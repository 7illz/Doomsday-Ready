import { prisma } from './client.js';
import { cinemaSeeds, movieSeeds, prerequisiteSeeds } from './seed-data.js';

async function seed() {
  await prisma.$transaction(async (transaction) => {
    const movieIds = new Map<string, string>();

    for (const movie of movieSeeds) {
      const savedMovie = await transaction.movie.upsert({
        where: { title: movie.title },
        update: {
          releaseYear: movie.releaseYear,
          runtimeMinutes: movie.runtimeMinutes,
        },
        create: movie,
      });

      movieIds.set(savedMovie.title, savedMovie.id);
    }

    const seededMovieIds = [...movieIds.values()];
    await transaction.moviePrerequisite.deleteMany({
      where: { movieId: { in: seededMovieIds } },
    });

    await transaction.moviePrerequisite.createMany({
      data: prerequisiteSeeds.map(([movieTitle, prerequisiteTitle]) => ({
        movieId: movieIds.get(movieTitle)!,
        prerequisiteId: movieIds.get(prerequisiteTitle)!,
      })),
      skipDuplicates: true,
    });

    for (const cinema of cinemaSeeds) {
      const savedCinema = await transaction.cinema.upsert({
        where: { name: cinema.name },
        update: {},
        create: { name: cinema.name },
      });

      await transaction.cinemaBundle.deleteMany({
        where: { cinemaId: savedCinema.id },
      });
      await transaction.cinemaBundle.createMany({
        data: cinema.bundleSizes.map((size) => ({
          cinemaId: savedCinema.id,
          size,
        })),
        skipDuplicates: true,
      });
    }
  });
}

seed()
  .then(() => {
    console.log('Database seed completed.');
  })
  .catch((error: unknown) => {
    console.error('Database seed failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
