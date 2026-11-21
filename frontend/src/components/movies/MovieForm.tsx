import { useState, type FormEvent } from 'react';
import type { CreateMovieRequest, Movie } from '../../api/client';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PrerequisitePicker } from './PrerequisitePicker';

export interface MovieFormValues extends CreateMovieRequest {
  prerequisiteIds: string[];
  watched: boolean;
}

interface MovieFormProps {
  movies: Movie[];
  initialMovie?: Movie;
  submitting: boolean;
  serverError?: string;
  onCancel: () => void;
  onSubmit: (values: MovieFormValues) => Promise<void>;
}

export function MovieForm({
  movies,
  initialMovie,
  submitting,
  serverError,
  onCancel,
  onSubmit,
}: MovieFormProps) {
  const [title, setTitle] = useState(initialMovie?.title ?? '');
  const [releaseYear, setReleaseYear] = useState(
    initialMovie ? String(initialMovie.releaseYear) : '',
  );
  const [runtimeMinutes, setRuntimeMinutes] = useState(
    initialMovie ? String(initialMovie.runtimeMinutes) : '',
  );
  const [watched, setWatched] = useState(initialMovie?.watched ?? false);
  const [prerequisiteIds, setPrerequisiteIds] = useState(
    initialMovie?.prerequisites.map(({ id }) => id) ?? [],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    await onSubmit({
      title,
      releaseYear: Number(releaseYear),
      runtimeMinutes: Number(runtimeMinutes),
      watched,
      prerequisiteIds,
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {serverError && (
        <div role="alert" className="rounded-xl border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-sm leading-6 text-red-200">
          {serverError}
        </div>
      )}
      <Input
        label="Movie title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        autoComplete="off"
        required
        maxLength={200}
        placeholder="e.g. The Avengers"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Release year"
          value={releaseYear}
          onChange={(event) => setReleaseYear(event.target.value)}
          type="number"
          min="1888"
          max="2100"
          required
        />
        <Input
          label="Runtime (minutes)"
          value={runtimeMinutes}
          onChange={(event) => setRuntimeMinutes(event.target.value)}
          type="number"
          min="1"
          max="300"
          required
        />
      </div>
      <PrerequisitePicker
        movies={movies}
        selectedIds={prerequisiteIds}
        excludedMovieId={initialMovie?.id}
        onChange={setPrerequisiteIds}
      />
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/8 bg-black/15 p-4 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={watched}
          onChange={(event) => setWatched(event.target.checked)}
          className="h-4 w-4 accent-crimson"
        />
        Mark this movie as watched
      </label>
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" loading={submitting}>
          {initialMovie ? 'Save changes' : 'Add movie'}
        </Button>
      </div>
    </form>
  );
}
