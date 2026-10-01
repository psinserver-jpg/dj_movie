import BoxOffice from "./box-office";
import { lastAvailableDate } from "@/lib/boxoffice";
import { getDailyBoxOffice } from "@/lib/kobis";
export const dynamic = "force-dynamic";
export default async function Home() {
  const date = lastAvailableDate();
  try {
    const movies = await getDailyBoxOffice(date);
    return <BoxOffice initialDate={date} initialMovies={movies} />;
  } catch {
    return <BoxOffice initialDate={date} />;
  }
}
