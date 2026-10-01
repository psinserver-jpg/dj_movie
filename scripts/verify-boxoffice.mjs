import assert from 'node:assert/strict';
import { lastAvailableDate, validDate, shiftDate } from '../lib/boxoffice.ts';
const origin = 'http://127.0.0.1:5173';
assert.equal(lastAvailableDate(new Date('2026-09-30T15:01:00Z')), '2026-09-30');
assert.equal(lastAvailableDate(new Date('2026-09-30T14:59:00Z')), '2026-09-29');
assert.equal(validDate('2026-02-30'), false);
assert.equal(validDate('2026-10-01', '2026-09-30'), false);
assert.equal(shiftDate('2024-03-01', -1), '2024-02-29');
for (const path of ['/api/boxoffice?date=2026-02-30', '/api/boxoffice?date=2099-01-01', '/api/boxoffice', '/api/movies/invalid']) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 400, path);
  assert.equal(typeof (await response.json()).error, 'string');
}
for (const date of ['2026-09-30', '2026-09-29']) {
  const response = await fetch(`${origin}/api/boxoffice?date=${date}`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.date, date);
  assert.ok(data.movies.length > 0 && data.movies.length <= 10);
  assert.ok(data.movies.every(movie => /^\d{8}$/.test(movie.movieCd)));
  assert.ok(!JSON.stringify(data).includes('key='));
  console.log(`${date}: ${data.movies.length} movies verified`);
}
const response = await fetch(`${origin}/api/movies/20256161`);
assert.equal(response.status, 200);
const movie = await response.json();
assert.equal(movie.movieCd, '20256161');
assert.ok(movie.movieNm);
assert.ok(Array.isArray(movie.directors));
console.log('Movie detail, invalid input and Korean date boundaries verified.');
