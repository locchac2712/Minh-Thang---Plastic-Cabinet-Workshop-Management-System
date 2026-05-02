import type { AccountantPlaceholderId } from '../config/accountantPlaceholderCopy'
import { accountantPlaceholderCopy } from '../config/accountantPlaceholderCopy'
import './AccountantPlaceholderPage.css'

type Props = {
  pageId: AccountantPlaceholderId
}

export function AccountantPlaceholderPage({ pageId }: Props) {
  const c = accountantPlaceholderCopy[pageId]

  return (
    <div className="th-acc-placeholder">
      <h1 className="th-acc-placeholder__title">{c.title}</h1>
      {c.lead ? <p className="th-acc-placeholder__lead">{c.lead}</p> : null}
    </div>
  )
}
