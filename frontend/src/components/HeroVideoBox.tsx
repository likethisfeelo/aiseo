// ============================================================
// HeroVideoBox — the in-hero video player used on the
// /events2026/free · /paid · /first pages.
// ------------------------------------------------------------
// Replaces the old play-button stub: clicking play loads the same
// shared YouTube clip as site.aiseo.tips. Includes a mute toggle and
// ESC-to-stop; whenever the video isn't playing (initial, stopped, or
// failed) the prism artwork shows through as the background.
//
// Renders the existing `.hero-video` / `.hero-video-play` /
// `.hero-video-label` class names so each page's scoped CSS
// (.evtfree / .evtpaid / .evtfirst) styles it unchanged.
// ============================================================

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { YT_VIDEO_ID, ytSrc, ytCommand, VIDEO_FALLBACK_IMAGE } from '../lib/ytControl';

const muteBtnStyle: CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  zIndex: 5,
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(10,6,20,0.6)',
  color: '#fff',
  fontSize: 16,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(6px)',
};

export function HeroVideoBox({
  videoId = YT_VIDEO_ID,
  label = 'AISEO.TIPS 이벤트 영상',
}: {
  videoId?: string;
  label?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const play = () => {
    setPlaying(true);
    if (iframeRef.current) iframeRef.current.src = ytSrc(videoId, { autoplay: true, mute: muted });
  };
  const stop = () => {
    setPlaying(false);
    if (iframeRef.current) iframeRef.current.src = '';
  };
  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      ytCommand(iframeRef.current, next ? 'mute' : 'unMute');
      return next;
    });
  };

  // ESC stops the video (and the music with it) and brings the prism
  // background back — matches how people instinctively kill audio.
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing]);

  return (
    <div
      className="hero-video"
      style={{
        backgroundImage: `url(${VIDEO_FALLBACK_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <iframe
        ref={iframeRef}
        title="AISEO 이벤트 영상"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
          borderRadius: 'inherit',
          opacity: playing ? 1 : 0,
          pointerEvents: playing ? 'auto' : 'none',
          transition: 'opacity .3s ease',
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      {!playing && (
        <button type="button" className="hero-video-play" aria-label="이벤트 영상 재생" onClick={play}>
          <svg viewBox="0 0 24 24" fill="#0A0614" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}
      {playing && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? '소리 켜기' : '음소거'}
          style={muteBtnStyle}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      )}
      <div className="hero-video-label">{label}</div>
    </div>
  );
}
