package com.pcwms.backend.services;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import com.pcwms.backend.config.PayOSClient;
import com.pcwms.backend.config.PayOSClient.CreateLinkRequest;
import com.pcwms.backend.config.PayOSClient.CreateLinkResponse;
import com.pcwms.backend.dto.PaymentDTO;
import com.pcwms.backend.entity.Payment;
import com.pcwms.backend.entity.SalesOrder;
import com.pcwms.backend.entity.SalesOrderDetail;
import com.pcwms.backend.repository.PaymentRepository;
import com.pcwms.backend.repository.SalesOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final SalesOrderRepository salesOrderRepository;
    private final PaymentRepository    paymentRepository;
    private final PayOSClient          payOSClient;

    @Value("${app.seller.name:NỘI THẤT NHỰA MINH THẮNG}")
    private String sellerName;

    @Value("${app.seller.tax:0}")
    private String sellerTax;

    @Value("${app.seller.address:Hà Nội}")
    private String sellerAddress;

    @Value("${app.seller.phone:0978533079}")
    private String sellerPhone;

    @Value("${app.seller.bank-name:Vietcombank}")
    private String sellerBankName;

    @Value("${app.seller.bank-account:1234567890}")
    private String sellerBankAccount;

    @Value("${app.invoice.serial:0}")
    private String invoiceSerial;

    @Value("${app.vat-rate:5}")
    private int vatRate;

    @Value("${payos.return-url:http://localhost:5173/payment/result}")
    private String returnUrl;

    @Value("${payos.cancel-url:http://localhost:5173/payment/cancel}")
    private String cancelUrl;

    // Colors
    private static final DeviceRgb RED     = new DeviceRgb(192, 57, 43);
    private static final DeviceRgb LGRAY   = new DeviceRgb(245, 245, 245);
    private static final DeviceRgb GRAY    = new DeviceRgb(100, 100, 100);
    private static final DeviceRgb PURPLE  = new DeviceRgb(91, 33, 182);
    private static final DeviceRgb PINK_BG = new DeviceRgb(255, 243, 243);

    // ── Entry point ───────────────────────────────────────────
    public byte[] generateInvoicePdf(Long salesOrderId, String paymentType, Long amount) throws Exception {
        SalesOrder order = salesOrderRepository.findByIdWithCustomer(salesOrderId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay don hang: " + salesOrderId));

        BigDecimal payAmount = amount != null
                ? BigDecimal.valueOf(amount)
                : order.getTotalAmount();

        BigDecimal subtotal  = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal vatAmount = subtotal.multiply(BigDecimal.valueOf(vatRate))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        BigDecimal total     = subtotal.add(vatAmount);

        // Tạo PayOS link để lấy QR — nhúng vào PDF
        String qrCodeUrl  = null;
        String checkoutUrl = null;
        try {
            long orderCode = generateOrderCode(salesOrderId);
            String desc    = buildDescription(order.getOrderNumber(), paymentType);

            CreateLinkRequest.Item item = new CreateLinkRequest.Item();
            item.setName(desc);
            item.setQuantity(1);
            item.setPrice(payAmount.intValue());

            CreateLinkRequest linkReq = new CreateLinkRequest();
            linkReq.setOrderCode(orderCode);
            linkReq.setAmount(payAmount.intValue());
            linkReq.setDescription(desc);
            linkReq.setBuyerName(order.getCustomer() != null ? order.getCustomer().getName() : "");
            linkReq.setReturnUrl(returnUrl);
            linkReq.setCancelUrl(cancelUrl);
            linkReq.setItems(List.of(item));

            CreateLinkResponse response = payOSClient.createPaymentLink(linkReq);
            qrCodeUrl   = response.getQrCode();       // chuỗi QR VietQR
            checkoutUrl = response.getCheckoutUrl();

            // Lưu payment vào DB
            Payment payment = new Payment();
            payment.setSalesOrder(order);
            payment.setCustomer(order.getCustomer());
            payment.setAmount(payAmount);
            payment.setTransactionDate(java.time.LocalDateTime.now());
            payment.setPaymentMethod("PAYOS");
            payment.setPayosPaymentType("DEPOSIT".equals(paymentType) ? "DEPOSIT" : "FULL");
            payment.setPayosPaymentLinkId(response.getPaymentLinkId());
            payment.setPayosOrderCode(orderCode);
            payment.setPayosCheckoutUrl(checkoutUrl);
            payment.setPayosQrCode(qrCodeUrl);
            payment.setPayosStatus("PENDING");
            paymentRepository.save(payment);

            log.info("PayOS link created for invoice | orderCode={} | amount={}", orderCode, payAmount);
        } catch (Exception e) {
            log.warn("Could not create PayOS link, PDF will use fallback QR: {}", e.getMessage());
            // Fallback: QR chứa thông tin chuyển khoản thủ công
            qrCodeUrl = String.format("BANK:%s|ACC:%s|AMT:%d|MSG:%s",
                    sellerBankName, sellerBankAccount,
                    payAmount.longValue(), order.getOrderNumber());
        }

        return buildPdf(order, subtotal, vatAmount, total, payAmount, paymentType, qrCodeUrl, checkoutUrl);
    }

    // ── Build PDF với iText7 ──────────────────────────────────
    private byte[] buildPdf(SalesOrder order, BigDecimal subtotal,
                            BigDecimal vatAmount, BigDecimal total,
                            BigDecimal payAmount, String paymentType,
                            String qrContent, String checkoutUrl) throws Exception {

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdfDoc = new PdfDocument(new PdfWriter(baos));
        Document doc = new Document(pdfDoc, PageSize.A4);
        doc.setMargins(20, 25, 20, 25);

        PdfFont fontNormal = PdfFontFactory.createFont(
                "ttf/DejaVuSans.ttf");
        PdfFont fontBold = PdfFontFactory.createFont(
                "ttf/DejaVuSans-Bold.ttf");
        PdfFont fontItalic = PdfFontFactory.createFont("ttf/DejaVuSans-Oblique.ttf");

        String invoiceDate = order.getCreatedDate() != null
                ? order.getCreatedDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String[] dp = invoiceDate.split("/");

        String customerName    = order.getCustomer() != null ? order.getCustomer().getName()    : "";
        String customerTax     = order.getCustomer() != null && order.getCustomer().getTaxCode() != null
                ? order.getCustomer().getTaxCode() : "";
        String customerAddress = order.getCustomer() != null ? order.getCustomer().getAddress() : "";

        // ── 1. HEADER ────────────────────────────────────────
        Table headerTbl = new Table(UnitValue.createPercentArray(new float[]{60, 40}))
                .useAllAvailableWidth();
        Cell left = new Cell().setBorder(Border.NO_BORDER).setPadding(0);
        left.add(new Paragraph(sellerName).setFont(fontBold).setFontSize(9).setFontColor(RED));
        left.add(new Paragraph("Mã số thuế : " + sellerTax).setFont(fontNormal).setFontSize(8));
        left.add(new Paragraph("Địa chỉ : " + sellerAddress).setFont(fontNormal).setFontSize(8));
        left.add(new Paragraph("Điện thoại : " + sellerPhone).setFont(fontNormal).setFontSize(8));
        headerTbl.addCell(left);

        Cell right = new Cell().setBorder(Border.NO_BORDER).setPadding(0);
        right.add(new Paragraph("Mẫu số : " + invoiceSerial)
                .setFont(fontBold).setFontSize(8).setTextAlignment(TextAlignment.RIGHT));
        right.add(new Paragraph("Số : " + String.format("%08d", order.getId()))
                .setFont(fontBold).setFontSize(8).setTextAlignment(TextAlignment.RIGHT));
        headerTbl.addCell(right);
        doc.add(headerTbl);

        doc.add(new Paragraph(" ").setMargin(0)
                .setBorderBottom(new SolidBorder(RED, 1.5f)));

// ── 2. TITLE & QR SECTION ─────────────────────────────
        byte[] qrBytes = generateQrBytes(qrContent != null ? qrContent : order.getOrderNumber(), 250);
        Image qrImage = new Image(ImageDataFactory.create(qrBytes))
                .setWidth(90).setHeight(90)
                .setHorizontalAlignment(HorizontalAlignment.RIGHT); // Đẩy ảnh sang phải trong cell

        Table titleTable = new Table(UnitValue.createPercentArray(new float[]{65, 35}))
                .useAllAvailableWidth().setMarginTop(5);


        Cell titleCell = new Cell().setBorder(Border.NO_BORDER).setVerticalAlignment(VerticalAlignment.MIDDLE);
        titleCell.add(new Paragraph("HOÁ ĐƠN GIÁ TRỊ GIA TĂNG (VAT)")
                .setFont(fontBold).setFontSize(15).setFontColor(RED)
                .setTextAlignment(TextAlignment.CENTER).setMarginLeft(40)); // Offset để bù khoảng trống QR
        titleCell.add(new Paragraph("(VAT INVOICE)")
                .setFont(fontItalic).setFontSize(9).setFontColor(RED)
                .setTextAlignment(TextAlignment.CENTER).setMarginLeft(40).setMarginTop(-5));
        titleCell.add(new Paragraph("Ngày (day) " + dp[0] + " tháng (month) " + dp[1] + " năm (year) " + dp[2])
                .setFont(fontNormal).setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER).setMarginLeft(40));
        titleTable.addCell(titleCell);


        Cell qrCell = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT);
        qrCell.add(qrImage);

        String payTypeLabel = "DEPOSIT".equals(paymentType) ? "Đặt cọc" : "Thanh toán";
        qrCell.add(new Paragraph("Thanh toán qua PayOS")
                .setFont(fontBold).setFontSize(8).setMarginTop(2));
        qrCell.add(new Paragraph(payTypeLabel + ": " + fmtMoney(payAmount.longValue()) + " đ")
                .setFont(fontBold).setFontSize(8).setFontColor(RED).setMarginTop(-2));
        qrCell.add(new Paragraph("Đơn hàng: " + order.getOrderNumber())
                .setFont(fontNormal).setFontSize(7).setMarginTop(-2));

        titleTable.addCell(qrCell);
        doc.add(titleTable);

