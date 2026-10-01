import { unstable_cache } from "next/cache";
import { validDate, type Movie } from "./boxoffice";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
type KobisPayload = { faultInfo?: { errorCode: string; message: string }; boxOfficeResult?: unknown; movieInfoResult?: unknown };
async function fetchKobis(service: "boxoffice" | "movie", method: string, params: Record<string, string>): Promise<KobisPayload> {
  const key = process.env.KOBIS_API_KEY;
  if (!key?.trim()) throw new ApiError(503, "현재 조회 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.");
  const url = new URL(`https://www.kobis.or.kr/kobisopenapi/webservice/rest/${service}/${method}.json`);
  url.search = new URLSearchParams({ key, ...params }).toString();
  let response: Response;
  try { response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12000), headers: { Accept: "application/json" } }); }
  catch { throw new ApiError(504, "영화 정보를 가져오는 데 시간이 걸리고 있습니다. 다시 시도해 주세요."); }
  if (!response.ok) throw new ApiError(502, "영화 정보 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
  let data: KobisPayload;
  try { data = await response.json() as KobisPayload; }
  catch { throw new ApiError(502, "영화 정보를 읽을 수 없습니다. 다시 시도해 주세요."); }
  if (data.faultInfo) throw new ApiError(502, "영화 정보 서비스가 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  return data;
}
// Cache only the result and public query parameters; the secret remains inside fetchKobis.
const cachedBoxOffice = unstable_cache(
  (method: string, params: Record<string, string>) => fetchKobis("boxoffice", method, params),
  ["kobis-daily-v2"], { revalidate: 600 },
);
const cachedMovie = unstable_cache(
  (method: string, params: Record<string, string>) => fetchKobis("movie", method, params),
  ["kobis-movie-v2"], { revalidate: 3600 },
);
const pendingRequests = new Map<string, Promise<KobisPayload>>();
export async function requestKobis(service: "boxoffice" | "movie", method: string, params: Record<string, string>) {
  const id = `${service}/${method}?${new URLSearchParams(params)}`;
  const pending = pendingRequests.get(id);
  if (pending) return pending;
  const request = (service === "movie" ? cachedMovie : cachedBoxOffice)(method, params);
  pendingRequests.set(id, request);
  try { return await request; } finally { pendingRequests.delete(id); }
}
export async function getDailyBoxOffice(date: string): Promise<Movie[]> {
  if (!validDate(date)) throw new ApiError(400, "2004년 1월 1일부터 어제까지의 올바른 날짜를 선택해 주세요.");
  const data = await requestKobis("boxoffice", "searchDailyBoxOfficeList", { targetDt: date.replaceAll("-", "") });
  const result = data.boxOfficeResult as { dailyBoxOfficeList?: Movie[] } | undefined;
  if (!Array.isArray(result?.dailyBoxOfficeList)) throw new ApiError(502, "박스오피스 정보를 읽을 수 없습니다.");
  return result.dailyBoxOfficeList.map(m => ({ rank: m.rank, rankInten: m.rankInten, rankOldAndNew: m.rankOldAndNew, movieCd: m.movieCd, movieNm: m.movieNm, openDt: m.openDt, audiCnt: m.audiCnt, audiAcc: m.audiAcc, audiInten: m.audiInten, salesAmt: m.salesAmt, salesShare: m.salesShare, scrnCnt: m.scrnCnt }));
}
export function errorResponse(error: unknown) {
  return Response.json({ error: error instanceof ApiError ? error.message : "정보를 불러오지 못했습니다. 다시 시도해 주세요." }, { status: error instanceof ApiError ? error.status : 500, headers: { "Cache-Control": "no-store" } });
}
