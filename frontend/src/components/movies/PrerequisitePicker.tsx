import type { Movie } from '../../api/client';

interface PrerequisitePickerProps {
  movies: Movie[];
  selectedIds: string[];
  excludedMovieId?: string;
  onChange: (ids: string[]) => void;
}

export function PrerequisitePicker({
  movies,
  selectedIds,
  excludedMovieId,
  onChange,
}: PrerequisitePickerProps) {
  const choices = movies.filter(({ id }) => id !== excludedMovieId);

  function toggle(movieId: string) {
    onChange(
      selectedIds.includes(movieId)
        ? selectedIds.filter((id) => id !== movieId)
        : [...selectedIds, movieId],
    );
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-zinc-200">Prerequisite movies</legend>
      <p className="mt-1.5 text-sm leading-6 text-zinc-500">
        Select every direct prerequisite. The server will reject circular relationships.
      </p>
      {choices.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm text-zinc-500">
          No other movies are available yet.
        </p>
      ) : (
        <div className="mt-3 max-h-52 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2">
          {choices.map((movie) => {
            const selected = selectedIds.includes(movie.id);
            return (
              <label
                key={movie.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition ${
                  selected ? 'bg-crimson/15 text-white' : 'text-zinc-400 hover:bg-white/[0.045]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggle(movie.id)}
                  className="h-4 w-4 shrink-0 accent-crimson"
                />
                <span className="min-w-0 flex-1 truncate text-sm">{movie.title}</span>
                <span className="text-xs tabular-nums text-zinc-600">{movie.releaseYear}</span>
              </label>
            );
          })}
        </div>
      )}
      {selectedIds.length > 0 && (
        <p className="mt-2 text-sm text-gold">
          {selectedIds.length} prerequisite{selectedIds.length === 1 ? '' : 's'} selected
        </p>
      )}
    </fieldset>
  );
}