// ── 3. BUYER ─────────────────────────────────────────
        doc.add(new Paragraph("Người mua :").setFont(fontNormal).setFontSize(9).setMarginTop(5));
        doc.add(new Paragraph("Đơn vị (Công ty): " + customerName).setFont(fontBold).setFontSize(9).setMarginBottom(1));
        doc.add(new Paragraph("Mã số thuế : " + customerTax).setFont(fontNormal).setFontSize(9).setMarginBottom(1));
        doc.add(new Paragraph("Địa chỉ : " + customerAddress).setFont(fontNormal).setFontSize(9).setMarginBottom(1));
        doc.add(new Paragraph("Hình thức thanh toán : Chuyển khoản qua PayOS/VietQR").setFont(fontNormal).setFontSize(9).setMarginBottom(4));

        // ── 4. ITEMS TABLE ────────────────────────────────────
        float[] colW = {12f, 35f, 12f, 11f, 15f, 15f};
        Table itemsTbl = new Table(UnitValue.createPercentArray(colW))
                .useAllAvailableWidth().setMarginBottom(4);

        for (String h : new String[]{"STT\n(No.)", "Tên hàng hoá, dịch vụ\n(Description)",
                "Đơn vị tính\n(Unit)", "Số lượng\n(Qty)", "Đơn giá\n(Unit Price)", "Thành tiền\n(Amount)"}) {
            itemsTbl.addHeaderCell(new Cell()
                    .add(new Paragraph(h).setFont(fontBold).setFontSize(7.5f).setTextAlignment(TextAlignment.CENTER))
                    .setBackgroundColor(RED).setFontColor(ColorConstants.WHITE)
                    .setPadding(4).setBorder(new SolidBorder(ColorConstants.WHITE, 0.5f)));
        }
        for (String s : new String[]{"1", "2", "3", "4", "5", "6"}) {
            itemsTbl.addCell(new Cell()
                    .add(new Paragraph(s).setFont(fontNormal).setFontSize(7.5f).setTextAlignment(TextAlignment.CENTER))
                    .setBackgroundColor(LGRAY).setPadding(3).setBorder(new SolidBorder(ColorConstants.GRAY, 0.5f)));
        }

        List<SalesOrderDetail> details = order.getDetails();
        AtomicInteger idx = new AtomicInteger(1);
        if (details != null && !details.isEmpty()) {
            for (SalesOrderDetail d : details) {
                addRow(itemsTbl, fontNormal, idx.getAndIncrement(),
                        d.getProduct().getName(), d.getProduct().getUnit(),
                        d.getQuantity() != null ? d.getQuantity().doubleValue() : 0,
                        d.getUnitPrice() != null ? d.getUnitPrice().longValue() : 0,
                        d.getTotalLineAmount() != null ? d.getTotalLineAmount().longValue() : 0);
            }
        } else {
            addRow(itemsTbl, fontNormal, 1, "Hàng hoá đơn" + order.getOrderNumber(),
                    "Lo", 1, subtotal.longValue(), subtotal.longValue());
        }

        int padRows = Math.max(0, 6 - (details != null ? details.size() : 1));
        for (int i = 0; i < padRows; i++) {
            for (int j = 0; j < 6; j++) {
                itemsTbl.addCell(new Cell().add(new Paragraph(" ").setFontSize(7))
                        .setHeight(16).setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.3f)).setPadding(2));
            }
        }

        // Subtotal
        itemsTbl.addCell(new Cell(1, 5).add(new Paragraph("Cộng tiền hàng (Sub total):")
                        .setFont(fontBold).setFontSize(8).setTextAlignment(TextAlignment.RIGHT))
                .setBorder(new SolidBorder(ColorConstants.BLACK, 0.8f)).setPadding(4));
        itemsTbl.addCell(new Cell().add(new Paragraph(fmtMoney(subtotal.longValue()))
                        .setFont(fontBold).setFontSize(8).setTextAlignment(TextAlignment.RIGHT))
                .setBorder(new SolidBorder(ColorConstants.BLACK, 0.8f)).setPadding(4));

        // VAT
        itemsTbl.addCell(new Cell(1, 3).add(new Paragraph("Thuế xuất GTGT (Tax rate): " + vatRate + "%")
                        .setFont(fontNormal).setFontSize(8))
                .setBorder(new SolidBorder(ColorConstants.GRAY, 0.5f)).setPadding(4));
        itemsTbl.addCell(new Cell(1, 2).add(new Paragraph("Tiền thuế GTGT (VAT amount):")
                        .setFont(fontNormal).setFontSize(8).setTextAlignment(TextAlignment.RIGHT))
                .setBorder(new SolidBorder(ColorConstants.GRAY, 0.5f)).setPadding(4));
        itemsTbl.addCell(new Cell().add(new Paragraph(fmtMoney(vatAmount.longValue()))
                        .setFont(fontBold).setFontSize(8).setTextAlignment(TextAlignment.RIGHT))
                .setBorder(new SolidBorder(ColorConstants.GRAY, 0.5f)).setPadding(4));

        // Total
        itemsTbl.addCell(new Cell(1, 5).add(new Paragraph("Tổng cộng tiền thanh toán (Total payment):")
                        .setFont(fontBold).setFontSize(8).setTextAlignment(TextAlignment.RIGHT))
                .setBackgroundColor(PINK_BG).setBorder(new SolidBorder(ColorConstants.BLACK, 1f)).setPadding(4));
        itemsTbl.addCell(new Cell().add(new Paragraph(fmtMoney(total.longValue()))
                        .setFont(fontBold).setFontSize(9).setTextAlignment(TextAlignment.RIGHT).setFontColor(RED))
                .setBackgroundColor(PINK_BG).setBorder(new SolidBorder(ColorConstants.BLACK, 1f)).setPadding(4));

        doc.add(itemsTbl);

        // ── 5. QR PayOS + SIGNATURES ──────────────────────────
        // Tạo QR từ chuỗi qrContent (chuỗi VietQR từ PayOS)
        Table sigTbl = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .useAllAvailableWidth().setMarginTop(20);

        sigTbl.addCell(new Cell().setBorder(Border.NO_BORDER)
                .add(new Paragraph("Người mua hàng")
                        .setFont(fontBold).setFontSize(9).setTextAlignment(TextAlignment.CENTER))
                .add(new Paragraph("(Ký, ghi rõ họ tên)")
                        .setFont(fontItalic).setFontSize(7).setTextAlignment(TextAlignment.CENTER))
                .add(new Paragraph("\n\n\n\n")));

        sigTbl.addCell(new Cell().setBorder(Border.NO_BORDER)
                .add(new Paragraph("Người bán hàng")
                        .setFont(fontBold).setFontSize(9).setTextAlignment(TextAlignment.CENTER))
                .add(new Paragraph("(Ký, ghi rõ họ tên)")
                        .setFont(fontItalic).setFontSize(7).setTextAlignment(TextAlignment.CENTER))
                .add(new Paragraph("\n\n\n\n")));

        doc.add(sigTbl);

        // Footer
        doc.add(new Paragraph(" ").setMargin(3).setBorderBottom(new SolidBorder(ColorConstants.GRAY, 0.5f)));
        doc.close();
        log.info("Invoice PDF built | order={} | size={}KB", order.getOrderNumber(), baos.size() / 1024);
        return baos.toByteArray();
    }

    // ── Helpers ───────────────────────────────────────────────

    private void addRow(Table tbl, PdfFont font, int no, String name,
                        String unit, double qty, long price, long amount) {
        String q = qty == (int) qty ? String.valueOf((int) qty) : String.valueOf(qty);
        tbl.addCell(cell(font, String.valueOf(no), TextAlignment.CENTER));
        tbl.addCell(cell(font, name,               TextAlignment.LEFT));
        tbl.addCell(cell(font, unit,               TextAlignment.CENTER));
        tbl.addCell(cell(font, q,                  TextAlignment.CENTER));
        tbl.addCell(cell(font, fmtMoney(price),    TextAlignment.RIGHT));
        tbl.addCell(cell(font, fmtMoney(amount),   TextAlignment.RIGHT));
    }

    private Cell cell(PdfFont font, String text, TextAlignment align) {
        return new Cell()
                .add(new Paragraph(text).setFont(font).setFontSize(8).setTextAlignment(align))
                .setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f))
                .setPadding(3);
    }

    private String fmtMoney(long n) {
        return NumberFormat.getNumberInstance(new Locale("vi", "VN"))
                .format(n).replace(",", ".");
    }


    private byte[] generateQrBytes(String content, int size) throws Exception {
        QRCodeWriter writer = new QRCodeWriter();
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 1);
        BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, size, size, hints);
        BufferedImage image = MatrixToImageWriter.toBufferedImage(matrix);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", out);
        return out.toByteArray();
    }

    private long generateOrderCode(Long salesOrderId) {
        long epoch = System.currentTimeMillis() / 1000 % 100000;
        String code = salesOrderId + String.format("%05d", epoch);
        return Long.parseLong(code.length() > 9 ? code.substring(code.length() - 9) : code);
    }

    private String buildDescription(String orderNumber, String paymentType) {
        String prefix = "DEPOSIT".equals(paymentType) ? "DC" : "TT";
        String raw    = prefix + " " + orderNumber;
        return raw.length() > 25 ? raw.substring(0, 25) : raw;
    }
}