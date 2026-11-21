import assert from 'node:assert/strict';
import { prisma } from './client.js';
import { cinemaSeeds, movieSeeds, prerequisiteSeeds } from './seed-data.js';

async function verifySeed() {
  const movies = await prisma.movie.findMany({
    where: { title: { in: movieSeeds.map(({ title }) => title) } },
    orderBy: { title: 'asc' },
    include: {
      prerequisites: {
        include: { prerequisite: true },
        orderBy: { prerequisite: { title: 'asc' } },
      },
    },
  });

  const cinemas = await prisma.cinema.findMany({
    where: { name: { in: cinemaSeeds.map(({ name }) => name) } },
    orderBy: { name: 'asc' },
    include: {
      bundleSizes: { orderBy: { size: 'asc' } },
    },
  });

  const relationshipCount = movies.reduce(
    (count, movie) => count + movie.prerequisites.length,
    0,
  );

  assert.equal(movies.length, movieSeeds.length, 'Seed movie count is incorrect');
  assert.equal(
    relationshipCount,
    prerequisiteSeeds.length,
    'Seed prerequisite count is incorrect',
  );
  assert.equal(cinemas.length, cinemaSeeds.length, 'Seed cinema count is incorrect');

  for (const expectedMovie of movieSeeds) {
    const actualMovie = movies.find(({ title }) => title === expectedMovie.title);
    assert.ok(actualMovie, `Missing seed movie: ${expectedMovie.title}`);
    assert.equal(actualMovie.releaseYear, expectedMovie.releaseYear);
    assert.equal(actualMovie.runtimeMinutes, expectedMovie.runtimeMinutes);

    const expectedPrerequisites = prerequisiteSeeds
      .filter(([movieTitle]) => movieTitle === expectedMovie.title)
      .map(([, prerequisiteTitle]) => prerequisiteTitle)
      .sort();
    const actualPrerequisites = actualMovie.prerequisites
      .map(({ prerequisite }) => prerequisite.title)
      .sort();
    assert.deepEqual(actualPrerequisites, expectedPrerequisites);
  }

  for (const expectedCinema of cinemaSeeds) {
    const actualCinema = cinemas.find(({ name }) => name === expectedCinema.name);
    assert.ok(actualCinema, `Missing seed cinema: ${expectedCinema.name}`);
    assert.deepEqual(
      actualCinema.bundleSizes.map(({ size }) => size),
      [...expectedCinema.bundleSizes].sort((left, right) => left - right),
    );
  }

  console.log(
    JSON.stringify(
      {
        movieCount: movies.length,
        relationshipCount,
        movies: movies.map((movie) => ({
          title: movie.title,
          prerequisites: movie.prerequisites.map(
            ({ prerequisite }) => prerequisite.title,
          ),
        })),
        cinemaCount: cinemas.length,
        cinemas: cinemas.map((cinema) => ({
          name: cinema.name,
          bundleSizes: cinema.bundleSizes.map(({ size }) => size),
        })),
      },
      null,
      2,
    ),
  );
}

verifySeed()
  .catch((error: unknown) => {
    console.error('Seed verification failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
