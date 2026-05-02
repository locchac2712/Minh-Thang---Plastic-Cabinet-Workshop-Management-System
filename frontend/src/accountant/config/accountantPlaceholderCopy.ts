export const accountantPlaceholderCopy = {
  receivablesDeposits: {
    title: 'Xác nhận nạp tiền',
    lead: '',
  },
  receivablesInvoices: {
    title: 'Hóa đơn VAT điện tử',
    lead: '',
  },
  payablesBills: {
    title: 'Sổ nợ trả nhà cung cấp',
    lead: '',
  },
  mastersSuppliers: {
    title: 'Danh sách nhà cung cấp',
    lead: '',
  },
} as const

export type AccountantPlaceholderId = keyof typeof accountantPlaceholderCopy
