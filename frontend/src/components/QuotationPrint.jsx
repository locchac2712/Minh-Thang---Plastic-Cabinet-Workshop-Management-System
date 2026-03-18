import React from 'react'
import { fmtCurrency, fmtDate } from './ui'

export function QuotationPrint({ data }) {
  if (!data) return null

  return (
    <div className="print-template hidden print:block bg-white p-12 text-gray-900 font-serif leading-relaxed min-h-[297mm] w-[210mm] mx-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-template, .print-template * { visibility: visible; }
          .print-template { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 0;
            margin: 0;
          }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-start mb-12 border-b-2 border-gray-900 pb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">BÁO GIÁ</h1>
          <p className="text-sm font-bold text-gray-500 italic">Quotation</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold tracking-tight">{data.quotationNumber}</h2>
          <p className="text-sm text-gray-500 font-medium">Ngày lập: {fmtDate(new Date())}</p>
        </div>
      </div>

      {/* Company & Customer Info */}
      <div className="grid grid-cols-2 gap-12 mb-12 text-sm">
        <div>
          <h3 className="font-bold uppercase mb-3 border-b border-gray-200 pb-1">Đơn vị cung cấp</h3>
          <p className="font-black text-base mb-1">XƯỞNG TỦ NHỰA MINH THẮNG</p>
          <p className="text-gray-600">Địa chỉ: Đường số 10, Hiệp Bình Phước, Thủ Đức, TP.HCM</p>
          <p className="text-gray-600">Điện thoại: 0909 123 456</p>
          <p className="text-gray-600">Email: sales@minhthang plastic.com</p>
        </div>
        <div>
          <h3 className="font-bold uppercase mb-3 border-b border-gray-200 pb-1">Khách hàng</h3>
          <p className="font-black text-base mb-1">{data.customerName || 'Khách hàng lẻ'}</p>
          <p className="text-gray-600">Loại: {data.customerType}</p>
          <p className="text-gray-600">Điện thoại: {data.customerPhone}</p>
          <p className="text-gray-600">Email: {data.customerEmail}</p>
        </div>
      </div>

      {/* Product Table */}
      <table className="w-full mb-12 text-sm">
        <thead>
          <tr className="border-y-2 border-gray-900 bg-gray-50">
            <th className="px-4 py-3 text-left font-bold uppercase w-12">STT</th>
            <th className="px-4 py-3 text-left font-bold uppercase">Sản phẩm</th>
            <th className="px-4 py-3 text-center font-bold uppercase w-20">SL</th>
            <th className="px-4 py-3 text-right font-bold uppercase w-32">Đơn giá</th>
            <th className="px-4 py-3 text-right font-bold uppercase w-24">CK (%)</th>
            <th className="px-4 py-3 text-right font-bold uppercase w-32">Thành tiền</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.items.map((item, idx) => (
            <tr key={idx}>
              <td className="px-4 py-4 text-gray-600">{idx + 1}</td>
              <td className="px-4 py-4">
                <div className="font-bold">{item.name}</div>
                <div className="text-[11px] text-gray-400">SKU: {item.sku}</div>
              </td>
              <td className="px-4 py-4 text-center font-bold">{item.quantity}</td>
              <td className="px-4 py-4 text-right font-medium">{fmtCurrency(item.unitPrice)}</td>
              <td className="px-4 py-4 text-right text-gray-500">{item.discount > 0 ? `${item.discount}%` : '-'}</td>
              <td className="px-4 py-4 text-right font-bold">{fmtCurrency(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="flex justify-end mb-16">
        <div className="w-80 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 italic">Tổng tiền hàng:</span>
            <span className="font-medium">{fmtCurrency(data.totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 italic">Tổng chiết khấu:</span>
            <span className="font-medium text-red-600">-{fmtCurrency(data.totals.discount)}</span>
          </div>
          <div className="pt-3 border-t border-gray-900 flex justify-between items-center bg-gray-50 px-3 py-2">
            <span className="text-base font-black uppercase">Tổng cộng:</span>
            <span className="text-xl font-black text-purple-700">{fmtCurrency(data.totals.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Terms & Signatures */}
      <div className="grid grid-cols-2 gap-12 text-sm italic text-gray-600 mb-20 px-4">
        <div>
          <p className="mb-2">- Giá trên đã bao gồm thuế GTGT (nếu có).</p>
          <p className="mb-2">- Báo giá có hiệu lực đến ngày: <span className="font-bold text-gray-900 not-italic">{fmtDate(data.validUntil)}</span></p>
          <p>- Quý khách vui lòng xác nhận trước khi đặt hàng.</p>
        </div>
        <div className="text-center space-y-1">
            <p>Xin trân trọng cảm ơn!</p>
        </div>
      </div>

      <div className="flex justify-between px-12 pb-12 mt-auto">
        <div className="text-center w-48 border-t border-dashed border-gray-300 pt-4">
          <p className="font-bold uppercase text-xs mb-1">Xác nhận Khách hàng</p>
          <p className="text-[10px] text-gray-400">(Ký và ghi rõ họ tên)</p>
        </div>
        <div className="text-center w-48 border-t border-dashed border-gray-300 pt-4">
          <p className="font-bold uppercase text-xs mb-1">Nhân viên Báo giá</p>
          <p className="text-[10px] text-gray-400">(Ký và ghi rõ họ tên)</p>
        </div>
      </div>
    </div>
  )
}
