import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  /** TipTap / ProseMirror — tránh lỗi « Outdated Optimize Dep » khi dev server cache deps cũ */
  optimizeDeps: {
    include: [
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-color',
      '@tiptap/extension-link',
      '@tiptap/extension-placeholder',
      '@tiptap/extension-text-align',
      '@tiptap/extension-text-style',
      '@tiptap/extension-underline',
      'prosemirror-view',
      'prosemirror-model',
      'prosemirror-state',
    ],
  },
})
