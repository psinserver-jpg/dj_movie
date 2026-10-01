import { ApiError, errorResponse, requestKobis } from "@/lib/kobis";
import type { MovieInfo } from "@/lib/boxoffice";
export async function GET(_request: Request, context: { params: Promise<{ movieCd: string }> }) {
  try {
    const { movieCd } = await context.params;
    if (!/^\d{8}$/.test(movieCd)) throw new ApiError(400, "올바른 영화 코드를 지정해 주세요.");
    const data = await requestKobis("movie", "searchMovieInfo", { movieCd });
    const info = (data.movieInfoResult as { movieInfo?: MovieInfo } | undefined)?.movieInfo;
    if (!info?.movieCd) throw new ApiError(404, "영화 상세정보를 찾을 수 없습니다.");
    const { movieNm, movieNmEn, prdtYear, showTm, openDt, typeNm, prdtStatNm, nations, genres, directors, actors, audits, companys } = info;
    return Response.json({ movieCd, movieNm, movieNmEn, prdtYear, showTm, openDt, typeNm, prdtStatNm, nations, genres, directors, actors, audits, companys }, { headers: { "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=3600" } });
  } catch (error) { return errorResponse(error); }
}
