import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Bold, Italic, List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon, Heading1, Heading2, Undo, Redo } from 'lucide-react'
import { useState } from 'react'
import { MediaPicker } from './MediaPicker'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  if (!editor) return null

  const Btn = ({ active, onClick, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-ink-100 ${active ? 'bg-lilac-100 text-lilac-700' : 'text-ink-600'}`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-ink-200 rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 border-b border-ink-100 bg-ink-50">
        <Btn title="H1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={16} />
        </Btn>
        <Btn title="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={16} />
        </Btn>
        <div className="w-px bg-ink-200 mx-1" />
        <Btn title="Negrito" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </Btn>
        <Btn title="Itálico" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </Btn>
        <div className="w-px bg-ink-200 mx-1" />
        <Btn title="Lista" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </Btn>
        <Btn title="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </Btn>
        <Btn title="Citação" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </Btn>
        <div className="w-px bg-ink-200 mx-1" />
        <Btn
          title="Link"
          active={editor.isActive('link')}
          onClick={() => {
            const url = window.prompt('URL:', editor.getAttributes('link').href || 'https://')
            if (url === null) return
            if (url === '') editor.chain().focus().unsetLink().run()
            else editor.chain().focus().setLink({ href: url }).run()
          }}
        >
          <LinkIcon size={16} />
        </Btn>
        <Btn title="Inserir imagem" onClick={() => setPickerOpen(true)}>
          <ImageIcon size={16} />
        </Btn>
        <div className="w-px bg-ink-200 mx-1" />
        <Btn title="Desfazer" onClick={() => editor.chain().focus().undo().run()}>
          <Undo size={16} />
        </Btn>
        <Btn title="Refazer" onClick={() => editor.chain().focus().redo().run()}>
          <Redo size={16} />
        </Btn>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[280px]"
      />

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        multiple={false}
        onSelect={(urls) => {
          if (urls[0]) editor.chain().focus().setImage({ src: urls[0] }).run()
        }}
      />
    </div>
  )
}
