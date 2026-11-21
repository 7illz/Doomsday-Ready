import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, type Movie } from '../api/client';
import { MoviesPage } from './MoviesPage';

vi.mock('../api/client', async (importOriginal) => {
  const original = await importOriginal<typeof import('../api/client')>();
  return {
    ...original,
    api: {
      ...original.api,
      getMovies: vi.fn(),
      createMovie: vi.fn(),
      updateMovie: vi.fn(),
    },
  };
});

const IRON_MAN_ID = '11111111-1111-4111-8111-111111111111';
const AVENGERS_ID = '22222222-2222-4222-8222-222222222222';

const movies: Movie[] = [
  {
    id: IRON_MAN_ID,
    title: 'Iron Man',
    releaseYear: 2008,
    runtimeMinutes: 126,
    watched: false,
    prerequisites: [],
  },
  {
    id: AVENGERS_ID,
    title: 'The Avengers',
    releaseYear: 2012,
    runtimeMinutes: 143,
    watched: true,
    prerequisites: [
      {
        id: IRON_MAN_ID,
        title: 'Iron Man',
        releaseYear: 2008,
        runtimeMinutes: 126,
        watched: false,
      },
    ],
  },
];

describe('MoviesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getMovies).mockResolvedValue(movies);
    vi.mocked(api.createMovie).mockResolvedValue(movies[0]);
    vi.mocked(api.updateMovie).mockResolvedValue(movies[0]);
  });

  it('loads and displays movie metadata and prerequisites', async () => {
    render(<MoviesPage />);

    expect(await screen.findByRole('heading', { name: 'The Avengers' })).toBeInTheDocument();
    expect(screen.getByText('143 min')).toBeInTheDocument();
    expect(screen.getAllByText('Watched').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Iron Man').length).toBeGreaterThan(1);
  });

  it('creates a movie with prerequisites and refreshes the library', async () => {
    render(<MoviesPage />);
    await screen.findByRole('heading', { name: 'Iron Man' });

    fireEvent.click(screen.getByRole('button', { name: 'Add movie' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Movie title'), {
      target: { value: 'Avengers: Endgame' },
    });
    fireEvent.change(within(dialog).getByLabelText('Release year'), {
      target: { value: '2019' },
    });
    fireEvent.change(within(dialog).getByLabelText('Runtime (minutes)'), {
      target: { value: '181' },
    });
    fireEvent.click(within(dialog).getByRole('checkbox', { name: /The Avengers/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add movie' }));

    await waitFor(() => {
      expect(api.createMovie).toHaveBeenCalledWith({
        title: 'Avengers: Endgame',
        releaseYear: 2019,
        runtimeMinutes: 181,
        watched: false,
        prerequisiteIds: [AVENGERS_ID],
      });
    });
    expect(api.getMovies).toHaveBeenCalledTimes(2);
  });

  it('keeps form input and explains a circular-dependency error', async () => {
    vi.mocked(api.updateMovie).mockRejectedValue(
      new ApiError('The proposed prerequisites create a circular dependency.', 409, 'CIRCULAR_DEPENDENCY'),
    );
    render(<MoviesPage />);
    await screen.findByRole('heading', { name: 'Iron Man' });

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    const dialog = await screen.findByRole('dialog');
    const titleInput = within(dialog).getByLabelText('Movie title');
    fireEvent.change(titleInput, { target: { value: 'Iron Man Edited' } });
    fireEvent.click(within(dialog).getByRole('checkbox', { name: /The Avengers/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(
      await within(dialog).findByText(/would create a circular dependency/i),
    ).toBeInTheDocument();
    expect(titleInput).toHaveValue('Iron Man Edited');
    expect(dialog).toBeInTheDocument();
  });

  it('excludes the edited movie from its own prerequisite choices', async () => {
    render(<MoviesPage />);
    await screen.findByRole('heading', { name: 'Iron Man' });

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).queryByRole('checkbox', { name: /^Iron Man/ })).not.toBeInTheDocument();
    expect(within(dialog).getByRole('checkbox', { name: /The Avengers/ })).toBeInTheDocument();
  });

  it('updates watched status and refreshes persisted data', async () => {
    render(<MoviesPage />);
    await screen.findByRole('heading', { name: 'Iron Man' });

    fireEvent.click(screen.getByRole('button', { name: 'Mark watched' }));

    await waitFor(() => {
      expect(api.updateMovie).toHaveBeenCalledWith(IRON_MAN_ID, { watched: true });
    });
    expect(api.getMovies).toHaveBeenCalledTimes(2);
  });
});
