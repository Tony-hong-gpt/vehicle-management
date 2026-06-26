# 교회 통합 차량 관리 시스템 (vehicle-management)

## 프로젝트 개요

교회 보유 차량(대형버스·중형버스·12인승·7인승·승용차)을 전담 관리자 1~2명이
스마트폰으로 주간 단위로 기록하고, 상위 관리자(총무처·목회지원실)가
PC 웹 대시보드에서 실시간으로 관제하는 시스템.

**핵심 원칙**
- 일일 점검 없음 — 주 1회 주간 점검 + 이벤트 발생 시 즉시 등록
- 현장 관리자도 알림 수신, 캘린더·통계 열람, 알림 기준 커스터마이징 가능
- 상위 관리자는 현장 관리자 권한 전체 + 시스템 설정·전체 관제 추가

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 App Router + TypeScript |
| DB / 백엔드 | Supabase (PostgreSQL + Storage + Realtime + Edge Functions) |
| 스타일 | Tailwind CSS + shadcn/ui |
| 하이브리드 앱 | Capacitor (PWA 우선, 추후 앱스토어 배포) |
| 배포 | Vercel |
| 부가 기능 | Web Speech API (STT), html5-qrcode (QR 스캔) |

---

## GitHub

https://github.com/Tony-hong-gpt/vehicle-management

## 개발 환경

- 로컬 Supabase: Docker Desktop + WSL
  - API: 포트 54331 / Studio: 54333 / Mailpit: 54334
  - 배포: Vercel (main 브랜치 push 시 자동 배포)
  - 패키지 매니저: npm

  ## SLICE 개발 순서

  | SLICE | 내용 | 기간 |
  |-------|------|------|
  | 01 | DB 스키마 마이그레이션 (10개 테이블) | 3일 |
  | 02 | 차량 마스터 CRUD + QR 코드 생성·스캔 | 2일 |
  | 03 | 현장 관리자 주간 점검 체크리스트 UI | 3일 |
  | 04 | 즉시 등록 UI + 사진 업로드·압축 | 2일 |
  | 05 | STT 음성 메모 + 알림 기준 커스터마이징 UI | 2일 |
  | 06 | 현장 관리자 열람 화면 (카드뷰·이력·캘린더) | 2일 |
  | 07 | 통계 차트 (현장·상위 공용) | 2일 |
  | 08 | 상위 관리자 전체 관제판 + 주간 점검 현황판 | 2일 |
  | 09 | 알림 시스템 (Edge Functions + 피드 UI) | 2일 |
  | 10 | Realtime + Cron Job + PWA + Vercel 배포 | 1일 |

  > 전체 상세 내용은 docs/Claude_Code_Prompts.md 참조
