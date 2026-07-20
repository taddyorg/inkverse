import { type ReactNode } from "react";
import { redirect, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { getMetaTags } from "@/lib/seo";

/* ---------------------------------------------------------------------------
 * EDIT THIS SECTION TO UPDATE THE PAGE (then redeploy)
 * ------------------------------------------------------------------------- */

const GITHUB_REPO_URL = 'https://github.com/taddyorg/inkverse';
const TADDY_API_URL = 'https://taddy.org/developers/comics-api';
const SSS_DOCS_URL = `${GITHUB_REPO_URL}/blob/main/docs/sss-exclusive-content.md`;

const INTRO_COPY = "Inkverse is an open-source webtoons platform. You can read the code, contribute a feature, or fork the whole thing and make your own comic app.";

interface Accent {
  heading: string;
  card: string;
  shadow: string;
}

const ACCENTS: Accent[] = [
  {
    heading: 'text-brand-pink',
    card: 'border-brand-pink/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.brand-pink)]',
  },
  {
    heading: 'text-brand-purple',
    card: 'border-brand-purple/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.brand-purple)]',
  },
  {
    heading: 'text-taddy-blue',
    card: 'border-taddy-blue/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.taddy-blue)]',
  },
  {
    heading: 'text-action-green',
    card: 'border-action-green/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.action-green)]',
  },
];

const CODEBASE = [
  {
    title: 'Website',
    body: 'A React app.',
    url: `${GITHUB_REPO_URL}/tree/main/website`,
  },
  {
    title: 'Mobile Apps',
    body: 'A React Native app (Expo) for iOS and Android.',
    url: `${GITHUB_REPO_URL}/tree/main/react-native`,
  },
  {
    title: 'GraphQL API',
    body: 'The main server for Inkverse (a GraphQL API).',
    url: `${GITHUB_REPO_URL}/tree/main/graphql-server`,
  },
  {
    title: 'Worker',
    body: 'For background jobs and useful scripts. We use queues for event-driven workflows, ex) sending an email in the background.',
    url: `${GITHUB_REPO_URL}/tree/main/worker`,
  },
];

const FAQS = [
  {
    question: 'Is Inkverse open-source?',
    answer: [
      "Yes! Inkverse is open-sourced under an AGPL license, ie) you can fork it, rebrand it, and tweak it however you want (including for commercial reasons). One important note with AGPL is that it is a copy-left license, meaning your updates must also be open-source. That is, if you are benefiting from using our open-source code, we are also asking you to open-source your updates.",
    ],
  },
  {
    question: 'Does Inkverse host comics?',
    answer: [
      "Creators don't upload comics to Inkverse and Inkverse doesn't host any comics. Inkverse can display any comic that follows the open-source comic format.",
    ],
  },
  {
    question: 'Why use an open-source comic format?',
    answer: [
      "An open-source comic format is creator-friendly. Creators keep all their IP rights and aren't locked into any one comic hosting platform (a creator can always leave their current hosting provider, host their own comic, and keep all their readers across all the comic reading apps).",
      "As an analogy, this is the same distribution model used by podcasts (RSS) and is why you can listen to podcasts on any podcast app (Apple, Spotify, Overcast, PocketCast, etc) and why podcast creators aren't locked into any one tech content platform.",
    ],
  },
  {
    question: 'How does Inkverse make money? How would your comic app make money?',
    answer: [
      "Right now, Inkverse does not make money. However, we plan to by building our own version of FastPass and adding support for Ads to unlock content.",
      "FastPass: On many comic platforms, you can unlock the latest episodes with coins (FastPass), however, creators have to give up their IP rights and be exclusive to the platform to get access to FastPass. Our goal is to make FastPass for indie creators, where creators keep all their IP rights, creators keep 85%+ of all revenue, and hosting providers and comic apps split the remaining revenue (credit card and additional fees are transparent).",
      "Ads: Instead of using coins, a creator can choose to allow readers to unlock exclusive episodes by watching an ad. Hosting providers and comic apps will take a rev-share on ad revenue."
    ],
  },
];

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export const loader = ({ params }: LoaderFunctionArgs) => {
  if (params.slug) { throw redirect("/open-source", 301); }
  return null;
};

export const meta: MetaFunction = () => {
  return getMetaTags({
    title: "Open Source",
    description: INTRO_COPY,
    url: "https://inkverse.co/open-source",
  });
};

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
        <h1 className="text-5xl sm:text-6xl font-black leading-tight text-inkverse-black dark:text-white">
          Inkverse is <span className="text-brand-pink">Open Source</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-inkverse-black/80 dark:text-white/80">
          {INTRO_COPY}
        </p>
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-full bg-inkverse-black px-6 py-3 font-bold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-inkverse-black dark:hover:bg-gray-200"
        >
          View on GitHub
        </a>
      </div>
    </section>
  );
}

