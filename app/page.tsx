import BoxOffice from "./box-office";
import { lastAvailableDate } from "@/lib/boxoffice";
export const dynamic = "force-dynamic";
export default function Home() { return <BoxOffice initialDate={lastAvailableDate()} />; }
