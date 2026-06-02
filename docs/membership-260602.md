# AISEO 멤버십 & 인증 통합 아키텍처 — 260602

> 작성: 2026-06-02
> 소스: 사용자 「AISEO.TIPS 멤버십 & 서비스 통합 아키텍처 기획서」 + plan `/root/.claude/plans/synthetic-twirling-hopper.md` (audit) + 후속 결정
> 범위: aiseo.tips / b2b.aiseo.tips / site.aiseo.tips 3개 서브도메인 통합 인증·등급 모델
> 용도: 신규 가입 hook · 결제 hook · 권한 게이트 작성 시 단일 출처

---

## 1 · 결정 사항 요약

| # | 항목 | 확정 |
|---|---|---|
| D-1 | 인증 풀 | **단일 Cognito 풀 (Path A)** — site.aiseo.tips 가 이미 사용 중인 풀 그대로 확장. 마이그레이션 없음. |
| D-2 | 그룹 정책 | **누적 (additive)** — 등급 변경 = 그룹 add only. 회수는 admin 강등 케이스 외엔 없음. |
| D-3 | `paid_member` vs `site-customer` | **별개 등급, 공존 가능** — 두 흐름이 독립적. paid_member 가 site 대시보드, site-customer 는 apex 포털 권한. |
| D-4 | SSO 쿠키 | **HttpOnly + Domain=.aiseo.tips set-cookie 교환 엔드포인트** (P-5) — 별도 phase, 본 문서 범위 밖. |
| D-5 | apex 포털 위치 | aiseo.tips 의 `/account` (또는 `/my`) 신규 페이지 — 결제 시스템(P-7) 과 함께 별도 phase. |

---

## 2 · 그룹 카탈로그

Cognito 콘솔에 등록된 그룹 (260602 기준):

| 그룹 | 우선순위 | IAM Role | 부여 시점 | 의미 |
|---|---|---|---|---|
| `admin` | 1 | — | 수동 (개발자) | 관리자 권한 |
| `paid_member` (기존) | 10 | — | site 결제 + admin 수동 승인 | site.aiseo.tips 풀 대시보드 |
| `site-customer` | 20 | — | apex 결제 webhook | apex 포털 (구매 이력·다운로드) |
| `shop` | 40 | — | 실명인증 완료 hook | apex 결제 가능 상태 |
| `community` | 50 | — | post-confirmation Lambda (자동) | apex 콘텐츠 (블로그·뉴스레터) |

> IAM Role 은 모두 비어있음. AISEO 는 Cognito Identity Pool 을 쓰지 않으므로 IAM Role 부여는 무의미 (audit 결과 참고).

---

## 3 · 등급 흐름

### apex 흐름 (aiseo.tips 가입자)

```
Cognito 가입
    │
    ▼ post-confirmation Lambda (auth-post-confirmation)
[community]
    │
    ▼ 실명인증 통과 (POST /identity-verify/confirm — TBD)
[community, shop]
    │
    ▼ apex 결제 webhook (PG, 예: 포트원 — TBD)
[community, shop, site-customer]
```

### site 흐름 (site.aiseo.tips 가입자)

```
Cognito 가입 (같은 풀)
    │
    ▼ post-confirmation Lambda
[community]
    │
    ▼ site 결제 + admin 수동 승인 (POST /admin/users/grant — 기존)
[community, paid_member]
```

### 두 흐름 동시 진행 가능

```
[community, shop, site-customer, paid_member]  ← 가장 풀 상태
```

> 등급 변경은 항상 `AdminAddUserToGroup` 만 호출. `Remove` 는 admin 강등 등 명시적 회수 케이스에서만.

---

## 4 · 권한 게이트 매트릭스

모든 조건은 OR (그룹 중 하나만 있으면 통과). 우선순위 (priority) 는 같은 도메인에서 두 권한 모두 통과될 때 어느 UI 를 보일지.

| 자원 | 통과 조건 | priority (도메인 내) |
|---|---|---|
| **apex (aiseo.tips)** | | |
| 블로그 전체 + 뉴스레터 | `community` 있음 | — |
| `/account` 포털 (구매 이력·다운로드) | `shop` ∨ `site-customer` | — |
| 결제 진입 (실명인증 단계 표시) | `community` ∧ ¬ `shop` | — |
| **site (site.aiseo.tips)** | | |
| `AuthenticatedShell` (관리 대시보드) | `paid_member` | 1 (최우선) |
| `SiteCustomerNoticePage` (안내) | `site-customer` ∧ ¬ `paid_member` | 2 |
| `/admin/*` (관리자 콘솔) | `admin` | (병행) |
| `MemberWaitingPage` (대기) | 로그인 O, 위 조건 모두 false | 3 (폴백) |
| `LandingPage` (공개) | 비로그인 | — |
| **b2b (b2b.aiseo.tips)** | | |
| 리드 폼 | 인증 불필요 | — |

---

## 5 · 구현 상태 (260602 기준)

