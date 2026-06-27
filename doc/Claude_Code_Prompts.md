# 교회 차량 관리 시스템 — Claude Code 개발 프롬프트 가이드

> **사용법**: 각 SLICE를 순서대로 진행합니다.
> 새 SLICE 시작 전 반드시 `/compact` 또는 `/clear`를 실행해 컨텍스트를 정리하세요.
> 각 SLICE 완료 후 ✅ 체크리스트를 확인하고 다음 단계로 넘어가세요.

---

## 🚀 프로젝트 시작 전 — 최초 1회만 실행

```
Windows PowerShell 또는 WSL에서 실행:

cd "C:\Users\Tony Hong\Documents"
npx create-next-app@latest vehicle-system --typescript --tailwind --app --src-dir --import-alias "@/*"
cd vehicle-system
npm install @supabase/supabase-js @supabase/ssr
npm install lucide-react class-variance-authority clsx tailwind-merge
npx shadcn@latest init
```

> CLAUDE.md 파일을 `vehicle-system/` 루트에 복사해 넣으세요.

---

---

## SLICE 01 — 프로젝트 초기 설정 및 DB 스키마

> **목표**: Supabase 연결 + 10개 테이블 전체 생성 + 시드 데이터 삽입
> **예상 시간**: 3일

---

### SLICE-01 프롬프트 (Claude Code에 그대로 붙여넣기)

```
CLAUDE.md를 먼저 읽고 프로젝트 전체 맥락을 파악해줘.

지금부터 SLICE 01을 진행한다. 목표는 Supabase 연결 설정과 DB 스키마 전체 생성이야.

## 작업 순서

### 1단계 — 환경 변수 설정
프로젝트 루트에 .env.local 파일을 생성해줘:
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=(로컬 Supabase anon key)
SUPABASE_SERVICE_ROLE_KEY=(로컬 Supabase service_role key)

### 2단계 — Supabase 클라이언트 설정
아래 파일을 생성해줘:
- src/lib/supabase/client.ts  (브라우저용 클라이언트)
- src/lib/supabase/server.ts  (서버 컴포넌트용 클라이언트)
- src/lib/supabase/middleware.ts (세션 갱신용)
- src/middleware.ts (루트 미들웨어 — 인증 체크 + role 기반 라우팅)

role 라우팅 규칙:
- /admin/* → role = 'admin' 만 접근 가능
- /field/* → role = 'field' 또는 'admin' 접근 가능
- /login → 미인증 사용자만 접근 가능

### 3단계 — DB 마이그레이션 파일 생성
supabase/migrations/001_initial_schema.sql 파일을 생성해줘.
아래 10개 테이블을 모두 포함해야 해:

1. vehicles (차량 마스터)
   - id UUID PK DEFAULT gen_random_uuid()
   - name TEXT NOT NULL
   - plate TEXT NOT NULL UNIQUE
   - fuel_type TEXT CHECK IN ('diesel','gasoline','electric','hybrid')
   - year INTEGER
   - capacity INTEGER  -- 승차 정원 (신호등 로직에서 검사 주기 계산에 사용)
   - current_mileage INTEGER DEFAULT 0
   - insurance_company TEXT
   - insurance_policy_no TEXT
   - insurance_expire_date DATE
   - last_inspection_date DATE
   - next_inspection_date DATE  -- capacity 기반 자동 계산값 저장
   - last_tax_paid_date DATE
   - tax_payment_method TEXT DEFAULT 'direct'
   - annual_tax_prepaid BOOLEAN DEFAULT false
   - vin TEXT  -- 차대번호
   - primary_operation_time TEXT  -- 'dawn'/'daytime'/'weekend'
   - assigned_field_user_id UUID REFERENCES auth.users(id)
   - created_at TIMESTAMPTZ DEFAULT now()
   - updated_at TIMESTAMPTZ DEFAULT now()

2. weekly_inspections
   - id UUID PK
   - vehicle_id UUID FK → vehicles
   - week_start DATE NOT NULL  -- 해당 주 월요일 날짜
   - mileage INTEGER NOT NULL
   - exterior_ok BOOLEAN NOT NULL  -- true=정상, false=이상
   - interior_clean TEXT CHECK IN ('good','fair','poor')
   - car_wash_done BOOLEAN DEFAULT false
   - lights_ok BOOLEAN NOT NULL
   - fluids_ok BOOLEAN NOT NULL
   - tire_status TEXT CHECK IN ('normal','wear','replace')
   - note TEXT
   - submitted_by UUID REFERENCES auth.users(id)
   - submitted_at TIMESTAMPTZ DEFAULT now()
   - UNIQUE(vehicle_id, week_start)

3. maintenance_records
   - id UUID PK
   - vehicle_id UUID FK → vehicles
   - part_category TEXT NOT NULL  -- '엔진 및 구동계' 등 대분류
   - part_name TEXT NOT NULL  -- '엔진오일' 등 소분류
   - mileage_at_service INTEGER NOT NULL
   - service_date DATE NOT NULL
   - receipt_url TEXT
   - note TEXT
   - registered_by UUID REFERENCES auth.users(id)
   - created_at TIMESTAMPTZ DEFAULT now()

4. incident_records
   - id UUID PK
   - vehicle_id UUID FK → vehicles
   - incident_type TEXT CHECK IN ('damage','battery_dead','other')
   - photo_url TEXT
   - note TEXT NOT NULL
   - registered_by UUID REFERENCES auth.users(id)
   - created_at TIMESTAMPTZ DEFAULT now()

5. legal_documents
   - id UUID PK
   - vehicle_id UUID FK → vehicles
   - doc_type TEXT CHECK IN ('insurance','inspection','tax','license')
   - expire_date DATE
   - photo_url TEXT
   - note TEXT
   - updated_by UUID REFERENCES auth.users(id)
   - updated_at TIMESTAMPTZ DEFAULT now()

6. consumable_defaults
   - id UUID PK
   - part_name TEXT NOT NULL UNIQUE  -- '엔진오일' 등
   - part_category TEXT NOT NULL
   - default_km INTEGER  -- NULL이면 km 기준 없음
   - default_months INTEGER  -- NULL이면 기간 기준 없음
   - min_km INTEGER  -- 하한선 (권장값의 50%)
   - min_months INTEGER
   - sort_order INTEGER DEFAULT 0

7. consumable_thresholds
   - id UUID PK
   - vehicle_id UUID FK → vehicles
   - part_name TEXT NOT NULL
   - custom_km INTEGER
   - custom_months INTEGER
   - modified_by UUID REFERENCES auth.users(id)
   - modified_at TIMESTAMPTZ DEFAULT now()
   - UNIQUE(vehicle_id, part_name)

8. threshold_change_log
   - id UUID PK
   - vehicle_id UUID FK
   - part_name TEXT
   - old_km INTEGER
   - old_months INTEGER
   - new_km INTEGER
   - new_months INTEGER
   - changed_by UUID REFERENCES auth.users(id)
   - changed_at TIMESTAMPTZ DEFAULT now()

9. drivers
   - id UUID PK
   - name TEXT NOT NULL
   - license_type TEXT  -- '1종대형','1종보통' 등
   - license_expire_date DATE
   - assigned_vehicle_ids UUID[]
   - created_at TIMESTAMPTZ DEFAULT now()

10. notifications
    - id UUID PK
    - user_id UUID REFERENCES auth.users(id)
    - vehicle_id UUID FK → vehicles
    - notif_type TEXT  -- 'consumable_warn','legal_expire','inspection_due' 등
    - title TEXT NOT NULL
    - body TEXT NOT NULL
    - is_read BOOLEAN DEFAULT false
    - created_at TIMESTAMPTZ DEFAULT now()

추가로 아래도 포함해줘:
- 모든 테이블에 RLS(Row Level Security) 활성화
- vehicles 테이블: field 사용자는 assigned_field_user_id = auth.uid() 행만 접근
- weekly_inspections, maintenance_records, incident_records: vehicles를 통해 접근 권한 확인
- admin 사용자는 모든 행 접근 가능
- user 메타데이터에서 role 확인: auth.jwt() -> 'user_metadata' -> 'role'

### 4단계 — 시드 데이터
supabase/seed.sql 파일을 생성해줘.
아래 데이터를 삽입해줘:

consumable_defaults 시드 데이터 (9개 항목):
- 엔진오일: 10000km / 6개월 / 하한선 5000km·3개월
- 미션오일: 50000km / 48개월 / 하한선 25000km·24개월
- 부동액/냉각수: 40000km / 24개월 / 하한선 20000km·12개월
- 브레이크 패드: 30000km / 24개월 / 하한선 15000km·12개월
- 타이어: 50000km / 48개월 / 하한선 25000km·24개월
- 시동 배터리: NULL km / 36개월 / 하한선 NULL·18개월
- 에어컨 필터: 5000km / 6개월 / 하한선 2500km·3개월
- 와이퍼 블레이드: NULL km / 12개월 / 하한선 NULL·6개월
- 구동 벨트: 40000km / 36개월 / 하한선 20000km·18개월

vehicles 시드 데이터 (테스트용 차량 5대):
- 대형버스 A (capacity 45, diesel, 서울12가3456)
- 중형버스 B (capacity 25, diesel, 서울34나5678)
- 12인승 C (capacity 12, diesel, 서울56다7890)
- 7인승 D (capacity 7, gasoline, 서울78라1234)
- 승용차 E (capacity 5, gasoline, 서울90마5678)

### 5단계 — TypeScript 타입 정의
src/types/database.ts 파일을 생성해줘.
Supabase에서 생성되는 Database 타입 패턴으로 작성해줘.
각 테이블의 Row, Insert, Update 타입을 모두 포함해야 해.

### 완료 확인
작업 완료 후 아래를 실행해서 확인해줘:
supabase db reset (로컬 Supabase 재시작 + 마이그레이션 + 시드 적용)
```

