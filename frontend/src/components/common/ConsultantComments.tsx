import { useState, useEffect } from 'react';
import { getComments, markCommentsRead } from '../../api';

interface Comment {
  commentId: string;
  targetType: string;
  targetId: string | null;
  authorName: string;
  type: 'opinion' | 'suggestion' | 'correction';
  content: string;
  suggestedValue: string | null;
  createdAt: string;
  isRead: boolean;
}

interface Props {
  siteId: string;
  targetType: string;
  targetId?: string;
}

const TYPE_CONFIG = {
  opinion: { label: '의견', icon: '💬', color: '#2563eb', bg: '#eff6ff' },
  suggestion: { label: '수정 제안', icon: '🟡', color: '#d97706', bg: '#fefce8' },
  correction: { label: '수정사항', icon: '🔴', color: '#dc2626', bg: '#fef2f2' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export function ConsultantComments({ siteId, targetType, targetId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    getComments(siteId, targetType, targetId)
      .then((data: { comments: Comment[] }) => setComments(data.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId, targetType, targetId]);

  const unreadCount = comments.filter((c) => !c.isRead).length;

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);

    // Mark unread as read when expanding
    if (next && unreadCount > 0) {
      const unreadIds = comments.filter((c) => !c.isRead).map((c) => c.commentId);
      markCommentsRead({ siteId, commentIds: unreadIds }).catch(() => {});
      setComments((prev) => prev.map((c) => ({ ...c, isRead: true })));
    }
  };

  if (loading) return null;

  return (
    <div style={{ marginTop: 16 }}>
      {/* Toggle Header */}
      <button
        onClick={handleToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px',
          border: '1px solid #fde68a', borderRadius: expanded ? '10px 10px 0 0' : 10,
          background: '#fefce8', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          transition: 'border-radius 0.2s',
        }}
      >
        <span style={{ fontSize: 14 }}>💬</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e', flex: 1 }}>
          컨설턴트 코멘트
          {comments.length > 0 && <span style={{ fontWeight: 400, marginLeft: 4 }}>({comments.length})</span>}
        </span>
        {unreadCount > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#dc2626', borderRadius: 10, padding: '2px 6px', minWidth: 16, textAlign: 'center' }}>
            {unreadCount}
          </span>
        )}
        <span style={{ fontSize: 12, color: '#94a3b8', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {/* Comments List */}
      {expanded && (
        <div style={{ border: '1px solid #fde68a', borderTop: 'none', borderRadius: '0 0 10px 10px', background: '#fffef5' }}>
          {comments.length === 0 ? (
            <div style={{ padding: 16, fontSize: 13, color: '#78350f', textAlign: 'center' }}>
              아직 등록된 코멘트가 없습니다. 컨설팅 진행 시 전문가 의견이 여기에 표시됩니다.
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {comments.map((comment, i) => {
                const config = TYPE_CONFIG[comment.type] || TYPE_CONFIG.opinion;
                return (
                  <div
                    key={comment.commentId}
                    style={{
                      padding: '12px 14px',
                      borderBottom: i < comments.length - 1 ? '1px solid #fef3c7' : 'none',
                    }}
                  >
                    {/* Comment Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 12 }}>{config.icon}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: config.color, background: config.bg,
                        padding: '2px 6px', borderRadius: 4,
                      }}>{config.label}</span>
                      <span style={{ fontSize: 11, color: '#92400e', fontWeight: 600 }}>{comment.authorName}</span>
                      <span style={{ fontSize: 10, color: '#b4a06e', marginLeft: 'auto' }}>{timeAgo(comment.createdAt)}</span>
                    </div>

                    {/* Comment Content */}
                    <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                      {comment.content}
                    </p>

                    {/* Suggested Value */}
                    {comment.suggestedValue && (
                      <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: '#fff', border: '1px solid #fde68a', fontSize: 12 }}>
                        <span style={{ color: '#92400e', fontWeight: 600 }}>제안값: </span>
                        <span style={{ color: '#1e293b' }}>{comment.suggestedValue}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
