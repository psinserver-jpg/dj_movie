import { ApiError, errorResponse, requestKobis } from "@/lib/kobis";
import { validDate, type Movie } from "@/lib/boxoffice";
export async function GET(request: Request) {
  try {
    const date = new URL(request.url).searchParams.get("date") ?? "";
    if (!validDate(date)) throw new ApiError(400, "2004년 1월 1일부터 어제까지의 올바른 날짜를 선택해 주세요.");
    const data = await requestKobis("boxoffice", "searchDailyBoxOfficeList", { targetDt: date.replaceAll("-", "") });
    const result = data.boxOfficeResult as { dailyBoxOfficeList?: Movie[] } | undefined;
    if (!Array.isArray(result?.dailyBoxOfficeList)) throw new ApiError(502, "박스오피스 정보를 읽을 수 없습니다.");
    const movies = result.dailyBoxOfficeList.map(m => ({ rank: m.rank, rankInten: m.rankInten, rankOldAndNew: m.rankOldAndNew, movieCd: m.movieCd, movieNm: m.movieNm, openDt: m.openDt, audiCnt: m.audiCnt, audiAcc: m.audiAcc, audiInten: m.audiInten, salesAmt: m.salesAmt, salesShare: m.salesShare, scrnCnt: m.scrnCnt }));
    return Response.json({ date, movies }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch (error) { return errorResponse(error); }
}
