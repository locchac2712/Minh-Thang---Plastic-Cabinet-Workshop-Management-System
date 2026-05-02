import type { AdminPlaceholderId } from '../config/placeholderCopy'
import { adminPlaceholderCopy } from '../config/placeholderCopy'
import './AdminPlaceholderPage.css'

type Props = {
  pageId: AdminPlaceholderId
}

export function AdminPlaceholderPage({ pageId }: Props) {
  const c = adminPlaceholderCopy[pageId]

  return (
    <div className="th-admin-placeholder">
      <h1 className="th-admin-placeholder__title">{c.title}</h1>
      {c.lead ? <p className="th-admin-placeholder__lead">{c.lead}</p> : null}
    </div>
  )
}
