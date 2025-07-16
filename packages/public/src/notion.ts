export const NotionPage = {
  HOME: { id: "ef477dc32ff041c8a7313cd57351c3f7", path: "/" },
  SUPPORT: { id: "dd3f50c0a2f94216bca3d35f71ccd3e8", path: "/support" },
  ADD_YOUR_COMIC_TO_INKVERSE: { id: "33d6efdfef2849ca95784f9953506643", path: "/support/add-your-comic-to-inkverse" },
  BLOG: { id: "fc0e58aacbb04e74b7172977be60e72e", path: "/blog" },
  BEST_VAMPIRE_WEBTOONS: { id: "8cbd0fd824bd4dafbc93a2741c61e0b3", path: "/blog/best-vampire-webtoons" },
  BEST_ROMANCE_WEBTOONS: { id: "59ad2f983ac1454f832db7756da4a5ef", path: "/blog/best-romance-webtoons-to-read" },
  BEST_SUPERNATURAL_WEBTOONS: { id: "ce18c8b2fa3c4af98744adbbf878ce03", path: "/blog/best-supernatural-webtoons-to-read" },
  BEST_BOYSLOVE_WEBTOONS: { id: "5bd0c6f188084f738307aeec964aa02e", path: "/blog/best-boyslove-webtoons-recommend" },
  BEST_GIRLSLOVE_WEBTOONS: { id: "128332bebe3f8017bf72cf167afa7e37", path: "/blog/best-girls-love-webtoons-to-read" },
  BEST_LGBT_GAY_WEBTOONS: { id: "132332bebe3f80e593d0e1b7526aabed", path: "/blog/best-lgbt-gay-webtoons" },
  BEST_CANVAS_WEBTOONS: { id: "137332bebe3f80de8eb0ce097f7e6af0", path: "/blog/best-canvas-webtoons-to-read" },
  BEST_ACTION_WEBTOONS: { id: "aff56802b1ae493c89aea0eb95ca433d", path: "/blog/best-action-webtoons-we-recommend" },
  BEST_WEBTOONS_OF_ALL_TIME: { id: "12e332bebe3f8074bc37c038e10909b6", path: "/blog/best-webtoons-of-all-time" },
  APP_UPDATES: { id: "5c29ee8546e142b1b72de04eae36960d", path: "/updates" },
  APP_UPDATES_NEW_APP_LAUNCHED: { id: "1b9332bebe3f80cd8437e457f71ebbf0", path: "/updates/new-app-launched" },
  APP_UPDATES_ROADMAP: { id: "1bc332bebe3f80ec8bc2d14b3ff5ceec", path: "/updates/our-roadmap" },
  APP_UPDATES_INKVERSE2DOT0: { id: "230332bebe3f8055bd1ac78b311867f5", path: "/updates/inkverse-2dot0" },
  BRAND_KIT: { id: "a900cc4737e045c7aec5312df1ce741a", path: "/brand-kit" },
  ABOUT_US: { id: "334d2f916f2948d5b9e470dc0473527b", path: "/about-us" },
  OPEN_SOURCE: { id: "12b332bebe3f80f9a197eb8e60525e72", path: "/open-source" },
  OPEN_SOURCE_FORK_INKVERSE: { id: "12b332bebe3f80cab980f7a0ead01c2b", path: "/open-source/fork-inkverse" },
  TERMS_OF_SERVICE: { id: "ce1fc05e5ae3477284ebda8cbe8f506e", path: "/terms-of-service" },
  PRIVACY_POLICY: { id: "5ad172e9fc834d1bb5a61b030ef5cd82", path: "/terms-of-service/privacy-policy" },
  CONTENT_POLICY: { id: "2705be9449fa410480224a7d2b23d61c", path: "/terms-of-service/content-policy" },
  CODE_OF_CONDUCT: { id: "b4ba94c1f40349a1912450df246dbb79", path: "/terms-of-service/code-of-conduct" },
} as const;

export type BlogPost = {
  priority: string,
  title?: string,
  description?: string,
  url?: string,
  imageURL?: string,
  author?: { name: string, url: string }
}