function Codebase() {
  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="The Codebase"
          accent="text-brand-pink"
        />
        <div className="grid gap-8 sm:grid-cols-2">
          {CODEBASE.map((project, index) => {
            const accent = ACCENTS[index % ACCENTS.length];
            return (
              <a
                key={project.title}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group rounded-2xl border-2 bg-white/60 dark:bg-white p-6 ${accent.card} ${accent.shadow}`}
              >
                <h3 className={`text-xl font-extrabold ${accent.heading}`}>
                  {project.title}
                  <span aria-hidden="true" className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                </h3>
                <p className="mt-3 leading-relaxed text-inkverse-black/80">{project.body}</p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DiagramNode({ label, small }: { label: string; small?: boolean }) {
  return (
    <div className={`rounded-xl border border-inkverse-black/10 dark:border-white/10 bg-white dark:bg-white/10 text-center font-bold text-inkverse-black dark:text-white shadow-sm ${small ? 'px-4 py-2 text-sm' : 'px-6 py-4'}`}>
      {label}
    </div>
  );
}

function DiagramTier({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-brand-purple/60 p-4 sm:p-6">
      <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-purple">{label}</p>
      {children}
    </div>
  );
}

function DiagramArrow() {
  return (
    <div aria-hidden="true" className="py-2 text-center text-2xl leading-none text-inkverse-black/50 dark:text-white/50">
      ↓
    </div>
  );
}

function Architecture() {
  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="Architecture" accent="text-brand-purple" />
        <div
          role="img"
          aria-label="Diagram of the Inkverse architecture: the Website and Mobile Apps talk to the GraphQL API and Worker scripts, which use queues and store data in Postgres and Redis"
          className="rounded-2xl border-2 border-brand-purple/60 bg-white/60 dark:bg-white/5 p-4 sm:p-8 shadow-[6px_6px_0_0_theme(colors.brand-purple)]"
        >
          <DiagramTier label="Frontend">
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
              <DiagramNode label="Website" />
              <DiagramNode label="Mobile Apps" />
            </div>
          </DiagramTier>
          <DiagramArrow />
          <DiagramTier label="Backend">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <DiagramNode label="GraphQL API" />
              <div className="flex items-center justify-center gap-2 sm:gap-4">
                <DiagramNode label="Worker scripts" />
                <span aria-hidden="true" className="text-xl text-inkverse-black/50 dark:text-white/50">⇄</span>
                <div>
                  <p className="mb-1 text-center text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-inkverse-black/60 dark:text-white/60">Queues</p>
                  <DiagramNode label="High Priority" small />
                </div>
              </div>
            </div>
          </DiagramTier>
          <DiagramArrow />
          <DiagramTier label="Storage">
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
              <DiagramNode label="Postgres" />
              <DiagramNode label="Redis" />
            </div>
          </DiagramTier>
        </div>
      </div>
    </section>
  );
}

function Contributing() {
  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="Contributing" accent="text-taddy-blue" />
        <div className="grid gap-8 sm:grid-cols-2">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-2xl border-2 border-taddy-blue/60 bg-white/60 dark:bg-white p-8 shadow-[6px_6px_0_0_theme(colors.taddy-blue)]"
          >
            <h3 className="text-xl font-extrabold text-taddy-blue">
              Quick Setup
              <span aria-hidden="true" className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </h3>
            <p className="mt-3 leading-relaxed text-inkverse-black/80">
              If you want to tweak styling or make smaller feature upgrades, you can get the Inkverse web or mobile apps running locally in a couple of minutes, without running the backend.
            </p>
            <div className="mt-6 flex flex-1 items-end">
              <span className="font-bold text-brand-pink underline underline-offset-4 group-hover:opacity-80">
                Follow the Quick Setup instructions
              </span>
            </div>
          </a>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-2xl border-2 border-taddy-blue/60 bg-white/60 dark:bg-white p-8 shadow-[6px_6px_0_0_theme(colors.taddy-blue)]"
          >
            <h3 className="text-xl font-extrabold text-taddy-blue">
              Full Setup
              <span aria-hidden="true" className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </h3>
            <p className="mt-3 leading-relaxed text-inkverse-black/80">
              If you want to add a brand new feature, you probably will need to run Inkverse's backend as well.
            </p>
            <div className="mt-6 flex flex-1 items-end">
              <span className="font-bold text-brand-pink underline underline-offset-4 group-hover:opacity-80">
                Follow the Full Setup instructions
              </span>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

function ToolsWeUse() {
  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="Tools We Use" accent="text-action-green" />
        <div className="space-y-8">
          <a
            href={TADDY_API_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl border-2 border-action-green/60 bg-white/60 dark:bg-white p-6 shadow-[6px_6px_0_0_theme(colors.action-green)]"
          >
            <h3 className="text-xl font-extrabold text-action-green">
              Taddy Webcomics API
              <span aria-hidden="true" className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed text-inkverse-black/80">
              <li>To get a list of all comics that use the SSS open-standard.</li>
              <li>For search.</li>
              <li>To get a webhook notification whenever a new comic or new episode is released.</li>
            </ul>
            <p className="mt-3 leading-relaxed text-inkverse-black/80">
              Taddy API is a useful tool, but can cost money if you make a lot of requests to the API. If you choose to fork Inkverse to make your own comic app, you can implement this yourself — you don't have to use Taddy API if you don't find it helpful or don't want to pay for it.
            </p>
          </a>
          <a
            href={SSS_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl border-2 border-action-green/60 bg-white/60 dark:bg-white p-6 shadow-[6px_6px_0_0_theme(colors.action-green)]"
          >
            <h3 className="text-xl font-extrabold text-action-green">
              The comicseries open-standard
              <span aria-hidden="true" className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </h3>
            <p className="mt-3 leading-relaxed text-inkverse-black/80">
              All the comics on Inkverse are self-hosted and use the comicseries open-standard format (SSS). As long as a comic uses that exact format, it can be displayed on Inkverse.
            </p>
          </a>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="px-4 py-8 pb-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          accent="text-brand-pink"
        />
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-inkverse-black/10 bg-white/60 dark:bg-white open:bg-white"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 text-lg font-extrabold text-inkverse-black [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span className="text-brand-pink transition-transform group-open:rotate-45" aria-hidden="true">✦</span>
              </summary>
              <div className="px-5 pb-5">
                {faq.answer.map((paragraph, index) => (
                  <p
                    key={paragraph}
                    className={`${index === 0 ? '' : 'mt-3'} leading-relaxed text-inkverse-black/80`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function OpenSource() {
  return (
    <div className="min-h-screen text-inkverse-black dark:text-white">
      <main>
        <Hero />
        <Codebase />
        <Architecture />
        <Contributing />
        <ToolsWeUse />
        <Faq />
      </main>
    </div>
  );
}