#### ✅ SLICE 01 완료 체크리스트
- [ ] `.env.local` 환경변수 설정 완료
- [ ] Supabase 클라이언트 파일 3개 생성 완료
- [ ] `src/middleware.ts` role 기반 라우팅 작동 확인
- [ ] 마이그레이션 실행 후 Supabase Studio(localhost:54333)에서 10개 테이블 확인
- [ ] `consumable_defaults` 시드 데이터 9개 삽입 확인
- [ ] `vehicles` 시드 데이터 5개 삽입 확인
- [ ] TypeScript 타입 파일 생성 완료

---

---

## SLICE 02 — 인증 + 차량 마스터 CRUD + QR 코드

> **목표**: 로그인/로그아웃 + 차량 등록·수정·삭제 + QR 코드 생성·스캔
> **예상 시간**: 2일

---

### SLICE-02 프롬프트

```
/compact

CLAUDE.md를 읽고 SLICE 02를 시작한다.
SLICE 01은 완료되어 DB와 Supabase 연결이 준비된 상태야.

## 작업 순서

### 1단계 — 로그인 페이지
src/app/(auth)/login/page.tsx 생성
- 이메일 + 비밀번호 로그인 (Supabase Auth)
- 로그인 성공 시 role에 따라 리다이렉트:
  - admin → /admin/dashboard
  - field → /field/home (알림 피드 홈)
- 에러 메시지 표시 (잘못된 이메일·비밀번호)
- 모바일 최적화: 입력 필드 높이 48px 이상

### 2단계 — 공통 레이아웃
두 개의 레이아웃을 만들어줘:

A. src/app/(field)/layout.tsx — 현장 관리자 모바일 레이아웃
   - 하단 탭 바 8개: 홈(알림)·점검·즉시등록·카드뷰·이력·캘린더·통계·설정
   - 각 탭 아이콘 + 라벨 (lucide-react 아이콘 사용)
   - 홈 탭에 읽지 않은 알림 수 빨간 배지 표시
   - 상단 헤더: 로고 + 현재 페이지 타이틀 + 로그아웃 버튼

B. src/app/(admin)/layout.tsx — 상위 관리자 PC 레이아웃
   - 좌측 사이드바: 전체 차량 관제·주간 점검 현황·법정 만기·통계·차량 관리·설정
   - 상단 헤더: 로고 + 관리자명 + 로그아웃

### 3단계 — 차량 관리 페이지 (상위 관리자)
src/app/(admin)/admin/vehicles/page.tsx
- 차량 목록 테이블 (이름·번호판·연료·정원·현재km·담당자)
- 차량 등록 버튼 → 모달 폼
- 차량 수정·삭제 버튼
- Server Actions 사용 (src/app/actions/vehicles.ts)

### 4단계 — QR 코드 생성
차량 상세 페이지에 QR 코드 생성 기능을 추가해줘.
- 라이브러리: npm install qrcode react-qr-code
- QR 데이터 형식: {"vehicleId": "uuid", "plate": "서울12가3456"}
- QR 코드 이미지 다운로드 버튼 (PNG 저장)
- 인쇄용 QR 카드 레이아웃 (A4 1/4 사이즈, 차량명·번호판·QR 포함)

### 5단계 — QR 스캔 페이지 (현장 관리자)
src/app/(field)/field/scan/page.tsx
- 라이브러리: npm install html5-qrcode
- 카메라 뷰파인더 UI (모바일 전체 화면)
- 스캔 성공 시 → /field/inspect/[vehicleId] 로 이동
- 스캔 실패 시 에러 메시지 표시
- '직접 선택' 버튼 → 담당 차량 목록 드롭다운

### 6단계 — 차량 상태 요약 계산 함수
src/lib/vehicle-status.ts 파일을 만들어줘.
신호등 상태를 계산하는 순수 함수 세트:

type VehicleStatus = 'normal' | 'caution' | 'warning' | 'legal_violation'

function calcConsumableStatus(
  lastServiceMileage: number,
  lastServiceDate: Date,
  currentMileage: number,
  thresholdKm: number | null,
  thresholdMonths: number | null
): { status: 'normal'|'caution'|'warning', usedKmPct: number, usedMonthsPct: number }

function calcLegalStatus(
  expireDate: Date | null,
  docType: 'insurance'|'inspection'|'tax'|'license'
): 'normal' | 'caution' | 'legal_violation'

function calcVehicleOverallStatus(
  weeklyInspectionSubmitted: boolean,
  consumableStatuses: ReturnType<typeof calcConsumableStatus>[],
  legalStatuses: ReturnType<typeof calcLegalStatus>[]
): VehicleStatus

모든 함수에 단위 테스트도 작성해줘 (src/lib/__tests__/vehicle-status.test.ts)
테스트 프레임워크: Jest (npm install -D jest @types/jest ts-jest)
```

