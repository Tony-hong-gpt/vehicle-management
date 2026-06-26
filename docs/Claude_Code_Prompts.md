# 교회 차량 관리 시스템 — Claude Code 개발 프롱프트 가이드

> **사용법**: 각 SLICE를 순서대로 진행합니다.
> 새 SLICE 시작 전 반드시 `/compact` 또는 `/clear`를 실행해 컨텍스트를 정리하세요.
> 각 SLICE 완료 후 ✅ 체크리스트를 확인하고 다음 단계로 넘어가세요.

---

## 프로젝트 시작 전 최초 1회만 실행

```
cd "C:\Users\Tony Hong\Documents"
npx create-next-app@latest vehicle-management --typescript --tailwind --app --src-dir --import-alias "@/*"
cd vehicle-management
npm install @supabase/supabase-js @supabase/ssr
npm install lucide-react class-variance-authority clsx tailwind-merge
npx shadcn@latest init
```

> CLAUDE.md 파일을 vehicle-management/ 루트에 복사해 넣으세요.

---

## SLICE 01 — DB 스키마 설계

**목표**: Supabase 연결 + 10개 테이블 전체 생성 + 시드 데이터

```
CLAUDE.md를 먼저 읽고 SLICE 01을 시작한다.

[SLICE 01 완전한 프롱프트는 다운로드한 Claude_Code_Prompts.md 파일 사용]
```

전체 상세 프롱프트는 다운로드한 Claude_Code_Prompts.md 파일을 사용하세요.

---

## SLICE 요약

| SLICE | 내용 | 기간 |
|-------|------|------|
| 01 | DB 스키마 마이그레이션 (10개 테이블) | 3일 |
| 02 | 인증 + 차량 CRUD + QR 코드 | 2일 |
| 03 | 현장 관리자 주간 점검 체크리스트 UI | 3일 |
| 04 | 즉시 등록 UI + 사진 업로드 | 2일 |
| 05 | STT 음성 메모 + 알림 기준 커스터마이징 | 2일 |
| 06 | 현장 관리자 열람 화면 (카드뷰·이력·캘린더) | 2일 |
| 07 | 통계 차트 (현장·상위 공용) | 2일 |
| 08 | 상위 관리자 전체 관제판 | 2일 |
| 09 | 알림 시스템 (Edge Functions + 피드 UI) | 2일 |
| 10 | Realtime + Cron + PWA + Vercel 배포 | 1일 |

> 각 SLICE의 완전한 프롱프트는 다운로드한 Claude_Code_Prompts.md를 사용하세요.

## 개발 중 자주 쓰는 명령어

```bash
supabase start
supabase db reset
npm run dev
npx tsc --noEmit
npm test
git add . && git commit -m "feat: SLICE XX 완료" && git push origin main
```
