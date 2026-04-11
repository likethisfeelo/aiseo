import { ComingSoon2026 } from './ComingSoon2026';

/**
 * 수강안내 2026 — marketing landing for the 2026 course cycle.
 *
 * Currently a "준비중" stub wrapping the shared ComingSoon2026
 * shell. When real content is ready, replace the <ComingSoon2026 />
 * call with custom markup (hero, curriculum, schedule, FAQ, form).
 *
 * Mounted at `/course2026` in App.tsx.
 */
export function Course2026Page() {
  return (
    <ComingSoon2026
      activeMenu="course"
      eyebrow="COURSE 2026"
      title="수강안내"
      docTitle="수강안내 2026 | AISEO"
    />
  );
}