#### ✅ SLICE 02 완료 체크리스트
- [ ] 로그인 → role별 리다이렉트 작동 확인
- [ ] 현장 관리자 하단 탭 8개 렌더링 확인
- [ ] 차량 5대 목록 Admin 페이지에서 확인
- [ ] 차량 등록·수정·삭제 작동 확인
- [ ] QR 코드 생성 및 PNG 다운로드 확인
- [ ] QR 스캔 후 점검 페이지 이동 확인
- [ ] `vehicle-status.ts` 단위 테스트 전체 통과 (`npm test`)

---

---

## SLICE 03 — 현장 관리자 주간 점검 체크리스트 UI

> **목표**: 주간 점검 입력 화면 (모바일 최적화)
> **예상 시간**: 3일

---

### SLICE-03 프롬프트

```
/compact

CLAUDE.md를 읽고 SLICE 03을 시작한다.

## 작업 목표
현장 관리자가 스마트폰으로 주간 점검을 입력하는 화면을 만들어.
CLAUDE.md의 주간 점검 체크리스트 8개 항목을 모두 구현해야 해.

## 작업 순서

### 1단계 — 점검 입력 페이지
src/app/(field)/field/inspect/[vehicleId]/page.tsx

페이지 상단: 차량 정보 헤더
- 차량명 + 번호판 + 이번 주 점검 여부 상태 표시
- 이미 이번 주에 제출했으면 "이번 주 점검 완료 ✅" 표시 + 수정 버튼

체크리스트 UI 구성 (각 항목 카드 형태):
① 누적 주행거리
   - 숫자 입력 필드 (type="number", min=0)
   - 지난 주 주행거리 표시 → 이번 주 증감 자동 계산
   - 입력값 < 이전 기록이면 경고 메시지

② 외관 상태
   - 큰 버튼 2개: [✅ 정상] [⚠️ 이상 발견]
   - '이상 발견' 선택 시 사진 업로드 영역 즉시 표시
   - 사진 촬영 버튼 (카메라 직접 실행)

③ 실내 청소 상태
   - 3단계 라디오 버튼: [🟢 상] [🟡 중] [🔴 하]
   - 버튼 크기 최소 56px 높이

④ 외부 세차 상태
   - 토글 스위치: 완료 / 미완

⑤ 등화 장치
   - 큰 버튼 2개: [✅ 정상] [⚠️ 이상]
   - '이상' 선택 시 어떤 등이 문제인지 체크박스 (전조등/후미등/깜빡이/기타)

⑥ 냉각수·워셔액
   - 큰 버튼 2개: [✅ 정상] [🔵 보충 필요]

⑦ 타이어 상태
   - 3단계 버튼: [✅ 정상] [⚠️ 편마모 의심] [🔴 교체 필요]

⑧ 특이사항 메모
   - textarea (3줄)
   - 마이크 버튼 (SLICE 05에서 STT 연결 예정 — 지금은 버튼만 배치, disabled 상태)

하단: [이번 주 점검 제출] 버튼
- 버튼 높이 56px, 전체 너비
- 제출 전 미완료 항목 있으면 스크롤하여 해당 항목 강조
- 제출 성공 시 애니메이션 + "제출 완료!" 토스트 메시지

### 2단계 — Server Action
src/app/actions/inspections.ts
- submitWeeklyInspection(): 이번 주 weekly_inspections 행 upsert
- getThisWeekInspection(vehicleId): 이번 주 제출 여부 조회
- 제출 시 vehicles.current_mileage 자동 업데이트

### 3단계 — 사진 업로드 컴포넌트
src/components/ImageUploader.tsx
- 카메라 촬영 또는 갤러리 선택 지원
- 업로드 전 클라이언트 사이드 이미지 압축:
  - 최대 1200px 리사이즈
  - JPEG 품질 0.8
  - 라이브러리: npm install browser-image-compression
- 업로드 중 프로그레스 바 표시
- Supabase Storage 버킷: 'vehicle-photos'
- 저장 경로: vehicle-photos/{vehicleId}/{year}/{month}/{uuid}.jpg
- 업로드 완료 후 public URL 반환

### 4단계 — 점검 이력 조회 (간단 버전)
src/app/(field)/field/inspect/[vehicleId]/history/page.tsx
- 최근 8주 점검 이력 목록 (날짜·제출자·주요 이상 여부)
- 각 항목 클릭 시 상세 내용 아코디언 펼치기
```

