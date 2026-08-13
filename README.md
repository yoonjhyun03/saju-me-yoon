# 윤정현의 사주

생년월일·출생 시간 등 프로필을 저장하고, Gemini로 사주를 해석한 뒤 결과를 다시 볼 수 있는 웹 앱입니다.

**배포:** [https://saju-me-yoon.vercel.app](https://saju-me-yoon.vercel.app)

## 주요 기능

- Google 로그인 (Supabase Auth)
- 첫 로그인 시 필수 프로필 입력 모달
- 프로필(`users`)과 해석 결과(`saju_readings`) 분리 저장
- 사주 해석 결과 CRUD (생성·조회·수정·삭제)
- 사이드바에서 저장된 결과 목록 확인

## 기술 스택

- React + Vite
- Supabase (Auth, Postgres, RLS)
- Google Gemini API
- Vercel 배포

## 시작하기

```bash
npm install
cp .env.example .env
npm run dev
```

`.env`에 아래 값을 채웁니다.

```env
VITE_GEMINI_API_KEY=
VITE_SUPABASE_URL=https://atwsrxwryiktmcosslgi.supabase.co
VITE_SUPABASE_ANON_KEY=
```

## 프로젝트 구조

```
src/
  App.jsx                 # 화면 조립
  hooks/useSajuApp.js     # 상태·비즈니스 로직
  components/
    auth/                 # 로그인
    layout/               # 사이드바, 메인 패널
    profile/              # 프로필 모달·요약
    readings/             # 해석 결과
    common/
  lib/                    # supabase, gemini
  utils/                  # 프로필 유틸
  styles/
```

## 데이터베이스

| 테이블 | 설명 |
|--------|------|
| `users` | 이름, 생년월일, 시간, 성별, 양력/음력 |
| `saju_readings` | 해석 결과 (`user_id`로 `users`와 연결) |

로그인한 사용자는 RLS로 **본인 데이터만** 읽고 쓸 수 있습니다.

## 스크립트

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 미리보기
npm run lint     # oxlint
```
