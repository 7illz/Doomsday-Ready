import { Link } from 'react-router';

export function AppLogo() {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      aria-label="Doomsday Ready home"
    >
      <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-gold/45 bg-black shadow-[inset_0_0_18px_rgba(214,173,96,0.16)]">
        <span className="absolute inset-[5px] rounded-full border border-crimson-light/70" />
        <span className="absolute h-[2px] w-7 rotate-[-35deg] bg-gold/80" />
        <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
      </span>
      <span>
        <span className="block font-display text-[1.05rem] leading-none tracking-[0.16em] text-white">
          DOOMSDAY
        </span>
        <span className="mt-1 block text-[0.7rem] font-semibold tracking-[0.36em] text-gold">
          READY
        </span>
      </span>
    </Link>
  );
}
