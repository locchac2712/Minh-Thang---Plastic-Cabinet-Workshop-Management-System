import { useCallback, useState } from 'react'
import './ShareTrackLinkDialog.css'

export type ShareTrackLinkDialogProps = {
  open: boolean
  url: string | null
  expiresAt: string | null
  loading: boolean
  error: string | null
  /** Gợi ý ngắn (vd. tên SP) — chi tiết giao hàng nằm trên trang link công khai. */
  subtitle?: string | null
  onClose: () => void
}

function formatExpiry(iso: string | null): string {
  if (!iso?.trim()) return ''
  const d = iso.trim()
  const noMs = d.includes('.') ? (d.split('.')[0] ?? d) : d.length >= 19 ? d.slice(0, 19) : d
  return noMs.includes('T') ? noMs.replace('T', ' ') : noMs
}

export function ShareTrackLinkDialog({
  open,
  url,
  expiresAt,
  loading,
  error,
  subtitle,
  onClose,
}: ShareTrackLinkDialogProps) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [url])

  if (!open) return null

  return (
    <div className="th-share-track__backdrop" role="presentation" onClick={onClose}>
      <div
        className="th-share-track__dialog"
        role="dialog"
        aria-labelledby="th-share-track-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="th-share-track__head">
          <div>
            <h2 id="th-share-track-title">Chia sẻ link theo dõi lô</h2>
            {subtitle?.trim() ? (
              <p className="th-share-track__subtitle">{subtitle.trim()}</p>
            ) : null}
          </div>
          <button type="button" className="th-share-track__close" onClick={onClose} aria-label="Đóng">
            <span className="material-symbols-outlined" aria-hidden>
              close
            </span>
          </button>
        </header>

        {loading ? (
          <p className="th-share-track__muted">Đang tạo link…</p>
        ) : error ? (
          <p className="th-share-track__error" role="alert">
            {error}
          </p>
        ) : url ? (
          <>
            <p className="th-share-track__lead">
              Khách mở link sẽ xem tiến độ sản xuất, nhật ký xưởng và thông tin giao lô (không có
              giá hay dữ liệu nội bộ).
            </p>
            <div className="th-share-track__url-row">
              <input className="th-share-track__url" readOnly value={url} aria-label="Link theo dõi" />
              <button type="button" className="th-share-track__copy" onClick={() => void copy()}>
                {copied ? 'Đã sao chép' : 'Sao chép'}
              </button>
            </div>
            {expiresAt ? (
              <p className="th-share-track__expiry">Hết hạn: {formatExpiry(expiresAt)}</p>
            ) : null}
            <p className="th-share-track__note">Tạo link mới sẽ vô hiệu link cũ (nếu có).</p>
          </>
        ) : null}
      </div>
    </div>
  )
}

export type ShareTrackLinkButtonProps = {
  onShare: () => void
  loading?: boolean
  className?: string
  label?: string
}

export function ShareTrackLinkButton({
  onShare,
  loading = false,
  className,
  label = 'Chia sẻ link',
}: ShareTrackLinkButtonProps) {
  return (
    <button
      type="button"
      className={className ?? 'th-share-track__btn'}
      onClick={onShare}
      disabled={loading}
    >
      <span className="material-symbols-outlined" aria-hidden>
        share
      </span>
      {loading ? 'Đang tạo…' : label}
    </button>
  )
}
