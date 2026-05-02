import type { SellerPlaceholderId } from '../config/sellerPlaceholderCopy'
import { sellerPlaceholderCopy } from '../config/sellerPlaceholderCopy'
import './SellerPlaceholderPage.css'

type Props = {
  pageId: SellerPlaceholderId
}

export function SellerPlaceholderPage({ pageId }: Props) {
  const c = sellerPlaceholderCopy[pageId]

  return (
    <div className="th-seller-placeholder">
      <h1 className="th-seller-placeholder__title">{c.title}</h1>
      <p className="th-seller-placeholder__lead">{c.lead}</p>
    </div>
  )
}
