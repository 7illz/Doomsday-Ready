import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, api, getErrorMessage, type Movie } from '../api/client';
import { MovieCard } from '../components/MovieCard';
import { MovieForm, type MovieFormValues } from '../components/movies/MovieForm';
import { PageHeading } from '../components/PageHeading';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { EmptyState, ErrorPanel } from '../components/ui/FeedbackPanels';
import { Input } from '../components/ui/Input';
import { CardSkeleton } from '../components/ui/Loading';
import { Select } from '../components/ui/Select';
import { Toast } from '../components/ui/Toast';

type WatchedFilter = 'all' | 'watched' | 'unwatched';

function getMutationError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'CIRCULAR_DEPENDENCY') {
      return 'That prerequisite change would create a circular dependency. Remove the conflicting relationship and try again.';
    }
    if (error.code === 'DUPLICATE_TITLE') {
      return 'A movie with this title already exists. Choose a unique title.';
    }
    if (error.code === 'CYCLE_DETECTOR_NOT_IMPLEMENTED') {
      return 'Movie prerequisite validation is not available until the cycle-detection algorithm is completed.';
    }
  }
  return getErrorMessage(error);
}

export function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie>();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [updatingMovieId, setUpdatingMovieId] = useState<string>();
  const [search, setSearch] = useState('');
  const [watchedFilter, setWatchedFilter] = useState<WatchedFilter>('all');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' }>();

  const loadMovies = useCallback(async () => {
    setLoading(true);
    setLoadError(undefined);
    try {
      setMovies(await api.getMovies());
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMovies();
  }, [loadMovies]);

  const filteredMovies = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return movies.filter((movie) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        movie.title.toLocaleLowerCase().includes(normalizedSearch);
      const matchesWatched =
        watchedFilter === 'all' ||
        (watchedFilter === 'watched' ? movie.watched : !movie.watched);
      return matchesSearch && matchesWatched;
    });
  }, [movies, search, watchedFilter]);

  const watchedCount = movies.filter(({ watched }) => watched).length;

  function openAddDialog() {
    setEditingMovie(undefined);
    setFormError(undefined);
    setDialogOpen(true);
  }

  function openEditDialog(movie: Movie) {
    setEditingMovie(movie);
    setFormError(undefined);
    setDialogOpen(true);
  }

  function closeDialog() {
    if (saving) return;
    setDialogOpen(false);
    setFormError(undefined);
  }

  async function handleSubmit(values: MovieFormValues) {
    if (saving) return;
    setSaving(true);
    setFormError(undefined);
    try {
      if (editingMovie) {
        await api.updateMovie(editingMovie.id, values);
      } else {
        await api.createMovie(values);
      }
      setDialogOpen(false);
      setToast({
        message: editingMovie ? 'Movie changes saved.' : 'Movie added to the timeline.',
        tone: 'success',
      });
      await loadMovies();
    } catch (error) {
      setFormError(getMutationError(error));
    } finally {
      setSaving(false);
    }
  }

  async function toggleWatched(movie: Movie) {
    if (updatingMovieId) return;
    setUpdatingMovieId(movie.id);
    try {
      await api.updateMovie(movie.id, { watched: !movie.watched });
      setToast({
        message: `${movie.title} marked ${movie.watched ? 'unwatched' : 'watched'}.`,
        tone: 'success',
      });
      await loadMovies();
    } catch (error) {
      setToast({ message: getMutationError(error), tone: 'error' });
    } finally {
      setUpdatingMovieId(undefined);
    }
  }

  const hasActiveFilters = search.trim().length > 0 || watchedFilter !== 'all';

  return (
    <div>
      <PageHeading
        eyebrow="Movie library"
        title="Assemble the timeline"
        description="Create movies, edit prerequisite relationships, and keep watched progress current from one responsive library."
        action={
          <Button onClick={openAddDialog} icon={<span aria-hidden="true">＋</span>}>
            Add movie
          </Button>
        }
      />

      {!loading && !loadError && movies.length > 0 && (
        <>
          <div className="mb-5 flex flex-wrap gap-3 text-sm text-zinc-400">
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">{movies.length} movies</span>
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">{watchedCount} watched</span>
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">{movies.length - watchedCount} remaining</span>
          </div>
          <div className="mb-7 grid gap-4 rounded-2xl border border-white/8 bg-panel/60 p-4 sm:grid-cols-[1fr_13rem]">
            <Input
              label="Search movies"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title"
            />
            <Select
              label="Watched status"
              value={watchedFilter}
              onChange={(event) => setWatchedFilter(event.target.value as WatchedFilter)}
            >
              <option value="all">All movies</option>
              <option value="watched">Watched</option>
              <option value="unwatched">Unwatched</option>
            </Select>
          </div>
        </>
      )}

      {loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <CardSkeleton key={index} />)}
        </div>
      )}
      {loadError && <ErrorPanel message={loadError} onRetry={() => void loadMovies()} />}
      {!loading && !loadError && movies.length === 0 && (
        <EmptyState
          title="The timeline is empty"
          description="Add the first movie to begin building your rewatch universe."
          action={<Button onClick={openAddDialog}>Add the first movie</Button>}
        />
      )}
      {!loading && !loadError && movies.length > 0 && filteredMovies.length === 0 && (
        <EmptyState
          title="No movies match"
          description="Adjust the search or watched filter to see more of the library."
          action={
            hasActiveFilters ? (
              <Button variant="secondary" onClick={() => { setSearch(''); setWatchedFilter('all'); }}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}
      {!loading && !loadError && filteredMovies.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              updating={updatingMovieId === movie.id}
              onEdit={openEditDialog}
              onToggleWatched={(selectedMovie) => void toggleWatched(selectedMovie)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title={editingMovie ? 'Edit movie' : 'Add a movie'}
        description={
          editingMovie
            ? 'Update metadata, watched status, and the complete direct prerequisite list.'
            : 'Add metadata and select any direct prerequisites already in the library.'
        }
      >
        {dialogOpen && (
          <MovieForm
            key={editingMovie?.id ?? 'new-movie'}
            movies={movies}
            initialMovie={editingMovie}
            submitting={saving}
            serverError={formError}
            onCancel={closeDialog}
            onSubmit={handleSubmit}
          />
        )}
      </Dialog>
      {toast && <Toast {...toast} onDismiss={() => setToast(undefined)} />}
    </div>
  );
}