#### ✅ SLICE 03 완료 체크리스트
- [ ] 점검 체크리스트 8개 항목 모두 렌더링 확인
- [ ] 이상 선택 시 사진 업로드 영역 동적 표시 확인
- [ ] 이미지 압축 후 Supabase Storage 업로드 확인 (Studio에서 파일 확인)
- [ ] 제출 후 `weekly_inspections` 테이블에 행 생성 확인
- [ ] 이미 제출한 주 재접속 시 "완료" 상태 표시 확인
- [ ] 모바일(Chrome DevTools 모바일 뷰)에서 버튼 크기 및 UX 확인

---

---

## SLICE 04 — 즉시 등록 화면 + 사진 업로드

> **목표**: 소모품 교환·파손·법정 갱신 즉시 등록
> **예상 시간**: 2일

---

### SLICE-04 프롬프트

```
/compact

CLAUDE.md를 읽고 SLICE 04를 시작한다.

## 작업 목표
이벤트 발생 즉시 등록하는 화면 3종을 만들어.
이 화면들은 주간 점검과 별개로 언제든 접근 가능해야 해.

## 작업 순서

### 1단계 — 즉시 등록 메뉴 화면
src/app/(field)/field/register/page.tsx
- 차량 선택 드롭다운 (담당 차량 목록)
- 등록 유형 선택 카드:
  🔧 소모품 교환 등록
  📷 외관 파손·이상 등록
  🔋 배터리 방전 이력
  📋 법정 서류 갱신 (보험·검사·세금·면허)

### 2단계 — 소모품 교환 등록
src/app/(field)/field/register/maintenance/page.tsx

소모품 선택 UI:
- consumable_defaults 테이블에서 목록 조회
- 카테고리별 그룹핑된 선택 버튼
- 선택한 소모품의 현재 잔여 주기 표시 (커스텀 기준 적용)

입력 필드:
- 교환 시 주행거리 (km) — 필수
- 교환 날짜 (date picker) — 기본값: 오늘
- 메모 (선택)
- 영수증 사진 업로드 (ImageUploader 컴포넌트 재사용)

제출 후:
- maintenance_records 테이블에 행 삽입
- 해당 소모품 잔여 주기 초기화
- vehicles.current_mileage 업데이트
- "교환 기록 완료! 다음 교환 예정: X,000km 또는 X개월 후" 토스트

### 3단계 — 외관 파손 등록
src/app/(field)/field/register/incident/page.tsx

입력 필드:
- 파손 유형 선택: 스크래치·찌그러짐·유리파손·기타
- 파손 위치 (차량 도식 위에 터치로 위치 표시 또는 텍스트 선택)
  위치 옵션: 전면·후면·좌측·우측·상단·실내
- 사진 업로드 (최소 1장 필수, 최대 5장)
- 상황 설명 텍스트 (필수)
- 배터리 방전 여부를 별도 선택으로도 지원 (incident_type = 'battery_dead')

제출 후:
- incident_records 테이블에 행 삽입
- 신호등 🔴 즉시 전환 (vehicles 테이블에 status 필드 업데이트)
- 상위 관리자에게 알림 즉시 발송 (SLICE 09에서 완성, 지금은 DB 저장만)

### 4단계 — 법정 서류 갱신 등록
src/app/(field)/field/register/legal/page.tsx

서류 유형별 입력 폼:
A. 보험 갱신
   - 보험사명 / 증권번호 / 새 만기일
   - 보험증권 사진 업로드 (필수)

B. 정기검사 수검 완료
   - 수검일 / 검사증 사진 업로드 (필수)
   - 저장 시 next_inspection_date 자동 계산:
     capacity >= 16 → +6개월
     capacity >= 11 → +12개월
     기타 → +24개월

C. 자동차세 납부 완료
   - 납부일 / 납부 영수증 사진 (선택)
   - 연납 여부 체크박스

D. 운전자 면허 갱신
   - 운전자 선택 (drivers 테이블)
   - 새 만기일 / 사진 (선택)

제출 후:
- legal_documents 테이블 upsert
- vehicles 테이블 해당 만기일 필드 업데이트
- 🟣 법정 위반 상태였으면 → 🟢 정상 복귀
```

#### ✅ SLICE 04 완료 체크리스트
- [ ] 소모품 교환 등록 후 `maintenance_records` 행 삽입 확인
- [ ] 소모품 잔여 주기 초기화 확인 (Studio에서 교환일·km 업데이트 확인)
- [ ] 사진 5장 업로드 후 Supabase Storage 경로 확인
- [ ] 법정 서류 갱신 후 `vehicles.next_inspection_date` 자동 계산 확인
- [ ] 배터리 방전 등록 후 `incident_records` 행 삽입 확인

