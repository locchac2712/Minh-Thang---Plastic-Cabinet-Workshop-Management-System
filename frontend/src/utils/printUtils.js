import { fmt, fmtDate } from "./formatUtils";

export const printQuotation = (quote) => {
    if (!quote) return;
    
    // Create a hidden iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const itemsHtml = (quote.details || quote.items || []).map((d, index) => `
        <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td>
                <div style="font-weight: 600;">${d.productName || d.product?.name || "Sản phẩm"}</div>
                <div style="font-size: 11px; color: #666;">SKU: ${d.productSku || d.product?.sku || "N/A"}</div>
            </td>
            <td style="text-align: center;">${d.quantity || d.qty || 0}</td>
            <td style="text-align: right;">${fmt(d.unitPrice)}</td>
            <td style="text-align: right;">${d.discountPercent ? d.discountPercent + "%" : (d.discount ? fmt(d.discount) : "0")}</td>
            <td style="text-align: right; font-weight: 600;">${fmt(d.totalLineAmount || (d.quantity * d.unitPrice))}</td>
        </tr>
    `).join("");

    const html = `
        <html>
            <head>
                <title>In Báo Giá - ${quote.quotationNumber}</title>
                <style>
                    body { font-family: 'Inter', 'Roboto', Arial, sans-serif; padding: 20px; color: #333; line-height: 1.5; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
                    .company-info h1 { margin: 0; color: #1e3a8a; font-size: 20px; text-transform: uppercase; }
                    .company-info p { font-size: 11px; margin: 2px 0; }
                    .quote-meta { text-align: right; }
                    .quote-meta h2 { margin: 0; color: #3b82f6; font-size: 24px; }
                    .quote-meta p { font-size: 12px; margin: 2px 0; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 20px; }
                    .info-section h3 { border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 8px; }
                    .info-section p { font-size: 12px; margin: 3px 0; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th { border-bottom: 2px solid #e2e8f0; text-align: left; padding: 10px; font-size: 11px; color: #475569; text-transform: uppercase; }
                    td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
                    .totals { float: right; width: 250px; margin-top: 10px; }
                    .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; }
                    .total-row.grand { border-top: 2px solid #3b82f6; margin-top: 8px; padding-top: 10px; font-weight: 700; font-size: 16px; color: #1e3a8a; }
                    @media print { body { padding: 0px; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-info">
                        <h1>Xưởng Nội Thất Minh Thắng</h1>
                        <p>Địa chỉ: 123 Đường Công Nghệ, Hà Nội</p>
                        <p>SĐT: 0988 123 456 | Email: info@minhthanh.vn</p>
                    </div>
                    <div class="quote-meta">
                        <h2>BÁO GIÁ</h2>
                        <p>Số: <strong>${quote.quotationNumber}</strong></p>
                        <p>Ngày lập: ${fmtDate(quote.createdDate)}</p>
                    </div>
                </div>

                <div class="info-grid">
                    <div class="info-section">
                        <h3>Khách hàng</h3>
                        <p><strong>${quote.customer?.name}</strong></p>
                        <p>${quote.customer?.address || "Địa chỉ: N/A"}</p>
                        <p>SĐT: ${quote.customer?.phoneNumber || quote.customer?.phone || "N/A"}</p>
                    </div>
                    <div class="info-section">
                        <h3>Người lập</h3>
                        <p><strong>${quote.staff?.fullName || "Nhân viên kinh doanh"}</strong></p>
                        <p>Mã NV: ${quote.staff?.employeeId || "N/A"}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 30px;">STT</th>
                            <th>Mô tả sản phẩm</th>
                            <th style="width: 50px; text-align: center;">SL</th>
                            <th style="width: 100px; text-align: right;">Đơn giá</th>
                            <th style="width: 70px; text-align: right;">CK</th>
                            <th style="width: 110px; text-align: right;">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                </table>

                <div style="overflow: hidden;">
                    <div class="totals">
                        <div class="total-row"><span>Giá trị hàng hóa:</span><span>${fmt(quote.totalAmount || 0)}</span></div>
                        <div class="total-row grand"><span>TỔNG CỘNG:</span><span>${fmt(quote.totalAmount || 0)}</span></div>
                    </div>
                </div>

                <div style="margin-top: 60px; display: flex; justify-content: space-around; text-align: center; font-size: 13px;">
                    <div><p><strong>Khách hàng</strong><br><em style="font-size: 11px; color: #666;">(Ký và ghi rõ họ tên)</em></p></div>
                    <div><p><strong>Người lập biểu</strong><br><em style="font-size: 11px; color: #666;">(Ký và ghi rõ họ tên)</em></p></div>
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
