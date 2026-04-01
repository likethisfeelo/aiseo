# SEO 스냅샷 자동 수집 — 구현 방안 및 비용 분석

## 1. 개요

현재 SEO 스냅샷은 **수동 입력** 방식으로 운영됩니다.
이 문서는 자동으로 검색 결과, SNS 노출, 지도 리뷰를 수집하는 방안을 정리합니다.

---

## 2. 채널별 자동화 방안

### 2.1 구글 검색 (google-search)

| 방법 | 설명 | 비용 |
|------|------|------|
| **Google Custom Search JSON API** | 공식 API. 프로그래밍 가능한 검색엔진(PSE) 생성 후 키워드 검색. 순위/페이지 정보 추출 가능 | 무료: 100회/일, 유료: $5/1,000회 |
| **SerpAPI (3rd party)** | Google 검색 결과를 JSON으로 반환. 순위, 이미지, 지도 결과 모두 포함 | $50/월 (5,000회), $125/월 (15,000회) |
| **ValueSERP (3rd party)** | SerpAPI와 유사하지만 저렴 | $25/월 (2,500회) |
| **직접 크롤링** | Puppeteer/Playwright로 Google 검색 후 파싱 | Lambda 비용만 (~$0.5/월), 단 Google ToS 위반 가능 |

**추천**: SerpAPI 또는 ValueSERP (안정적, ToS 준수)
**구현**: Lambda 스케줄러 → API 호출 → 결과 파싱 → DynamoDB 저장

### 2.2 네이버 검색 (naver-search)

| 방법 | 설명 | 비용 |
|------|------|------|
| **Naver Search API** | 공식 API. 블로그/뉴스/웹문서/이미지 등 카테고리별 검색 가능 | 무료: 25,000회/일 |
| **SerpAPI Naver** | SerpAPI에서 네이버 엔진도 지원 | SerpAPI 플랜에 포함 |

**추천**: Naver Search API (무료이므로 최우선)
**구현**: Lambda → Naver API 호출 → 결과에서 사이트 URL 존재 여부 및 순위 확인

### 2.3 구글 이미지 (google-image) / 네이버 이미지 (naver-image)

| 방법 | 설명 | 비용 |
|------|------|------|
| **Google Custom Search (이미지)** | `searchType=image` 파라미터로 이미지 검색 가능 | 위 Google CSE와 동일 |
| **Naver Image Search API** | 네이버 이미지 검색 API | 무료 25,000회/일 |
| **SerpAPI** | `tbm=isch` 파라미터로 Google 이미지 검색 | 기존 플랜에 포함 |

### 2.4 인스타그램 해시태그 (instagram-hashtag)

| 방법 | 설명 | 비용 |
|------|------|------|
| **Instagram Graph API** | 비즈니스 계정 필요. 해시태그 검색은 제한적 (최근 게시물만) | 무료 (Meta 앱 승인 필요) |
| **RapidAPI Instagram** | 3rd party API로 해시태그 게시물 수 조회 | $0~$10/월 (기본 플랜) |
| **직접 크롤링** | Instagram 웹 페이지에서 해시태그 게시물 수 파싱 | Lambda 비용만, Instagram 차단 위험 |

**추천**: RapidAPI Instagram (간단하고 저렴)
**한계**: 인스타그램은 API 접근이 제한적. 정확한 게시물 수는 어려울 수 있음

### 2.5 네이버 블로그 (naver-blog)

| 방법 | 설명 | 비용 |
|------|------|------|
| **Naver Blog Search API** | 네이버 블로그 검색 공식 API. 키워드로 블로그 게시물 검색 | 무료 25,000회/일 |

**추천**: Naver Blog Search API (무료)
**구현**: 키워드 검색 → 자사 블로그 URL 노출 여부 확인

### 2.6 구글 지도 (google-map)

| 방법 | 설명 | 비용 |
|------|------|------|
| **Google Places API (New)** | 장소 검색, 리뷰 수, 별점 조회 가능 | $32/1,000회 (Place Details) |
| **SerpAPI Google Maps** | 구글 지도 검색 결과를 JSON으로 반환 | 기존 SerpAPI 플랜에 포함 |

**추천**: SerpAPI (이미 사용하는 경우) 또는 Google Places API
**구현**: 비즈니스명으로 검색 → 리뷰 수, 별점 추출

### 2.7 네이버 플레이스 (naver-place)

| 방법 | 설명 | 비용 |
|------|------|------|
| **Naver Place API** | 없음 (공식 API 미제공) |  |
| **직접 크롤링** | Puppeteer로 네이버 플레이스 페이지 파싱 | Lambda 비용만 |
| **SerpAPI Naver** | 네이버 검색 결과 중 플레이스 섹션 추출 | 기존 플랜에 포함 |

**추천**: SerpAPI 또는 Naver Search API 결과에서 플레이스 섹션 파싱

---

## 3. 구현 아키텍처

```
EventBridge Scheduler (매일 09:00 KST)
    │
    ▼
Lambda: seo-snapshot-collector
    │
    ├── Google CSE API / SerpAPI 호출
    ├── Naver Search API 호출
    ├── Instagram API 호출
    ├── Google Places API 호출
    │
    ▼
DynamoDB: aiseo-sites.seoSnapshots[]
    │
    ▼
프론트엔드: 스냅샷 타임라인에 자동 수집 결과 표시
(source: 'automated' 로 구분)
```

