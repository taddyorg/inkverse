import { type MetaFunction } from "react-router";
import { getMetaTags } from "@/lib/seo";

/* ---------------------------------------------------------------------------
 * EDIT THIS SECTION TO UPDATE THE PAGE (then redeploy)
 * ------------------------------------------------------------------------- */

const INTRO_COPY = "Here is everything we've shipped so far and what's coming next.";

interface Accent {
  heading: string;
  card: string;
  shadow: string;
  marker: string;
}

const ACCENTS: Accent[] = [
  {
    heading: 'text-brand-pink',
    card: 'border-brand-pink/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.brand-pink)]',
    marker: 'border-brand-pink',
  },
  {
    heading: 'text-brand-purple',
    card: 'border-brand-purple/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.brand-purple)]',
    marker: 'border-brand-purple',
  },
  {
    heading: 'text-taddy-blue',
    card: 'border-taddy-blue/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.taddy-blue)]',
    marker: 'border-taddy-blue',
  },
  {
    heading: 'text-action-green',
    card: 'border-action-green/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.action-green)]',
    marker: 'border-action-green',
  },
];

type Bullet = string | { lead: string; body: string };

interface Drop {
  drop: number;
  title: string;
  status: 'completed' | 'upcoming';
  completedDate?: string;
  bullets: Bullet[];
}

const DROPS: Drop[] = [
  {
    drop: 0,
    title: 'Launch new iOS, Android and Website for Inkverse',
    status: 'completed',
    completedDate: 'April 7, 2025',
    bullets: [
      'Now open-source + rebuilt in TypeScript',
    ],
  },
  {
    drop: 1,
    title: 'Signup / Login',
    status: 'completed',
    completedDate: 'July 14, 2025',
    bullets: [
      'Bring back signup / login so that users can recommend comics, save comics to lists etc.',
      'Add login with Google or Apple option (vs old Inkverse app required typing in your email)',
      'Ability to subscribe to a comic (which adds it to your profile)',
      'Bring back Patreon integration so that a paid Patreon backer can read exclusive comics',
      'Build out the Profile Screen',
    ],
  },
  {
    drop: 2,
    title: 'Comments & Likes per episode',
    status: 'completed',
    completedDate: 'April 10, 2026',
    bullets: [
      'Comment on an episode',
      'Like an episode',
      'Super-Like (lets you like all episodes for a comic)',
      'Creator Profiles (combine user profile + creator profile into one account)',
      'Creators get an email when they get a new comment, their comic gets added to a list etc.',
    ],
  },
  {
    drop: 3,
    title: 'Track your read episodes & new List Tab',
    status: 'upcoming',
    bullets: [
      "Tracking reading history (right now, the app doesn't show you where you left off in a comic, and always highlights episode 1)",
      "Add a new tab at the bottom of the screen where you can see comics in certain lists. It will have 'Recent', 'Subscribed', 'To Read', 'My Favourites' + any of your custom lists.",
      "Ability to add a custom list ('To Read', 'My Favourites', etc.)",
      'Ability to mark a comic as up-to-date for your reading history',
      'Show creators which panels users liked',
    ],
  },
  {
    drop: 4,
    title: 'Character Sheets / Fan Art',
    status: 'upcoming',
    bullets: [
      'Creators can add character sheets to their comic',
      'Creators can showcase fan art',
      'Creators can post any new art they are working on',
    ],
  },
  {
    drop: 5,
    title: 'Recommendations',
    status: 'upcoming',
    bullets: [
      'Ability to recommend a comic',
      'Bring back your old recommendations',
    ],
  },
  {
    drop: 6,
    title: 'New Discovery / Home Screen',
    status: 'upcoming',
    bullets: [
      'Have better ways to discover comics. Some ideas include:',
      'Indie focused home feed algorithm',
      'New Search Screen',
      'Filters on Home Screen catered to tags or genres',
      'Push notifications to remind you to come back to a comic you started reading',
    ],
  },
  {
    drop: 7,
    title: 'FastPass / Ads to unlock content',
    status: 'upcoming',
    bullets: [
      {
        lead: 'FastPass',
        body: "Currently webtoons platforms allow readers to unlock the latest episodes with coins (FastPass), however, the creators have to give up their IP rights and be exclusive to the platform to get access to FastPass. Our goal is to make a FastPass where indie creators get to keep all their IP rights, keep 80%+ of all revenue, and are transparent on how much money they earned and how much we charged in fees.",
      },
      {
        lead: 'Ads to unlock content',
        body: 'Instead of coins, a creator can choose to allow readers to unlock exclusive episodes by watching an Ad.',
      },
    ],
  },
];

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export const meta: MetaFunction = () => {
  return getMetaTags({
    title: "Inkverse Webtoons & Webcomics - Roadmap",
    description: INTRO_COPY,
    url: "https://inkverse.co/our-roadmap",
  });
};

