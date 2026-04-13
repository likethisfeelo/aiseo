import { useEffect, useRef, useCallback, type CSSProperties } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { createImageUploadUrl } from '../../api';
import { useQuotaPolicy } from '../../hooks/useQuotaPolicy';
import { resizeImageWithPolicy } from '../../utils/resizeImage';

/**
 * TipTap-based WYSIWYG editor used by the blog admin.
 *
 * The editor surface carries the `.blog-content` class so it
 * inherits the exact same typography as the public post page
 * (`frontend/src/styles/blog-content.css`). What the author
 * sees while typing matches what readers see after publishing.
 *
 * Value is exposed as HTML. The backend sanitizes on write
 * (`backend/functions/blog/handler.js`).
 */

const BODY_LIMIT = 300000;

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function BlogEditor({ value, onChange, placeholder }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Admin-only editor, but we still fetch quota so we can apply the
  // policy-driven resize settings before uploading blog images.
  const { data: quota } = useQuotaPolicy();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Image.configure({
        HTMLAttributes: { loading: 'lazy' },
      }),
      Placeholder.configure({
        placeholder: placeholder || '본문을 입력하세요...',
      }),
      CharacterCount.configure({ limit: BODY_LIMIT }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'blog-content ProseMirror',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Re-hydrate when parent replaces the value (e.g. initial load in edit mode).
  // We compare serialized HTML to avoid resetting cursor during local edits.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  const handleImageButton = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset the input so the same file can be selected twice in a row.
      e.target.value = '';
      if (!file || !editor) return;

      const valid = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!valid.includes(file.type)) {
        alert('JPG, PNG, WebP, SVG 파일만 업로드 가능합니다.');
        return;
      }
      const maxMB = quota?.policy.maxImageMB ?? 5;
      if (file.size > maxMB * 1024 * 1024) {
        alert(`파일 크기는 ${maxMB}MB 이하여야 합니다.`);
        return;
      }

      try {
        // Apply the same policy-driven resize the main uploader uses
        // so blog images also land in S3 at a reasonable size.
        const resized = await resizeImageWithPolicy(file, quota?.policy.imageResize ?? null);

        const data = (await createImageUploadUrl({
          siteId: 'blog',
          fileName: file.name,
          fileType: resized.mimeType,
          fileSize: resized.resultBytes,
        })) as { uploadUrl: string; imageUrl: string };

        await fetch(data.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': resized.mimeType },
          body: resized.blob,
        });

        editor.chain().focus().setImage({ src: data.imageUrl }).run();
      } catch (err) {
        alert(err instanceof Error ? err.message : '이미지 업로드 실패');
      }
    },
    [editor, quota],
  );

  const handleLinkButton = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('링크 URL (비우면 링크 제거):', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run();
  }, [editor]);

  if (!editor) {
    return <div style={styles.placeholder}>에디터 로딩 중...</div>;
  }

  const chars = editor.storage.characterCount.characters() as number;

  return (
    <div style={styles.wrap}>
      <Toolbar
        editor={editor}
        onImageClick={handleImageButton}
        onLinkClick={handleLinkButton}
      />
      <div style={styles.surfaceWrap}>
        <EditorContent editor={editor} />
      </div>
      <div style={styles.footer}>
        <span>
          {chars.toLocaleString()} / {BODY_LIMIT.toLocaleString()} 자
        </span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />
    </div>
  );
}

interface ToolbarProps {
  editor: Editor;
  onImageClick: () => void;
  onLinkClick: () => void;
}

function Toolbar({ editor, onImageClick, onLinkClick }: ToolbarProps) {
  const btn = (active: boolean): CSSProperties => ({
    ...styles.toolBtn,
    background: active ? '#e0e7ff' : '#fff',
    color: active ? '#1d4ed8' : '#334155',
    borderColor: active ? '#c7d2fe' : '#e2e8f0',
  });

  return (
    <div style={styles.toolbar}>
      <button
        type="button"
        style={btn(editor.isActive('heading', { level: 1 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="제목 1"
      >
        H1
      </button>
      <button
        type="button"
        style={btn(editor.isActive('heading', { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="제목 2"
      >
        H2
      </button>
      <button
        type="button"
        style={btn(editor.isActive('heading', { level: 3 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="제목 3"
      >
        H3
      </button>

      <span style={styles.sep} />

      <button
        type="button"
        style={btn(editor.isActive('bold'))}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="굵게"
      >
        <b>B</b>
      </button>
      <button
        type="button"
        style={btn(editor.isActive('italic'))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="기울임"
      >
        <i>I</i>
      </button>
      <button
        type="button"
        style={btn(editor.isActive('strike'))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="취소선"
      >
        <s>S</s>
      </button>

      <span style={styles.sep} />

      <button
        type="button"
        style={btn(editor.isActive('bulletList'))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="글머리 기호 목록"
      >
        •
      </button>
      <button
        type="button"
        style={btn(editor.isActive('orderedList'))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="번호 목록"
      >
        1.
      </button>
      <button
        type="button"
        style={btn(editor.isActive('blockquote'))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="인용"
      >
        ❝
      </button>
      <button
        type="button"
        style={btn(editor.isActive('codeBlock'))}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="코드 블록"
      >
        {'</>'}
      </button>

      <span style={styles.sep} />

      <button
        type="button"
        style={btn(editor.isActive('link'))}
        onClick={onLinkClick}
        title="링크"
      >
        링크
      </button>
      <button type="button" style={btn(false)} onClick={onImageClick} title="이미지 삽입">
        이미지
      </button>
      <button
        type="button"
        style={btn(false)}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="가로 구분선"
      >
        ―
      </button>

      <span style={styles.sep} />

      <button
        type="button"
        style={btn(false)}
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="서식 지우기"
      >
        지우기
      </button>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    padding: '8px 10px',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
    alignItems: 'center',
  },
  toolBtn: {
    minWidth: 32,
    height: 30,
    padding: '0 10px',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    background: '#fff',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: '#334155',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sep: {
    width: 1,
    height: 20,
    background: '#e2e8f0',
    margin: '0 4px',
  },
  surfaceWrap: {
    padding: '24px 28px',
    minHeight: 480,
    cursor: 'text',
  },
  footer: {
    padding: '8px 14px',
    borderTop: '1px solid #e2e8f0',
    background: '#f8fafc',
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  placeholder: {
    padding: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13,
  },
};
