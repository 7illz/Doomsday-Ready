import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, getErrorMessage, type Movie, type RewatchPlan } from '../api/client';
import { PageHeading } from '../components/PageHeading';
import { Button } from '../components/ui/Button';
import {
  ConfirmationPanel,
  EmptyState,
  ErrorPanel,
} from '../components/ui/FeedbackPanels';
import { LoadingSpinner } from '../components/ui/Loading';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Select } from '../components/ui/Select';
import { Toast } from '../components/ui/Toast';

export function formatRemainingTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m remaining`;
  if (minutes === 0) return `${hours}h remaining`;
  return `${hours}h ${minutes}m remaining`;
}

export function RewatchPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [plan, setPlan] = useState<RewatchPlan>();
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [updatingMovieId, setUpdatingMovieId] = useState<string>();
  const [libraryError, setLibraryError] = useState<string>();
  const [planError, setPlanError] = useState<string>();
  const [toast, setToast] = useState<string>();

  const loadMovies = useCallback(async () => {
    setLoadingMovies(true);
    setLibraryError(undefined);
    try {
      setMovies(await api.getMovies());
    } catch (error) {
      setLibraryError(getErrorMessage(error));
    } finally {
      setLoadingMovies(false);
    }
  }, []);

  useEffect(() => {
    void loadMovies();
  }, [loadMovies]);

  const loadPlan = useCallback(async (movieId: string) => {
    setPlanning(true);
    setPlanError(undefined);
    try {
      const nextPlan = await api.getRewatchPlan(movieId);
      setPlan(nextPlan);
      return nextPlan;
    } catch (error) {
      setPlan(undefined);
      setPlanError(getErrorMessage(error));
      return undefined;
    } finally {
      setPlanning(false);
    }
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedId || planning) return;
    await loadPlan(selectedId);
  }

  async function toggleWatched(movieId: string, currentlyWatched: boolean) {
    if (!selectedId || updatingMovieId) return;
    setUpdatingMovieId(movieId);
    setPlanError(undefined);
    try {
      await api.updateMovie(movieId, { watched: !currentlyWatched });
      const refreshedPlan = await loadPlan(selectedId);
      if (refreshedPlan) {
        setToast(`Watch status updated. ${refreshedPlan.watchedCount} of ${refreshedPlan.totalPrerequisiteCount} watched.`);
      }
    } catch (error) {
      setPlanError(getErrorMessage(error));
    } finally {
      setUpdatingMovieId(undefined);
    }
  }

  const percentage =
    plan && plan.totalPrerequisiteCount > 0
      ? Math.round((plan.watchedCount / plan.totalPrerequisiteCount) * 100)
      : 0;
  const complete =
    plan !== undefined &&
    plan.totalPrerequisiteCount > 0 &&
    plan.watchedCount === plan.totalPrerequisiteCount;

  return (
    <div>
      <PageHeading
        eyebrow="Rewatch planner"
        title="Follow every thread"
        description="Choose the destination. The API returns every prerequisite once in dependency-safe viewing order."
      />

      <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <section className="h-fit rounded-2xl border border-white/9 bg-panel/80 p-6 lg:sticky lg:top-28">
          <p className="text-sm font-semibold tracking-wide text-gold">Select your target</p>
          <h2 className="mt-2 font-display text-2xl text-white">Where are you headed?</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            The selected target is shown as the destination and never repeated in its prerequisite watchlist.
          </p>

          {loadingMovies ? (
            <LoadingSpinner label="Loading movie library" />
          ) : libraryError ? (
            <div className="mt-5">
              <ErrorPanel message={libraryError} onRetry={() => void loadMovies()} />
            </div>
          ) : movies.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="No movies yet"
                description="Add movies before building a rewatch plan."
              />
            </div>
          ) : (
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <Select
                label="Target movie"
                value={selectedId}
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setPlan(undefined);
                  setPlanError(undefined);
                }}
                required
              >
                <option value="">Choose a movie</option>
                {movies.map((movie) => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title}
                  </option>
                ))}
              </Select>
              <Button
                type="submit"
                className="w-full"
                loading={planning}
                disabled={!selectedId}
              >
                Generate rewatch plan
              </Button>
            </form>
          )}
        </section>

        <section aria-live="polite" aria-busy={planning}>
          {planError && (
            <div className="mb-5">
              <ErrorPanel
                message={planError}
                onRetry={selectedId ? () => void loadPlan(selectedId) : undefined}
              />
            </div>
          )}
          {planning && !plan && <LoadingSpinner label="Building dependency-safe sequence" />}
          {!planning && !plan && !planError && (
            <EmptyState
              title={selectedId ? 'Ready to build the sequence' : 'No target selected'}
              description={
                selectedId
                  ? 'Generate the plan to reveal every prerequisite in backend-provided order.'
                  : 'Select a target movie to reveal its complete prerequisite journey.'
              }
            />
          )}

          {plan && (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-2xl border border-white/9 bg-panel/80">
                <div className="border-b border-white/8 bg-[radial-gradient(circle_at_90%_0%,rgba(164,29,47,0.22),transparent_18rem)] p-6 sm:p-7">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gold">Final destination</p>
                      <h2 className="mt-1 font-display text-3xl text-white">{plan.target.title}</h2>
                      <p className="mt-2 text-zinc-400">
                        {plan.totalPrerequisiteCount === 0
                          ? 'No prerequisite chapters required'
                          : `${plan.watchedCount} of ${plan.totalPrerequisiteCount} watched`}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:min-w-56">
                      <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-3 text-center">
                        <span className="block font-display text-2xl text-white">{percentage}%</span>
                        <span className="text-xs text-zinc-500">complete</span>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-3 text-center">
                        <span className="block font-display text-2xl text-white">{plan.remainingRuntimeMinutes}</span>
                        <span className="text-xs text-zinc-500">minutes left</span>
                      </div>
                    </div>
                  </div>
                  {plan.totalPrerequisiteCount > 0 && (
                    <div className="mt-7">
                      <ProgressBar
                        label={`${plan.watchedCount} of ${plan.totalPrerequisiteCount} watched`}
                        value={plan.watchedCount}
                        max={plan.totalPrerequisiteCount}
                      />
                      <p className="mt-3 text-sm text-zinc-400">
                        <span className="font-semibold text-zinc-200">
                          {formatRemainingTime(plan.remainingRuntimeMinutes)}
                        </span>{' '}
                        · {plan.remainingRuntimeMinutes} total minutes
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {plan.totalPrerequisiteCount === 0 ? (
                <EmptyState
                  title="No prerequisites needed"
                  description={`${plan.target.title} is ready to watch without any earlier chapters.`}
                />
              ) : (
                <>
                  {complete && (
                    <ConfirmationPanel
                      title="Rewatch complete"
                      description={`Every prerequisite for ${plan.target.title} is watched. The final destination is ready.`}
                    />
                  )}
                  <ol className="relative space-y-3 before:absolute before:top-8 before:bottom-8 before:left-[1.35rem] before:w-px before:bg-gradient-to-b before:from-gold/40 before:via-white/10 before:to-crimson/30" data-testid="rewatch-timeline">
                    {plan.orderedPrerequisites.map((movie, index) => (
                      <li
                        key={movie.id}
                        className={`relative flex items-center gap-4 rounded-2xl border p-4 pl-3 transition sm:p-5 sm:pl-3 ${
                          movie.watched
                            ? 'border-emerald-400/18 bg-emerald-400/[0.035]'
                            : 'border-white/8 bg-white/[0.03]'
                        }`}
                      >
                        <span
                          className={`z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border text-sm font-semibold ${
                            movie.watched
                              ? 'border-emerald-400/40 bg-emerald-950 text-emerald-300'
                              : 'border-gold/25 bg-panel text-gold'
                          }`}
                          aria-label={`Step ${index + 1}${movie.watched ? ', watched' : ''}`}
                        >
                          {movie.watched ? '✓' : index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className={`font-medium ${movie.watched ? 'text-zinc-400 line-through decoration-zinc-600' : 'text-white'}`}>
                            {movie.title}
                          </h3>
                          <p className="mt-1 text-sm text-zinc-500">
                            {movie.releaseYear} · {movie.runtimeMinutes} min
                          </p>
                        </div>
                        <Button
                          variant={movie.watched ? 'ghost' : 'secondary'}
                          size="sm"
                          loading={updatingMovieId === movie.id}
                          disabled={updatingMovieId !== undefined && updatingMovieId !== movie.id}
                          onClick={() => void toggleWatched(movie.id, movie.watched)}
                          className="shrink-0"
                          aria-label={movie.watched ? 'Mark unwatched' : 'Mark watched'}
                        >
                          <span className="hidden sm:inline">
                            {movie.watched ? 'Mark unwatched' : 'Mark watched'}
                          </span>
                          <span className="sm:hidden">{movie.watched ? 'Undo' : 'Done'}</span>
                        </Button>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          )}
        </section>
      </div>
      {toast && <Toast message={toast} tone="success" onDismiss={() => setToast(undefined)} />}
    </div>
  );
}
