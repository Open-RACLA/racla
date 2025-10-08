# 🎮 Open RACLA Desktop App (Vite)

<div align="center">
  <img src="https://github.com/user-attachments/assets/80ea7d9c-63de-40f8-9969-486d062fb2a9" alt="RACLA">
  
  <p><strong>종합리듬 게임 성과 관리 도구</strong></p>
  
  <p>
    <img src="https://img.shields.io/github/license/Open-RACLA/racla?color=blue" alt="License">
    <img src="https://img.shields.io/badge/platforms-Windows-brightgreen" alt="Platforms">
    <a href="https://github.com/Open-RACLA/racla/actions/workflows/build.yml"><img src="https://github.com/Open-RACLA/racla/actions/workflows/build.yml/badge.svg?branch=main" alt="Build Verification"></a>
    <a href="https://app.codacy.com/gh/Open-RACLA/racla/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade"><img src="https://app.codacy.com/project/badge/Grade/e6c8071c93564fcbb7624bd09e912a1a"/></a>
  </p>
</div>

## 📋 개요

Open RACLA는 **Tsuki.chat**에서 개발한 종합리듬 게임 성과 관리 도구입니다.  
해당 브랜치에서는 Vite로 개발된 Open RACLA 데스크톱 앱의 소스코드와 최종 결과물인 소프트웨어를 **Windows** 플랫폼으로 배포합니다.