const pageStyles = `
  @keyframes marker-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.6; }
  }
  @media (prefers-reduced-motion: reduce) {
    .marker-pulse { animation: none !important; }
  }
`;

function Hero() {
  return (
    <section className="px-4 pt-12 pb-6 sm:pt-16 text-center">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-5xl sm:text-6xl font-black leading-tight text-inkverse-black dark:text-white">
        Inkverse <span className="text-brand-pink">Roadmap</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-inkverse-black/80 dark:text-white/80">
          If you have feedback or suggestions, please email us at{' '}
          <a href="mailto:danny@inkverse.co" className="font-bold text-brand-pink dark:text-taddy-blue underline underline-offset-4 hover:opacity-80">
            danny@inkverse.co
          </a>
        </p>
      </div>
    </section>
  );
}

function StatusPill({ drop }: { drop: Drop }) {
  if (drop.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-action-green/60 px-3 py-1 text-sm font-bold text-action-green">
        ✓ Completed {drop.completedDate}
      </span>
    );
  }
  const isUpNext = drop.drop === DROPS.find((d) => d.status === 'upcoming')?.drop;
  if (isUpNext) {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded-full border-2 border-brand-pink/60 px-3 py-1 text-sm font-bold text-brand-pink">
        Up next
      </span>
    );
  }
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border-2 border-inkverse-black/30 px-3 py-1 text-sm font-bold text-inkverse-black/60 dark:border-white/30 dark:text-white/60">
      Planned
    </span>
  );
}

function TimelineMarker({ drop, accent }: { drop: Drop; accent: Accent }) {
  if (drop.status === 'completed') {
    return (
      <span
        className="absolute -left-[15px] top-5 flex h-7 w-7 items-center justify-center rounded-full bg-action-green text-sm font-bold text-white"
        aria-hidden="true"
      >
        ✓
      </span>
    );
  }
  const isUpNext = drop.drop === DROPS.find((d) => d.status === 'upcoming')?.drop;
  return (
    <span
      className={`marker-pulse absolute -left-[15px] top-5 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-paper-pink dark:bg-inkverse-black ${accent.marker} text-sm font-extrabold ${accent.heading}`}
      style={isUpNext ? { animation: 'marker-pulse 3s ease-in-out infinite' } : undefined}
      aria-hidden="true"
    >
      {drop.drop}
    </span>
  );
}

function DropCard({ drop, accent }: { drop: Drop; accent: Accent }) {
  return (
    <div className={`rounded-2xl border-2 bg-white/60 dark:bg-white/5 p-6 ${accent.card} ${accent.shadow}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-extrabold uppercase tracking-[0.18em] ${accent.heading}`}>
            Drop {drop.drop}
          </p>
          <h3 className="mt-1 text-xl font-extrabold text-inkverse-black dark:text-white">{drop.title}</h3>
        </div>
        <StatusPill drop={drop} />
      </div>
      <ul className="mt-4 list-disc pl-5 space-y-1.5 leading-relaxed text-inkverse-black/80 dark:text-white/80">
        {drop.bullets.map((bullet, index) => (
          <li key={index}>
            {typeof bullet === 'string' ? bullet : (
              <>
                <span className="font-bold text-inkverse-black dark:text-white">{bullet.lead}</span>
                {' — '}
                {bullet.body}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Timeline() {
  return (
    <section className="px-4 pt-4 pb-24">
      <div className="mx-auto max-w-3xl">
        {/* <SectionHeading eyebrow="The Drops" accent="text-brand-purple" /> */}
        <ol className="relative ml-3 border-l-2 border-inkverse-black/15 dark:border-white/15 sm:ml-4">
          {DROPS.map((drop, index) => (
            <li key={drop.drop} className="relative pl-8 pb-6 last:pb-0 sm:pl-10">
              <TimelineMarker drop={drop} accent={ACCENTS[index % ACCENTS.length]} />
              <DropCard drop={drop} accent={ACCENTS[index % ACCENTS.length]} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function OurRoadmap() {
  return (
    <div className="min-h-screen text-inkverse-black dark:text-white">
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <main>
        <Hero />
        <Timeline />
      </main>
    </div>
  );
}