### 필요 AWS 리소스
- **EventBridge Scheduler**: 크론 스케줄 (무료)
- **Lambda**: seo-snapshot-collector (실행 시간 ~30초)
- **Secrets Manager**: API 키 저장 ($0.40/시크릿/월)

### 구현 흐름
1. EventBridge가 매일 정해진 시간에 Lambda 트리거
2. Lambda가 각 사이트의 키워드 목록을 DynamoDB에서 조회
3. 각 키워드 × 각 채널에 대해 외부 API 호출
4. 결과를 `SeoSnapshot` 형태로 변환 (`source: 'automated'`)
5. DynamoDB에 저장
6. 프론트엔드에서 수동/자동 스냅샷 모두 타임라인에 표시

---

## 4. 비용 예상 (사이트 1개, 키워드 5개 기준)

### 월간 API 호출 수 (매일 1회 수집)
- 구글 검색: 5키워드 × 30일 = 150회
- 네이버 검색: 150회
- 구글 이미지: 150회
- 네이버 이미지: 150회
- 인스타그램: 150회
- 네이버 블로그: 150회
- 구글 지도: 30회 (비즈니스 1개)
- 네이버 플레이스: 30회

### 비용 시나리오

#### A. 최소 비용 (무료 API 최대 활용)

| 항목 | 비용 |
|------|------|
| Naver Search/Blog/Image API | 무료 (일 25,000회 한도) |
| Google Custom Search API | 무료 (일 100회 한도, 450회/월 사용) |
| Lambda 실행 | ~$0.10/월 |
| EventBridge | 무료 |
| **합계** | **~$0.10/월** |

단, 인스타그램/구글 지도 자동 수집 제외

#### B. 중간 비용 (SerpAPI 활용)

| 항목 | 비용 |
|------|------|
| SerpAPI Developer 플랜 | $50/월 (5,000회, 구글+네이버+이미지+지도 포함) |
| Naver 공식 API | 무료 |
| RapidAPI Instagram | $0~10/월 |
| Lambda + EventBridge | ~$0.10/월 |
| **합계** | **~$50~60/월** |

#### C. 사이트 10개 운영 시

| 항목 | 비용 |
|------|------|
| SerpAPI Business 플랜 | $125/월 (15,000회) |
| Naver 공식 API | 무료 |
| RapidAPI Instagram | $10/월 |
| Lambda + EventBridge | ~$0.50/월 |
| **합계** | **~$135/월** |

#### D. 사이트 50개 운영 시

| 항목 | 비용 |
|------|------|
| SerpAPI Enterprise | $250/월 (50,000회) |
| Google Places API | $32 × 1.5 = ~$48/월 |
| 기타 | ~$20/월 |
| **합계** | **~$320/월** |

---

## 5. 구현 우선순위 제안

### Phase 1: 무료 API 우선 (비용 $0)
1. **Naver Search API** (검색 + 블로그 + 이미지) — 무료 25,000회/일
2. **Google Custom Search API** — 무료 100회/일

이것만으로 핵심 검색엔진 2곳의 자동 수집이 가능합니다.

### Phase 2: SerpAPI 추가 (+$50/월)
3. **SerpAPI** — 구글 검색/이미지/지도를 한 번에 커버
4. **구글 지도 리뷰/별점** 자동 수집

### Phase 3: SNS 확장 (+$10/월)
5. **인스타그램 해시태그** 자동 수집 (RapidAPI)

### Phase 4: 고급 분석 (추후)
6. **키워드 순위 추이 차트** 시각화
7. **경쟁사 비교** 기능
8. **알림** — 순위 변동 시 이메일/카카오 알림

---

## 6. 필요 설정

### 사이트 관리자가 입력해야 할 정보
- **추적 키워드** (최대 10개): 예) "천안 가방", "천안 핸드메이드", etc.
- **비즈니스명** (지도 검색용): 예) "OO공방"
- **인스타그램 해시태그**: 예) "#천안가방"
- **자동 수집 주기**: 매일 / 주 3회 / 주 1회

### API 키 발급 필요
| API | 발급처 | 무료 한도 |
|-----|--------|-----------|
| Naver Search API | developers.naver.com | 25,000회/일 |
| Google Custom Search | console.cloud.google.com | 100회/일 |
| SerpAPI | serpapi.com | 100회/월 (무료 체험) |
| RapidAPI Instagram | rapidapi.com | 플랜별 상이 |

---

## 7. 데이터 확장 고려사항

현재 `seoSnapshots`는 `aiseo-sites` 테이블의 배열 속성으로 저장됩니다.
자동화로 매일 수집하면 365일 × 8채널 = 2,920 엔트리/년이 될 수 있습니다.

### 별도 테이블 마이그레이션 기준
- 사이트당 스냅샷 100개 이상 축적 시
- DynamoDB 아이템 크기 400KB 접근 시

### 마이그레이션 방법
1. `aiseo-seo-snapshots` 테이블 생성 (PK: `siteId`, SK: `date#id`)
2. 기존 배열 데이터 마이그레이션 스크립트 실행
3. 핸들러에서 새 테이블로 읽기/쓰기 전환
4. 기존 `SeoSnapshot` 인터페이스는 변경 없음 (프론트엔드 수정 불필요)
