import type { Movie } from '../api/client';
import { Button } from './ui/Button';

function titleMonogram(title: string) {
  return title
    .split(/\s+/)
    .filter((word) => !['the', 'a', 'an'].includes(word.toLowerCase()))
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

interface MovieCardProps {
  movie: Movie;
  updating?: boolean;
  onEdit: (movie: Movie) => void;
  onToggleWatched: (movie: Movie) => void;
}

export function MovieCard({ movie, updating, onEdit, onToggleWatched }: MovieCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/9 bg-panel/85 shadow-[0_16px_50px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:border-gold/25">
      <div className="relative grid min-h-40 place-items-center overflow-hidden border-b border-white/8 bg-[radial-gradient(circle_at_50%_45%,rgba(164,29,47,0.35),transparent_45%),linear-gradient(145deg,#18181d,#09090b)]">
        <div className="absolute -top-12 -right-10 h-32 w-32 rounded-full border border-gold/15" />
        <div className="absolute -bottom-14 -left-10 h-36 w-36 rounded-full border border-crimson/25" />
        <span className="font-display text-5xl tracking-widest text-white/90">{titleMonogram(movie.title)}</span>
        <span className="absolute top-3 right-3 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur">
          {movie.releaseYear}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-xl leading-snug text-white">{movie.title}</h2>
          <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
            movie.watched ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/[0.05] text-zinc-500'
          }`}>{movie.watched ? 'Watched' : 'Unwatched'}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          <span>{movie.runtimeMinutes} min</span>
          <span aria-hidden="true" className="text-zinc-700">•</span>
          <span>{movie.prerequisites.length} prerequisite{movie.prerequisites.length === 1 ? '' : 's'}</span>
        </div>
        {movie.prerequisites.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Prerequisites">
            {movie.prerequisites.map((prerequisite) => (
              <span key={prerequisite.id} className="rounded-md bg-white/[0.05] px-2 py-1 text-xs text-zinc-400">
                {prerequisite.title}
              </span>
            ))}
          </div>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/8 pt-4">
          <Button variant="ghost" size="sm" onClick={() => onEdit(movie)}>Edit</Button>
          <Button
            variant="secondary"
            size="sm"
            loading={updating}
            onClick={() => onToggleWatched(movie)}
          >
            {movie.watched ? 'Mark unwatched' : 'Mark watched'}
          </Button>
        </div>
      </div>
    </article>
  );
}
