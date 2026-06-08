// ============================================================
// ytControl.ts — shared helpers for the AISEO demo/event video.
// ------------------------------------------------------------
// All marketing pages embed the same YouTube video through an
// <iframe> with `enablejsapi=1`, which lets us drive mute/unMute
// and stop via postMessage without reloading the player.
// ============================================================

// Single source of truth for the shared video. site.aiseo.tips and
// every /events2026 page play this same clip.
export const YT_VIDEO_ID = 'HMV6PMtG720';

type YtSrcOpts = { autoplay?: boolean; mute?: boolean };

/** Build a YouTube embed URL with our standard params. */
export const ytSrc = (id: string = YT_VIDEO_ID, opts: YtSrcOpts = {}): string => {
  const params = ['rel=0', 'modestbranding=1', 'color=white', 'enablejsapi=1'];
  if (opts.autoplay) params.push('autoplay=1');
  if (opts.mute) params.push('mute=1');
  return `https://www.youtube.com/embed/${id}?${params.join('&')}`;
};

type YtFunc = 'mute' | 'unMute' | 'playVideo' | 'pauseVideo' | 'stopVideo';

/**
 * Send a command to a playing YouTube iframe. Requires the iframe src
 * to include `enablejsapi=1` (ytSrc always adds it). Safe to call even
 * if the player isn't ready — YouTube ignores commands it can't run.
 */
export const ytCommand = (iframe: HTMLIFrameElement | null | undefined, func: YtFunc): void => {
  iframe?.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args: [] }),
    '*',
  );
};

// Prism-on-starfield artwork shown behind the video before play and
// after it stops / fails. Same asset as the events2026 hero.
export const VIDEO_FALLBACK_IMAGE = '/events/hero-pc.jpg';