export const additionalInfoForNotionId: { [key: string]: BlogPost } = {
  [NotionPage.HOME.path]: {
    priority: '1.0',
  },
  [NotionPage.SUPPORT.path]: {
    priority: '0.8',
  },
  [NotionPage.ADD_YOUR_COMIC_TO_INKVERSE.path]: {
    priority: '0.8',
  },
  [NotionPage.ABOUT_US.path]: {
    priority: '0.9',
  },
  [NotionPage.BRAND_KIT.path]: {
    priority: '0.8',
  },
  [NotionPage.OPEN_SOURCE.path]: {
    priority: '0.8',
  },
  [NotionPage.OPEN_SOURCE_FORK_INKVERSE.path]: {
    priority: '0.8',
  },
  [NotionPage.BLOG.path]: {
    priority: '0.9',
  },
  [NotionPage.BEST_VAMPIRE_WEBTOONS.path]: {
    priority: '0.9',
    title: "The 10 Best Vampire Webtoons To Fit Everyone's Taste",
    description: "Have you ever hungered for an amazing vampire webtoon but don't know where to start? Here are 10 amazing vampire comics to read, no matter what your personal taste.",
    url: 'https://inkverse.co/blog/best-vampire-webtoons',
    imageURL: 'https://ink0.inkverse.co/blog/best-vampire-comics/best-vampire-webtoons-banner.webp',
    author: {
      name: 'Eleanor Tremeer',
      url: 'https://twitter.com/extratremeerial',
    }
  },
  [NotionPage.BEST_ROMANCE_WEBTOONS.path]: {
    priority: '0.9',
    title: 'The 10 Best Romance Webtoons You Need To Read',
    description: 'From love triangles to polyamory, fake dating and enemies to lovers, this list of the best romance webtoons will have you swooning!',
    url: 'https://inkverse.co/blog/best-romance-webtoons',
    imageURL: 'https://ink0.inkverse.co/blog/best-romance-webtoons/best-romance-webtoons.webp',
    author: {
      name: 'Eleanor Tremeer',
      url: 'https://twitter.com/extratremeerial',
    }
  },
  [NotionPage.BEST_SUPERNATURAL_WEBTOONS.path]: {
    priority: '0.9',
    title: 'The 10 Best Supernatural Webtoons That We Recommend',
    description: 'Spooky toons and gothic romances! The supernatural webtoon genre truly has everything — and these are the best comics that we recommend.',
    url: 'https://inkverse.co/blog/best-supernatural-webtoons-to-read',
    imageURL: 'https://ink0.inkverse.co/blog/best-supernatural-webtoons/supernatural-webtoons-banner.png',
    author: {
      name: 'Eleanor Tremeer',
      url: 'https://twitter.com/extratremeerial',
    }
  },
  [NotionPage.BEST_BOYSLOVE_WEBTOONS.path]: {
    priority: '0.9',
    title: "The 10 Best Boys Love Webtoons We Can't Stop Reading",
    description: "Boys love webtoons can be hard to find, but whether you want wholesome high school romances, or spicy mature affairs, we've got you covered!",
    url: 'https://inkverse.co/blog/best-boyslove-webtoons-recommend',
    imageURL: 'https://ink0.inkverse.co/blog/best-boyslove-webtoons-images/boyslove-webtoons-banner.png',
    author: {
      name: 'Eleanor Tremeer',
      url: 'https://twitter.com/extratremeerial',
    }
  },
  [NotionPage.BEST_GIRLSLOVE_WEBTOONS.path]: {
    priority: '0.9',
    title: "The 10 Best Girls Love Romance Webtoons To Fall In Love With",
    description: "Girls love webtoons can be hard to find, so we've collected the 10 best girlslove romances you're bound to fall in love with!",
    url: 'https://inkverse.co/blog/best-girls-love-webtoons-to-read',
    imageURL: 'https://ink0.inkverse.co/blog/girlslove-webtoons-images/best-girlslove-webtoons-banner.webp',
    author: {
      name: 'Eleanor Tremeer',
      url: 'https://twitter.com/extratremeerial',
    }
  },
  [NotionPage.BEST_LGBT_GAY_WEBTOONS.path]: {
    priority: '0.9',
    title: "The 10 Best Gay Webtoons Of All Time",
    description: "Good LGBT representation can be hard to find, but there are plenty of gay webtoons out there! We count down our 10 favourite queer webtoons, from romances to heartfelt real life stories.",
    url: 'https://inkverse.co/blog/best-lgbt-gay-webtoons',
    imageURL: 'https://ink0.inkverse.co/blog/best-lgbtq-webtoons-banner.jpg',
    author: {
      name: 'Eleanor Tremeer',
      url: 'https://twitter.com/extratremeerial',
    }
  },
  [NotionPage.BEST_CANVAS_WEBTOONS.path]: {
    priority: '0.9',
    title: "The 10 Best Indie & Canvas Webtoons Of All Time",
    description: "Indie comics can be hard to find, so we've collected the best Canvas webtoons of all time! Whatever your genre, you'll find it here.",
    url: 'https://inkverse.co/blog/best-canvas-webtoons-to-read',
    imageURL: 'https://ink0.inkverse.co/blog/best-canvas-webtoons-banner.jpg',
    author: {
      name: 'Eleanor Tremeer',
      url: 'https://twitter.com/extratremeerial',
    }
  },
  [NotionPage.BEST_ACTION_WEBTOONS.path]: {
    priority: '0.9',
    title: "The 10 Best Action Webtoons That We Recommend",
    description: "From scifi to fantasy, action webtoons span so many genres it can be hard to know what to read next! So here are the 10 action webtoons we think are the best.",
    url: 'https://inkverse.co/blog/best-action-webtoons-we-recommend',
    imageURL: 'https://ink0.inkverse.co/blog/best-action-webtoons-banner.jpg',
    author: {
      name: 'Eleanor Tremeer',
      url: 'https://twitter.com/extratremeerial',
    }
  },
  [NotionPage.BEST_WEBTOONS_OF_ALL_TIME.path]: {
    priority: '0.9',
    title: "The 20 Best Webtoons of All Time, Ranked",
    description: "There are so many webtoons that sometimes it can be hard to pick what to read next. So, we've rounded up 20 of the most popular webtoons to make your choice easier!",
    url: 'https://inkverse.co/blog/best-webtoons-of-all-time',
    imageURL: 'https://ink0.inkverse.co/blog/best-webtoons-images/best-webtoons-banner.webp',
    author: {
      name: 'Daniel Mathews',
      url: 'https://dmathewwws.com',
    }
  },
  [NotionPage.APP_UPDATES.path]: {
    priority: '0.9',
    title: "A list of all the updates to the Inkverse app",
    description: "We've been working on the Inkverse app and we wanted to share a list of all the updates we've made to the app so far!",
    url: 'https://inkverse.co/updates',
    imageURL: 'https://ink0.inkverse.co/blog/best-webtoons-images/best-webtoons-banner.webp',
    author: {
      name: 'Daniel Mathews',
      url: 'https://dmathewwws.com',
    }
  },
  [NotionPage.APP_UPDATES_NEW_APP_LAUNCHED.path]: {
    priority: '0.9',
    title: "New Inkverse app has been launched!",
    description: "We're excited to announce that the new iOS, Android and Web Inkverse app has been launched!",
    url: 'https://inkverse.co/updates/new-app-launched',
    author: {
      name: 'Daniel Mathews',
      url: 'https://dmathewwws.com',
    }
  },
  [NotionPage.APP_UPDATES_INKVERSE2DOT0.path]: {
    priority: '0.8',
    title: "Inkverse 2.0 has been launched!",
    description: "We're excited to announce that the new Inkverse app has been launched!",
    url: 'https://inkverse.co/updates/inkverse-2dot0',
    author: {
      name: 'Daniel Mathews',
      url: 'https://dmathewwws.com',
    }
  },
  [NotionPage.APP_UPDATES_ROADMAP.path]: {
    priority: '0.8',
    title: "Our roadmap for the Inkverse app",
    description: "We've been working on the Inkverse app and we wanted to share a list of all the updates we've made to the app so far!",
    url: 'https://inkverse.co/updates/our-roadmap',
    author: {
      name: 'Daniel Mathews',
      url: 'https://dmathewwws.com',
    }
  },
  [NotionPage.TERMS_OF_SERVICE.path]: {
    priority: '0.8',
  },
  [NotionPage.PRIVACY_POLICY.path]: {
    priority: '0.7',
  },
  [NotionPage.CONTENT_POLICY.path]: {
    priority: '0.7',
  },
  [NotionPage.CODE_OF_CONDUCT.path]: {
    priority: '0.7',
  },
}