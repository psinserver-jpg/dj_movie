# 일일 박스오피스

KOBIS API로 날짜별 박스오피스와 영화 상세정보를 조회합니다. React/TypeScript와 Vinext(Next.js 호환), Cloudflare Workers를 사용합니다.

## 실행

Node.js 22.13 이상이 필요합니다.

```powershell
npm ci
Copy-Item .env.example .dev.vars
# .dev.vars의 KOBIS_API_KEY에 실제 키를 설정
npm run dev
```

http://localhost:5173 에서 확인합니다. 현재 로컬 환경 파일에는 제공된 키가 설정되어 있습니다. 환경 파일은 Git 및 배포에서 제외됩니다. 운영 환경에는 `KOBIS_API_KEY`를 서버 secret으로 설정하세요.

키는 서버의 `cloudflare:workers` 환경에서만 읽습니다. `VITE_`, `NEXT_PUBLIC_` 접두사를 사용하지 않습니다. 화면에 키 입력창이 없으며 브라우저는 `/api/boxoffice?date=YYYY-MM-DD` 및 `/api/movies/:movieCd`만 호출합니다. KOBIS 요청 URL과 오류 전문은 반환하지 않습니다.

## 기능

- 날짜 변경 즉시 조회, 이전·다음 날짜 및 어제 바로가기
- 한국 시간 기준 어제가 기본값. 서버에서도 오늘·미래·잘못된 날짜 거부
- 상위 10개 영화의 관객·매출 합계, 순위 변동, 누적 관객과 점유율
- 영화 제목 선택 시 감독·출연·장르·등급·제작 및 배급 상세정보
- 로딩·빈 결과·오류·재시도 상태, 모바일과 키보드 지원
- KOBIS 호출 12초 제한, 박스오피스 10분·상세정보 1시간 인스턴스 내 캐시

```powershell
npm run build
npm run start
```

빌드 결과는 Cloudflare Worker 전용입니다. `.openai/hosting.json`에 인증키를 저장하지 마세요. `.env`, `.dev.vars`를 공유·배포 아카이브에 포함하지 마세요.

API 문서: https://www.kobis.or.kr/kobisopenapi/homepg/apiservice/searchServiceInfo.do
