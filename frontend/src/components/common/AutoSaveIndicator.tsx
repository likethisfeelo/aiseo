interface Props {
  saving: boolean;
  lastSaved: Date | null;
  error: string;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return '방금 전';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  return `${hours}시간 전`;
}

export function AutoSaveIndicator({ saving, lastSaved, error }: Props) {
  if (error) {
    return (
      <span style={{ fontSize: 12, color: '#dc2626' }}>
        저장 실패
      </span>
    );
  }

  if (saving) {
    return (
      <span style={{ fontSize: 12, color: '#64748b' }}>
        저장 중...
      </span>
    );
  }

  if (lastSaved) {
    return (
      <span style={{ fontSize: 12, color: '#059669' }}>
        ✓ 자동 저장됨 · {timeAgo(lastSaved)}
      </span>
    );
  }

  return null;
}
