import { errorResponse, getDailyBoxOffice } from "@/lib/kobis";
export async function GET(request: Request) {
  try {
    const date = new URL(request.url).searchParams.get("date") ?? "";
    const movies = await getDailyBoxOffice(date);
    return Response.json({ date, movies }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } });
  } catch (error) { return errorResponse(error); }
}
