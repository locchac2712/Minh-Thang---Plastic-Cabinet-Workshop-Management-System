export const adminPlaceholderCopy = {
  catalogCategories: {
    title: 'Ngành hàng',
    lead: '',
  },
  catalogProducts: {
    title: 'Mẫu tủ chuẩn',
    lead: '',
  },
  materials: {
    title: 'Danh sách vật tư',
    lead: '',
  },
  bom: {
    title: 'Cấu hình BOM',
    lead: '',
  },
  agencies: {
    title: 'Tệp khách sỉ',
    lead: '',
  },
  suppliers: {
    title: 'Nhà cung cấp',
    lead: '',
  },
} as const

export type AdminPlaceholderId = keyof typeof adminPlaceholderCopy
