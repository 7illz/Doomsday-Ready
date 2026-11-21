import { NavLink, Outlet } from 'react-router';
import { AppLogo } from './AppLogo';

const navigation = [
  { to: '/', label: 'Overview', end: true },
  { to: '/movies', label: 'Movies' },
  { to: '/rewatch', label: 'Rewatch Plan' },
  { to: '/booking', label: 'Booking' },
];

export function AppLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_12%_-10%,rgba(164,29,47,0.2),transparent_30rem),radial-gradient(circle_at_90%_10%,rgba(214,173,96,0.07),transparent_24rem)]" />
      <header className="sticky top-0 z-40 border-b border-white/8 bg-void/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8">
          <AppLogo />
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-gold ${
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-zinc-400 hover:bg-white/[0.045] hover:text-zinc-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <span className="hidden rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-zinc-500 lg:inline-flex">
            MARATHON CONTROL
          </span>
        </div>
        <nav aria-label="Mobile navigation" className="scrollbar-none flex overflow-x-auto border-t border-white/6 px-3 py-2 md:hidden">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium ${
                  isActive ? 'bg-crimson text-white' : 'text-zinc-400'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto min-h-[calc(100vh-10rem)] max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-7 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Doomsday Ready — built for deliberate rewatches.</p>
          <p>No posters, logos, or external movie data required.</p>
        </div>
      </footer>
    </div>
  );
}