---

---

## SLICE 05 — STT 음성 메모 + 알림 기준 커스터마이징

> **목표**: 음성 → 텍스트 변환 / 소모품 교환 주기 현장 수정 UI
> **예상 시간**: 2일

---

### SLICE-05 프롬프트

```
/compact

CLAUDE.md를 읽고 SLICE 05를 시작한다.

## 작업 순서

### 1단계 — STT 음성 메모 컴포넌트
src/components/VoiceMemo.tsx

Web Speech API 사용:
- 마이크 버튼 클릭 → 녹음 시작 (빨간 펄스 애니메이션)
- 말하는 동안 실시간 텍스트 변환 표시
- 마이크 버튼 재클릭 또는 3초 무음 → 녹음 종료
- 변환된 텍스트를 부모 컴포넌트 textarea에 자동 삽입
- 브라우저 미지원 시 "이 브라우저는 음성 입력을 지원하지 않습니다" 표시
- 언어: 'ko-KR'

SLICE 03의 특이사항 메모 마이크 버튼에 이 컴포넌트를 연결해줘.

### 2단계 — 알림 기준 커스터마이징 페이지 (탭 ⑧)
src/app/(field)/field/settings/thresholds/page.tsx

화면 구성:
- 상단: 담당 차량 선택 탭 (차량이 여러 대면 탭으로 전환)
- 소모품 목록 (consumable_defaults 기반)

각 소모품 행:
┌─────────────────────────────────────────┐
│ 🔧 엔진오일                [기본값] 태그  │
│ km 기준:  [10,000] km                   │
│ 기간 기준: [6] 개월                      │
│ [권장값으로 초기화]                       │
└─────────────────────────────────────────┘

- 현재 커스텀 값이 기본값과 다르면 [커스텀] 태그 (주황색) 표시
- 기본값이면 [기본값] 태그 (파란색) 표시
- 입력값 변경 즉시 저장 버튼 활성화
- 하한선 미만 입력 시 즉각 빨간 경고: "최소 X,000km 이상 설정해야 합니다"
- [저장] 버튼 클릭 시:
  - consumable_thresholds upsert
  - threshold_change_log 감사 기록 삽입
  - "저장되었습니다. 잔여 주기가 재계산됩니다." 토스트

### 3단계 — Server Action
src/app/actions/thresholds.ts

- updateThreshold(vehicleId, partName, customKm, customMonths):
  하한선 검증 → consumable_thresholds upsert → threshold_change_log 삽입
- resetThreshold(vehicleId, partName): 커스텀 값 삭제 → 기본값으로 복귀
- getVehicleThresholds(vehicleId): 커스텀 기준 조회 (없으면 default 반환)

하한선 검증은 서버 사이드에서만 수행 (클라이언트 검증은 UX용, 보안은 서버).
```

#### ✅ SLICE 05 완료 체크리스트
- [ ] 마이크 버튼 클릭 → 한국어 음성 인식 → textarea 자동 입력 확인
- [ ] 소모품 기준 수정 후 `consumable_thresholds` 행 upsert 확인
- [ ] `threshold_change_log` 변경 이력 행 삽입 확인
- [ ] 하한선 미만 입력 시 저장 버튼 비활성화 + 경고 메시지 확인
- [ ] '권장값으로 초기화' 후 [기본값] 태그로 복귀 확인

---

---

## SLICE 06 — 현장 관리자 열람 화면 (카드뷰·이력·캘린더)

> **목표**: 탭 ④⑤⑥ — 신호등 카드뷰, 정비 이력 타임라인, 법정 만기 캘린더
> **예상 시간**: 2일

---

### SLICE-06 프롬프트

```
/compact

CLAUDE.md를 읽고 SLICE 06을 시작한다.

## 작업 순서

### 1단계 — 차량 상태 카드뷰 (탭 ④)
src/app/(field)/field/status/page.tsx

담당 차량들을 카드 그리드로 표시:

각 차량 카드:
┌──────────────────────────────┐
│ 🟢  소나타 A호  서울12가3456  │
│ 현재: 45,230 km              │
│ ─────────────────────────── │
│ 엔진오일    ████████░░ 82%   │
│ 브레이크    ██████░░░░ 61%   │
│ 배터리      ████░░░░░░ 43%   │
│ ─────────────────────────── │
│ 보험 만기: 2025-08-15 (D-52) │
│ 정기검사: 2025-12-01 (D-180) │
└──────────────────────────────┘

- 신호등 색상이 카드 좌측 테두리 색상 + 상단 배지로 표시
- 소모품 게이지 바: 사용률 % (커스텀 기준 기반)
  - 0~79%: 파란색
  - 80~89%: 노란색
  - 90~100%: 주황색
  - 초과: 빨간색
- 법정 만기 D-Day 표시
- 카드 클릭 → 해당 차량 정비 이력 페이지로 이동

페이지 데이터 fetching:
- vehicle-status.ts의 calcVehicleOverallStatus 함수 활용
- 소모품 잔여 주기는 커스텀 기준 우선 적용

### 2단계 — 정비 이력 타임라인 (탭 ⑤)
src/app/(field)/field/history/[vehicleId]/page.tsx

타임라인 UI:
- 날짜 역순 정렬
- 이벤트 유형별 아이콘:
  🔧 소모품 교환 (maintenance_records)
  📷 외관 파손 (incident_records, type=damage)
  🔋 배터리 방전 (incident_records, type=battery_dead)
  📋 법정 서류 갱신 (legal_documents)
  ✅ 주간 점검 제출 (weekly_inspections)

각 타임라인 항목:
- 날짜 + 유형 아이콘 + 제목
- 펼치기 시: 상세 내용 + 증빙 사진 (썸네일 → 클릭 시 원본 확대)

사진 라이트박스:
- 사진 클릭 시 전체화면 오버레이
- 좌우 스와이프로 여러 장 탐색

### 3단계 — 법정 만기 캘린더 (탭 ⑥)
src/app/(field)/field/calendar/page.tsx

라이브러리: npm install react-calendar
(또는 shadcn/ui Calendar 컴포넌트 사용)

월간 캘린더 뷰:
- 만기일 있는 날짜에 컬러 점 표시:
  🔴 빨간 점: 이미 경과 또는 15일 이내
  🟡 노란 점: 30일 이내
  🔵 파란 점: 30일 초과
- 날짜 클릭 시 하단에 해당 날짜 만기 항목 목록 표시

하단 임박 항목 리스트:
- "이번 달 주요 만기 일정" 섹션
- 차량명 + 항목명 + 만기일 + D-Day
- 가장 임박한 순서로 정렬

데이터 범위: 현장 관리자는 담당 차량만 표시
```

