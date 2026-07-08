import Image from 'next/image';
import Link from 'next/link';

type Props = {
  title?: string;
  subtitle?: string;
};

export function HeroHeader({
  title = 'Create Your Day',
  subtitle = 'Events, places, and what RVA is doing right now.',
}: Props) {
  return (
    <header className="relative isolate overflow-hidden bg-[#07060A]">
      <div className="absolute inset-0">
        <Image
          src="/rva-graffiti.jpg"
          alt="Richmond mural"
          fill
          priority
          className="animate-soft-drift object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,6,10,0.55)_0%,rgba(7,6,10,0.35)_45%,rgba(7,6,10,0.78)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(196,75,47,0.28),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[58vh] max-w-7xl flex-col justify-end px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8 lg:min-h-[62vh]">
        <p className="animate-fade-up font-[family-name:var(--font-display)] text-sm font-extrabold tracking-[0.28em] text-white/90 sm:text-base">
          CITIPILOT
        </p>
        <p className="animate-fade-up mt-4 text-sm font-bold text-[#C44B2F]" style={{ animationDelay: '80ms' }}>
          Richmond, VA
        </p>
        <h1
          className="animate-fade-up mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
          style={{ animationDelay: '140ms' }}
        >
          {title}
        </h1>
        <p
          className="animate-fade-up mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
          style={{ animationDelay: '200ms' }}
        >
          {subtitle}
        </p>
        <div className="animate-fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: '280ms' }}>
          <Link
            href="/map"
            className="rounded-full bg-[#C44B2F] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#9E3A24]"
          >
            Explore the map
          </Link>
          <Link
            href="/submit"
            className="rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
          >
            List an event
          </Link>
        </div>
      </div>
    </header>
  );
}
