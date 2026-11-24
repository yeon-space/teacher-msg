# 선생님 말투 변환기 (Vercel + Gemini)

## 폴더 구성
- `public/index.html` — 화면
- `api/convert.js` — Gemini를 부르는 서버 함수 (API 키는 여기서만 쓰여요)

## Vercel 환경 변수
| 이름 | 필수 | 설명 |
|---|---|---|
| `GEMINI_API_KEY` | 필수 | 구글 AI 스튜디오에서 받은 API 키 |
| `APP_PASSWORD` | 선택 | 넣으면 이 비밀번호를 아는 사람만 사용 가능 (처음 한 번 입력하면 그 기기에 기억됨) |
| `GEMINI_MODEL` | 선택 | 기본값 `gemini-3.8-flash` |

## 주의
- 구글 AI 스튜디오 무료 등급은 입력 내용이 구글 제품 개선에 쓰여요. 학생 정보가 들어가므로 결제를 연결한 유료 등급을 권장해요.
- API 키를 `index.html`에 직접 넣지 마세요. 누구나 볼 수 있어요.