#### ✅ SLICE 06 완료 체크리스트
- [ ] 차량 카드에 소모품 게이지 바 색상 구분 확인
- [ ] 신호등 상태 카드 테두리 색상 반영 확인
- [ ] 타임라인에 5가지 이벤트 유형 모두 표시 확인
- [ ] 사진 클릭 시 라이트박스 전체화면 확인
- [ ] 캘린더 만기일 컬러 점 표시 확인
- [ ] 만기 항목 D-Day 계산 정확도 확인

---

---

## SLICE 07 — 통계 차트 (현장·상위 공용)

> **목표**: 주행거리 추이, 소모품 교환 비용, 차량별 이용 현황 차트
> **예상 시간**: 2일

---

### SLICE-07 프롬프트

```
/compact

CLAUDE.md를 읽고 SLICE 07을 시작한다.

## 작업 순서

### 1단계 — 통계 차트 페이지 (현장 관리자 탭 ⑦)
src/app/(field)/field/stats/page.tsx

차트 라이브러리: recharts (npm install recharts)

차트 3종:

A. 주간 주행거리 추이 (최근 12주)
   - LineChart
   - X축: 주차 (예: "6/2주", "6/3주")
   - Y축: 주행거리 (km)
   - 현장 관리자: 담당 차량 전체 합산 또는 차량별 선택
   - 툴팁: 해당 주 날짜 + 주행거리

B. 소모품 교환 비용 추이 (월별, 최근 6개월)
   - BarChart
   - 비용 데이터는 maintenance_records에 cost 필드 추가 필요
     (SLICE 04 maintenance_records에 cost INTEGER NULL 필드 추가 마이그레이션)
   - 비용 없으면 교환 횟수로 대체 표시

C. 차량별 주간 이용 현황 (최근 4주)
   - StackedBarChart 또는 표 형태
   - 각 차량의 주간 주행거리 비교
   - 현장 관리자: 담당 차량만 / 상위 관리자: 전체 차량

### 2단계 — 통계 API Route
src/app/api/stats/route.ts

GET /api/stats?type=weekly-mileage&vehicleIds=xxx,yyy&weeks=12
GET /api/stats?type=maintenance-cost&vehicleIds=xxx&months=6
GET /api/stats?type=vehicle-usage&vehicleIds=xxx&weeks=4

응답 형식: { data: [...], labels: [...] }
role 체크: field 사용자는 assigned_vehicle_ids 범위만 반환

### 3단계 — 상위 관리자용 통계 페이지
src/app/(admin)/admin/stats/page.tsx

현장 관리자 페이지와 같은 차트 컴포넌트를 재사용하되:
- 전체 차량 데이터 표시
- 차량 필터 드롭다운 (다중 선택)
- 기간 선택 (1개월·3개월·6개월·1년)
- CSV 다운로드 버튼
```

#### ✅ SLICE 07 완료 체크리스트
- [ ] 주간 주행거리 LineChart 12주 데이터 렌더링 확인
- [ ] 소모품 교환 BarChart 데이터 렌더링 확인
- [ ] 현장 관리자: 담당 차량 범위만 API 응답 확인 (Network 탭)
- [ ] 상위 관리자: 전체 차량 CSV 다운로드 확인

---

---

## SLICE 08 — 상위 관리자 전체 관제판

> **목표**: 전체 차량 신호등 관제, 주간 점검 현황, 상위 관리자 전용 기능
> **예상 시간**: 2일

---

### SLICE-08 프롬프트

```
/compact

CLAUDE.md를 읽고 SLICE 08을 시작한다.

## 작업 순서

### 1단계 — 메인 대시보드 (전체 차량 카드뷰)
src/app/(admin)/admin/dashboard/page.tsx

전체 차량을 4색 신호등 카드 그리드로 표시 (SLICE 06 카드 컴포넌트 재사용):
- 필터 버튼: [전체] [🟢 정상] [🟡 주의] [🔴 경고] [🟣 법정]
- 정렬: 심각도 높은 순 (🟣 → 🔴 → 🟡 → 🟢)
- 검색: 차량명·번호판 검색
- 카드 클릭 → 해당 차량 상세 관제 페이지

### 2단계 — 주간 점검 제출 현황판
src/app/(admin)/admin/inspections/page.tsx

이번 주 전체 차량 점검 제출 현황 테이블:
┌──────────┬──────────┬──────────┬──────────┐
│ 차량명   │ 담당자   │ 제출 여부 │ 제출 시각 │
├──────────┼──────────┼──────────┼──────────┤
│ 대형버스A│ 홍길동   │ ✅ 완료   │ 09:23    │
│ 중형버스B│ 홍길동   │ ⚠️ 미제출 │ —        │
│ 12인승C  │ 김철수   │ ✅ 완료   │ 10:15    │
└──────────┴──────────┴──────────┴──────────┘

- 미제출 차량 행 배경 연한 노란색 강조
- 주차 선택 드롭다운 (이전 주 이력 조회)
- 미제출 차량 담당자에게 수동 알림 발송 버튼

### 3단계 — 알림 기준 일괄 설정 (상위 관리자 전용)
src/app/(admin)/admin/settings/thresholds/page.tsx

consumable_defaults 테이블 편집 UI:
- 소모품 목록 표 형태 인라인 편집
- [저장] 버튼 → 전체 차량에 새 기본값 적용 안내 메시지
  ("기존 커스텀 설정 차량은 영향 없음")
- [전체 초기화] 버튼 → 모든 consumable_thresholds 삭제 확인 모달

### 4단계 — 차량별 상세 관제 페이지
src/app/(admin)/admin/vehicles/[vehicleId]/page.tsx

탭 구조:
① 현황 요약 — 신호등 상태 + 소모품 게이지 + 법정 만기
② 주간 점검 이력 — 최근 12주 테이블
③ 정비 이력 — 타임라인 (SLICE 06 컴포넌트 재사용)
④ 법정 서류 — 보험·검사·세금 만기일 및 증빙 사진
⑤ 알림 기준 이력 — threshold_change_log 조회 (감사용)
```

