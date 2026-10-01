export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
type KobisPayload = { faultInfo?: { errorCode: string; message: string }; boxOfficeResult?: unknown; movieInfoResult?: unknown };
const cache = new Map<string, { expires: number; value: KobisPayload }>();
export async function requestKobis(service: "boxoffice" | "movie", method: string, params: Record<string, string>): Promise<KobisPayload> {
  const key = process.env.KOBIS_API_KEY;
  if (!key?.trim()) throw new ApiError(503, "현재 조회 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.");
  const cacheId = `${service}/${method}?${new URLSearchParams(params)}`;
  const hit = cache.get(cacheId);
  if (hit && hit.expires > Date.now()) return hit.value;
  const url = new URL(`https://www.kobis.or.kr/kobisopenapi/webservice/rest/${service}/${method}.json`);
  url.search = new URLSearchParams({ key, ...params }).toString();
  let response: Response;
  try { response = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { Accept: "application/json" } }); }
  catch { throw new ApiError(504, "영화 정보를 가져오는 데 시간이 걸리고 있습니다. 다시 시도해 주세요."); }
  if (!response.ok) throw new ApiError(502, "영화 정보 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
  let data: KobisPayload;
  try { data = await response.json() as KobisPayload; }
  catch { throw new ApiError(502, "영화 정보를 읽을 수 없습니다. 다시 시도해 주세요."); }
  if (data.faultInfo) throw new ApiError(502, "영화 정보 서비스가 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  if (cache.size >= 120) cache.delete(cache.keys().next().value!);
  cache.set(cacheId, { expires: Date.now() + (service === "movie" ? 3600000 : 600000), value: data });
  return data;
}
export function errorResponse(error: unknown) {
  return Response.json({ error: error instanceof ApiError ? error.message : "정보를 불러오지 못했습니다. 다시 시도해 주세요." }, { status: error instanceof ApiError ? error.status : 500, headers: { "Cache-Control": "no-store" } });
}
