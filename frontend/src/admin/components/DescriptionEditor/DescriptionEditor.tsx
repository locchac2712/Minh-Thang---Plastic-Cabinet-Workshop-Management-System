import { Color } from '@tiptap/extension-color'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import './DescriptionEditor.css'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  id?: string
}

function normalizeHtml(h: string): string {
  const t = h.trim()
  if (t === '' || t === '<p></p>' || t === '<p><br></p>') return ''
  return h
}

export function DescriptionEditor({ value, onChange, placeholder, id }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? '',
        emptyEditorClass: 'th-description-editor__empty',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'th-description-editor__content',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const cur = normalizeHtml(editor.getHTML())
    const next = normalizeHtml(value || '')
    if (cur === next) return
    editor.commands.setContent(value || '', { emitUpdate: false })
  }, [editor, value])

  if (!editor) {
    return (
      <div className="th-description-editor th-description-editor--loading" id={id} aria-busy>
        <span className="th-description-editor__loading-text">Đang tải trình soạn thảo…</span>
      </div>
    )
  }

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Địa chỉ liên kết', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="th-description-editor" id={id}>
      <div className="th-description-editor__toolbar" role="toolbar" aria-label="Định dạng mô tả">
        <span className="th-description-editor__group">
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive('heading', { level: 1 }) ? ' th-description-editor__tb--on' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Tiêu đề 1"
          >
            H1
          </button>
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive('heading', { level: 2 }) ? ' th-description-editor__tb--on' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Tiêu đề 2"
          >
            H2
          </button>
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive('heading', { level: 3 }) ? ' th-description-editor__tb--on' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Tiêu đề 3"
          >
            H3
          </button>
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive('paragraph') && !editor.isActive('heading') ? ' th-description-editor__tb--on' : ''}`}
            onClick={() => editor.chain().focus().setParagraph().run()}
            title="Đoạn văn"
          >
            ¶
          </button>
        </span>
        <span className="th-description-editor__sep" aria-hidden />
        <span className="th-description-editor__group">
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive('bold') ? ' th-description-editor__tb--on' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Đậm"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive('italic') ? ' th-description-editor__tb--on' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Nghiêng"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive('underline') ? ' th-description-editor__tb--on' : ''}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Gạch dưới"
          >
            <span className="th-description-editor__u">U</span>
          </button>
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive('strike') ? ' th-description-editor__tb--on' : ''}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Gạch ngang"
          >
            <s>S</s>
          </button>
        </span>
        <span className="th-description-editor__sep" aria-hidden />
        <span className="th-description-editor__group">
          <label className="th-description-editor__color">
            <span className="th-description-editor-visually-hidden">Màu chữ</span>
            <input
              type="color"
              aria-label="Màu chữ"
              value={editor.getAttributes('textStyle').color || '#0f172a'}
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            />
          </label>
        </span>
        <span className="th-description-editor__sep" aria-hidden />
        <span className="th-description-editor__group">
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive({ textAlign: 'left' }) ? ' th-description-editor__tb--on' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Căn trái"
          >
            <span className="material-symbols-outlined" aria-hidden>format_align_left</span>
          </button>
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive({ textAlign: 'center' }) ? ' th-description-editor__tb--on' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Căn giữa"
          >
            <span className="material-symbols-outlined" aria-hidden>format_align_center</span>
          </button>
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive({ textAlign: 'right' }) ? ' th-description-editor__tb--on' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="Căn phải"
          >
            <span className="material-symbols-outlined" aria-hidden>format_align_right</span>
          </button>
        </span>
        <span className="th-description-editor__sep" aria-hidden />
        <span className="th-description-editor__group">
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive('bulletList') ? ' th-description-editor__tb--on' : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Danh sách bullet"
          >
            <span className="material-symbols-outlined" aria-hidden>format_list_bulleted</span>
          </button>
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive('orderedList') ? ' th-description-editor__tb--on' : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Danh sách số"
          >
            <span className="material-symbols-outlined" aria-hidden>format_list_numbered</span>
          </button>
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive('blockquote') ? ' th-description-editor__tb--on' : ''}`}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Trích dẫn"
          >
            <span className="material-symbols-outlined" aria-hidden>format_quote</span>
          </button>
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive('codeBlock') ? ' th-description-editor__tb--on' : ''}`}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Khối mã"
          >
            <span className="material-symbols-outlined" aria-hidden>code</span>
          </button>
        </span>
        <span className="th-description-editor__sep" aria-hidden />
        <span className="th-description-editor__group">
          <button
            type="button"
            className={`th-description-editor__tb${editor.isActive('link') ? ' th-description-editor__tb--on' : ''}`}
            onClick={setLink}
            title="Liên kết"
          >
            <span className="material-symbols-outlined" aria-hidden>link</span>
          </button>
          <button
            type="button"
            className="th-description-editor__tb"
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            title="Xóa định dạng tại vị trí"
          >
            <span className="material-symbols-outlined" aria-hidden>format_clear</span>
          </button>
        </span>
        <span className="th-description-editor__sep" aria-hidden />
        <span className="th-description-editor__group">
          <button
            type="button"
            className="th-description-editor__tb"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Hoàn tác"
          >
            <span className="material-symbols-outlined" aria-hidden>undo</span>
          </button>
          <button
            type="button"
            className="th-description-editor__tb"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Làm lại"
          >
            <span className="material-symbols-outlined" aria-hidden>redo</span>
          </button>
        </span>
      </div>
      <EditorContent editor={editor} className="th-description-editor__wrap" />
    </div>
  )
}
