'use client'

// @anchor: cca.crm.email-editor
// Beautiful TipTap email editor with merge-tag insertion and a clean,
// branded toolbar. Output is HTML ready for the renderer pipeline.

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Image as ImageIcon,
  Code,
  Tag,
  Undo,
  Redo,
  Minus,
} from 'lucide-react'
import { useState } from 'react'
import { STANDARD_MERGE_TAGS } from '@/lib/crm/merge-tags'

interface CustomTag {
  key: string
  label: string
}

interface Props {
  initialHtml?: string
  onChange: (html: string) => void
  customTags?: CustomTag[]
}

function ToolbarBtn({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void
  active?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`p-2 rounded-md transition-colors ${active ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'text-[var(--color-foreground)]/70 hover:bg-[var(--color-muted)]'}`}
    >
      {children}
    </button>
  )
}

export function EmailEditor({ initialHtml, onChange, customTags = [] }: Props) {
  const [tagOpen, setTagOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'cca-link', rel: 'noopener' },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: 'Write your email…' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
    ],
    content: initialHtml ?? '<p></p>',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  })

  if (!editor) return <div className="h-72 rounded-lg bg-[var(--color-muted)] animate-pulse" />
  const ed = editor

  function setLink() {
    const previous = ed.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', previous ?? 'https://')
    if (url === null) return
    if (url === '') {
      ed.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      ed.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run()
    }
  }

  function addImage() {
    const url = window.prompt('Image URL')
    if (!url) return
    ed.chain().focus().setImage({ src: url }).run()
  }

  function insertTag(key: string) {
    ed.chain().focus().insertContent(`{{${key}}}`).run()
    setTagOpen(false)
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-[var(--color-border)]">
          <ToolbarBtn onClick={() => ed.chain().focus().undo().run()} label="Undo">
            <Undo size={15} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => ed.chain().focus().redo().run()} label="Redo">
            <Redo size={15} />
          </ToolbarBtn>
        </div>
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-[var(--color-border)]">
          <ToolbarBtn
            onClick={() => ed.chain().focus().toggleHeading({ level: 1 }).run()}
            active={ed.isActive('heading', { level: 1 })}
            label="Heading 1"
          >
            <Heading1 size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => ed.chain().focus().toggleHeading({ level: 2 }).run()}
            active={ed.isActive('heading', { level: 2 })}
            label="Heading 2"
          >
            <Heading2 size={15} />
          </ToolbarBtn>
        </div>
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-[var(--color-border)]">
          <ToolbarBtn
            onClick={() => ed.chain().focus().toggleBold().run()}
            active={ed.isActive('bold')}
            label="Bold"
          >
            <Bold size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => ed.chain().focus().toggleItalic().run()}
            active={ed.isActive('italic')}
            label="Italic"
          >
            <Italic size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => ed.chain().focus().toggleUnderline().run()}
            active={ed.isActive('underline')}
            label="Underline"
          >
            <UnderlineIcon size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => ed.chain().focus().toggleCode().run()}
            active={ed.isActive('code')}
            label="Inline code"
          >
            <Code size={15} />
          </ToolbarBtn>
        </div>
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-[var(--color-border)]">
          <ToolbarBtn
            onClick={() => ed.chain().focus().toggleBulletList().run()}
            active={ed.isActive('bulletList')}
            label="Bullet list"
          >
            <List size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => ed.chain().focus().toggleOrderedList().run()}
            active={ed.isActive('orderedList')}
            label="Numbered list"
          >
            <ListOrdered size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => ed.chain().focus().toggleBlockquote().run()}
            active={ed.isActive('blockquote')}
            label="Quote"
          >
            <Quote size={15} />
          </ToolbarBtn>
        </div>
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-[var(--color-border)]">
          <ToolbarBtn
            onClick={() => ed.chain().focus().setTextAlign('left').run()}
            active={ed.isActive({ textAlign: 'left' })}
            label="Align left"
          >
            <AlignLeft size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => ed.chain().focus().setTextAlign('center').run()}
            active={ed.isActive({ textAlign: 'center' })}
            label="Align center"
          >
            <AlignCenter size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => ed.chain().focus().setTextAlign('right').run()}
            active={ed.isActive({ textAlign: 'right' })}
            label="Align right"
          >
            <AlignRight size={15} />
          </ToolbarBtn>
        </div>
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-[var(--color-border)]">
          <ToolbarBtn onClick={setLink} active={ed.isActive('link')} label="Link">
            <Link2 size={15} />
          </ToolbarBtn>
          <ToolbarBtn onClick={addImage} label="Image">
            <ImageIcon size={15} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => ed.chain().focus().setHorizontalRule().run()} label="Divider">
            <Minus size={15} />
          </ToolbarBtn>
        </div>
        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setTagOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-primary)]/20"
          >
            <Tag size={12} />
            Insert merge tag
          </button>
          {tagOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 max-h-72 overflow-y-auto bg-white border border-[var(--color-border)] rounded-lg shadow-lg z-20 py-1">
              {STANDARD_MERGE_TAGS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => insertTag(t.key)}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--color-muted)] text-sm"
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-[11px] text-[var(--color-muted-foreground)] font-mono">
                    {`{{${t.key}}}`}
                  </div>
                </button>
              ))}
              {customTags.length > 0 && (
                <>
                  <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)] border-t border-[var(--color-border)] mt-1">
                    Custom fields
                  </div>
                  {customTags.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => insertTag(t.key)}
                      className="w-full text-left px-3 py-2 hover:bg-[var(--color-muted)] text-sm"
                    >
                      <div className="font-medium">{t.label}</div>
                      <div className="text-[11px] text-[var(--color-muted-foreground)] font-mono">
                        {`{{${t.key}}}`}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="px-6 py-4 prose prose-sm max-w-none min-h-[280px] focus-within:outline-none">
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .ProseMirror { outline: none; min-height: 240px; font-size: 15px; line-height: 1.6; }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af; content: attr(data-placeholder); float: left; height: 0; pointer-events: none;
        }
        .ProseMirror h1 { font-size: 22px; font-weight: 700; margin: 12px 0 6px; }
        .ProseMirror h2 { font-size: 18px; font-weight: 700; margin: 10px 0 6px; }
        .ProseMirror h3 { font-size: 16px; font-weight: 600; margin: 8px 0 4px; }
        .ProseMirror a { color: #3b70b0; text-decoration: underline; }
        .ProseMirror blockquote { border-left: 3px solid #3b70b0; padding-left: 10px; margin: 10px 0; color: #4b5563; }
        .ProseMirror hr { border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0; }
        .ProseMirror img { max-width: 100%; border-radius: 8px; }
      `}</style>
    </div>
  )
}
