const APP_STORE_URL = 'https://inkverse.co/ios';
const PLAY_STORE_URL = 'https://inkverse.co/android';
const APP_STORE_BADGE = 'https://ax0.taddy.org/general/apple-app-store-badge.png';
const PLAY_STORE_BADGE = 'https://ax0.taddy.org/general/google-play-badge.png';

// The two badge PNGs share a 572×174 canvas but the Apple badge has ~55px of
// transparent side padding and a narrower official aspect ratio (2.99:1 vs 3.36:1).
// aspect-[...] + object-cover crops each image to its visible artwork, and Apple
// gets a ~6% taller height so both badges have the same visual area.
function StoreBadges({ appleHeight, googleHeight }: { appleHeight: string; googleHeight: string }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
        <img className={`${appleHeight} w-auto aspect-[517/173] object-cover`} src={APP_STORE_BADGE} alt="Download on the App Store" loading="lazy" />
      </a>
      <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
        <img className={`${googleHeight} w-auto aspect-[564/168] object-cover`} src={PLAY_STORE_BADGE} alt="Get it on Google Play" loading="lazy" />
      </a>
    </div>
  );
}

export function AppDownloadCTA({ variant }: { variant: 'inline' | 'full' }) {
  if (variant === 'inline') {
    return (
      <aside aria-label="Download the Inkverse app" className="rounded-2xl border-2 border-brand-pink/60 bg-white/60 dark:bg-[#FFF4EF] p-5 shadow-[6px_6px_0_0_theme(colors.brand-pink)]">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-lg font-extrabold text-inkverse-black">Inkverse Webtoons App</p>
            <p className="mt-1 text-sm text-inkverse-black/80">
              Discover indie webtoons on the free Inkverse app.
            </p>
          </div>
          <StoreBadges appleHeight="h-[51px]" googleHeight="h-12" />
        </div>
      </aside>
    );
  }

  return (
    <aside aria-label="Download the Inkverse app" className="rounded-2xl border-2 border-brand-purple/60 bg-white/60 dark:bg-[#FFF4EF] p-8 text-center shadow-[6px_6px_0_0_theme(colors.brand-purple)]">
      <h2 className="text-2xl sm:text-3xl font-black text-inkverse-black">
        Enjoyed this list? You'll love <span className="text-brand-pink">Inkverse</span>
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-inkverse-black/80">
        Inkverse is a free webtoons app built for people who love webtoons (no pop-ups, no nagging you for coins every chapter).
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-6 md:flex-row md:gap-10">
        <StoreBadges appleHeight="h-[59px]" googleHeight="h-14" />
        <div className="hidden md:block">
          <img className="h-36 w-36 dark:hidden" src="https://ink0.inkverse.co/general/qr-code-4.png" alt="Scan QR code to download the Inkverse app" loading="lazy" />
          <img className="hidden h-36 w-36 dark:block" src="https://ink0.inkverse.co/general/qr-code-5.png" alt="Scan QR code to download the Inkverse app" loading="lazy" />
          <p className="mt-2 text-xs text-inkverse-black/60">Or scan to download</p>
        </div>
      </div>
    </aside>
  );
}
