export const sellerPlaceholderCopy = {
  agencies: {
    title: 'Khách sỉ trực thuộc',
    lead:
      'Danh sách đại lý của Sale: thêm mới, cảnh báo nợ, xem lịch sử tủ đã lấy để up-sale.',
  },
  store: {
    title: 'Menu hàng hóa',
    lead:
      'Lưới catalog tủ (Bếp, Quần áo…), nhãn tồn kho giao ngay.',
  },
  orders: {
    title: 'Đơn đặt hàng',
    lead:
      'Tab: Nháp | Chờ Giám đốc | Thợ đang ráp | Chờ giao. Nút + Tạo đơn mới; đơn: tủ sẵn / Custom, giảm giá.',
  },
  payments: {
    title: 'Thanh toán & đối soát',
    lead:
      'Lịch sử giấy nộp tiền, upload biên lai, trạng thái Kế toán (từ chối / đã cấn nợ).',
  },
  tracking: {
    title: 'Nhật ký theo dõi xưởng',
    lead: 'Feed ảnh thực tế lắp tủ — kéo xem, gửi khách.',
  },
} as const

export type SellerPlaceholderId = keyof typeof sellerPlaceholderCopy
