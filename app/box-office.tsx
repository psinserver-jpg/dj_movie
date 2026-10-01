"use client";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Film, Users, Ticket, TrendingUp, RotateCw, X } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { lastAvailableDate, shiftDate, validDate, type Movie, type MovieInfo } from "@/lib/boxoffice";

const number = (v: string | number) => new Intl.NumberFormat("ko-KR").format(Number(v) || 0);
const dateLabel = (d: string) => new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
const releaseLabel = (v: string) => v?.trim() ? v.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1.$2.$3").replaceAll("-", ".") : "미정";

function Change({ movie }: { movie: Movie }) {
  const n = Number(movie.rankInten);
  if (movie.rankOldAndNew === "NEW") return <span className="rank-new">NEW</span>;
  return <span className={`rank-change ${n > 0 ? "up" : n < 0 ? "down" : "same"}`} aria-label={n ? `전일 대비 ${Math.abs(n)}위 ${n > 0 ? "상승" : "하락"}` : "순위 변동 없음"}>{n > 0 ? "▲" : n < 0 ? "▼" : "—"}{n !== 0 && ` ${Math.abs(n)}`}</span>;
}
export default function BoxOffice({ initialDate }: { initialDate: string }) {
  const [date, setDate] = useState(initialDate);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<Movie | null>(null);
  const [info, setInfo] = useState<MovieInfo | null>(null);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRetry, setDetailRetry] = useState(0);
  const maxDate = lastAvailableDate();
  const requestVersion = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const version = ++requestVersion.current;
    setLoading(true); setError(""); setMovies([]); setSelected(null);
    fetch(`/api/boxoffice?date=${encodeURIComponent(date)}`, { signal: controller.signal })
      .then(async response => { const data = await response.json() as { movies: Movie[]; error?: string }; if (!response.ok) throw new Error(data.error); return data; })
      .then(data => { if (version === requestVersion.current) setMovies(data.movies); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message || "순위를 불러오지 못했습니다."); })
      .finally(() => { if (!controller.signal.aborted && version === requestVersion.current) setLoading(false); });
    return () => controller.abort();
  }, [date, retry]);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    setInfo(null); setDetailError(""); setDetailLoading(true);
    fetch(`/api/movies/${selected.movieCd}`, { signal: controller.signal })
      .then(async response => { const data = await response.json() as MovieInfo & { error?: string }; if (!response.ok) throw new Error(data.error); return data; })
      .then(setInfo)
      .catch(e => { if (!controller.signal.aborted) setDetailError(e.message || "상세정보를 불러오지 못했습니다."); })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [selected, detailRetry]);

  function chooseDate(value: string) { if (validDate(value, maxDate)) setDate(value); }
  const audience = movies.reduce((sum, m) => sum + Number(m.audiCnt), 0);
  const sales = movies.reduce((sum, m) => sum + Number(m.salesAmt), 0);
  const first = movies[0];
  const complete = !loading && !error && movies.length > 0;

  return <>
    <header className="topbar"><div className="nav-inner"><a className="brand" href="/" aria-label="Box Office 홈"><span className="brand-icon"><Film size={19} /></span>Box Office<span className="brand-dot">.</span></a><span className="nav-label">한국 영화 박스오피스</span></div></header>
    <main className="workspace">
      <section className="page-heading"><div><div className="eyebrow">DAILY CHART</div><h1>일일 박스오피스</h1><p>오늘의 영화, 숫자로 만나다.</p></div><div className="date-block"><label htmlFor="chart-date">조회 날짜</label><div className="date-control"><button className="icon-button" aria-label="이전 날짜" disabled={date <= "2004-01-01"} onClick={() => chooseDate(shiftDate(date, -1))}><ChevronLeft size={18} /></button><CalendarDays size={18} className="calendar-icon" /><input id="chart-date" type="date" min="2004-01-01" max={maxDate} value={date} onChange={e => chooseDate(e.target.value)} /><button className="icon-button" aria-label="다음 날짜" disabled={date >= maxDate} onClick={() => chooseDate(shiftDate(date, 1))}><ChevronRight size={18} /></button></div><button className="yesterday-button" disabled={date === maxDate} onClick={() => chooseDate(maxDate)}>어제 기준으로 보기</button></div></section>
      <section className="summary-grid" aria-label="상위 10개 영화 요약">
        <article className="summary-card"><div className="summary-label"><Users size={17} />총 관객 수<span>TOP 10</span></div><div className="summary-value">{loading ? <Skeleton className="stat-skeleton" /> : complete ? <>{number(audience)}<small>명</small></> : "—"}</div><p>선택한 날짜의 상위 10개 영화 합계</p></article>
        <article className="summary-card"><div className="summary-label"><Ticket size={17} />총 매출액<span>TOP 10</span></div><div className="summary-value">{loading ? <Skeleton className="stat-skeleton" /> : complete ? <>{(sales / 100000000).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}<small>억 원</small></> : "—"}</div><p>선택한 날짜의 상위 10개 영화 합계</p></article>
        <article className="summary-card leader-card"><div className="summary-label"><TrendingUp size={17} />박스오피스 1위<span className="leader-pill">NO. 1</span></div><div className="leader-name">{loading ? <Skeleton className="stat-skeleton" /> : first?.movieNm || "—"}</div><p>{complete ? <>{number(first.audiCnt)}명 관람<span className="inline-dot">·</span>매출 점유율 {first.salesShare}%</> : "선택한 날짜의 관객 수 기준"}</p></article>
      </section>
      <section className="chart-panel" aria-busy={loading}>
        <div className="chart-header"><div><h2>영화 순위 <span>TOP 10</span></h2><p>{dateLabel(date)}<span className="inline-dot">·</span>{date.slice(0, 4)}</p></div><span className="chart-note">관객 수 기준</span></div>
        <div role="status" className="sr-only">{loading ? `${date} 박스오피스를 불러오는 중` : error || `${date} 영화 ${movies.length}편 조회 완료`}</div>
        {error ? <Empty className="state-message" role="alert"><EmptyHeader><EmptyTitle>잠시 연결이 어려워요</EmptyTitle><EmptyDescription>{error}</EmptyDescription></EmptyHeader><button className="primary-button" onClick={() => setRetry(n => n + 1)}><RotateCw size={16} />다시 시도</button></Empty> : !loading && movies.length === 0 ? <Empty className="state-message"><CalendarDays size={30} /><EmptyHeader><EmptyTitle>아직 집계된 영화가 없어요</EmptyTitle><EmptyDescription>다른 날짜를 선택해 박스오피스를 확인해 보세요.</EmptyDescription></EmptyHeader></Empty> : <Table className="movie-table"><TableHeader><TableRow><TableHead className="rank-col">순위</TableHead><TableHead>영화</TableHead><TableHead className="numeric">일일 관객 수</TableHead><TableHead className="numeric cumulative-col">누적 관객 수</TableHead><TableHead className="numeric sales-col">일일 매출액</TableHead><TableHead className="numeric share-col">매출 점유율</TableHead></TableRow></TableHeader><TableBody>
          {loading ? Array.from({ length: 7 }, (_, i) => <TableRow key={i}><TableCell><Skeleton className="rank-skeleton" /></TableCell><TableCell><Skeleton className="title-skeleton" /><Skeleton className="meta-skeleton" /></TableCell><TableCell><Skeleton className="number-skeleton" /></TableCell><TableCell className="cumulative-col"><Skeleton className="number-skeleton" /></TableCell><TableCell className="sales-col"><Skeleton className="number-skeleton" /></TableCell><TableCell className="share-col"><Skeleton className="number-skeleton" /></TableCell></TableRow>) : movies.map(movie => <TableRow key={movie.movieCd} className={movie.rank === "1" ? "first-row" : ""}><TableCell><div className="ranking"><span className={`rank-number rank-${movie.rank}`}>{movie.rank.padStart(2, "0")}</span><Change movie={movie} /></div></TableCell><TableCell><button className="movie-title" onClick={() => setSelected(movie)} aria-label={`${movie.movieNm} 상세정보 보기`}>{movie.movieNm}<ChevronRight size={15} /></button><span className="movie-meta">{releaseLabel(movie.openDt)} 개봉</span></TableCell><TableCell className="numeric audience-cell"><strong>{number(movie.audiCnt)}</strong><span className={`audience-change ${Number(movie.audiInten) >= 0 ? "up" : "down"}`}>{Number(movie.audiInten) > 0 ? "+" : ""}{number(movie.audiInten)}명</span></TableCell><TableCell className="numeric cumulative-col">{number(movie.audiAcc)}<span className="unit">명</span></TableCell><TableCell className="numeric sales-col">{number(movie.salesAmt)}<span className="unit">원</span></TableCell><TableCell className="numeric share-col"><div className="share-value">{movie.salesShare}%</div><div className="share-track"><span style={{ width: `${Math.max(0, Math.min(100, Number(movie.salesShare)))}%` }} /></div></TableCell></TableRow>)}
        </TableBody></Table>}
        <div className="chart-footer"><span>영화 제목을 선택하면 상세정보를 볼 수 있습니다.</span><span>순위 변동 · 전일 대비</span></div>
      </section>
      <footer className="page-footer"><span>영화의 흐름을 한눈에.</span><a href="https://www.kobis.or.kr/kobisopenapi/homepg/apiservice/searchServiceInfo.do" target="_blank" rel="noreferrer">데이터 제공 · 영화진흥위원회 KOBIS</a><span>집계 결과는 갱신될 수 있습니다.</span></footer>
    </main>
    <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><SheetContent className="movie-sheet" showCloseButton={false}><SheetClose className="sheet-close icon-button" aria-label="상세정보 닫기"><X size={20} /></SheetClose><SheetHeader className="detail-header"><div className="eyebrow">MOVIE DETAILS</div><SheetTitle>{selected?.movieNm}</SheetTitle><SheetDescription>{info?.movieNmEn || "영화 상세정보"}</SheetDescription></SheetHeader>
      {detailLoading ? <div className="detail-loading" role="status" aria-label="상세정보 불러오는 중"><Skeleton className="detail-skeleton" /><Skeleton className="detail-skeleton" /><Skeleton className="detail-skeleton" /></div> : detailError ? <Empty role="alert"><EmptyHeader><EmptyTitle>상세정보를 불러오지 못했어요</EmptyTitle><EmptyDescription>{detailError}</EmptyDescription></EmptyHeader><button className="primary-button" onClick={() => setDetailRetry(n => n + 1)}>다시 시도</button></Empty> : info && <div className="detail-body"><div className="detail-tags">{[...(info.genres || []).map(v => v.genreNm), ...(info.audits || []).map(v => v.watchGradeNm)].map((tag, i) => <span key={`${tag}-${i}`}>{tag}</span>)}</div><dl className="detail-grid"><div><dt>개봉일</dt><dd>{releaseLabel(info.openDt)}</dd></div><div><dt>상영 시간</dt><dd>{info.showTm ? `${info.showTm}분` : "정보 없음"}</dd></div><div><dt>제작 국가</dt><dd>{info.nations?.map(v => v.nationNm).join(", ") || "정보 없음"}</dd></div><div><dt>감독</dt><dd>{info.directors?.map(v => v.peopleNm).join(", ") || "정보 없음"}</dd></div><div><dt>제작 연도</dt><dd>{info.prdtYear || "정보 없음"}</dd></div><div><dt>영화 유형</dt><dd>{info.typeNm || "정보 없음"}</dd></div></dl><section className="detail-section"><h3>출연</h3>{info.actors?.length ? <div className="cast-list">{info.actors.map((actor, i) => <div key={i}><strong>{actor.peopleNm}</strong>{actor.cast && <span>{actor.cast}</span>}</div>)}</div> : <p>등록된 출연 정보가 없습니다.</p>}</section><section className="detail-section"><h3>제작·배급</h3>{info.companys?.length ? info.companys.map((company, i) => <div className="company" key={i}><span>{company.companyNm}</span><small>{company.companyPartNm}</small></div>) : <p>등록된 제작·배급 정보가 없습니다.</p>}</section><div className="detail-source">영화진흥위원회 KOBIS 제공</div></div>}
    </SheetContent></Sheet>
  </>;
}
