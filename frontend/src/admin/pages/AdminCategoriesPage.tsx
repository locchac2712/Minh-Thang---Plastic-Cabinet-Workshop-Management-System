import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  AppFilterActions,
  AppFilterBar,
  AppFilterClearButton,
  AppFilterField,
  AppFilterInput,
  AppFilterSelect,
  AppPagination,
} from '../../shared/ui/listing'
import { getAccessToken, getTokenType } from '../../auth/storage'
import './AdminCategoriesPage.css'

/* ── Types ─────────────────────────────────────────────────────────── */
type Category = {
  id: string
  name: string
  description: string
  productCount: number
  isActive: boolean
  imageUrl: string | null
  createdAt: string
}

type PendingConfirm =
  | null
  | { kind: 'delete'; id: string; name: string }
  | { kind: 'toggleActive'; id: string; name: string; newActive: boolean }
  | { kind: 'saveDetail' }

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

type CategoryApiDto = {
  id: string
  name: string
  description: string
  imageUrl: string | null
  isActive: boolean
  createdAt: string
}

type CategoryListResponse = {
  content: CategoryApiDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

type UploadedImageResponse = {
  url: string
  publicId: string
}

type Notice = {
  type: 'success' | 'error'
  message: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

const PAGE_SIZE_OPTIONS = [10, 15, 20, 50] as const

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/* ── Component ──────────────────────────────────────────────────────── */
/**
 * Ngành hàng (Categories) — CRUD nhóm sản phẩm.
 * @see documents/ui/admin_sidebar.md §3
 */
export function AdminCategoriesPage() {
  const fid = useId()

  /* dialogs */
  const addDialogRef = useRef<HTMLDialogElement>(null)
  const detailDialogRef = useRef<HTMLDialogElement>(null)
  const confirmDialogRef = useRef<HTMLDialogElement>(null)

  /* data */
  const [rows, setRows] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [reloadNonce, setReloadNonce] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [confirmWorking, setConfirmWorking] = useState(false)
  const [imageInputMode, setImageInputMode] = useState<'link' | 'upload'>('link')
  const [draftImageFile, setDraftImageFile] = useState<File | null>(null)
  const [draft, setDraft] = useState({ name: '', description: '', imageUrl: '' })

  /* detail / edit */
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailEdit, setDetailEdit] = useState(false)
  const [detailDraft, setDetailDraft] = useState<Category | null>(null)
  const [detailImageInputMode, setDetailImageInputMode] = useState<'link' | 'upload'>('link')
  const [detailImageFile, setDetailImageFile] = useState<File | null>(null)

  /* confirm */
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null)

  /* search / filter / pagination */
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState<number>(15)
  const filtersApplied = filterStatus !== 'all' || searchQuery.trim() !== ''

  const mapCategory = useCallback((dto: CategoryApiDto): Category => {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description ?? '',
      productCount: 0,
      isActive: dto.isActive,
      imageUrl: dto.imageUrl,
      createdAt: dto.createdAt,
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setLoadError('Thiếu access token. Vui lòng đăng nhập lại.')
      setRows([])
      setTotalElements(0)
      return
    }

    setLoading(true)
    setLoadError(null)
    try {
      const q = new URLSearchParams()
      q.set('page', String(pageIndex))
      q.set('size', String(pageSize))
      const search = searchQuery.trim()
      if (search) q.set('search', search)
      if (filterStatus !== 'all') q.set('is_active', filterStatus === 'active' ? 'true' : 'false')

      const res = await fetch(`${API_BASE_URL}/api/admin/categories?${q.toString()}`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })

      const envelope = (await res.json()) as ApiEnvelope<CategoryListResponse>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tải được danh sách ngành hàng')
      }

      const data = envelope.data
      setRows(data.content.map(mapCategory))
      setPageIndex(data.page)
      setTotalElements(data.totalElements)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Không tải được danh sách ngành hàng')
      setRows([])
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, mapCategory, pageIndex, pageSize, searchQuery])

  useEffect(() => {
    void fetchCategories()
  }, [fetchCategories, reloadNonce])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 3000)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => { setPageIndex(0) }, [searchQuery, filterStatus])

  /* ── dialog sync ──────────────────────────────────────────────────── */
  useEffect(() => {
    const el = addDialogRef.current
    if (!el) return
    addOpen ? (!el.open && el.showModal()) : (el.open && el.close())
  }, [addOpen])

  useEffect(() => {
    const el = detailDialogRef.current
    if (!el) return
    selectedId ? (!el.open && el.showModal()) : (el.open && el.close())
  }, [selectedId])

  useEffect(() => {
    const el = confirmDialogRef.current
    if (!el) return
    pendingConfirm ? (!el.open && el.showModal()) : (el.open && el.close())
  }, [pendingConfirm])

  /* ── keep detail draft fresh when not editing ─────────────────────── */
  useEffect(() => {
    if (!selectedId || detailEdit) return
    const u = rows.find((r) => r.id === selectedId)
    if (u) setDetailDraft({ ...u })
  }, [rows, selectedId, detailEdit])

  /* ── actions ──────────────────────────────────────────────────────── */
  const openDetail = useCallback(
    (id: string) => {
      const u = rows.find((r) => r.id === id)
      if (!u) return
      setSelectedId(id)
      setDetailDraft({ ...u })
      setDetailImageInputMode('link')
      setDetailImageFile(null)
      setDetailEdit(false)
    },
    [rows],
  )

  const closeDetail = useCallback(() => {
    setSelectedId(null)
    setDetailDraft(null)
    setDetailEdit(false)
    setDetailImageInputMode('link')
    setDetailImageFile(null)
  }, [])

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const accessToken = getAccessToken()
    if (!accessToken) {
      setNotice({ type: 'error', message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' })
      return
    }

    const name = draft.name.trim()
    if (!name) return

    setAddSubmitting(true)
    try {
      let finalImageUrl = ''
      if (imageInputMode === 'link') {
        finalImageUrl = draft.imageUrl.trim()
      } else if (draftImageFile) {
        const uploadBody = new FormData()
        uploadBody.append('file', draftImageFile)

        const uploadRes = await fetch(`${API_BASE_URL}/api/uploadable/image`, {
          method: 'POST',
          headers: {
            accept: '*/*',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
          body: uploadBody,
        })
        const uploadEnvelope = (await uploadRes.json()) as ApiEnvelope<UploadedImageResponse>
        if (!uploadRes.ok || !uploadEnvelope.success || !uploadEnvelope.data?.url) {
          throw new Error(uploadEnvelope.message || 'Upload ảnh thất bại')
        }
        finalImageUrl = uploadEnvelope.data.url
      } else {
        throw new Error('Vui lòng chọn ảnh để tải lên.')
      }

      const createRes = await fetch(`${API_BASE_URL}/api/admin/categories`, {
        method: 'POST',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
        body: JSON.stringify({
          name,
          description: draft.description.trim(),
          imageUrl: finalImageUrl || null,
        }),
      })
      const createEnvelope = (await createRes.json()) as ApiEnvelope<CategoryApiDto>
      if (!createRes.ok || !createEnvelope.success || !createEnvelope.data) {
        throw new Error(createEnvelope.message || 'Tạo ngành hàng thất bại')
      }

      setNotice({ type: 'success', message: `Đã tạo ngành hàng ${createEnvelope.data.name} thành công.` })
      setDraft({ name: '', description: '', imageUrl: '' })
      setDraftImageFile(null)
      setImageInputMode('link')
    setAddOpen(false)
      setPageIndex(0)
      setReloadNonce((n) => n + 1)
    } catch (err) {
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể tạo ngành hàng',
      })
    } finally {
      setAddSubmitting(false)
    }
  }

  const uploadImage = useCallback(async (file: File, accessToken: string): Promise<string> => {
    const uploadBody = new FormData()
    uploadBody.append('file', file)

    const uploadRes = await fetch(`${API_BASE_URL}/api/uploadable/image`, {
      method: 'POST',
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
      body: uploadBody,
    })
    const uploadEnvelope = (await uploadRes.json()) as ApiEnvelope<UploadedImageResponse>
    if (!uploadRes.ok || !uploadEnvelope.success || !uploadEnvelope.data?.url) {
      throw new Error(uploadEnvelope.message || 'Upload ảnh thất bại')
    }
    return uploadEnvelope.data.url
  }, [])

  const handleConfirmAction = useCallback(async () => {
    if (!pendingConfirm || confirmWorking) return

    const accessToken = getAccessToken()
    if (!accessToken) {
      setNotice({ type: 'error', message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' })
      setPendingConfirm(null)
      return
    }

    if (pendingConfirm.kind === 'delete') {
      setRows((prev) => prev.filter((r) => r.id !== pendingConfirm.id))
      if (selectedId === pendingConfirm.id) closeDetail()
      setPendingConfirm(null)
      return
    }

    if (pendingConfirm.kind === 'toggleActive') {
      const current = rows.find((r) => r.id === pendingConfirm.id)
      if (!current) {
        setPendingConfirm(null)
        return
      }
      setConfirmWorking(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/categories/${encodeURIComponent(current.id)}`, {
          method: 'PATCH',
          headers: {
            accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
          body: JSON.stringify({
            name: current.name,
            description: current.description,
            imageUrl: current.imageUrl,
            isActive: pendingConfirm.newActive,
          }),
        })
        const envelope = (await res.json()) as ApiEnvelope<CategoryApiDto>
        if (!res.ok || !envelope.success || !envelope.data) {
          throw new Error(envelope.message || 'Cập nhật trạng thái ngành hàng thất bại')
        }
        const next = mapCategory(envelope.data)
        setRows((prev) => prev.map((r) => (r.id === current.id ? next : r)))
        if (selectedId === current.id) setDetailDraft(next)
        setNotice({ type: 'success', message: envelope.message || 'Đã cập nhật trạng thái ngành hàng.' })
      } catch (err) {
        setNotice({
          type: 'error',
          message: err instanceof Error ? err.message : 'Không thể cập nhật trạng thái ngành hàng',
        })
      } finally {
        setConfirmWorking(false)
        setPendingConfirm(null)
      }
      return
    }

    if (pendingConfirm.kind === 'saveDetail' && selectedId && detailDraft) {
      const name = detailDraft.name.trim()
      const description = detailDraft.description.trim()
      if (!name) {
        setNotice({ type: 'error', message: 'Tên ngành hàng không được để trống.' })
        setPendingConfirm(null)
        return
      }

      setConfirmWorking(true)
      try {
        let imageUrl = detailDraft.imageUrl?.trim() ?? ''
        if (detailImageInputMode === 'upload') {
          if (!detailImageFile) throw new Error('Vui lòng chọn ảnh để tải lên.')
          imageUrl = await uploadImage(detailImageFile, accessToken)
        }

        const res = await fetch(`${API_BASE_URL}/api/admin/categories/${encodeURIComponent(selectedId)}`, {
          method: 'PATCH',
          headers: {
            accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
          body: JSON.stringify({
            name,
            description,
            imageUrl: imageUrl || null,
            isActive: detailDraft.isActive,
          }),
        })
        const envelope = (await res.json()) as ApiEnvelope<CategoryApiDto>
        if (!res.ok || !envelope.success || !envelope.data) {
          throw new Error(envelope.message || 'Cập nhật ngành hàng thất bại')
        }
        const next = mapCategory(envelope.data)
        setRows((prev) => prev.map((r) => (r.id === selectedId ? next : r)))
      setDetailDraft(next)
      setDetailEdit(false)
        setDetailImageInputMode('link')
        setDetailImageFile(null)
        setNotice({ type: 'success', message: envelope.message || 'Đã cập nhật ngành hàng.' })
      } catch (err) {
        setNotice({
          type: 'error',
          message: err instanceof Error ? err.message : 'Không thể cập nhật ngành hàng',
        })
      } finally {
        setConfirmWorking(false)
        setPendingConfirm(null)
      }
      return
    }

    setPendingConfirm(null)
  }, [
    pendingConfirm,
    confirmWorking,
    selectedId,
    detailDraft,
    detailImageInputMode,
    detailImageFile,
    closeDetail,
    rows,
    mapCategory,
    uploadImage,
  ])

  /* ── render ───────────────────────────────────────────────────────── */
  return (
    <div className="th-admin-cat">
      {/* ── Page header ── */}
      <header className="th-admin-cat__header">
        <div className="th-admin-cat__heading">
          <h1 className="th-admin-cat__title">Ngành hàng</h1>
          {loadError ? <p className="th-admin-users__api-error">{loadError}</p> : null}
        </div>
      </header>
      {notice ? (
        <div
          className={`th-admin-users-notice th-admin-users-notice--${notice.type}`}
          role="status"
          aria-live="polite"
        >
          {notice.message}
        </div>
      ) : null}

      {/* ── Dialog: Thêm ngành hàng ── */}
      <dialog
        ref={addDialogRef}
        className="th-dlg"
        aria-labelledby={`${fid}-add-title`}
        onClose={() => {
          setAddOpen(false)
          setDraft({ name: '', description: '', imageUrl: '' })
          setDraftImageFile(null)
          setImageInputMode('link')
        }}
        onClick={(e) => { if (e.target === addDialogRef.current) addDialogRef.current?.close() }}
      >
        <div className="th-dlg__panel" onClick={(e) => e.stopPropagation()}>
          <div className="th-dlg__head">
            <div className="th-dlg__head-icon">
              <span className="material-symbols-outlined" aria-hidden>category</span>
            </div>
            <h2 id={`${fid}-add-title`} className="th-dlg__title">Thêm ngành hàng</h2>
            <button type="button" className="th-dlg__close" onClick={() => addDialogRef.current?.close()} aria-label="Đóng">
              <span className="material-symbols-outlined" aria-hidden>close</span>
            </button>
          </div>
          <form onSubmit={handleAddSubmit}>
            <div className="th-dlg__body">
              <label className="th-admin-cat-field">
                <span className="th-admin-cat-field__label">Tên ngành hàng</span>
                <input
                  className="th-admin-cat-field__input"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Ví dụ: Tủ Bếp"
                  required
                  autoFocus
                />
              </label>
              <label className="th-admin-cat-field">
                <span className="th-admin-cat-field__label">Mô tả ngắn</span>
                <textarea
                  className="th-admin-cat-field__input th-admin-cat-field__input--textarea"
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  placeholder="Mô tả sản phẩm thuộc ngành hàng này…"
                  rows={3}
                />
              </label>
              <label className="th-admin-cat-field">
                <span className="th-admin-cat-field__label">Cách nhập ảnh</span>
                <div className="th-admin-cat-segment" role="tablist" aria-label="Chọn cách nhập ảnh">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={imageInputMode === 'link'}
                    className={`th-admin-cat-segment__btn${imageInputMode === 'link' ? ' is-active' : ''}`}
                    onClick={() => setImageInputMode('link')}
                  >
                    Link ảnh
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={imageInputMode === 'upload'}
                    className={`th-admin-cat-segment__btn${imageInputMode === 'upload' ? ' is-active' : ''}`}
                    onClick={() => setImageInputMode('upload')}
                  >
                    Tải từ máy
                  </button>
                </div>
              </label>
              {imageInputMode === 'link' ? (
                <label className="th-admin-cat-field">
                  <span className="th-admin-cat-field__label">Image URL</span>
                  <input
                    className="th-admin-cat-field__input"
                    value={draft.imageUrl}
                    onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </label>
              ) : (
                <label className="th-admin-cat-field">
                  <span className="th-admin-cat-field__label">Ảnh từ máy</span>
                  <input
                    className="th-admin-cat-field__input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDraftImageFile(e.target.files?.[0] ?? null)}
                    required
                  />
                </label>
              )}
            </div>
            <div className="th-dlg__footer">
              <button
                type="button"
                className="th-admin-cat__btn-ghost"
                onClick={() => addDialogRef.current?.close()}
                disabled={addSubmitting}
              >
                Hủy
              </button>
              <button type="submit" className="th-admin-cat__btn-primary" disabled={addSubmitting}>
                <span className="material-symbols-outlined th-admin-cat__btn-icon" aria-hidden>save</span>
                {addSubmitting ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* ── Dialog: Chi tiết ── */}
      <dialog
        ref={detailDialogRef}
        className="th-dlg"
        aria-labelledby={`${fid}-detail-title`}
        onClose={closeDetail}
        onClick={(e) => { if (e.target === detailDialogRef.current) detailDialogRef.current?.close() }}
      >
        {selectedId && detailDraft ? (
          <div className="th-dlg__panel" onClick={(e) => e.stopPropagation()}>
            <div className="th-dlg__head th-dlg__head--detail">
              <div className="th-dlg__avatar">{getInitials(detailDraft.name)}</div>
              <div className="th-dlg__identity">
                <h2 id={`${fid}-detail-title`} className="th-dlg__identity-name">{detailDraft.name}</h2>
                <span className="th-dlg__identity-email">
                  {detailDraft.productCount} mẫu tủ &nbsp;·&nbsp;{' '}
                  {detailDraft.isActive ? 'Đang kích hoạt' : 'Ẩn'}
                </span>
              </div>
              <button type="button" className="th-dlg__close" onClick={() => detailDialogRef.current?.close()} aria-label="Đóng">
                <span className="material-symbols-outlined" aria-hidden>close</span>
              </button>
            </div>

            {!detailEdit ? (
              <>
                <div className="th-dlg__body">
                  <dl className="th-admin-users-detail__dl">
                    <div className="th-admin-users-detail__row">
                      <dt>Mô tả</dt>
                      <dd>{detailDraft.description || <span className="th-admin-cat__empty-val">Chưa có mô tả</span>}</dd>
                    </div>
                    <div className="th-admin-users-detail__row">
                      <dt>Số mẫu tủ</dt>
                      <dd>
                        <span className="th-admin-badge th-admin-badge--role">
                          {detailDraft.productCount} sản phẩm
                        </span>
                      </dd>
                    </div>
                    <div className="th-admin-users-detail__row">
                      <dt>Trạng thái</dt>
                      <dd>
                        <span className={`th-admin-badge ${detailDraft.isActive ? 'th-admin-badge--active' : 'th-admin-badge--locked'}`}>
                          <span className="th-admin-badge__dot" aria-hidden />
                          {detailDraft.isActive ? 'Kích hoạt' : 'Ẩn'}
                        </span>
                      </dd>
                    </div>
                    <div className="th-admin-users-detail__row">
                      <dt>ID</dt>
                      <dd><span className="th-admin-cat__mono">#{detailDraft.id}</span></dd>
                    </div>
                  </dl>
                </div>
                <div className="th-dlg__footer">
                  <button
                    type="button"
                    className="th-admin-cat__btn-danger-ghost"
                    onClick={() => setPendingConfirm({ kind: 'delete', id: detailDraft.id, name: detailDraft.name })}
                  >
                    <span className="material-symbols-outlined th-admin-cat__btn-icon" aria-hidden>delete</span>
                    Xóa
                  </button>
                  <button type="button" className="th-admin-cat__btn-ghost" onClick={() => detailDialogRef.current?.close()}>Đóng</button>
                  <button type="button" className="th-admin-cat__btn-primary" onClick={() => setDetailEdit(true)}>
                    <span className="material-symbols-outlined th-admin-cat__btn-icon" aria-hidden>edit</span>
                    Chỉnh sửa
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setPendingConfirm({ kind: 'saveDetail' }) }}>
                <div className="th-dlg__body">
                  <label className="th-admin-cat-field">
                    <span className="th-admin-cat-field__label">Tên ngành hàng</span>
                    <input
                      className="th-admin-cat-field__input"
                      value={detailDraft.name}
                      onChange={(e) => setDetailDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                      required
                    />
                  </label>
                  <label className="th-admin-cat-field">
                    <span className="th-admin-cat-field__label">Mô tả ngắn</span>
                    <textarea
                      className="th-admin-cat-field__input th-admin-cat-field__input--textarea"
                      value={detailDraft.description}
                      onChange={(e) => setDetailDraft((d) => (d ? { ...d, description: e.target.value } : d))}
                      rows={3}
                    />
                  </label>
                  <label className="th-admin-cat-field">
                    <span className="th-admin-cat-field__label">Cách nhập ảnh</span>
                    <div className="th-admin-cat-segment" role="tablist" aria-label="Chọn cách nhập ảnh">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={detailImageInputMode === 'link'}
                        className={`th-admin-cat-segment__btn${detailImageInputMode === 'link' ? ' is-active' : ''}`}
                        onClick={() => setDetailImageInputMode('link')}
                      >
                        Link ảnh
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={detailImageInputMode === 'upload'}
                        className={`th-admin-cat-segment__btn${detailImageInputMode === 'upload' ? ' is-active' : ''}`}
                        onClick={() => setDetailImageInputMode('upload')}
                      >
                        Tải từ máy
                      </button>
                    </div>
                  </label>
                  {detailImageInputMode === 'link' ? (
                    <label className="th-admin-cat-field">
                      <span className="th-admin-cat-field__label">Image URL</span>
                      <input
                        className="th-admin-cat-field__input"
                        value={detailDraft.imageUrl ?? ''}
                        onChange={(e) => setDetailDraft((d) => (d ? { ...d, imageUrl: e.target.value } : d))}
                        placeholder="https://..."
                      />
                    </label>
                  ) : (
                    <label className="th-admin-cat-field">
                      <span className="th-admin-cat-field__label">Ảnh từ máy</span>
                      <input
                        className="th-admin-cat-field__input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setDetailImageFile(e.target.files?.[0] ?? null)}
                        required
                      />
                    </label>
                  )}
                  <label className="th-admin-cat-field th-admin-cat-field--checkbox">
                    <input
                      type="checkbox"
                      className="th-admin-cat-field__check"
                      checked={detailDraft.isActive}
                      onChange={(e) => setDetailDraft((d) => (d ? { ...d, isActive: e.target.checked } : d))}
                    />
                    <span>Ngành hàng đang kích hoạt</span>
                  </label>
                </div>
                <div className="th-dlg__footer">
                  <button type="button" className="th-admin-cat__btn-ghost" onClick={() => {
                    const u = rows.find((r) => r.id === selectedId)
                    if (u) setDetailDraft({ ...u })
                    setDetailEdit(false)
                    setDetailImageInputMode('link')
                    setDetailImageFile(null)
                  }}>Hủy</button>
                  <button type="submit" className="th-admin-cat__btn-primary">
                    <span className="material-symbols-outlined th-admin-cat__btn-icon" aria-hidden>save</span>
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : null}
      </dialog>

      {/* ── Dialog: Xác nhận ── */}
      <dialog
        ref={confirmDialogRef}
        className="th-dlg th-dlg--confirm"
        aria-labelledby={`${fid}-confirm-title`}
        aria-describedby={pendingConfirm ? `${fid}-confirm-desc` : undefined}
        onClose={() => {
          setPendingConfirm(null)
          setConfirmWorking(false)
        }}
        onClick={(e) => { if (e.target === confirmDialogRef.current) confirmDialogRef.current?.close() }}
      >
        {pendingConfirm ? (
          <div className="th-dlg__panel" onClick={(e) => e.stopPropagation()}>
            <div className="th-dlg__body th-dlg__body--confirm">
              <div className={`th-dlg__confirm-icon ${
                pendingConfirm.kind === 'delete' ? 'th-dlg__confirm-icon--danger'
                : pendingConfirm.kind === 'toggleActive' && !pendingConfirm.newActive ? 'th-dlg__confirm-icon--warn'
                : pendingConfirm.kind === 'toggleActive' ? 'th-dlg__confirm-icon--success'
                : 'th-dlg__confirm-icon--info'
              }`}>
                <span className="material-symbols-outlined" aria-hidden>
                  {pendingConfirm.kind === 'delete' && 'delete_forever'}
                  {pendingConfirm.kind === 'toggleActive' && !pendingConfirm.newActive && 'visibility_off'}
                  {pendingConfirm.kind === 'toggleActive' && pendingConfirm.newActive && 'visibility'}
                  {pendingConfirm.kind === 'saveDetail' && 'save'}
                </span>
              </div>
              <h2 id={`${fid}-confirm-title`} className="th-dlg__confirm-title">
                {pendingConfirm.kind === 'delete' && 'Xóa ngành hàng?'}
                {pendingConfirm.kind === 'toggleActive' && (pendingConfirm.newActive ? 'Kích hoạt ngành hàng?' : 'Ẩn ngành hàng?')}
                {pendingConfirm.kind === 'saveDetail' && 'Lưu thay đổi?'}
              </h2>
              <p id={`${fid}-confirm-desc`} className="th-dlg__confirm-desc">
                {pendingConfirm.kind === 'delete' && (
                  <>Ngành hàng <strong>{pendingConfirm.name}</strong> sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.</>
                )}
                {pendingConfirm.kind === 'toggleActive' && !pendingConfirm.newActive && (
                  <>Ngành hàng <strong>{pendingConfirm.name}</strong> sẽ bị ẩn khỏi các mẫu tủ.</>
                )}
                {pendingConfirm.kind === 'toggleActive' && pendingConfirm.newActive && (
                  <>Kích hoạt lại <strong>{pendingConfirm.name}</strong> để hiển thị trong danh mục.</>
                )}
                {pendingConfirm.kind === 'saveDetail' && <>Cập nhật thông tin ngành hàng lên hệ thống.</>}
              </p>
            </div>
            <div className="th-dlg__footer th-dlg__footer--confirm">
              <button
                type="button"
                className="th-admin-cat__btn-ghost"
                onClick={() => confirmDialogRef.current?.close()}
                disabled={confirmWorking}
              >
                Hủy
              </button>
              <button
                type="button"
                className={pendingConfirm.kind === 'delete' ? 'th-admin-cat__btn-danger' : 'th-admin-cat__btn-primary'}
                onClick={() => void handleConfirmAction()}
                disabled={confirmWorking}
              >
                {confirmWorking
                  ? 'Đang xử lý...'
                  : pendingConfirm.kind === 'delete'
                    ? 'Xóa vĩnh viễn'
                    : 'Xác nhận'}
              </button>
            </div>
          </div>
        ) : null}
      </dialog>

      {/* ── Table card ── */}
      <div className="th-admin-cat-table-wrap">

        {/* toolbar */}
        <div className="th-admin-cat-table-head">
          <AppFilterBar className="th-admin-cat-table-bar">
            <AppFilterField search className="th-admin-cat-search">
              <span className="th-admin-users-visually-hidden">Tìm theo tên hoặc mô tả</span>
              <AppFilterInput
                value={searchQuery}
                onChangeValue={setSearchQuery}
                placeholder="Tìm ngành hàng…"
                autoComplete="off"
              />
            </AppFilterField>

            <AppFilterField label="Trạng thái" className="th-admin-cat-filter-field">
              <AppFilterSelect
                value={filterStatus}
                onChangeValue={(value) => setFilterStatus(value as 'all' | 'active' | 'inactive')}
                options={[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'active', label: 'Kích hoạt' },
                  { value: 'inactive', label: 'Đã ẩn' },
                ]}
              />
            </AppFilterField>

            {filtersApplied ? (
              <AppFilterActions>
                <AppFilterClearButton
                  onClick={() => {
                    setFilterStatus('all')
                    setSearchQuery('')
                  }}
                />
              </AppFilterActions>
            ) : null}

            <button
              type="button"
              className="th-admin-cat__btn-primary th-admin-cat__filter-add"
              onClick={() => setAddOpen(true)}
              aria-haspopup="dialog"
            >
              <span className="material-symbols-outlined th-admin-cat__btn-icon" aria-hidden>
                add
              </span>
              Thêm ngành hàng
            </button>
          </AppFilterBar>
        </div>

        {/* table */}
        <div className="th-admin-cat-table-scroll">
          <table className="th-admin-cat-table" aria-label="Bảng ngành hàng">
            <thead>
              <tr>
                <th scope="col" style={{ width: '3rem' }} />
                <th scope="col">Tên ngành hàng</th>
                <th scope="col">Mô tả</th>
                <th scope="col" style={{ width: '8rem' }}>Trạng thái</th>
                <th scope="col" style={{ width: '6rem' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="th-admin-cat-table__empty">
                    Đang tải danh sách ngành hàng...
                  </td>
                </tr>
              ) : null}
              {!loading && totalElements === 0 ? (
                <tr>
                  <td colSpan={5} className="th-admin-cat-table__empty">
                    Không có ngành hàng phù hợp.
                  </td>
                </tr>
              ) : null}
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={`th-admin-cat-table__row${selectedId === row.id ? ' th-admin-cat-table__row--selected' : ''}`}
                  onClick={() => openDetail(row.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(row.id) } }}
                  tabIndex={0}
                  aria-label={`Xem chi tiết ${row.name}`}
                >
                  <td data-label="">
                    <div className="th-admin-cat-avatar">{getInitials(row.name)}</div>
                  </td>
                  <td data-label="Tên">
                    <span className="th-admin-cat-table__name">{row.name}</span>
                  </td>
                  <td data-label="Mô tả">
                    <span className="th-admin-cat-table__desc">{row.description || '—'}</span>
                  </td>
                  <td data-label="Trạng thái">
                    <button
                      type="button"
                      className={`th-admin-toggle${row.isActive ? ' th-admin-toggle--on' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingConfirm({ kind: 'toggleActive', id: row.id, name: row.name, newActive: !row.isActive })
                      }}
                      aria-pressed={row.isActive}
                      aria-label={row.isActive ? `Ẩn ${row.name}` : `Kích hoạt ${row.name}`}
                    >
                      <span className="th-admin-toggle__track"><span className="th-admin-toggle__thumb" /></span>
                      <span className="th-admin-toggle__text">{row.isActive ? 'Kích hoạt' : 'Ẩn'}</span>
                    </button>
                  </td>
                  <td data-label="Thao tác" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="th-admin-cat__btn-icon-only"
                      aria-label={`Chỉnh sửa ${row.name}`}
                      title="Chỉnh sửa ngành hàng"
                      onClick={() => {
                        openDetail(row.id)
                        setDetailEdit(true)
                        setDetailImageInputMode('link')
                        setDetailImageFile(null)
                      }}
                    >
                      <span className="material-symbols-outlined" aria-hidden>edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <AppPagination
          className="th-admin-cat-pagination"
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={totalElements}
          pageSizeOptions={PAGE_SIZE_OPTIONS as unknown as number[]}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize)
            setPageIndex(0)
          }}
        />

      </div>
    </div>
  )
}
