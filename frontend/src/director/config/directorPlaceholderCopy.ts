export const directorPlaceholderCopy = {
  approvalsDebt: {
    title: 'Phê duyệt hạn mức nợ',
    lead: '',
  },
  riskReceivables: {
    title: 'Nợ phải thu — báo động',
    lead: '',
  },
  riskWastage: {
    title: 'Tổ đội tay nghề — hao phí',
    lead: '',
  },
  mts: {
    title: 'Điều hành Make-to-Stock',
    lead: '',
  },
} as const

export type DirectorPlaceholderId = keyof typeof directorPlaceholderCopy
