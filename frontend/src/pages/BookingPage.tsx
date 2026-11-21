import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ApiError,
  api,
  getErrorMessage,
  type BookingQuote,
  type Cinema,
  type CreateCinemaRequest,
} from '../api/client';
import { CinemaForm } from '../components/cinemas/CinemaForm';
import { PageHeading } from '../components/PageHeading';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { ConfirmationPanel, EmptyState, ErrorPanel } from '../components/ui/FeedbackPanels';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/Loading';
import { Select } from '../components/ui/Select';
import { Toast } from '../components/ui/Toast';

function getCinemaError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'DUPLICATE_CINEMA_NAME') {
      return 'A cinema with this name already exists. Choose a unique name.';
    }
    if (error.code === 'BUNDLE_OPTIMIZER_NOT_IMPLEMENTED') {
      return 'Booking quotes are unavailable until the minimum-bundle algorithm is completed.';
    }
  }
  return getErrorMessage(error);
}

function validateGroupSize(value: string): string | undefined {
  if (!/^\d+$/.test(value)) return 'Enter a whole-number group size.';
  const size = Number(value);
  if (size < 1 || size > 10_000) return 'Group size must be between 1 and 10,000.';
  return undefined;
}

export function BookingPage() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [cinemaId, setCinemaId] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [groupSizeError, setGroupSizeError] = useState<string>();
  const [quote, setQuote] = useState<BookingQuote>();
  const [loadingCinemas, setLoadingCinemas] = useState(true);
  const [quoting, setQuoting] = useState(false);
  const [libraryError, setLibraryError] = useState<string>();
  const [quoteError, setQuoteError] = useState<string>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string>();
  const [toast, setToast] = useState<string>();

  const loadCinemas = useCallback(async (preselectId?: string) => {
    setLoadingCinemas(true);
    setLibraryError(undefined);
    try {
      const nextCinemas = await api.getCinemas();
      setCinemas(nextCinemas);
      if (preselectId && nextCinemas.some(({ id }) => id === preselectId)) {
        setCinemaId(preselectId);
      }
    } catch (error) {
      setLibraryError(getErrorMessage(error));
    } finally {
      setLoadingCinemas(false);
    }
  }, []);

  useEffect(() => {
    void loadCinemas();
  }, [loadCinemas]);

  async function handleCreateCinema(values: CreateCinemaRequest) {
    if (creating) return;
    setCreating(true);
    setCreateError(undefined);
    try {
      const createdCinema = await api.createCinema(values);
      setDialogOpen(false);
      setToast(`${createdCinema.name} created and selected.`);
      await loadCinemas(createdCinema.id);
    } catch (error) {
      setCreateError(getCinemaError(error));
    } finally {
      setCreating(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (quoting || !cinemaId) return;
    const validationError = validateGroupSize(groupSize);
    setGroupSizeError(validationError);
    if (validationError) return;

    setQuoting(true);
    setQuoteError(undefined);
    setQuote(undefined);
    try {
      setQuote(await api.getBookingQuote(cinemaId, Number(groupSize)));
    } catch (error) {
      setQuoteError(getCinemaError(error));
    } finally {
      setQuoting(false);
    }
  }

  const selectedCinema = cinemas.find(({ id }) => id === cinemaId);
  const totalSeats = quote?.possible
    ? quote.bundles.reduce(
        (total, bundle) => total + bundle.size * bundle.quantity,
        0,
      )
    : 0;

  return (
    <div>
      <PageHeading
        eyebrow="Watch-party booking"
        title="Make every seat count"
        description="Create cinemas, compare their available bundle sizes, and request an exact minimum-bundle quote—without prices, showtimes, or checkout steps."
        action={
          <Button
            variant="secondary"
            icon={<span aria-hidden="true">＋</span>}
            onClick={() => {
              setCreateError(undefined);
              setDialogOpen(true);
            }}
          >
            Add cinema
          </Button>
        }
      />

      <div className="mb-6 rounded-xl border border-gold/15 bg-gold/[0.04] px-4 py-3 text-sm leading-6 text-zinc-400">
        This tool provides a seating-bundle quote only. It does not reserve seats, process payments, or manage ticket inventory.
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <section className="h-fit rounded-2xl border border-white/9 bg-panel/80 p-6 sm:p-7 lg:sticky lg:top-28">
          <div className="mb-7 flex items-center justify-between gap-5">
            <div>
              <p className="text-sm font-semibold text-gold">Quote builder</p>
              <h2 className="mt-1 font-display text-2xl text-white">Set the guest list</h2>
            </div>
            <div aria-hidden="true" className="grid grid-cols-4 gap-1.5 opacity-60">
              {Array.from({ length: 12 }, (_, index) => (
                <span key={index} className="h-2.5 w-3.5 rounded-t-md bg-crimson/70" />
              ))}
            </div>
          </div>

          {loadingCinemas ? (
            <LoadingSpinner label="Loading cinemas" />
          ) : libraryError ? (
            <ErrorPanel message={libraryError} onRetry={() => void loadCinemas()} />
          ) : cinemas.length === 0 ? (
            <EmptyState
              title="No cinemas available"
              description="Create a cinema with its available bundle sizes before requesting a quote."
              action={<Button onClick={() => setDialogOpen(true)}>Create a cinema</Button>}
            />
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <Select
                label="Cinema"
                value={cinemaId}
                onChange={(event) => {
                  setCinemaId(event.target.value);
                  setQuote(undefined);
                  setQuoteError(undefined);
                }}
                required
              >
                <option value="">Choose a cinema</option>
                {cinemas.map((cinema) => (
                  <option key={cinema.id} value={cinema.id}>{cinema.name}</option>
                ))}
              </Select>
              {selectedCinema && (
                <div>
                  <p className="mb-2 text-sm font-medium text-zinc-300">Available bundles</p>
                  <div className="flex flex-wrap gap-2" aria-label="Available bundle sizes">
                    {selectedCinema.bundleSizes.map((size) => (
                      <span key={size} className="rounded-lg border border-white/8 bg-black/20 px-2.5 py-1.5 text-sm text-zinc-400">
                        {size} seats
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <Input
                label="Group size"
                type="number"
                min="1"
                max="10000"
                step="1"
                inputMode="numeric"
                value={groupSize}
                onChange={(event) => {
                  setGroupSize(event.target.value);
                  setGroupSizeError(undefined);
                  setQuote(undefined);
                  setQuoteError(undefined);
                }}
                placeholder="How many guests?"
                hint="Between 1 and 10,000 guests"
                error={groupSizeError}
              />
              <Button
                type="submit"
                className="w-full"
                loading={quoting}
                disabled={!cinemaId || !groupSize}
              >
                Find Optimal Bundles
              </Button>
            </form>
          )}
        </section>

        <section aria-live="polite" aria-busy={quoting}>
          {quoteError && <ErrorPanel message={quoteError} />}
          {quoting && <LoadingSpinner label="Calculating exact bundle combination" />}
          {!quoting && !quoteError && !quote && (
            <EmptyState
              title="Your bundle quote will appear here"
              description="Choose a cinema and group size to find the fewest complete bundles that fit exactly."
            />
          )}
          {quote?.possible && (
            <ConfirmationPanel
              title="Exact combination found"
              description={`${quote.cinema.name} can seat all ${quote.groupSize} guests with no partially filled bundles.`}
            >
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                  <dt className="text-xs tracking-wide text-zinc-500 uppercase">Cinema</dt>
                  <dd className="mt-2 font-semibold text-white">{quote.cinema.name}</dd>
                </div>
                <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                  <dt className="text-xs tracking-wide text-zinc-500 uppercase">Group size</dt>
                  <dd className="mt-2 font-display text-2xl text-white">{quote.groupSize}</dd>
                </div>
                <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                  <dt className="text-xs tracking-wide text-zinc-500 uppercase">Minimum bundles</dt>
                  <dd className="mt-2 font-display text-2xl text-white">{quote.totalBundles}</dd>
                </div>
                <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                  <dt className="text-xs tracking-wide text-zinc-500 uppercase">Total seats</dt>
                  <dd className="mt-2 font-display text-2xl text-white">{totalSeats}</dd>
                </div>
              </dl>

              <div className="mt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl text-white">Bundle breakdown</h3>
                  <p className="text-sm text-zinc-500">
                    Available: [{quote.cinema.bundleSizes.join(', ')}]
                  </p>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {quote.bundles.map((bundle) => (
                    <div key={bundle.size} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 p-4">
                      <span className="text-zinc-300">{bundle.size}-seat bundle</span>
                      <span className="font-display text-2xl text-white">× {bundle.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ConfirmationPanel>
          )}
          {quote && !quote.possible && (
            <ConfirmationPanel
              tone="warning"
              title="No exact combination"
              description="No exact bundle combination is available for this group size."
            >
              <div className="flex flex-wrap gap-2 text-sm text-zinc-400">
                <span>{quote.cinema.name}</span>
                <span aria-hidden="true">·</span>
                <span>{quote.groupSize} guests</span>
                <span aria-hidden="true">·</span>
                <span>Bundles [{quote.cinema.bundleSizes.join(', ')}]</span>
              </div>
            </ConfirmationPanel>
          )}
        </section>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => !creating && setDialogOpen(false)}
        title="Create a cinema"
        description="Define a unique cinema name and every seat bundle it offers."
      >
        {dialogOpen && (
          <CinemaForm
            submitting={creating}
            serverError={createError}
            onCancel={() => setDialogOpen(false)}
            onSubmit={handleCreateCinema}
          />
        )}
      </Dialog>
      {toast && <Toast message={toast} tone="success" onDismiss={() => setToast(undefined)} />}
    </div>
  );
}
