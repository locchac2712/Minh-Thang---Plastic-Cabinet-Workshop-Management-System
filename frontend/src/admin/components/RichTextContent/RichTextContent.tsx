import { looksLikeHtml } from '../../catalog/productModel'
import './RichTextContent.css'

type Props = {
  html: string
  className?: string
}

/** Hiển thị mô tả HTML hoặc text thuần (dữ liệu cũ) */
export function RichTextContent({ html, className }: Props) {
  const c = className ? ` ${className}` : ''
  if (!html.trim()) {
    return <span className="th-admin-cat__empty-val">Chưa có mô tả</span>
  }
  if (looksLikeHtml(html)) {
    return (
      <div
        className={`th-rich-text${c}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }
  return <div className={`th-rich-text th-rich-text--plain${c}`}>{html}</div>
}