| Phase | 작업 | 상태 |
|---|---|---|
| P-1 | Cognito 콘솔 그룹 3개 생성 (`community`, `shop`, `site-customer`) | ✅ 완료 |
| P-2 | App client callbackUrls 에 apex/b2b 추가 | ✅ 완료 (콘솔) |
| P-3 | 프론트 `App.tsx` 게이트에 `site-customer` 분기 + `SiteCustomerNoticePage` 추가 | ✅ 이번 커밋 |
| P-4 | post-confirmation Lambda (`community` 자동 부여) + CDK 배포 | ✅ 이번 커밋 (Cognito 트리거 attach 는 콘솔 수동 — 6번 참고) |
| P-5 | 쿠키 SSO (HttpOnly Domain=.aiseo.tips) | ⏳ TODO |
| P-6 | apex 가입 진입점 (`aiseo-main.html` 모달 또는 SPA 리다이렉트) | ⏳ TODO |
| P-7 | apex 포털 `/account` + 결제 시스템 (PG 통합) + `shop`/`site-customer` 자동 부여 webhook | ⏳ TODO |
| P-8 | b2b 리드 폼 + 알림 | ⏳ TODO |
| P-X1 | admin-users UI 가 community/shop/site-customer 도 grant/revoke 가능하도록 확장 (현재 `paid_member` 만 하드코딩) | ⏳ TODO |

---

## 6 · post-confirmation Lambda — Cognito 콘솔 attach 가이드

CDK 가 풀을 import (ARN) 만 하기 때문에 트리거 attach 는 콘솔에서 수동. CDK 는 (a) Lambda 자체, (b) IAM 권한, (c) Cognito → Lambda invoke 의 resource policy 까지 생성함.

**배포 후 1회만 콘솔에서:**

1. AWS Console → Cognito → User pools → 본 풀 선택
2. 좌측 메뉴 **User pool properties** → **Lambda triggers** → **Add Lambda trigger**
3. Trigger type: **Sign-up** → **Post confirmation**
4. Assign Lambda: CDK 가 만든 `AuthPostConfirmationFunction` 선택
5. Save

> 이후 신규 가입 (이메일 확인 코드 입력 완료 시점) 마다 Lambda 가 자동 호출되어 `community` 그룹을 부여한다. `AdminAddUserToGroup` 은 idempotent 이라 재실행해도 안전.

**검증:**
```
1. site.aiseo.tips 또는 aiseo.tips 에서 새 이메일로 가입 → 인증 코드 입력 완료
2. Cognito 콘솔 → Users → 해당 이메일 → Group memberships 에 community 자동 추가
3. CloudWatch Logs → /aws/lambda/<AuthPostConfirmationFunction> 에서 호출 로그 확인
```

---

## 7 · 코드 위치 인덱스

| 책임 | 파일 | 비고 |
|---|---|---|
| 그룹 read (claims 파싱) | `backend/functions/shared/auth.js` | 3가지 claim 포맷 정규화 |
| 그룹 read (프론트) | `frontend/src/App.tsx:45-50` | `hasServiceAccess`, `isAdminUser` |
| `/me` 응답 (groups 포함) | `backend/functions/me/handler.js` | 변경 없음 — 프론트가 직접 게이트 |
| 그룹 grant/revoke (admin UI) | `backend/functions/admin-users/handler.js` | 현재 `paid_member` 하드코딩 (P-X1 에서 확장 필요) |
| 가입 hook | `backend/functions/auth-post-confirmation/handler.js` | community 자동 부여 |
| site 라우팅 분기 | `frontend/src/App.tsx:279-296` | site-customer 분기 추가됨 |
| site-customer 안내 페이지 | `frontend/src/pages/SiteCustomerNoticePage.tsx` | 신규 |
| 기존 대기 페이지 | `frontend/src/pages/MemberWaitingPage.tsx` | community/shop only 사용자가 site.aiseo.tips 진입 시 |
| CORS allowOrigins | `infra/cdk/lib/cdk-stack.ts:157-161` 외 | apex/site/b2b (dev+prod) 6개 등록됨 |

---

## 8 · 알려진 한계 / 후속 과제

1. **쿠키 SSO 부재** — 현재 토큰은 localStorage 라 `aiseo.tips ↔ site.aiseo.tips` 간 자동 인증 공유 불가. 사용자가 site 에서 로그인해도 apex 에서는 다시 로그인 필요. P-5 에서 해결.
2. **admin-users 핸들러 그룹 하드코딩** — `paid_member` 만 grant/revoke 가능. site-customer 자동 부여(결제 webhook) 까지는 admin 수동 UI 가 없어도 되지만, 운영 중 수동 부여/회수가 필요해지면 핸들러 확장 필요 (P-X1).
3. **post-confirmation 트리거 attach 는 콘솔 수동** — 풀이 import 라 CDK L2 로 자동 attach 불가. 운영 환경 별로 1회씩 콘솔에서 attach 해야 함.
4. **shop → site-customer 결제 hook 미구현** — PG (포트원 등) 통합과 묶음. P-7 에서 일괄.
5. **실명인증 → shop hook 미구현** — 본인인증 PG (예: NICE, KCB) 통합. P-7 의 일부.
6. **apex 페이지가 정적 HTML** — `aiseo-main.html` 에서 로그인 진입점 없음. SPA 마운트 또는 site 로 리다이렉트 후 back-redirect 필요. P-5 (쿠키 SSO) 와 동시 진행해야 자연스러운 UX (P-6).
