interface TagProps {
  label: string;
  onRemove?: () => void;
  color?: string;
}

export function TagChip({ label, onRemove, color = '#2563eb' }: TagProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 500,
        background: `${color}14`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontSize: 14,
            lineHeight: 1,
            color: '#94a3b8',
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}

interface AddTagProps {
  onClick: () => void;
}

export function AddTagButton({ onClick }: AddTagProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 500,
        background: 'none',
        color: '#64748b',
        border: '1px dashed #cbd5e1',
        cursor: 'pointer',
      }}
    >
      + 추가
    </button>
  );
}
