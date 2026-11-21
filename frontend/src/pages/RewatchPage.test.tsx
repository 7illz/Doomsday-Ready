import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, type Movie, type MovieSummary, type RewatchPlan } from '../api/client';
import { formatRemainingTime, RewatchPage } from './RewatchPage';

vi.mock('../api/client', async (importOriginal) => {
  const original = await importOriginal<typeof import('../api/client')>();
  return {
    ...original,
    api: {
      ...original.api,
      getMovies: vi.fn(),
      getRewatchPlan: vi.fn(),
      updateMovie: vi.fn(),
    },
  };
});

const ids = {
  ironMan: '11111111-1111-4111-8111-111111111111',
  firstAvenger: '22222222-2222-4222-8222-222222222222',
  avengers: '33333333-3333-4333-8333-333333333333',
  civilWar: '44444444-4444-4444-8444-444444444444',
  ragnarok: '55555555-5555-4555-8555-555555555555',
  infinityWar: '66666666-6666-4666-8666-666666666666',
  endgame: '77777777-7777-4777-8777-777777777777',
  doomsday: '88888888-8888-4888-8888-888888888888',
};

function summary(
  id: string,
  title: string,
  releaseYear: number,
  runtimeMinutes: number,
  watched = false,
): MovieSummary {
  return { id, title, releaseYear, runtimeMinutes, watched };
}

const ironMan = summary(ids.ironMan, 'Iron Man', 2008, 126);
const firstAvenger = summary(
  ids.firstAvenger,
  'Captain America: The First Avenger',
  2011,
  124,
);
const avengers = summary(ids.avengers, 'The Avengers', 2012, 143);
const civilWar = summary(ids.civilWar, 'Captain America: Civil War', 2016, 147);
const ragnarok = summary(ids.ragnarok, 'Thor: Ragnarok', 2017, 130);
const infinityWar = summary(ids.infinityWar, 'Avengers: Infinity War', 2018, 149);
const endgame = summary(ids.endgame, 'Avengers: Endgame', 2019, 181);
const doomsday = summary(ids.doomsday, 'Avengers: Doomsday', 2026, 150);

const availableMovies: Movie[] = [doomsday, civilWar, ragnarok].map((movie) => ({
  ...movie,
  prerequisites: [],
}));

async function selectAndGenerate(title: string) {
  fireEvent.change(await screen.findByLabelText('Target movie'), {
    target: {
      value: availableMovies.find((movie) => movie.title === title)?.id,
    },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Generate rewatch plan' }));
}

describe('RewatchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getMovies).mockResolvedValue(availableMovies);
    vi.mocked(api.updateMovie).mockResolvedValue({ ...ironMan, prerequisites: [] });
  });

  it('renders all seven Doomsday prerequisites in backend order exactly once', async () => {
    const plan: RewatchPlan = {
      target: doomsday,
      orderedPrerequisites: [
        ironMan,
        firstAvenger,
        avengers,
        civilWar,
        ragnarok,
        infinityWar,
        endgame,
      ],
      totalPrerequisiteCount: 7,
      watchedCount: 0,
      remainingRuntimeMinutes: 1000,
    };
    vi.mocked(api.getRewatchPlan).mockResolvedValue(plan);
    render(<RewatchPage />);

    await selectAndGenerate('Avengers: Doomsday');

    const timeline = await screen.findByTestId('rewatch-timeline');
    const titles = within(timeline)
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual(plan.orderedPrerequisites.map(({ title }) => title));
    expect(titles).toHaveLength(7);
    expect(titles.filter((title) => title === 'Iron Man')).toHaveLength(1);
    expect(titles).not.toContain('Avengers: Doomsday');
  });

  it('renders the Civil War order and readable remaining runtime', async () => {
    vi.mocked(api.getRewatchPlan).mockResolvedValue({
      target: civilWar,
      orderedPrerequisites: [ironMan, firstAvenger, avengers],
      totalPrerequisiteCount: 3,
      watchedCount: 0,
      remainingRuntimeMinutes: 393,
    });
    render(<RewatchPage />);

    await selectAndGenerate('Captain America: Civil War');

    const timeline = await screen.findByTestId('rewatch-timeline');
    expect(
      within(timeline)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(['Iron Man', 'Captain America: The First Avenger', 'The Avengers']);
    expect(screen.getByText(/6h 33m remaining/)).toBeInTheDocument();
    expect(screen.getByText(/393 total minutes/)).toBeInTheDocument();
  });

  it('shows an empty plan safely for Ragnarok', async () => {
    vi.mocked(api.getRewatchPlan).mockResolvedValue({
      target: ragnarok,
      orderedPrerequisites: [],
      totalPrerequisiteCount: 0,
      watchedCount: 0,
      remainingRuntimeMinutes: 0,
    });
    render(<RewatchPage />);

    await selectAndGenerate('Thor: Ragnarok');

    expect(await screen.findByText('No prerequisites needed')).toBeInTheDocument();
    expect(screen.queryByTestId('rewatch-timeline')).not.toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('patches watched status and refreshes progress and runtime from the API', async () => {
    const initialPlan: RewatchPlan = {
      target: civilWar,
      orderedPrerequisites: [ironMan, { ...firstAvenger, watched: true }, avengers],
      totalPrerequisiteCount: 3,
      watchedCount: 1,
      remainingRuntimeMinutes: 269,
    };
    const refreshedPlan: RewatchPlan = {
      ...initialPlan,
      orderedPrerequisites: [
        { ...ironMan, watched: true },
        { ...firstAvenger, watched: true },
        avengers,
      ],
      watchedCount: 2,
      remainingRuntimeMinutes: 143,
    };
    vi.mocked(api.getRewatchPlan)
      .mockResolvedValueOnce(initialPlan)
      .mockResolvedValueOnce(refreshedPlan);
    render(<RewatchPage />);

    await selectAndGenerate('Captain America: Civil War');
    expect((await screen.findAllByText('1 of 3 watched')).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Mark watched' })[0]);

    await waitFor(() => {
      expect(api.updateMovie).toHaveBeenCalledWith(ids.ironMan, { watched: true });
      expect(api.getRewatchPlan).toHaveBeenCalledTimes(2);
    });
    expect((await screen.findAllByText('2 of 3 watched')).length).toBeGreaterThan(0);
    expect(screen.getByText(/2h 23m remaining/)).toBeInTheDocument();
    expect(screen.getByText(/143 total minutes/)).toBeInTheDocument();
  });

  it('formats minute totals for the UI', () => {
    expect(formatRemainingTime(342)).toBe('5h 42m remaining');
    expect(formatRemainingTime(120)).toBe('2h remaining');
    expect(formatRemainingTime(45)).toBe('45m remaining');
    expect(formatRemainingTime(0)).toBe('0m remaining');
  });
});
