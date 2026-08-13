import { NotionPage } from '@inkverse/public/notion';
import type { RankedListPost } from './types';
import { fromNotionPage } from './from-notion';

export const bestVampireWebtoons: RankedListPost = {
  ...fromNotionPage(NotionPage.BEST_VAMPIRE_WEBTOONS),
  publishedAt: '2026-04-27',
  updatedAt: '2026-08-12',
  intro: [
    "People have been fascinated with the idea of blood-sucking fiends for hundreds of years and webtoons fans are not spoiled for choice. Here are our recommendations of the 10 best vampire webtoons, from the most popular to hidden gems. We’ve also given you a mix of sub-genres, from horror vampire comics to romance vampire webtoons, fun slice of life comedies and post-apocalyptic thrilliers.",
  ],
  entries: [
    {
      rank: 1,
      name: 'Noblesse',
      anchor: 'noblesse',
      synopsis: [
        "When vampire Rai wakes up from his 820 year slumber, he must adjust to the intricacies of modern life — and where’s the best place to learn but in school? After enrolling in a South Korean high school, Rai befriends an eclectic group of humans, who must band together against the vicious attackers known as “Unions”…",
      ],
      whyReadIt: [
        'One of the most popular vampire webtoons of all time, with an incredible 439 million views, Noblesse is an older comic (began in 2007 and completed in 2019) but is nonetheless a must-read.',
      ],
      genres: ['Action', 'Supernatural'],
      status: 'Completed',
      episodeCount: '500+',
      readOn: [{ label: 'Webtoon', url: 'https://www.webtoons.com/en/action/noblesse/list?title_no=87' }],
      coverImage: {
        url: 'https://ink0.inkverse.co/blog/best-vampire-comics/noblesse.jpeg',
        alt: 'Noblesse webtoon cover art',
        width: 1280,
        height: 720,
      },
    },
    {
      rank: 2,
      name: 'Vampire Husband',
      anchor: 'vampire-husband',
      synopsis: [
        "Cute and fun, this slice of life comedy is to die for! Charles and Cheryl are happily married… and have been for fifty years. Which is tricky, considering that Cheryl is now an old lady, and Charles still looks like he’s in his 20s!",
      ],
      whyReadIt: [
        "I love love love this premise — it’s so sweet to imagine a love story that continues even when one person ages. There’s a poignancy to this comic as well, considering that Cheryl still refuses to become a vampire. Not one to miss!",
      ],
      genres: ['Romance', 'Comedy'],
      status: 'Completed',
      episodeCount: '200',
      readOn: [{ label: 'Webtoon', url: 'https://www.webtoons.com/en/slice-of-life/vampire-husband/list?title_no=4841' }],
      coverImage: {
        url: 'https://ink0.inkverse.co/blog/best-vampire-comics/vampire-husband.webp',
        alt: 'Vampire Husband webtoon cover art',
        width: 845,
        height: 440,
      },
    },
    {
      rank: 3,
      name: 'Unholy Blood',
      anchor: 'unholy-blood',
      synopsis: [
        "Hayan’s college studies are cut short by a vampire rampage. But as she embarks on a quest for revenge, she must contend with a dark secret she keeps hidden — that she is a pureblood vampire herself.",
      ],
      whyReadIt: [
        "This vampire webtoon is popular for a reason! The art style is gorgeous, and the vengeance plot provides plenty of drive for the narrative. The romance arcs keep it interesting too! There’s a reason that Unholy Blood is one of the most popular vampire webtoons of all time, and it definitely gets my recommendation too.",
      ],
      genres: ['Action', 'Supernatural'],
      status: 'Completed',
      episodeCount: '94',
      readOn: [{ label: 'Webtoon', url: 'https://www.webtoons.com/en/supernatural/unholy-blood/list?title_no=1262' }],
      coverImage: {
        url: 'https://ink0.inkverse.co/blog/best-vampire-comics/unholy-blood.webp',
        alt: 'Unholy Blood webtoon cover art',
        width: 408,
        height: 585,
      },
    },
    {
      rank: 4,
      name: 'Scarlet Symphony',
      anchor: 'scarlet-symphony',
      synopsis: [
        "This is a new one but it’s my personal favorite! Scarlet Symphony follows vampire hunter Eliza as she forms an alliance with the very man she’s been sent to kill. Eliza and pianist William vow to fight a common enemy — notoriously powerful vampire Edgar Blackwood — while navigating their unexpectedly passionate romance.",
      ],
      whyReadIt: [
        "Featuring incredible lore, swoon-worthy romances (vampires Lucy and Dahlia have such an incredible story!), and nuanced characters, Scarlet Symphony is not one to miss — definitely my top vampire webtoon recommendation. Not to mention, the art is absolutely stunning.",
      ],
      genres: ['Romance', 'Supernatural'],
      status: 'Hiatus',
      episodeCount: '10',
      readOn: [
        { label: 'Inkverse', url: 'https://inkverse.co/comics/scarlet-symphony' },
        { label: 'Webtoon', url: 'https://www.webtoons.com/en/canvas/scarlet-symphony/list?title_no=939853' },
      ],
      coverImage: {
        url: 'https://ink0.inkverse.co/blog/best-vampire-comics/scarlet-symphony-vampire-comic.webp',
        alt: 'Scarlet Symphony webtoon cover art',
        width: 2275,
        height: 1998,
      },
    },
    {
      rank: 5,
      name: 'Delusion',
      anchor: 'delusion',
      synopsis: [
        "Originally a Korean vampire manhwa, Delusion is a completed webtoon with 60 episodes. It’s more of a thriller, with subtle gothic horror vibes. Set in Korea in 1935, this vampire comic follows an artist as he is hired to paint the reclusive, wealthy, and apparently youthful Madam Song — except she wants him to paint her as an old woman.",
      ],
      whyReadIt: [
        'This comic builds tension well (he finds a note from a previous painter warning him to never finish the painting!) and has a really unique art style. Personally, I also enjoy that the fact that the creepy vamp antagonist is a woman.',
      ],
      genres: ['Thriller', 'Horror'],
      status: 'Completed',
      episodeCount: '60',
      readOn: [{ label: 'Webtoon', url: 'https://www.webtoons.com/en/thriller/delusion/list?title_no=2470' }],
      coverImage: {
        url: 'https://ink0.inkverse.co/blog/best-vampire-comics/delusion-banner.webp',
        alt: 'Delusion webtoon cover art',
        width: 943,
        height: 492,
      },
    },
    {
      rank: 6,
      name: 'Lesbiampires',
      anchor: 'lesbiampires',
      synopsis: [
        "This one is super fun, while the struggles of romantic life are deeply relatable. Daphne and Veronika are a cute couple, but they also have their flaws and this comic really dives into the realities of dating. Also, they’re vampires.",
      ],
      whyReadIt: [
        'So hunting down humans to kill — while dealing with the weight of immortality — adds an interesting edge to this slice of life comedy.',
      ],
      genres: ['Comedy', 'GL'],
      status: 'Ongoing',
      episodeCount: '300+',
      readOn: [{ label: 'Webtoon', url: 'https://www.webtoons.com/en/canvas/lesbiampires/list?title_no=307640' }],
      coverImage: {
        url: 'https://ink0.inkverse.co/blog/best-vampire-comics/lesbiampires.webp',
        alt: 'Lesbiampires webtoon cover art',
        width: 1188,
        height: 1190,
      },
    },
    {
      rank: 7,
      name: 'unTouchable',
      anchor: 'untouchable',
      synopsis: [
        'The days of vamps with fangs are over! Now, vampires feed by leeching energy, which they get from a single touch. Vampire Lia has been dying to touch her neighbor Jiho since he moved in — but his germophobia keeps getting in the way.',
      ],
      whyReadIt: [
        "This heartfelt vampire romance comic is beautifully illustrated and lots of fun. It’s also complete, with 15 published episodes. The episodes are pretty long though, but I definitely recommend for a short and sweet read!",
      ],
      genres: ['Romance', 'Supernatural'],
      status: 'Completed',
      episodeCount: '142',
      readOn: [{ label: 'Webtoon', url: 'https://www.webtoons.com/en/romance/untouchable/list?title_no=79' }],
      coverImage: {
        url: 'https://ink0.inkverse.co/blog/best-vampire-comics/untouchable-banner.webp',
        alt: 'unTouchable webtoon cover art',
        width: 798,
        height: 312,
      },
    },
    {
      rank: 8,
      name: 'Corpse Knight Gunther',
      anchor: 'corpse-knight-gunther',
      synopsis: [
        'In an apocalyptic, post-war landscape, vampires have triumphed over humanity. In desperation, surviving humans create an immortal “corpse knight” to fight the vampires…',
      ],
      whyReadIt: [
        "This is a great one if you like the darker side of vampires — it’s more Blade than Twilight to be sure! The characters also have fantastic designs, and it’s compellingly written. Originally Korean, the English translation is ongoing.",
      ],
      genres: ['Action', 'Horror'],
      status: 'Completed',
      episodeCount: '90',
      readOn: [{ label: 'Webtoon', url: 'https://www.webtoons.com/en/fantasy/corpse-knight-gunther/list?title_no=5032' }],
      coverImage: {
        url: 'https://ink0.inkverse.co/blog/best-vampire-comics/corpse-knight-gunther.webp',
        alt: 'Corpse Knight Gunther webtoon cover art',
        width: 690,
        height: 1000,
      },
    },
    {
      rank: 9,
      name: 'Vampire Syndrome',
      anchor: 'vampire-syndrome',
      synopsis: [
        'Vampires have secretly seized control of the world, after being infected by the mysterious vampire syndrome. After he loses everything to them, Taesu Dan forms a team that is dead-set on revenge…',
      ],
      whyReadIt: [
        'An original premise along with a unique art style make Vampire Syndrome an underrated gem. Completed in Korean, the English version is ongoing.',
      ],
      genres: ['Action', 'Thriller'],
      status: 'Completed',
      episodeCount: '80',
      readOn: [{ label: 'Webtoon', url: 'https://www.webtoons.com/en/supernatural/vampire-syndrome/list?title_no=5123' }],
      coverImage: {
        url: 'https://ink0.inkverse.co/blog/best-vampire-comics/vampire-syndrome.jpeg',
        alt: 'Vampire Syndrome webtoon cover art',
        width: 540,
        height: 540,
      },
    },
    {
      rank: 10,
      name: 'Moonshine',
      anchor: 'moonshine',
      synopsis: [
        "After hooking up with a guy at a bar, Kim gets transformed into a vampire… and his world gets turned upside down.",
      ],
      whyReadIt: [
        "Started in 2018, Moonshine is an absolute titan of the vampire romance comic genre. And with over 150 episodes, there’s plenty to get your teeth into!",
        'Sexy, mature, yet surprisingly grounded, this boys love comic is a lovely exploration of what it takes to be a successful, healthy couple.',
      ],
      genres: ['Romance', 'BL'],
      status: 'Completed',
      episodeCount: '400+',
      readOn: [{ label: 'Webtoon', url: 'https://www.webtoons.com/en/canvas/moonshine/list?title_no=175540' }],
      coverImage: {
        url: 'https://ink0.inkverse.co/blog/best-vampire-comics/moonshine.jpg',
        alt: 'Moonshine webtoon cover art',
        width: 998,
        height: 1193,
      },
    },
  ],
};
