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
    <header className="relative overflow-hidden bg-[#07060A]">
      <Image
        src="/rva-graffiti.jpg"
        alt="Richmond mural"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[rgba(7,6,10,0.62)]" />
      <div className="relative z-10 px-5 pb-5 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-extrabold tracking-[0.24em] text-white/75">CITIPILOT</span>
          <div className="flex gap-2">
            <Link
              href="/you"
              className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white"
            >
              Account
            </Link>
            <Link
              href="/you#prefs"
              className="rounded-full bg-[#C44B2F] px-3 py-2 text-xs font-extrabold text-white"
            >
              Tune
            </Link>
          </div>
        </div>
        <p className="text-sm font-bold text-[#C44B2F]">Richmond, VA</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-white">{title}</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-white/75">{subtitle}</p>
      </div>
    </header>
  );
}
