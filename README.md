# AutoVideoForPlus (숏폼 영상 제작 완전 자동화 파이프라인)

웹소설 원작 숏폼(60초 세로형 9:16) 제작 파이프라인을 완전 자동화하는 웹 기반 관리자 시스템입니다.

## 🚀 주요 기능 및 아키텍처

1. **헤드 에이전트 (Claude 3.5 Sonnet)**
   - 대본 입력 시 약 60초 분량(10~14개 컷)의 정교한 컷시트 JSON 자동 생성
   - 화자(플루/범/내레이션), 샷-리버스 샷 대화 교차 분할, 모션 프롬프트 및 서류 카드 오버레이 데이터 자동 분리

2. **서브 에이전트 파이프라인**
   - **Typecast TTS 음성 합성**:
     - 플루(Plue): 찬구 (`tc_5c547544fcfee90007fed455`)
     - 범(Beom): 서현 (`tc_69f2e455ea79fd197aa0476f`)
     - WAV 헤더 ByteRate 분석 기반 초 단위 정밀 duration 자동 산출
   - **Kling I2V 비디오 생성**:
     - 관리자 화면에서 등록한 캐릭터 대표 레퍼런스 이미지를 First Frame으로 자동 주입
     - 9:16 세로형 비율, silent clip 강제, 6초 간격 폴링

3. **Remotion 비디오 엔진**
   - **Audio-Driven Timeline**: TTS 실제 음성 길이에 맞춘 오디오 기반 가변 타임라인 (0.85배속 미세 싱크 보정)
   - **서류 카드 컴포넌트**: 계약서, 등기부등본, 33% 지분 차트, 검색창 오버레이 (상단 2/3 세이프존)
   - **자막 세이프존**: 쇼츠 UI 간섭 방지 `top: 1280px` 자막 레이아웃
   - **AI 워터마크**: 우측 상단 'AI 생성' 필수 뱃지 부착
   - **브라우저 실시간 프리뷰 & MP4 렌더링**

4. **클라우드 스토리지 & DB**
   - **Supabase PostgreSQL & Storage**: 미디어 에셋 영구 저장 및 인메모리 싱글톤 스토어 이중화 지원

---

## 🛠️ 시작하기

### 1. 환경 변수 설정
`.env.example`을 복사하여 `.env.local`을 생성하고 키를 입력합니다:
```bash
cp .env.example .env.local
```

### 2. Supabase DB 테이블 생성
Supabase 대시보드의 **SQL Editor**에서 `supabase/schema.sql`의 SQL 스크립트를 실행합니다.

### 3. 패키지 설치 및 개발 서버 실행
```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000/admin`에 접속하여 설정한 패스코드(`kingsunguk`)를 입력합니다.
