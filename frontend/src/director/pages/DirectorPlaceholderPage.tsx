import type { DirectorPlaceholderId } from '../config/directorPlaceholderCopy'
import { directorPlaceholderCopy } from '../config/directorPlaceholderCopy'
import './DirectorPlaceholderPage.css'

type Props = {
  pageId: DirectorPlaceholderId
}

export function DirectorPlaceholderPage({ pageId }: Props) {
  const c = directorPlaceholderCopy[pageId]

  return (
    <div className="th-director-placeholder">
      <h1 className="th-director-placeholder__title">{c.title}</h1>
      {c.lead ? <p className="th-director-placeholder__lead">{c.lead}</p> : null}
    </div>
  )
}
