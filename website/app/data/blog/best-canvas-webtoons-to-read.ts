import { NotionPage } from '@inkverse/public/notion';
import type { RankedListPost } from './types';
import { fromNotionPage } from './from-notion';

export const bestCanvasWebtoons: RankedListPost = {
  ...fromNotionPage(NotionPage.BEST_CANVAS_WEBTOONS),
  publishedAt: '2026-04-27',
  updatedAt: '2026-08-12',
  intro: [
    "When it comes to webtoons, the spotlight is firmly on the comics that are exclusive to the big publishing apps. Whether it’s in-app promotion, social media shout-outs, or webtoon app algorithms, major webtoon publishers want you to read the comics that they’ve invested in. Even the architecture of their apps pushes readers towards exclusive content, rather than comics written by independent creators.",
    "For those independent creators, this can be discouraging. And yet, some of the best comics are the ones that are independent and not exclusive to any one webtoons platform. So we’ve rounded up our favourites, from some of the most popular Canvas webtoons to hidden gems, so that you can find the best indie webtoons the internet has to offer.",
  ],
  entries: [
    {
      rank: 1,
      name: 'Heartstopper',
      anchor: 'heartstopper',
      synopsis: [
        "Heartstopper does a great job of capturing the joy, awkwardness and complexity of teenage love.",
      ],
      whyReadIt: [
        "Whether you’re LGBTQ+ or not, there’s something universal in how Heartstopper portrays first love, friendship, and self-discovery. In terms of art style, the art is clean, almost sketch-like.",
      ],
      genres: ['Romance', 'Slice of Life', 'BL'],
      status: 'Ongoing',
      episodeCount: '83',
      readOn: [
        { label: 'Tapas', url: 'https://tapas.io/series/Heartstopper/info' },
        { label: 'Webtoon', url: 'https://www.webtoons.com/en/canvas/heartstopper/list?title_no=329660' },
      ],
      watchOn: [{ label: 'Netflix', url: 'https://www.netflix.com/title/81059939' }],
      coverImage: {
        url: 'https://ax0.taddy.org/blog/best-indie-webtoons/heartstopper.png',
        alt: 'Heartstopper webtoon cover art',
        width: 770,
        height: 373,
      },
    },
    {
      rank: 2,
      name: 'Punderworld',
      anchor: 'punderworld',
      synopsis: [
        "Originally published on Tumbr as a series of illustrations, Punderworld is the story of Hades and Persephone, retold as you’ve never seen it before. And yes, I’m including Lore Olympus in that statement. Unlike the Webtoon Original, Punderworld is set firmly in the age of myth, but Linda Sejic’s writing is far from antiquated. Her portrayal of Persephone as rebellious and headstrong, the perfect counter to grounded workaholic Hades, has resonated with many readers, and gives life to this vivacious yet adorkable romcom reworking of the classic tale.",
      ],
      whyReadIt: [
        "With the entire Olympian pantheon given the Punderworld treatment, as supporting characters try to help (or hinder) the budding couple, this comic is a must-read for anyone who loves Greek myths.",
      ],
      genres: ['Mythology', 'Romance', 'Comedy'],
      status: 'Ongoing',
      episodeCount: '83',
      readOn: [
        { label: 'Webtoon', url: 'https://www.webtoons.com/en/canvas/punderworld/list?title_no=312584' },
        { label: 'Tapas', url: 'https://tapas.io/series/Punderworld' },
        { label: 'Amazon', url: 'https://www.amazon.ca/Punderworld-1-Linda-Sejic/dp/1534320725' },
      ],
      coverImage: {
        url: 'https://ax0.taddy.org/blog/best-indie-webtoons/punderworld.jpg',
        alt: 'Punderworld webtoon cover art',
        width: 680,
        height: 359,
      },
    },
    {
      rank: 3,
      name: 'The Little Trashmaid',
      anchor: 'the-little-trashmaid',
      synopsis: [
        "Another Tumblr original, The Little Trashmaid began as an illustration for the Mermay art contest. Depicting a Disney-esque mermaid wearing a plastic bag as a crop top, this artwork was intended to make people think about the impact waste has on the environment. Now that The Little Trashmaid is a full-blown comic, the creator donates the proceeds from merch and print editions to multiple charities focused on ocean clean-up.",
      ],
      whyReadIt: [
        "The comic itself is a delightfully heartfelt slice-of-life, so you can have fun while helping to save the oceans, one trashbag crop top at a time!",
      ],
      genres: ['Slice of Life', 'Fantasy'],
      status: 'Ongoing',
      episodeCount: '190',
      readOn: [
        { label: 'Webtoon', url: 'https://www.webtoons.com/en/canvas/the-little-trashmaid/list?title_no=300138' },
        { label: 'Tapas', url: 'https://tapas.io/series/The-Little-Trashmaid' },
        { label: 'Print', url: 'https://sillystudiosofficial.com/product/the-little-trashmaid-vol-01-ebook-print/' },
      ],
      coverImage: {
        url: 'https://ax0.taddy.org/blog/best-indie-webtoons/little-trashmaid.png',
        alt: 'The Little Trashmaid webtoon cover art',
        width: 1222,
        height: 597,
      },
    },
    {
      rank: 4,
      name: 'This Isekai Maid Is Forming A Union!',
      anchor: 'this-isekai-maid-is-forming-a-union',
      synopsis: [
        "In this acerbic and sharply funny take on the isekai genre, Bridgette is fed up of being reincarnated as a maid in “otome” romances again and again, only to be slapped and verbally abused by the romance’s female lead. Somehow, along the way, Bridgette has become self-aware — and genre-aware — and she’s not going to let this reincarnation go to waste. This time, she’s gonna fight back. This time, she’ll form a union!",
      ],
      whyReadIt: [
        "This Isekai Maid Is Forming A Union is a hilarious subversion of the romance genre, while also being very fond about its source material.",
      ],
      genres: ['Isekai', 'Comedy', 'Romance'],
      status: 'Ongoing',
      episodeCount: '155',
      readOn: [
        { label: 'Webtoon', url: 'https://www.webtoons.com/en/canvas/this-isekai-maid-is-forming-a-union/list?title_no=699696' },
      ],
      coverImage: {
        url: 'https://ax0.taddy.org/blog/best-indie-webtoons/isekai-maid.jpg',
        alt: 'This Isekai Maid Is Forming A Union! webtoon cover art',
        width: 960,
        height: 727,
      },
    },
    {
      rank: 5,
      name: 'The Uniques',
      anchor: 'the-uniques',
      synopsis: [
        "Superhero comics are pretty rare in the world of webtoons, but The Uniques is something special: in the era of superhero fatigue, this comic has managed to find a fresh take which makes the genre feel original and exciting again. The Uniques is set in a world where most people have superpowers, but few are superheroes, thanks to an utterly devastating supervillain attack which destroyed New York City. Awaking from a coma two years after this attack, Hope — the last psychic on Earth — decides to form a superhero team to try and tip the scales back to the side of good again.",
      ],
      whyReadIt: [
        "Although it’s not one of the typical webtoon genres, The Uniques is easily one of the best Canvas webtoons out there.",
      ],
      genres: ['Superhero', 'Action'],
      status: 'Hiatus',
      episodeCount: '200+',
      readOn: [
        { label: 'Webtoon', url: 'https://www.webtoons.com/en/canvas/the-uniques/list?title_no=207400' },
      ],
      coverImage: {
        url: 'https://ax0.taddy.org/blog/best-indie-webtoons/uniques.jpeg',
        alt: 'The Uniques webtoon cover art',
        width: 2731,
        height: 1585,
      },
    },
    {
      rank: 6,
      name: 'Netvor',
      anchor: 'netvor',
      synopsis: [
        "Reimagining the beast of old as an Eldritch being — and a vain, selfish one at that — Netvor creates lore that goes beyond the classic tale, making this an exciting story of fairies, princes, revenge, and betrayal, all tied together by a heroine who is far from the quiet, forgiving Beauty of old.",
      ],
      whyReadIt: [
        "This retelling of Beauty and the Beast isn’t just smart, subversive, and imaginative, it’s also stunningly illustrated, using webtoons’ scrollable format to break the boundaries of panels and scatter gorgeous artwork throughout the page.",
      ],
      genres: ['Fantasy', 'Romance'],
      status: 'Ongoing',
      episodeCount: '250+',
      readOn: [
        { label: 'Inkverse', url: 'https://inkverse.co/comics/netvor-a-retelling-of-beauty-and-the-beast' },
        { label: 'Webtoon', url: 'https://www.webtoons.com/en/canvas/netvor-a-retelling-of-beauty-and-the-beast/list?title_no=393409' },
      ],
      coverImage: {
        url: 'https://ax0.taddy.org/blog/best-indie-webtoons/netvor.jpg',
        alt: 'Netvor webtoon cover art',
        width: 1280,
        height: 834,
      },
    },
    {
      rank: 7,
      name: 'Fox Fires',
      anchor: 'fox-fires',
      synopsis: [
        "This lush, poignant comic dives into Finnish folklore, centering around the folk tale that the Northern Lights are a gateway to the afterlife. Known as fox fires, these lights bring hope to everyone who has lost someone… until, suddenly, they go out. Determined to find the answer, and discover what happened to Repo (the fox whose fiery tail lights up the sky), young raccoon dog Raate heads off on an epic journey northward…",
      ],
      whyReadIt: [
        "Fox Fires is a beautiful story, perfect for cuddling up on a cold winter’s night. The use of Finnish folklore — which is rich, varied, and rarely told — really makes this one of the best Canvas webtoons!",
      ],
      genres: ['Mythology', 'Fantasy'],
      status: 'Hiatus',
      episodeCount: '190',
      readOn: [
        { label: 'Webtoon', url: 'https://www.webtoons.com/en/canvas/fox-fires/list?title_no=125525' },
        { label: 'Simon & Schuster', url: 'https://www.simonandschuster.com/books/Fox-Fires-Volume-1/Emilia-Ojala/Fox-Fires/9781952126086' },
      ],
      coverImage: {
        url: 'https://ax0.taddy.org/blog/best-indie-webtoons/fox-fires.jpg',
        alt: 'Fox Fires webtoon cover art',
        width: 1399,
        height: 910,
      },
    },
    {
      rank: 8,
      name: 'ZomCom',
      anchor: 'zomcom',
      synopsis: [
        "With over 100 million views on Webtoon, ZomCom is easily one of the most popular Canvas webtoons — and with a fun script, heartfelt characters, and zany situations, ZomCom lives up to the hype. At its heart, ZomCom is a roommate comedy, but as the roommates are a zombie, a vampire, and a werewolf, this comic is more What We Do In The Shadows than Friends. And just like What We Do In The Shadows, ZomCom immerses readers in a world where the supernatural is real — but supernatural creatures just want to live their everyday lives.",
      ],
      whyReadIt: [
        "ZomCom is a great, lighthearted read, with plenty of episodes so you’ll never get bored!",
      ],
      genres: ['Comedy', 'Supernatural'],
      status: 'Completed',
      episodeCount: '200+',
      readOn: [
        { label: 'Webtoon', url: 'https://www.webtoons.com/en/canvas/zomcom/list?title_no=70195' },
      ],
      coverImage: {
        url: 'https://ax0.taddy.org/blog/best-indie-webtoons/ZomCom_Banner.webp',
        alt: 'ZomCom webtoon cover art',
        width: 943,
        height: 492,
      },
    },
    {
      rank: 9,
      name: 'Spontaneous World Shifting',
      anchor: 'spontaneous-world-shifting',
      synopsis: [
        "This one came to us highly recommended by the Canvas reader community: Spontaneous World Shifting is mentioned on almost every reader recommendation list we could find! And when you start reading, it’s easy to see why. This comic’s protagonist can shift between worlds, but cannot control this power, leaving her to fend for herself in totally unknown environments, with only her wits to save her!",
      ],
      whyReadIt: [
        "This dynamic premise is super exciting, and also allows the author to build a fascinating multiverse of different settings, compelling characters, and thrilling interconnected plot threads.",
      ],
      genres: ['Sci-fi', 'Fantasy'],
      status: 'Ongoing',
      episodeCount: '144',
      readOn: [
        { label: 'Webtoon', url: 'https://www.webtoons.com/en/canvas/spontaneous-world-shifting/list?title_no=671607' },
        { label: 'Tapas', url: 'https://tapas.io/series/Spontaneous-World-Shifting/info' },
      ],
      coverImage: {
        url: 'https://ax0.taddy.org/blog/best-indie-webtoons/Spontaneous-World-Shifting.jpg',
        alt: 'Spontaneous World Shifting webtoon cover art',
        width: 1080,
        height: 1080,
      },
    },
    {
      rank: 10,
      name: 'Beneath The Camphor Tree',
      anchor: 'beneath-the-camphor-tree',
      synopsis: [
        "After meeting the crown prince as a child, Eun-ah and her father are exiled thanks to a conspiracy against them. Years later, Eun-ah disguises herself as a man to work as hired protection... but when she saves the crown prince, he insists on hiring her as his bodyguard. Only problem is, he has no idea she's the same girl he met as a child... or that she's even a girl at all!",
      ],
      whyReadIt: [
        "This historical, cross-dressing romance is an absolute delight! While there are so many things to love about this indie comic, from the fantastic artwork to the witty writing, what really stood out to me is the storyboarding. Creator Leah Gracie is adept at visual gags, using her panels to set up and pay off jokes in hilarious, innovative ways. Put that together with the Studio Ghibli-esque movement, and compelling characters, and that makes this one of the best Canvas webtoons I’ve read.",
      ],
      genres: ['Historical', 'Romance', 'Comedy'],
      status: 'Hiatus',
      episodeCount: '100+',
      readOn: [
        { label: 'Inkverse', url: 'https://inkverse.co/comics/beneath-the-camphor-tree' },
        { label: 'Webtoon', url: 'https://www.webtoons.com/en/canvas/beneath-the-camphor-tree/list?title_no=632782' },
      ],
      coverImage: {
        url: 'https://ax0.taddy.org/blog/best-indie-webtoons/camphor-tree.jpg',
        alt: 'Beneath The Camphor Tree webtoon cover art',
        width: 1063,
        height: 826,
      },
    },
  ],
};
