import { fmt, fmtDate } from "./formatUtils";

export const printQuotation = (quote) => {
    if (!quote) return;
    
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const items = quote.details || quote.items || [];
    
    const itemsHtml = items.map((d, index) => {
        const qty = d.quantity || d.qty || 0;
        const price = d.unitPrice || 0;
        const lineTotal = d.totalLineAmount || (qty * price);
        return `
        <tr>
            <td style="text-align: center; border: 1px solid #999; padding: 6px;">${index + 1}</td>
            <td style="border: 1px solid #999; padding: 6px;">${d.productName || d.product?.name || ""}</td>
            <td style="border: 1px solid #999; padding: 6px;"></td>
            <td style="text-align: center; border: 1px solid #999; padding: 6px;">${d.product?.unit || "Cái"}</td>
            <td style="text-align: center; border: 1px solid #999; padding: 6px;">${qty}</td>
            <td style="text-align: right; border: 1px solid #999; padding: 6px;">${fmt(price)}</td>
            <td style="text-align: right; border: 1px solid #999; padding: 6px;">${fmt(lineTotal)}</td>
        </tr>`;
    }).join("");

    // Thêm dòng trống nếu ít hơn 6 dòng
    let emptyRows = "";
    for (let i = items.length; i < 6; i++) {
        emptyRows += `
        <tr>
            <td style="text-align: center; border: 1px solid #999; padding: 6px;">${i + 1}</td>
            <td style="border: 1px solid #999; padding: 6px;"></td>
            <td style="border: 1px solid #999; padding: 6px;"></td>
            <td style="border: 1px solid #999; padding: 6px;"></td>
            <td style="border: 1px solid #999; padding: 6px;"></td>
            <td style="border: 1px solid #999; padding: 6px;"></td>
            <td style="text-align: right; border: 1px solid #999; padding: 6px;">0</td>
        </tr>`;
    }

    // Tính tổng từ các dòng sản phẩm
    const subTotal = items.reduce((sum, d) => {
        const qty = d.quantity || d.qty || 0;
        const price = d.unitPrice || 0;
        return sum + (d.totalLineAmount || (qty * price));
    }, 0);
    const grandTotal = quote.totalAmount || subTotal;
    const discountAmount = subTotal - grandTotal;
    const discountPercent = subTotal > 0 ? Math.round((discountAmount / subTotal) * 100 * 100) / 100 : 0;

    const today = new Date();
    const dateStr = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

    const html = `
        <html>
            <head>
                <title>Báo giá ${quote.quotationNumber}</title>
                <style>
                    body { 
                        font-family: 'Times New Roman', Times, serif; 
                        padding: 20px 30px; 
                        color: #000; 
                        line-height: 1.4; 
                        font-size: 13px;
                    }
                    @media print { 
                        body { padding: 10px 20px; } 
                        @page { 
                            margin: 0; 
                            size: A4;
                        }
                        body { 
                            margin: 15mm; 
                        }
                    }
                </style>
            </head>
            <body>
                <!-- HEADER -->
                <table style="width: 100%; margin-bottom: 10px;">
                    <tr>
                        <td style="width: 120px; vertical-align: top;">
                            <img src="${window.location.origin}/logo.png" alt="Logo" style="width: 100px; height: auto;" />
                        </td>
                        <td style="text-align: center; vertical-align: top;">
                            <div style="font-weight: bold; font-size: 15px; color: #003399; text-transform: uppercase;">XƯỞNG NỘI THẤT NHỰA MINH THẮNG</div>
                            <div style="font-size: 12px;">VP: Hà Nội, Việt Nam</div>
                            <div style="font-size: 12px;">ĐT: 0988 123 456 &nbsp;&nbsp; Hotline: 0938 36 1919</div>
                            <div style="font-size: 12px;">MST: 0102011152</div>
                        </td>
                    </tr>
                </table>

                <!-- TITLE -->
                <div style="text-align: center; margin: 15px 0 10px;">
                    <div style="font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">BẢNG BÁO GIÁ</div>
                    <div style="font-size: 12px; font-style: italic; color: #666; margin-top: 2px;">Số: ${quote.quotationNumber}</div>
                </div>

                <!-- CUSTOMER INFO -->
                <div style="margin-bottom: 8px;">
                    <div style="margin-bottom: 4px;"><strong>Ngày:</strong> ${dateStr}</div>
                    <div style="margin-bottom: 4px;">
                        <strong>Kính gửi:</strong> ${quote.customer?.name || ""}
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <strong>SĐT:</strong> ${quote.customer?.phoneNumber || quote.customer?.phone || ""}
                        &nbsp;&nbsp;
                        <strong>Email:</strong> ${quote.customer?.email || ""}
                    </div>
                </div>

                <!-- INTRO -->
                <div style="margin-bottom: 10px; font-style: italic; font-size: 12.5px;">
                    Lời đầu tiên, xin trân trọng cảm ơn quý khách hàng đã quan tâm đến sản phẩm nội thất của công ty chúng tôi. Chúng tôi xin gửi đến quý khách hàng bảng báo giá như sau:
                </div>

                <!-- TABLE -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
                    <thead>
                        <tr style="background: #003399; color: #fff;">
                            <th style="border: 1px solid #999; padding: 8px; width: 35px; text-align: center;">STT</th>
                            <th style="border: 1px solid #999; padding: 8px; text-align: center;">TÊN SẢN PHẨM</th>
                            <th style="border: 1px solid #999; padding: 8px; width: 70px; text-align: center;">KÍCH THƯỚC</th>
                            <th style="border: 1px solid #999; padding: 8px; width: 40px; text-align: center;">ĐVT</th>
                            <th style="border: 1px solid #999; padding: 8px; width: 30px; text-align: center;">SL</th>
                            <th style="border: 1px solid #999; padding: 8px; width: 80px; text-align: center;">ĐƠN GIÁ</th>
                            <th style="border: 1px solid #999; padding: 8px; width: 90px; text-align: center;">THÀNH TIỀN</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                        ${emptyRows}
                    </tbody>
                </table>

                <!-- SUBTOTAL + DISCOUNT + GRAND TOTAL -->
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="font-weight: bold;">
                        <td style="border: 1px solid #999; padding: 8px; text-align: right;" colspan="6">Tổng tiền trước chiết khấu:</td>
                        <td style="border: 1px solid #999; padding: 8px; text-align: right; width: 90px;">${fmt(subTotal)}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #999; padding: 8px; text-align: right;" colspan="6">Chiết khấu (${discountPercent}%):</td>
                        <td style="border: 1px solid #999; padding: 8px; text-align: right; width: 90px; color: #c00;">- ${fmt(discountAmount)}</td>
                    </tr>
                    <tr style="font-weight: bold; font-size: 14px;">
                        <td style="border: 1px solid #999; padding: 8px; text-align: right;" colspan="6">TỔNG CỘNG SAU CHIẾT KHẤU:</td>
                        <td style="border: 1px solid #999; padding: 8px; text-align: right; width: 90px;">${fmt(grandTotal)}</td>
                    </tr>
                </table>

                <!-- NOTES -->
                <div style="margin-top: 15px; border: 1px solid #ccc; padding: 10px 14px; font-size: 12px;">
                    <div style="font-weight: bold; margin-bottom: 4px; background: #ffffcc; display: inline-block; padding: 1px 6px;">Ghi chú:</div>
                    <div style="padding-left: 5px; line-height: 1.6;">
                        - Giá trên đã bao gồm phí vận chuyển và lắp đặt trong khu vực Hà Nội.<br>
                        - Giá trên chưa bao gồm VAT 10%.<br>
                        - Giao hàng sau ngày kể từ ngày ký hợp đồng.<br>
                        - Bảng báo giá chỉ áp dụng trong vòng 15 ngày kể từ ngày khách hàng nhận báo giá.
                    </div>
                </div>

                <!-- SIGNATURES -->
                <div style="margin-top: 40px; display: flex; justify-content: space-around; text-align: center; font-size: 13px;">
                    <div>
                        <p><strong>Khách hàng</strong><br><em style="font-size: 11px; color: #666;">(Ký và ghi rõ họ tên)</em></p>
                    </div>
                    <div>
                        <p><strong>Người lập báo giá</strong><br><em style="font-size: 11px; color: #666;">(Ký và ghi rõ họ tên)</em></p>
                        <p style="margin-top: 50px; font-weight: 600;">${quote.staff?.fullName || ""}</p>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.frameElement.parentNode.removeChild(window.frameElement); }, 1000);
                    };
                </script>
            </body>
        </html>
    `;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
};
