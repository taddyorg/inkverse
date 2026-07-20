import { Link, type MetaFunction } from "react-router";
import { getMetaTags } from "@/lib/seo";

/* ---------------------------------------------------------------------------
 * EDIT THIS SECTION TO UPDATE THE PAGE (then redeploy)
 * ------------------------------------------------------------------------- */

const BRAND_KIT_PATH = '/brand-kit';
const OPEN_SOURCE_PATH = '/open-source';
const HIRING_EMAIL = 'danny@inkverse.co';
const BLINKY_IMG = 'https://ink0.inkverse.co/general/blinky.png';
const TADDY_UPLOAD_URL = 'https://taddy.org?ref=inkverse.co';

const INTRO_COPY = "There are no pop-ups on Inkverse, no nagging you for more coins every chapter, just a webtoons reader built for people who love webtoons and want to support their favourite indie creators.";

interface Feature {
  title: string;
  body: string;
  accent: {
    heading: string;
    card: string;
    shadow: string;
  };
}

const FEATURES: Feature[] = [
  {
    title: 'No Inkverse Originals',
    body: "Unlike other platforms, we don't create exclusive content. Every comic on Inkverse is independently owned by the comic creator who created it, so we have no incentive to promote our own content over yours.",
    accent: {
      heading: 'text-brand-purple',
      card: 'border-brand-purple/60',
      shadow: 'shadow-[6px_6px_0_0_theme(colors.brand-purple)]',
    },
  },
  {
    title: 'Patreon Early Access',
    body: 'Connect your Patreon account and make new episodes available exclusively to your patrons before they are released to everyone for free (A nice perk for your backers!)',
    accent: {
      heading: 'text-taddy-blue',
      card: 'border-taddy-blue/60',
      shadow: 'shadow-[6px_6px_0_0_theme(colors.taddy-blue)]',
    },
  },
  {
    title: 'No Lock-In',
    body: "Inkverse is open-source and uses an open comic format. Instead of hosting your comic on Inkverse, creators can self-host their comics or use other comic hosting services like Taddy. This means creators can grow their readership across comic platforms without being locked into Inkverse.",
    accent: {
      heading: 'text-brand-pink',
      card: 'border-brand-pink/60',
      shadow: 'shadow-[6px_6px_0_0_theme(colors.brand-pink)]',
    },
  },
  {
    title: 'Fast Pass',
    body: 'An upcoming feature that lets you earn money from your comics. Creators keep 85% of your earnings and we will be transparent about how much they earn and how much we charge in fees (most comic platforms are not transparent on this!)',
    accent: {
      heading: 'text-action-green',
      card: 'border-action-green/60',
      shadow: 'shadow-[6px_6px_0_0_theme(colors.action-green)]',
    },
  },
];

const TEAM = [
  {
    name: 'Daniel Mathews',
    role: 'Founder & Software Developer',
    bio: 'Hey, I\'m Danny. Before I built Taddy and Inkverse, I was the founder of Podyssey (Goodreads for Podcasts). I was also the an iOS Instructor at Lighthouse Labs, where I taught 100+ students across Canada how to build iOS and Android apps.',
    image: 'https://ax0.taddy.org/general/danny-avatar-2.jpg',
  },
];

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export const meta: MetaFunction = () => {
  return getMetaTags({
    title: "About Us - Inkverse Webtoons, Comics & Manga Reader",
    description: INTRO_COPY,
    url: "https://inkverse.co/about-us",
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
        <h1 className="mt-6 text-5xl sm:text-6xl font-black leading-tight text-inkverse-black dark:text-white">
          Welcome to <span className="text-brand-pink">Inkverse</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-inkverse-black/80 dark:text-white/80">
          {INTRO_COPY}
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-inkverse-black/80 dark:text-white/80">
          Inkverse is also{' '}
          <Link to={OPEN_SOURCE_PATH} className="font-bold text-brand-pink dark:text-taddy-blue underline underline-offset-4 hover:opacity-80">
            open-source
          </Link>
          {' '}. We invite you to contribute to the project.
        </p>
      </div>
    </section>
  );
}

function CreatorFeatures() {
  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Creator-Friendly"
          accent="text-brand-pink"
        />
        <div className="grid gap-8 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={`rounded-2xl border-2 bg-white/60 dark:bg-[#FFF4EF] p-6 ${feature.accent.card} ${feature.accent.shadow}`}
            >
              <h3 className={`text-xl font-extrabold ${feature.accent.heading}`}>{feature.title}</h3>
              <p className="mt-3 leading-relaxed text-inkverse-black/80">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Team() {
  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="Team" accent="text-brand-purple" />
        <div className="space-y-6">
          {TEAM.map((person) => (
            <div
              key={person.name}
              className="flex items-start gap-4 sm:gap-5 rounded-2xl border-2 border-brand-purple/60 bg-white/60 dark:bg-[#FFF4EF] p-6 shadow-[6px_6px_0_0_theme(colors.brand-purple)]"
            >
              {person.image && (
                <img
                  src={person.image}
                  alt={person.name}
                  className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-full object-cover border-2 border-brand-purple/60"
                />
              )}
              <div>
                <p className="text-xl font-extrabold text-inkverse-black">{person.name}</p>
                <p className="font-semibold text-brand-purple">{person.role}</p>
                <p className="mt-3 leading-relaxed text-inkverse-black/80">{person.bio}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center leading-relaxed text-inkverse-black/80 dark:text-white/80">
          Want to join the team? Email{' '}
          <a href={`mailto:${HIRING_EMAIL}`} className="font-bold text-brand-pink dark:text-taddy-blue underline underline-offset-4 hover:opacity-80">
            {HIRING_EMAIL}
          </a>
          {' '}(Vancouver-based applicants preferred).
        </p>
      </div>
    </section>
  );
}

function ForCreators() {
  return (
    <section className="px-4 py-8 pb-16">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="For Creators" accent="text-taddy-blue" />
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="flex flex-col rounded-2xl border-2 border-taddy-blue/60 bg-white/60 dark:bg-[#FFF4EF] p-8 text-center shadow-[6px_6px_0_0_theme(colors.taddy-blue)]">
            <p className="text-lg leading-relaxed text-inkverse-black/80">
              Want to add your comic to Inkverse?
            </p>
            <div className="mt-6 flex flex-1 items-end justify-center">
              <a
                href={TADDY_UPLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full bg-inkverse-black px-6 py-3 font-bold text-white transition-colors hover:bg-gray-800"
              >
                Add Your Comic
              </a>
            </div>
          </div>
          <div className="flex flex-col rounded-2xl border-2 border-taddy-blue/60 bg-white/60 dark:bg-[#FFF4EF] p-8 text-center shadow-[6px_6px_0_0_theme(colors.taddy-blue)]">
            <p className="text-lg leading-relaxed text-inkverse-black/80">
              Looking to promote your comic on Inkverse?
            </p>
            <div className="mt-6 flex flex-1 items-end justify-center">
              <Link
                to={BRAND_KIT_PATH}
                className="inline-block rounded-full border-2 border-inkverse-black px-6 py-3 font-bold text-inkverse-black transition-colors hover:bg-inkverse-black hover:text-white"
              >
                See Inkverse's Brand Assets
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AboutUs() {
  return (
    <div className="min-h-screen text-inkverse-black dark:text-white">
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <main>
        <Hero />
        <CreatorFeatures />
        <Team />
        <ForCreators />
      </main>
    </div>
  );
}
