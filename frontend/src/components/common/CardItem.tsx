interface Props {
  title: string;
  subtitle?: string;
  meta?: string;
  imageUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CardItem({ title, subtitle, meta, imageUrl, onEdit, onDelete }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: 12,
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        background: '#fff',
      }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#64748b' }}>{subtitle}</div>}
        {meta && <div style={{ fontSize: 12, color: '#2563eb', marginTop: 4 }}>{meta}</div>}
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4 }}
            title="편집"
          >
            ✏️
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4 }}
            title="삭제"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}
