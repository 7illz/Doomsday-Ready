import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api/client';

type ApiState = 'checking' | 'online' | 'offline';

const features = [
  {
    to: '/movies',
    label: 'Movie library',
    title: 'Map every connection',
    description: 'Build the collection, set prerequisites, and keep watched status current.',
    accent: 'from-crimson/30',
  },
  {
    to: '/rewatch',
    label: 'Rewatch plan',
    title: 'Enter in the right order',
    description: 'Turn a target movie into one clean, dependency-safe viewing sequence.',
    accent: 'from-gold/20',
  },
  {
    to: '/booking',
    label: 'Watch party',
    title: 'Fit the whole crew',
    description: 'Find an exact cinema bundle quote with no partially filled packages.',
    accent: 'from-zinc-500/20',
  },
];

export function HomePage() {
  const [apiState, setApiState] = useState<ApiState>('checking');

  useEffect(() => {
    let active = true;
    api.getHealth()
      .then(() => active && setApiState('online'))
      .catch(() => active && setApiState('offline'));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden rounded-[2rem] border border-white/9 bg-panel/75 px-6 py-12 shadow-[0_30px_100px_rgba(0,0,0,0.3)] sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div aria-hidden="true" className="absolute top-1/2 right-[-8rem] h-[28rem] w-[28rem] -translate-y-1/2 rounded-full border border-gold/10 sm:right-[-5rem]">
          <div className="absolute inset-12 rounded-full border border-crimson/20" />
          <div className="absolute inset-24 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.09),rgba(164,29,47,0.12)_12%,rgba(8,8,10,0.9)_48%)] shadow-[0_0_80px_rgba(164,29,47,0.12)]" />
        </div>
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-zinc-400">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                apiState === 'online'
                  ? 'bg-emerald-400'
                  : apiState === 'offline'
                    ? 'bg-red-400'
                    : 'animate-pulse bg-gold'
              }`}
            />
            <span role="status">
              {apiState === 'online'
                ? 'API online'
                : apiState === 'offline'
                  ? 'API unavailable'
                  : 'Checking API connection…'}
            </span>
          </div>
          <p className="mt-8 text-sm font-semibold tracking-[0.26em] text-gold uppercase">
            The final countdown begins
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.04] text-white sm:text-6xl lg:text-7xl">
            Every story. <span className="text-zinc-500">The right order.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-400">
            Plan a complete cinematic rewatch, track the journey, and build an exact watch-party quote from one focused command center.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/rewatch" className="inline-flex min-h-12 items-center rounded-xl border border-crimson bg-crimson px-6 font-semibold text-white shadow-[0_12px_30px_rgba(164,29,47,0.22)] transition hover:bg-crimson-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
              Build a rewatch plan
            </Link>
            <Link to="/movies" className="inline-flex min-h-12 items-center rounded-xl border border-white/12 bg-white/[0.05] px-6 font-semibold text-zinc-100 transition hover:bg-white/[0.09] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
              Browse movies
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Application features">
        {features.map((feature) => (
          <Link
            key={feature.to}
            to={feature.to}
            className={`group relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br ${feature.accent} to-panel p-6 transition duration-300 hover:-translate-y-1 hover:border-white/16 focus-visible:outline-2 focus-visible:outline-gold`}
          >
            <p className="text-sm font-semibold tracking-wide text-gold">{feature.label}</p>
            <h2 className="mt-8 font-display text-2xl text-white">{feature.title}</h2>
            <p className="mt-2 leading-7 text-zinc-400">{feature.description}</p>
            <span className="mt-6 inline-block text-sm font-semibold text-zinc-200 transition group-hover:text-white">
              Open workspace
            </span>
          </Link>
        ))}
      </section>

      <section className="mt-16 grid gap-8 border-t border-white/8 pt-10 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="text-sm font-semibold tracking-[0.2em] text-gold uppercase">One clear workflow</p>
          <h2 className="mt-3 font-display text-3xl text-white">From timeline to showtime.</h2>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {['Curate the movies', 'Generate the sequence', 'Quote the seats'].map((step, index) => (
            <li key={step} className="border-l border-white/10 pl-4">
              <span className="text-sm font-semibold text-crimson-light">0{index + 1}</span>
              <p className="mt-2 font-medium text-zinc-200">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
