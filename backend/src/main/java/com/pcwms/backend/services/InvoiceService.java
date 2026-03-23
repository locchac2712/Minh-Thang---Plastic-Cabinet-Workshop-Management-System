package com.pcwms.backend.services;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
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

    @Value("${app.seller.name:CONG TY SAN XUAT THUONG MAI VA DICH VU PCWMS}")
    private String sellerName;

    @Value("${app.seller.tax:0102143568}")
    private String sellerTax;

    @Value("${app.seller.address:Ha Noi}")
    private String sellerAddress;

    @Value("${app.seller.phone:0978533079}")
    private String sellerPhone;

    @Value("${app.seller.bank-name:Vietcombank}")
    private String sellerBankName;

    @Value("${app.seller.bank-account:1234567890}")
    private String sellerBankAccount;

    @Value("${app.invoice.serial:1C26THK}")
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

        PdfFont fontNormal = PdfFontFactory.createFont("Helvetica");
        PdfFont fontBold   = PdfFontFactory.createFont("Helvetica-Bold");
        PdfFont fontItalic = PdfFontFactory.createFont("Helvetica-Oblique");

        String invoiceDate = order.getCreatedDate() != null
                ? order.getCreatedDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : java.time.LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
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
        left.add(new Paragraph("Ma so thue (Tax Code): " + sellerTax).setFont(fontNormal).setFontSize(8));
        left.add(new Paragraph("Dia chi (Address): " + sellerAddress).setFont(fontNormal).setFontSize(8));
        left.add(new Paragraph("Dien thoai (Tel): " + sellerPhone).setFont(fontNormal).setFontSize(8));
        headerTbl.addCell(left);

        Cell right = new Cell().setBorder(Border.NO_BORDER).setPadding(0);
        right.add(new Paragraph("Mau so - Ky hieu (Serial No.): " + invoiceSerial)
                .setFont(fontBold).setFontSize(8).setTextAlignment(TextAlignment.RIGHT));
        right.add(new Paragraph("So (Invoice No.): " + String.format("%08d", order.getId()))
                .setFont(fontBold).setFontSize(8).setTextAlignment(TextAlignment.RIGHT));
        headerTbl.addCell(right);
        doc.add(headerTbl);

        doc.add(new Paragraph(" ").setMargin(0)
                .setBorderBottom(new SolidBorder(RED, 1.5f)));

        // ── 2. TITLE ─────────────────────────────────────────
        doc.add(new Paragraph("HOA DON GIA TRI GIA TANG")
                .setFont(fontBold).setFontSize(16).setFontColor(RED)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(6));
        doc.add(new Paragraph("(VAT INVOICE)")
                .setFont(fontItalic).setFontSize(10).setFontColor(RED)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(-4));
        doc.add(new Paragraph("Ngay (day) " + dp[0] + " thang (month) " + dp[1] + " nam (year) " + dp[2])
                .setFont(fontNormal).setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER).setMarginBottom(8));

        // ── 3. BUYER ─────────────────────────────────────────
        doc.add(new Paragraph("Nguoi mua (Buyer):").setFont(fontNormal).setFontSize(9).setMarginBottom(1));
        doc.add(new Paragraph("Don vi (Company name): " + customerName).setFont(fontBold).setFontSize(9).setMarginBottom(1));
        doc.add(new Paragraph("Ma so thue (Tax Code): " + customerTax).setFont(fontNormal).setFontSize(9).setMarginBottom(1));
        doc.add(new Paragraph("Dia chi (Address): " + customerAddress).setFont(fontNormal).setFontSize(9).setMarginBottom(1));
        doc.add(new Paragraph("Hinh thuc thanh toan (Payment method): Chuyen khoan/Tien mat").setFont(fontNormal).setFontSize(9).setMarginBottom(4));

        // ── 4. ITEMS TABLE ────────────────────────────────────
        float[] colW = {12f, 35f, 12f, 11f, 15f, 15f};
        Table itemsTbl = new Table(UnitValue.createPercentArray(colW))
                .useAllAvailableWidth().setMarginBottom(4);

        for (String h : new String[]{"STT\n(No.)", "Ten hang hoa, dich vu\n(Description)",
                "Don vi tinh\n(Unit)", "So luong\n(Qty)", "Don gia\n(Unit Price)", "Thanh tien\n(Amount)"}) {
            itemsTbl.addHeaderCell(new Cell()
                    .add(new Paragraph(h).setFont(fontBold).setFontSize(7.5f).setTextAlignment(TextAlignment.CENTER))
                    .setBackgroundColor(RED).setFontColor(ColorConstants.WHITE)
                    .setPadding(4).setBorder(new SolidBorder(ColorConstants.WHITE, 0.5f)));
        }
        for (String s : new String[]{"1", "2", "3", "4", "5", "6 = 4 x 5"}) {
            itemsTbl.addCell(new Cell()
                    .add(new Paragraph(s).setFont(fontNormal).setFontSize(7.5f).setTextAlignment(TextAlignment.CENTER))
                    .setBackgroundColor(LGRAY).setPadding(3).setBorder(new SolidBorder(ColorConstants.GRAY, 0.5f)));
        }

        List<SalesOrderDetail> details = order.getDetails();
        AtomicInteger idx = new AtomicInteger(1);
        if (details != null && !details.isEmpty()) {
            for (SalesOrderDetail d : details) {
                addRow(itemsTbl, fontNormal, idx.getAndIncrement(),
                        d.getProduct().getName(), "Cai",
                        d.getQuantity() != null ? d.getQuantity().doubleValue() : 0,
                        d.getUnitPrice() != null ? d.getUnitPrice().longValue() : 0,
                        d.getTotalLineAmount() != null ? d.getTotalLineAmount().longValue() : 0);
            }
        } else {
            addRow(itemsTbl, fontNormal, 1, "Hang hoa don " + order.getOrderNumber(),
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
        itemsTbl.addCell(new Cell(1, 5).add(new Paragraph("Cong tien hang (Sub total):")
                        .setFont(fontBold).setFontSize(8).setTextAlignment(TextAlignment.RIGHT))
                .setBorder(new SolidBorder(ColorConstants.BLACK, 0.8f)).setPadding(4));
        itemsTbl.addCell(new Cell().add(new Paragraph(fmtMoney(subtotal.longValue()))
                        .setFont(fontBold).setFontSize(8).setTextAlignment(TextAlignment.RIGHT))
                .setBorder(new SolidBorder(ColorConstants.BLACK, 0.8f)).setPadding(4));

        // VAT
        itemsTbl.addCell(new Cell(1, 3).add(new Paragraph("Thue suat GTGT (Tax rate): " + vatRate + "%")
                        .setFont(fontNormal).setFontSize(8))
                .setBorder(new SolidBorder(ColorConstants.GRAY, 0.5f)).setPadding(4));
        itemsTbl.addCell(new Cell(1, 2).add(new Paragraph("Tien thue GTGT (VAT amount):")
                        .setFont(fontNormal).setFontSize(8).setTextAlignment(TextAlignment.RIGHT))
                .setBorder(new SolidBorder(ColorConstants.GRAY, 0.5f)).setPadding(4));
        itemsTbl.addCell(new Cell().add(new Paragraph(fmtMoney(vatAmount.longValue()))
                        .setFont(fontBold).setFontSize(8).setTextAlignment(TextAlignment.RIGHT))
                .setBorder(new SolidBorder(ColorConstants.GRAY, 0.5f)).setPadding(4));

        // Total
        itemsTbl.addCell(new Cell(1, 5).add(new Paragraph("Tong cong tien thanh toan (Total payment):")
                        .setFont(fontBold).setFontSize(8).setTextAlignment(TextAlignment.RIGHT))
                .setBackgroundColor(PINK_BG).setBorder(new SolidBorder(ColorConstants.BLACK, 1f)).setPadding(4));
        itemsTbl.addCell(new Cell().add(new Paragraph(fmtMoney(total.longValue()))
                        .setFont(fontBold).setFontSize(9).setTextAlignment(TextAlignment.RIGHT).setFontColor(RED))
                .setBackgroundColor(PINK_BG).setBorder(new SolidBorder(ColorConstants.BLACK, 1f)).setPadding(4));

        doc.add(itemsTbl);

        // Total in words
        doc.add(new Paragraph("So tien viet bang chu (Amount in words): " + fmtWords(total.longValue()))
                .setFont(fontNormal).setFontSize(8).setMarginBottom(4));
        doc.add(new Paragraph(" ").setMargin(0).setBorderBottom(new SolidBorder(ColorConstants.GRAY, 0.5f)));

        // ── 5. QR PayOS + SIGNATURES ──────────────────────────
        // Tạo QR từ chuỗi qrContent (chuỗi VietQR từ PayOS)
        byte[]  qrBytes = generateQrBytes(qrContent != null ? qrContent : order.getOrderNumber(), 220);
        Image   qrImage = new Image(ImageDataFactory.create(qrBytes))
                .setWidth(100).setHeight(100)
                .setHorizontalAlignment(HorizontalAlignment.CENTER);

        // Thông tin thanh toán dưới QR
        String payTypeLabel = "DEPOSIT".equals(paymentType) ? "Dat coc" : "Thanh toan toan bo";
        Div qrDiv = new Div().setTextAlignment(TextAlignment.CENTER);
        qrDiv.add(qrImage);
        qrDiv.add(new Paragraph("Thanh toan qua PayOS")
                .setFont(fontBold).setFontSize(8).setTextAlignment(TextAlignment.CENTER).setMarginTop(4));
        qrDiv.add(new Paragraph(payTypeLabel + ": " + fmtMoney(payAmount.longValue()) + " d")
                .setFont(fontBold).setFontSize(9).setFontColor(RED).setTextAlignment(TextAlignment.CENTER));
        qrDiv.add(new Paragraph("Don hang: " + order.getOrderNumber())
                .setFont(fontNormal).setFontSize(7).setTextAlignment(TextAlignment.CENTER));
        qrDiv.add(new Paragraph("Quet ma QR de thanh toan")
                .setFont(fontItalic).setFontSize(7).setFontColor(GRAY).setTextAlignment(TextAlignment.CENTER));
        if (checkoutUrl != null) {
            qrDiv.add(new Paragraph("Hoac truy cap: " + checkoutUrl)
                    .setFont(fontNormal).setFontSize(6).setFontColor(GRAY).setTextAlignment(TextAlignment.CENTER));
        }

        Table sigTbl = new Table(UnitValue.createPercentArray(new float[]{33, 34, 33}))
                .useAllAvailableWidth().setMarginTop(10);
        sigTbl.addCell(new Cell().setBorder(Border.NO_BORDER)
                .add(new Paragraph("Nguoi mua hang (Buyer)\n\n\n\n(Ky, ghi ro ho ten)")
                        .setFont(fontNormal).setFontSize(8).setTextAlignment(TextAlignment.CENTER)));
        sigTbl.addCell(new Cell().setBorder(Border.NO_BORDER).add(qrDiv));
        sigTbl.addCell(new Cell().setBorder(Border.NO_BORDER)
                .add(new Paragraph("Nguoi ban hang (Seller)\n\n\n\n(Ky, ghi ro ho ten)")
                        .setFont(fontNormal).setFontSize(8).setTextAlignment(TextAlignment.CENTER)));
        doc.add(sigTbl);

        // Footer
        doc.add(new Paragraph(" ").setMargin(3).setBorderBottom(new SolidBorder(ColorConstants.GRAY, 0.5f)));
        doc.add(new Paragraph("(Can kiem tra doi chieu khi lap, giao, nhan hoa don)")
                .setFont(fontItalic).setFontSize(7).setFontColor(GRAY).setTextAlignment(TextAlignment.CENTER));

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

    private String fmtWords(long amount) {
        return fmtMoney(amount) + " dong chan./.";
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