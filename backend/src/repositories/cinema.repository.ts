import type { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../database/client.js';

export interface CinemaRecord {
  id: string;
  name: string;
  bundleSizes: number[];
}

export interface CinemaRepository {
  create(name: string, bundleSizes: readonly number[]): Promise<CinemaRecord>;
  findAll(): Promise<CinemaRecord[]>;
  findById(id: string): Promise<CinemaRecord | null>;
}

const cinemaInclude = {
  bundleSizes: { orderBy: { size: 'asc' } },
} satisfies Prisma.CinemaInclude;

type CinemaWithBundles = Prisma.CinemaGetPayload<{
  include: typeof cinemaInclude;
}>;

function toCinemaRecord(cinema: CinemaWithBundles): CinemaRecord {
  return {
    id: cinema.id,
    name: cinema.name,
    bundleSizes: cinema.bundleSizes.map(({ size }) => size),
  };
}

export class PrismaCinemaRepository implements CinemaRepository {
  async create(name: string, bundleSizes: readonly number[]): Promise<CinemaRecord> {
    return prisma.$transaction(
      async (transaction) => {
        const cinema = await transaction.cinema.create({
          data: {
            name,
            bundleSizes: {
              create: bundleSizes.map((size) => ({ size })),
            },
          },
          include: cinemaInclude,
        });
        return toCinemaRecord(cinema);
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async findAll(): Promise<CinemaRecord[]> {
    const cinemas = await prisma.cinema.findMany({
      orderBy: { name: 'asc' },
      include: cinemaInclude,
    });
    return cinemas.map(toCinemaRecord);
  }

  async findById(id: string): Promise<CinemaRecord | null> {
    const cinema = await prisma.cinema.findUnique({
      where: { id },
      include: cinemaInclude,
    });
    return cinema ? toCinemaRecord(cinema) : null;
  }
}
