import { ComingSoon2026 } from './ComingSoon2026';

/**
 * 수강안내 2026 — marketing landing for the 2026 course cycle.
 *
 * Currently a "준비중" stub wrapping the shared ComingSoon2026
 * shell. When real content is ready, replace the <ComingSoon2026 />
 * call with custom markup (hero, curriculum, schedule, FAQ, form)
 * and keep the meta props in sync with the new copy.
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
      metaDescription="AISEO 2026 수강안내. AI 웹사이트 제작과 검색 최적화 교육 과정을 안내합니다. (준비중)"
      canonicalPath="/course2026"
    />
  );
}
