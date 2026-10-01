export type Movie = {
  rank: string; rankInten: string; rankOldAndNew: string;
  movieCd: string; movieNm: string; openDt: string;
  audiCnt: string; audiAcc: string; audiInten: string;
  salesAmt: string; salesShare: string; scrnCnt: string;
};
export type MovieInfo = {
  movieCd: string; movieNm: string; movieNmEn: string; prdtYear: string;
  showTm: string; openDt: string; typeNm: string; prdtStatNm: string;
  nations: { nationNm: string }[]; genres: { genreNm: string }[];
  directors: { peopleNm: string }[];
  actors: { peopleNm: string; cast: string }[];
  audits: { watchGradeNm: string }[];
  companys: { companyNm: string; companyPartNm: string }[];
};
export function koreanDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function lastAvailableDate(now = new Date()) { return shiftDate(koreanDate(now), -1); }
export function validDate(value: string, max = lastAvailableDate()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === value && value >= "2004-01-01" && value <= max;
}
