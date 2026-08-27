import { type MetaFunction } from "react-router";
import { getMetaTags } from "@/lib/seo";
import { linkIconNames } from "@inkverse/shared-client/utils/link-icons";
import { LinkType } from "@inkverse/shared-client/graphql/operations";

/* ---------------------------------------------------------------------------
 * EDIT THIS SECTION TO UPDATE THE PAGE (then redeploy)
 * ------------------------------------------------------------------------- */

const BRAND_ZIP_URL = 'https://ink0.inkverse.co/general/inkverse-logos-mascots-stickers-2.zip';
const COMIC_LINK_WEB_IMG = 'https://ink0.inkverse.co/general/comic-unique-link-web-snipped.jpg';
const COMIC_LINK_MOBILE_IMG = 'https://ax0.taddy.org/general/comic-unique-link-2.jpg';
const BLINKY_IMG = 'https://ink0.inkverse.co/general/blinky.png';

interface BrandAsset {
  name: string;
  url: string;
  alt: string;
  secondaryText?: string;
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
  // {
  //   name: 'Read on Inkverse',
  //   url: 'https://ink0.inkverse.co/general/read-on-inkverse-mascot.png',
  //   alt: 'Blinky holding a "Read On" sign',
  // },
  // {
  //   name: 'Read on Inkverse — Badge',
  //   url: 'https://ink0.inkverse.co/general/read-on-inkverse-badge.png',
  //   alt: 'Read on Inkverse badge with Blinky',
  //   wide: true,
  // },
  {
    name: 'Dancing Blinky #1 - Sticker',
    url: 'https://ink0.inkverse.co/general/dancing-blinky-1.gif',
    alt: 'Dancing Blinky #1 holding a "Read On" sign',
    secondaryText: 'Search for #read-on-inkverse on Instagram or TikTok',
  },
  {
    name: 'Dancing Blinky #2 - Sticker',
    url: 'https://ink0.inkverse.co/general/dancing-blinky-2.gif',
    alt: 'Dancing Blinky #1 holding a "Read On" sign',
    secondaryText: 'Search for #read-on-inkverse on Instagram or TikTok',
  },
  {
    name: 'Dancing Blinky #3 - Sticker',
    url: 'https://ink0.inkverse.co/general/dancing-blinky-3.gif',
    alt: 'Dancing Blinky #2 holding a "Read On" sign',
    secondaryText: 'Search for #read-on-inkverse on Instagram or TikTok',
  },
];

const INTRO_COPY = "Yay! You've added your comic to Inkverse! Follow these steps to let your readers where to read your comic.";

const SOCIAL_PLATFORMS: { name: string; type: LinkType }[] = [
  { name: 'Instagram', type: LinkType.INSTAGRAM },
  { name: 'TikTok', type: LinkType.TIKTOK },
  { name: 'Bluesky', type: LinkType.BLUESKY },
  { name: 'Patreon', type: LinkType.PATREON },
];

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

function SectionHeading({ eyebrow, accent, subtitle, step }: { eyebrow: string; accent: string; subtitle?: string; step?: number }) {
  return (
    <div className="mb-8 text-center">
      <div className="inline-block">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {step ? (
            <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-current text-lg font-black ${accent}`}>
              <span className="text-white">{step}</span>
            </span>
          ) : (
            <span className={`${accent} opacity-70`} aria-hidden="true">✦</span>
          )}
          <h2 className={`-mr-[0.08em] sm:-mr-[0.18em] text-left sm:text-center text-xl sm:text-3xl font-extrabold uppercase tracking-[0.08em] sm:tracking-[0.18em] ${accent}`}>
            {eyebrow}
          </h2>
        </div>
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
          step={1}
          eyebrow="Pick an Image or Animated Sticker"
          accent="text-taddy-blue"
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
                {asset.secondaryText && (
                  <p className="mt-1 text-center text-sm text-inkverse-black/70 dark:text-white/70">
                    {asset.secondaryText}
                  </p>
                )}
              </a>
            ))}
          </div>
        <div className="mt-6 text-center">
          <a
            href={BRAND_ZIP_URL}
            download
            className="inline-block rounded-full bg-inkverse-black px-6 py-3 font-bold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-inkverse-black dark:hover:bg-gray-200"
          >
            Download All Logos, Mascots & Stickers (.zip)
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
          step={2}
          eyebrow="Get the Link to Your Comic"
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
      </div>
    </section>
  );
}

function TellYourAudience() {
  return (
    <section className="px-4 py-8 pb-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          step={3}
          eyebrow="Tell Your Fans About Your Comic"
          accent="text-taddy-blue"
        />
        <p className="mx-auto max-w-2xl text-center text-lg leading-relaxed text-inkverse-black/80 dark:text-white/80">
          Let your fans on Instagram, TikTok, Bluesky, and Patreon know where to read your comic.
        </p>
        <div className="mt-8 flex items-start justify-center gap-10 sm:gap-14">
          {SOCIAL_PLATFORMS.map((platform) => (
            <div key={platform.name} className="flex flex-col items-center">
              <img
                src={`https://ax0.taddy.org/brands/${linkIconNames[platform.type]}.svg`}
                alt={`${platform.name} logo`}
                loading="lazy"
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain dark:brightness-0 dark:invert"
              />
              <p className="mt-3 text-sm font-bold">{platform.name}</p>
            </div>
          ))}
        </div>
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
        <TellYourAudience />
      </main>
    </div>
  );
}
