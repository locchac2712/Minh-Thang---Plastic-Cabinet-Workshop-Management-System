/** Định dạng ngày hiển thị vi-VN: dd/MM/yyyy */
export function formatDateVi(value: string): string {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${dd}/${mm}/${d.getFullYear()}`
  }
  return value
}
