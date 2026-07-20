import { type MetaFunction } from "react-router";
import { getMetaTags } from "@/lib/seo";

/* ---------------------------------------------------------------------------
 * EDIT THIS SECTION TO UPDATE THE PAGE (then redeploy)
 * ------------------------------------------------------------------------- */

const BRAND_ZIP_URL = 'https://ink0.inkverse.co/general/inkverse-logos-mascots-stickers.zip';
const COMIC_LINK_WEB_IMG = 'https://ink0.inkverse.co/general/comic-unique-link-web-snipped.jpg';
const COMIC_LINK_MOBILE_IMG = 'https://ax0.taddy.org/general/comic-unique-link-2.jpg';
const BLINKY_IMG = 'https://ink0.inkverse.co/general/blinky.png';

interface BrandAsset {
  name: string;
  url: string;
  alt: string;
  // Spans both grid columns on desktop
  wide?: boolean;
}

const BRAND_ASSETS: BrandAsset[] = [
  {
    name: 'Logo — Rectangle',
    url: 'https://ink0.inkverse.co/general/inkverse-logo-rectangle.png',
    alt: 'Inkverse logo, rectangle version',
  },
  {
    name: 'Logo — Square',
    url: 'https://ink0.inkverse.co/general/inkverse-logo-square.png',
    alt: 'Inkverse logo, square version',
  },
  {
    name: 'Blinky',
    url: 'https://ink0.inkverse.co/general/inkverse-mascot.png',
    alt: 'Blinky, the Inkverse mascot',
  },
  {
    name: 'Read on Inkverse',
    url: 'https://ink0.inkverse.co/general/read-on-inkverse-mascot.png',
    alt: 'Blinky holding a "Read On" sign',
  },
  {
    name: 'Read on Inkverse — Badge',
    url: 'https://ink0.inkverse.co/general/read-on-inkverse-badge.png',
    alt: 'Read on Inkverse badge with Blinky',
    wide: true,
  },
];

const INTRO_COPY = "Yay! You've added your comic to Inkverse! Here are some some Inkverse brand assets you can use to promote your comic on your socials.";

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export const meta: MetaFunction = () => {
  return getMetaTags({
    title: "Inkverse Brand Assets for Creators",
    description: INTRO_COPY,
    url: "https://inkverse.co/brand-kit",
    imageURL: "https://ink0.inkverse.co/general/inkverse-brandmark-white.png",
  });
};

const pageStyles = `
  @keyframes blinky-bob {
    0%, 100% { transform: translateY(0) rotate(-3deg); }
    50% { transform: translateY(-12px) rotate(3deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .blinky-bob { animation: none !important; }
  }
`;

function SectionHeading({ eyebrow, accent, subtitle }: { eyebrow: string; accent: string; subtitle?: string }) {
  return (
    <div className="mb-8 text-center">
      <div className="inline-block">
        <span className={`${accent} opacity-70`} aria-hidden="true">✦</span>
        <h2 className={`mt-2 -mr-[0.18em] text-2xl sm:text-3xl font-extrabold uppercase tracking-[0.18em] ${accent}`}>
          {eyebrow}
        </h2>
        <div className="mt-3 h-0.5 w-full rounded-full bg-current opacity-40" aria-hidden="true" />
      </div>
      {subtitle && (
        <p className="mt-3 text-lg sm:text-xl font-semibold text-inkverse-black dark:text-white">{subtitle}</p>
      )}
    </div>
  );
}

function Hero() {
  return (
    <section className="px-4 pt-12 pb-8 sm:pt-16 text-center">
      <div className="mx-auto max-w-3xl">
        <img
          src={BLINKY_IMG}
          alt="Blinky, the Inkverse mascot"
          className="blinky-bob mx-auto w-40 sm:w-52"
          style={{ animation: 'blinky-bob 6s ease-in-out infinite' }}
        />
        <h1 className="mt-3 text-5xl sm:text-6xl font-black leading-tight text-inkverse-black dark:text-white">
          Inkverse<span className="text-brand-pink"> Brand Assets</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-inkverse-black/80 dark:text-white/80">
          {INTRO_COPY}
        </p>
      </div>
    </section>
  );
}

function LogosAndMascot() {
  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Logos & Mascot"
          accent="text-brand-pink"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {BRAND_ASSETS.map((asset) => (
              <a
                key={asset.url}
                href={asset.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open ${asset.name} full size`}
                className={`flex flex-col rounded-2xl border-2 border-inkverse-black/10 dark:border-white/15 p-4 transition-transform hover:scale-105 ${asset.wide ? 'sm:col-span-2' : ''}`}
              >
                <div className="flex flex-1 items-center justify-center">
                  <img
                    src={asset.url}
                    alt={asset.alt}
                    loading="lazy"
                    className="max-h-40 sm:max-h-48 w-auto max-w-full object-contain"
                  />
                </div>
                <p className="mt-3 text-center text-sm font-bold">
                  {asset.name}
                </p>
              </a>
            ))}
          </div>
        <div className="mt-6 text-center">
          <a
            href={BRAND_ZIP_URL}
            download
            className="inline-block rounded-full bg-inkverse-black px-6 py-3 font-bold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-inkverse-black dark:hover:bg-gray-200"
          >
            Download All Logos & Mascots (.zip)
          </a>
        </div>
      </div>
    </section>
  );
}

function ComicLink() {
  const steps = [
    {
      title: 'On Web',
      detail: 'Search for your comic, click on it, and copy the link.',
      img: COMIC_LINK_WEB_IMG,
      imgAlt: "Screenshot showing how to copy your comic's link on the web",
    },
    {
      title: 'On iOS or Android',
      detail: "Search for your comic, click on it, and there is a Share icon on the top right of your comic's screen.",
      img: COMIC_LINK_MOBILE_IMG,
      imgAlt: "Screenshot showing the Share icon on your comic's screen in the app",
    },
  ];
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="How to get a link to your comic"
          accent="text-taddy-blue"
        />
        <div className="grid gap-8 sm:grid-cols-2">
          {steps.map((step) => (
            <div
              key={step.title}
              className="flex flex-col rounded-2xl border-2 border-taddy-blue/60 bg-white/60 dark:bg-[#FFF4EF] p-6 shadow-[6px_6px_0_0_theme(colors.taddy-blue)]"
            >
              <h3 className="text-xl font-extrabold text-taddy-blue">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-inkverse-black/80">{step.detail}</p>
              <img
                src={step.img}
                alt={step.imgAlt}
                loading="lazy"
                className="mt-6 w-full rounded-xl border-2 border-inkverse-black/10"
              />
            </div>
          ))}
        </div>
        <p className="mt-6 text-center leading-relaxed text-inkverse-black/80 dark:text-white/80">
          Both will generate the same link.
        </p>
      </div>
    </section>
  );
}

export default function BrandKit() {
  return (
    <div className="min-h-screen text-inkverse-black dark:text-white">
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <main>
        <Hero />
        <LogosAndMascot />
        <ComicLink />
      </main>
    </div>
  );
}