#### ✅ SLICE 08 완료 체크리스트
- [ ] 전체 차량 카드뷰 필터·정렬 작동 확인
- [ ] 주간 점검 현황판 미제출 강조 표시 확인
- [ ] 소모품 기본값 일괄 편집 저장 확인
- [ ] 차량 상세 페이지 5개 탭 모두 렌더링 확인
- [ ] 알림 기준 변경 이력 감사 로그 표시 확인

---

---

## SLICE 09 — 알림 시스템 (Edge Functions + 피드 UI)

> **목표**: 단계별 소모품·법정 알림 자동 발송 + 인앱 알림 피드
> **예상 시간**: 2일

---

### SLICE-09 프롬프트

```
/compact

CLAUDE.md를 읽고 SLICE 09를 시작한다.

## 작업 순서

### 1단계 — 알림 피드 홈 (탭 ①)
src/app/(field)/field/home/page.tsx

알림 피드 UI:
- 상단: "읽지 않은 알림 N개" 배지
- [전체 읽음 처리] 버튼
- 알림 목록 (notifications 테이블 → user_id = 현재 사용자)

각 알림 카드:
┌─────────────────────────────────────┐
│ 🟡  소나타 A호 — 엔진오일 교환 임박   │  ← 읽지 않음: 파란 점
│ 9,200km 사용 / 기준 10,000km        │
│ 지금 등록하기 →                      │  ← 버튼
│ 3시간 전                            │
└─────────────────────────────────────┘

- 읽지 않은 알림: 파란 좌측 테두리
- 알림 클릭 시 is_read = true 업데이트 + 관련 페이지 이동
- Supabase Realtime 구독으로 새 알림 실시간 수신

### 2단계 — Edge Function: 소모품 알림 스캐너
supabase/functions/scan-consumables/index.ts

매일 00:00에 실행될 함수:
1. 모든 차량의 maintenance_records에서 소모품별 최근 교환 이력 조회
2. consumable_thresholds 또는 consumable_defaults에서 기준값 조회
3. 사용률 계산 (km% 와 기간% 중 큰 값 사용)
4. 단계별 알림 생성:
   - 80% 이상: 1단계 사전 예고 (아직 알림 없는 경우에만)
   - 90% 이상 또는 1개월 이내: 2단계 주의
   - 100% 초과: 3단계 경고
5. notifications 테이블에 INSERT
   (같은 차량+소모품 조합으로 24시간 내 동일 단계 알림이 이미 있으면 스킵)
6. 해당 차량 assigned_field_user_id + admin 사용자에게 알림 생성

### 3단계 — Edge Function: 법정 만기 스캐너
supabase/functions/scan-legal/index.ts

매일 00:00에 실행될 함수:
1. vehicles + legal_documents + drivers 테이블에서 만기일 조회
2. 만기일 기준 알림 단계 계산:
   - 보험: 60일 전(1단계)·30일 전(2단계)·15일 이내(3단계)
   - 정기검사: 60일·30일·만기 도달
   - 자동차세: 30일·14일·기한 경과
   - 면허: 60일·30일·만기 경과
3. notifications 테이블에 INSERT (중복 방지 로직 포함)

### 4단계 — Edge Function: 주간 점검 리마인더
supabase/functions/weekly-reminder/index.ts

매주 월요일 09:00 한국 시간에 실행:
1. 이번 주 weekly_inspections 미제출 차량 조회
2. 담당 현장 관리자에게 알림 생성: "이번 주 점검을 아직 제출하지 않았습니다"

매주 월요일 12:00에 실행:
1. 여전히 미제출 차량 → vehicles 테이블에 weekly_status = 'overdue' 설정
2. 해당 차량 신호등 🟡 전환 반영

### 5단계 — Edge Function 배포 및 Cron 설정
supabase/config.toml에 cron 스케줄 추가:
[functions.scan-consumables]
  schedule = "0 0 * * *"  # 매일 00:00 UTC (한국 09:00)

[functions.scan-legal]
  schedule = "0 0 * * *"

[functions.weekly-reminder]
  schedule = "0 0 * * 1"  # 매주 월요일 00:00 UTC (한국 09:00)

수동 실행 테스트 명령어도 알려줘:
supabase functions invoke scan-consumables --no-verify-jwt
```

#### ✅ SLICE 09 완료 체크리스트
- [ ] 알림 피드 홈 페이지 알림 목록 표시 확인
- [ ] 알림 클릭 시 `is_read` 업데이트 확인
- [ ] Realtime 구독으로 새 알림 즉시 표시 확인 (두 탭 열어서 테스트)
- [ ] `scan-consumables` 함수 수동 실행 → `notifications` 테이블 행 생성 확인
- [ ] `scan-legal` 함수 수동 실행 → 만기 임박 알림 생성 확인
- [ ] `weekly-reminder` 함수 수동 실행 → 미제출 차량 알림 생성 확인
- [ ] 중복 알림 방지 로직 작동 확인 (함수 2회 실행 시 중복 행 없음)

---

---

## SLICE 10 — Realtime + Cron + PWA + 배포