> 📢 **안내**: 0.7 버전대까지 사용된 Nextron 기반의 데스크톱 앱의 소스코드는 [Open-RACLA/racla](https://github.com/Open-RACLA/racla/tree/main-nextron)에서 확인하실 수 있습니다.

## 🛠️ 개발 환경 설정

### 필수 요구사항

- Node.js 22.14.0 이상
- pnpm 10.11.0 이상 (`npm install -g pnpm@10.11.0`)
- 윈도우 개발 환경 (윈도우 10/11)

### API URL 설정

API URL은 소스 코드에 직접 설정되어 있으며, 개발 환경에서는 `https://dev.api.open-racla.app`, 운영 환경에서는 `https://api.open-racla.app`을 사용합니다.  
개발 환경의 API URL은 접근 제어되어 있으므로 해당 URL을 접근하기 위해서는 별도로 사용 권한을 요청하셔야 합니다.  
API URL 설정에 관한 자세한 내용은 `src/libs/apiClient.ts` 파일을 참고해주세요.

### 환경 변수 설정

`.env.example` 파일을 복사하여 `.env.development`와 `.env.production` 파일을 만들고 필요한 값을 설정하세요:

```bash
# CDN URL 설정
VITE_CDN_URL=https://cdn.racla.app
# 디스코드 통합을 위한 설정
DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID
```

## 📦 프로젝트 설치 및 실행

### 설치

```bash
# 의존성 설치
pnpm install
```

### 개발 모드 실행

```bash
# 개발 서버 시작
pnpm dev

# 디버그 모드로 실행
pnpm debug
```

### 빌드

```bash
# 프로덕션 빌드
pnpm build

# 개발 환경용 빌드
pnpm build-dev
```

## 📂 프로젝트 구조

```
racla/
├── .github/                # GitHub 워크플로우 및 설정
├── scripts/                # 빌드 및 유틸리티 스크립트
├── resources/              # 애플리케이션 리소스 파일
├── src/                    # 소스 코드
│   ├── main/               # 메인 프로세스 (Electron)
│   ├── render/             # 렌더러 프로세스 (React)
│   ├── preload/            # 프리로드 스크립트
│   ├── libs/               # 공유 라이브러리
│   └── types/              # TypeScript 타입 정의
├── .env.development        # 개발 환경 변수
├── .env.production         # 프로덕션 환경 변수
├── .env.example            # 환경 변수 예제 파일
├── electron-builder.config.js # Electron 빌더 설정
├── vite.config.mts         # Vite 설정
└── tsconfig.json           # TypeScript 설정
```

## 🎵 지원 게임

<table>
  <tr>
    <td><b>🎹 DJMAX RESPECT V</b></td>
    <td>
      <a href="https://store.steampowered.com/app/960170/DJMAX_RESPECT_V/">디제이맥스 리스펙트 V</a><br>
      웹 성과 관리 도구 <a href="https://v-archive.net">V-ARCHIVE</a>, <a href="https://hard-archive.com">전일 아카이브</a>와 연동됩니다.
    </td>
  </tr>
  <!-- <tr>
    <td><b>🎧 PLATiNA::LAB</b></td>
    <td>
      <a href="https://platinalab.net/">플라티나 랩</a><br>
      RACLA 자체 구축 서비스로 운영됩니다.
    </td>
  </tr> -->
</table>

## 🌐 다국어 지원 (i18n)

Open RACLA는 다국어 지원을 위한 국제화(i18n) 시스템을 구축하고 있습니다. 현재 번역 기여를 받고 있으며, 다음 언어들을 지원합니다.

- 한국어 (기본)
- 영어 (Claude Sonnet 3.7로 번역됨)
- 일본어 (Claude Sonnet 3.7로 번역됨)

번역에 기여하고 싶으신 분들은 GitHub Issue나 Pull Request를 통해 참여해주시면 감사하겠습니다.

## 💬 TMI

> ⚠️ Nextron 기반의 RACLA 데스크톱 앱은 0.7.16 업데이트를 기점으로 더 이상 유지 보수되지 않습니다. ~(다시는 만나지 말자...)~
>
> 단, 해당 기반의 데스크톱 앱을 유지 보수하거나 이끌고가실 분이 계시다면 언제든지 편하게 연락주시길 바랍니다. 😊

✨ Vite is Best.

## 📜 라이선스

### 소프트웨어 라이선스

- 이 소프트웨어의 소스코드는 [MIT 라이선스](https://github.com/Open-RACLA/racla/blob/main/LICENSE)에 따라 제공됩니다.
- 자세한 내용은 소스코드에 포함된 `LICENSE` 파일을 참조하시기 바랍니다.

### 제3자 리소스

⚠️ 본 소프트웨어에는 제3자의 이미지, 아이콘, 폰트 등 일부 리소스가 포함되어 있을 수 있습니다.

- 이러한 제3자 리소스는 각각의 라이선스 조건이 적용됩니다
- 해당 리소스의 원저작자가 명시한 라이선스를 반드시 준수해야 합니다

## 개발 일지

### To-Do (Main Process)

- [x] Auth Manager (V-ARCHIVE, Discord 로그인 및 연동 모듈)
- [x] Discord Manager (Discord Rich Presence 모듈)
- [x] File Manager (설정, 세션, 로그 파일 관리 모듈)
- [x] Game Monitor (지원하는 게임 실행 상태를 주기적으로 확인하여 관련 서비스를 제공하는 통합 관리 모듈)
- [x] Image Processor (성과 이미지 전처리 모듈)
- [x] Logger (메인 프로세스, 렌더러 프로세스 로그 통합 모듈)
- [x] Main Window (메인 윈도우 모듈)
- [x] Message (메인 프로세스와 렌더러 프로세스간 메세지 교환을 확인하는 테스트 용도의 모듈)
- [x] OCR Manager (Image Processor에서 처리된 성과 이미지의 결과창 여부를 판단하는 모듈)
- [x] Overlay Window (오버레이 윈도우 모듈)
- [x] Process Manager (사용자 환경에서 실행 중인 프로세스를 확인하는 모듈)
- [x] Update Manager (앱 업데이트 관리 모듈)

### To-Do (Renderer Process)

- [x] 앱 초기화 로직 (Discord Manager, Overlway Window, Update Manager 호출, 수록곡 DB 업데이트, 자동 로그인...)
- [x] 앱 레이아웃 (Header, Navigation Bar, Footer, Common Component...)
- [x] 치트시트
- [x] 홈
- [x] 로그인 및 제3자 서비스 연동 회원가입
- [x] 오버레이 - 인게임 오버레이
- [x] 오버레이 - 설정
- [x] 피드백 센터 (버그 제보, 기능 추가 요청...)
- [ ] 트랙 메이커 - 허브
- [x] 트랙 메이커 - 패턴 에디어
- [x] 트랙 메이커 - 플레이어
- [x] DMRV - V-ARCHIVE - 기록 등록
- [x] DMRV - V-ARCHIVE - 성과표
- [x] DMRV - V-ARCHIVE - MAX DJ POWER
- [x] DMRV - V-ARCHIVE - 데이터베이스
- [x] DMRV - V-ARCHIVE - 서열표
- [x] DMRV - 전일 아카이브 - 종합 랭킹
- [x] DMRV - 전일 아카이브 - 랭킹 데이터베이스
- [x] DMRV - 전일 아카이브 - 하드 판정 서열표
- [x] PLATiNA :: LAB - 기록 등록
- [x] PLATiNA :: LAB - 성과표
- [x] PLATiNA :: LAB - 데이터베이스
- [x] 설정 - 계정 (내 계정 정보, V-ARCHIVE, Discord 연동 상태 관리 등)
- [x] 설정 - 일반 (기본적인 앱 설정)
- [x] 설정 - 저장 공간 (설정, 성과 이미지, 로그 파일 관리)
- [x] 설정 - 게임 자동 실행
- [x] 설정 - 자동 캡처 모드 (0.7 대비 간소화)
