import type { BadgeStatus } from '../../types';

const STATUS_CONFIG: Record<BadgeStatus, { label: string; bg: string; color: string }> = {
  'done': { label: '완료', bg: '#dcfce7', color: '#166534' },
  'in-progress': { label: '입력중', bg: '#dbeafe', color: '#1e40af' },
  'empty': { label: '미입력', bg: '#f1f5f9', color: '#64748b' },
  'needs-education': { label: '교육 필요', bg: '#fef3c7', color: '#92400e' },
  'coming-soon': { label: '예정', bg: '#f3e8ff', color: '#6b21a8' },
  'locked': { label: '잠금', bg: '#f1f5f9', color: '#94a3b8' },
};

interface Props {
  status: BadgeStatus;
  text?: string;
}

export function StatusBadge({ status, text }: Props) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 600,
        background: config.bg,
        color: config.color,
        whiteSpace: 'nowrap',
      }}
    >
      {text || config.label}
    </span>
  );
}
