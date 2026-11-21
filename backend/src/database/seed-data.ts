export const movieSeeds = [
  { title: 'Iron Man', releaseYear: 2008, runtimeMinutes: 126 },
  {
    title: 'Captain America: The First Avenger',
    releaseYear: 2011,
    runtimeMinutes: 124,
  },
  { title: 'The Avengers', releaseYear: 2012, runtimeMinutes: 143 },
  {
    title: 'Captain America: Civil War',
    releaseYear: 2016,
    runtimeMinutes: 147,
  },
  { title: 'Thor: Ragnarok', releaseYear: 2017, runtimeMinutes: 130 },
  {
    title: 'Avengers: Infinity War',
    releaseYear: 2018,
    runtimeMinutes: 149,
  },
  { title: 'Avengers: Endgame', releaseYear: 2019, runtimeMinutes: 181 },
  {
    title: 'Avengers: Doomsday',
    releaseYear: 2026,
    runtimeMinutes: 150,
  },
] as const;

export const prerequisiteSeeds = [
  ['The Avengers', 'Iron Man'],
  ['The Avengers', 'Captain America: The First Avenger'],
  ['Captain America: Civil War', 'The Avengers'],
  ['Avengers: Infinity War', 'Captain America: Civil War'],
  ['Avengers: Infinity War', 'Thor: Ragnarok'],
  ['Avengers: Endgame', 'Avengers: Infinity War'],
  ['Avengers: Doomsday', 'Avengers: Endgame'],
] as const;

export const cinemaSeeds = [
  { name: 'Cinema A', bundleSizes: [1, 3, 4] },
  { name: 'Cinema B', bundleSizes: [2, 5] },
  { name: 'Cinema C', bundleSizes: [6, 9, 20] },
  { name: 'Cinema D', bundleSizes: [4, 6] },
] as const;