> **목표**: 실시간 동기화, 알림 배지, PWA 설정, Vercel 배포
> **예상 시간**: 1일

---

### SLICE-10 프롬프트

```
/compact

CLAUDE.md를 읽고 SLICE 10을 시작한다. 마지막 SLICE야.

## 작업 순서

### 1단계 — Supabase Realtime 신호등 동기화
현장 관리자 차량 카드뷰(탭 ④)와 상위 관리자 대시보드에
Supabase Realtime 구독을 추가해줘.

구독 채널:
- vehicles 테이블 변경 → 카드 신호등 색상 실시간 업데이트
- notifications 테이블 INSERT → 하단 탭 배지 숫자 실시간 업데이트
- weekly_inspections INSERT → 주간 점검 현황판 실시간 갱신

구독 코드 패턴:
src/hooks/useRealtimeVehicles.ts
src/hooks/useRealtimeNotifications.ts

### 2단계 — PWA 설정
Next.js PWA 설정:
라이브러리: npm install next-pwa

next.config.ts에 PWA 설정 추가.

public/manifest.json 생성:
{
  "name": "교회 차량 관리",
  "short_name": "차량관리",
  "start_url": "/field/home",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1A3A5C",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}

PWA 아이콘 파일 (public/icons/) 생성:
- 교회 로고 또는 차량 아이콘 기반 192×192, 512×512 PNG
- 아이콘이 없으면 배경 #1A3A5C에 흰색 차량 이모지로 임시 생성

### 3단계 — 성능 최적화
아래 항목들을 점검하고 수정해줘:
- 이미지: Next.js Image 컴포넌트로 교체 (Supabase Storage URL 도메인 next.config에 추가)
- 코드 스플리팅: 차트 라이브러리 dynamic import로 변환
- API 응답 캐싱: 통계 API에 revalidate 설정 (60초)
- 로딩 스켈레톤: 카드뷰, 타임라인, 차트에 Skeleton 컴포넌트 추가

### 4단계 — Vercel 배포
아래 단계를 안내해줘:

1. GitHub에 push:
   git add .
   git commit -m "feat: vehicle management system v1.0"
   git push origin main

2. Vercel 환경 변수 설정 목록:
   NEXT_PUBLIC_SUPABASE_URL (프로덕션 Supabase URL)
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY

3. Supabase 프로덕션 설정:
   - Supabase 대시보드에서 마이그레이션 실행 방법
   - Storage 버킷 'vehicle-photos' 생성 및 공개 접근 정책 설정
   - Edge Functions 배포 명령어

4. 배포 후 체크리스트 안내

### 5단계 — 최종 통합 테스트 시나리오 작성
아래 테스트 시나리오를 실행하고 결과를 알려줘:

시나리오 1 — 현장 관리자 전체 플로우:
① 로그인 (field 계정)
② QR 스캔으로 차량 선택
③ 주간 점검 체크리스트 입력 (외관 이상 선택 + 사진 첨부)
④ 제출 후 카드뷰에서 🔴 경고 상태 확인
⑤ 알림 피드에서 신규 알림 수신 확인

시나리오 2 — 소모품 교환 플로우:
① 즉시 등록 → 소모품 교환 → 엔진오일 선택
② 영수증 사진 업로드 + 현재 km 입력
③ 제출 후 카드뷰 게이지 바 초기화 확인
④ 알림 기준 설정에서 엔진오일 기준 8,000km로 변경
⑤ 카드뷰 게이지 바 재계산 확인

시나리오 3 — 상위 관리자 관제 플로우:
① admin 계정으로 로그인
② 대시보드에서 경고 차량 필터링
③ 해당 차량 클릭 → 정비 이력 탭 확인
④ 주간 점검 현황판에서 미제출 차량 확인
⑤ 미제출 담당자 수동 알림 발송
```

#### ✅ SLICE 10 완료 체크리스트
- [ ] Realtime 구독으로 카드뷰 색상 즉시 변경 확인 (두 탭 테스트)
- [ ] 알림 배지 숫자 실시간 업데이트 확인
- [ ] 모바일 Chrome에서 "홈 화면에 추가" 옵션 확인 (PWA)
- [ ] Vercel 배포 URL에서 로그인 작동 확인
- [ ] 통합 테스트 시나리오 3개 모두 통과

---

---

## 📌 개발 중 자주 쓰는 명령어 모음

```bash
# 로컬 Supabase 시작
supabase start

# DB 초기화 (마이그레이션 + 시드 재실행)
supabase db reset

# Edge Function 수동 실행 (테스트)
supabase functions invoke scan-consumables --no-verify-jwt
supabase functions invoke scan-legal --no-verify-jwt
supabase functions invoke weekly-reminder --no-verify-jwt

# 개발 서버 실행
npm run dev

# TypeScript 타입 체크
npx tsc --noEmit

# 단위 테스트 실행
npm test

# Vercel 배포 미리보기
npx vercel

# GitHub push (자동 배포)
git add . && git commit -m "feat: SLICE XX 완료" && git push origin main
```

---

## 📌 컨텍스트가 길어질 때 — /compact 사용 기준

| 상황 | 권장 조치 |
|------|-----------|
| SLICE 하나 완료 후 다음 SLICE 시작 전 | `/compact` 실행 |
| 에러 해결에 10턴 이상 소요됐을 때 | `/compact` 실행 |
| 작업 도중 Claude가 이전 지시사항을 잊는 것 같을 때 | `CLAUDE.md를 다시 읽어줘` 요청 |
| SLICE 완전히 새로 시작할 때 | `/clear` 실행 후 프롬프트 붙여넣기 |

---

## 📌 에러 발생 시 공유 방법

Claude Code에 에러를 공유할 때는 아래 형식으로:

```
에러가 발생했어. 아래 내용을 확인해줘:

[에러 메시지 전체 붙여넣기]

현재 상황:
- 어떤 작업을 하다가 발생했는지
- 어떤 파일을 수정했는지

스크린샷은 별도로 첨부할게.
```
