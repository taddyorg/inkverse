import type { ListModel } from "../database/index.js"
import { ListType, PrivacyType } from "../database/index.js"

export const mostPopularComicSeriesUuids = [
  "a7046949-a79d-4471-b3e0-9c6df652b9c8",
  "fb20203b-0e55-4e7c-a213-c0cd1e74fd0f",
  "70587dde-bbec-41fe-9998-6d0fc25dca2b",
  "f9e936f7-9537-4aee-8de9-d90003cc0729",
  "dde612b2-e608-4b14-900d-37c1628e2e4a",
  "eb075a7b-38c3-4f8c-8be3-dcc6a5230dab",
  "e418408c-2d72-4a5b-8765-46df6b724d53",
  "83df96f0-874e-4bb7-98c9-fc92be5aa452",
  "01c6a940-eaa4-40f4-93cb-3033dbe08638",
  "54beb38b-2cd2-43d6-aa1c-3f4aea7da3b5",
  "c025ecd8-85ab-4584-90ed-deeb267987c4",
  "8154cda8-7d18-4250-9e42-a813dd074b15",
  "209fcb89-d2d7-4fa1-b362-4f08890b680f",
  "72d601a1-6e98-4c69-a577-666600fea15d",
  "71113968-45a2-4c30-b770-655b57ae0de6",
  "bbada132-2508-47fb-937a-22fbe12708be",
  "25660dd8-638c-4b39-aa56-43657ba94688",
  "d241ed6c-633f-4da8-ba36-026b905b635d",
  "ae78ecda-b05c-4fba-9b00-9211f6223907"
]

const friendsToLoversComicSeriesUuids = [
  "a7046949-a79d-4471-b3e0-9c6df652b9c8", // I’ll Keep Your Secret
  "2f347208-05d4-45ff-9799-cd445f6cf169", // Light Within Shadow
  "3be54437-5b28-4ef1-8594-a47ab137a2c0", // Honey & Cigarettes
  "de5eaad4-0755-4826-9c9a-4aba02303d9a", // Beneath The Camphor Tree
  "e3450ba5-de2a-4936-a53b-67d3883f9320", // Fragmented Dreams
  "25660dd8-638c-4b39-aa56-43657ba94688", // Rain Girl
  "076bd028-1b7a-4738-9ff9-b84513a2f7bf", // How To Be Human
  "c233e465-ec10-43f9-a730-b125bc1af10d", // Sleepless Nights
  "8154cda8-7d18-4250-9e42-a813dd074b15", // Before An Infinity Of Stars, I Choose You…
  "86722a58-2281-428e-b062-7818025b7a36", // Regarding Dandelions
]

const enemiesToLoversComicSeriesUuids = [
  "d241ed6c-633f-4da8-ba36-026b905b635d", // Secret Lies Next Door
  "ae78ecda-b05c-4fba-9b00-9211f6223907", // The Giant of Greywater
  "48e86fe7-65d5-4269-932e-6c11ed3863ad", // Netvor
  "af3e1dcc-2c0d-4ac5-9716-80b519985964", // Scarlet Symphony
  "6f888cc4-cbd2-4731-bc17-faef01cc16cc", // Guiltless Mischief
  "03237f41-5253-4954-8568-13ace0f516d6", // Scarlet Letters
  "2e1d5daa-9cf4-456a-88e9-20a4d442cdbb", // Shadowskulls
  "0f8adef5-5d96-4c49-ab23-a9df0c8a5145", // The Poisoner’s Piece
  "606c1b5d-482e-4e42-8668-24db3fd9702f", // Space Ultima
  "a047dcf9-d7dc-4c7d-ba93-2c182b2fe40c", // The Art Of Running Away
  "5d9a70f8-509b-4105-aff8-fdaab407e8be", // Moon Descendants
  "54beb38b-2cd2-43d6-aa1c-3f4aea7da3b5", // 10 of Swords
  "ed71982c-40fc-49d8-866a-71b31d31f647" // Firewalker
]

const femaleLeadComicSeriesUuids = [
  "bbada132-2508-47fb-937a-22fbe12708be", // Pirates of the Hard Nox
  "fc168e15-b24b-4f46-aca5-9e3996c5f84f", // Lavender & Lilacs
  "af3e1dcc-2c0d-4ac5-9716-80b519985964", // Scarlet Symphony
  "718556a6-1cdc-431d-ba92-9d56101b31ab", // Syrenics
  "e01e60f1-48db-47f1-9325-745b6a7505f0", // Nerya: The Unblessed
  "2f347208-05d4-45ff-9799-cd445f6cf169", // Light Within Shadow
  "95bba663-030c-4024-980b-fe9ef637d6a8", // I’ll Find You
  "03237f41-5253-4954-8568-13ace0f516d6", // Scarlet Letters
  "83df96f0-874e-4bb7-98c9-fc92be5aa452", // Gone Gray
  "f19aeef3-4de9-40e8-bdac-6d7a2293483a", // E Is For Evil
  "fb20203b-0e55-4e7c-a213-c0cd1e74fd0f", // Behind Our Eclipse
  "4bdf4642-958b-4394-9891-fd2be54ef253", // They’re Both A Kilogram
  "797f357b-652c-4cc7-a985-1c4749f78cd8" // Sleeping Magic
]

const isekaiComicSeriesUuids = [
  "f69f96d7-15d1-4dd8-9560-117c06f129aa", // Book Of Domination
  "3065ae8b-9128-4cd1-a0ed-52e618effffd", // The Dance
  "13e52f7e-8a2b-4425-b760-4feb87153736", // The Bookworm
  "0ea33c3f-582e-4280-a589-ec371486ce21", // D-Link
  "1d6bf248-a4e7-4f2b-a585-a8a747038c50", // City Of Souls
  "6f9568a2-3a7d-4d75-a021-48735eaf9116", // Eternal Reverie: 2000-year Odyssey
]

const spookyToonsComicSeriesUuids = [
  "5c3b4b58-09b7-4009-8112-edd6f1069ad8", // River Of Souls
  "11c6eb21-2c23-4525-ac14-a288c8dada3d", // Foggy Lake
  "a9c1a06e-09a3-4414-82cb-1442ddc40594", // Millennial Scarlet
  "ae44fcd1-329a-47fd-90e1-8e59de9ea5a1", // My Amnesia Ghost
  "2e1d5daa-9cf4-456a-88e9-20a4d442cdbb", // Shadow Skulls
  "3c06057c-82dc-49ab-837b-e488edda3919", // Max Jaw
  "25660dd8-638c-4b39-aa56-43657ba94688",  // Rain Girl
  "b5356b6d-7131-4ecb-a7d3-4780acf6c301", // Gentlemen Of Chaos
  "03a7ca4f-70b5-4d43-a9fb-d42d9b7f93b7", // My Fate Lies With You
  "abd853ed-618a-4998-bbb9-c9a24cf7d825", // Me Me Me
  "299eaa21-9c3a-4dbe-baf6-5c733420086f", // HiLo Spirits
  "15e7f2d2-2f3d-4750-94b3-ce8c418d66be", // I’m Mortal
  "6f59d535-159d-47f2-9ce3-75000f296448", // Team Diamant Presents : Happy Go Gothy
  "9966e4e4-cb0d-412d-b682-ebc8a7ab3ce5", // Supercat
]

const wholesomeComicSeriesUuids = [
  "70587dde-bbec-41fe-9998-6d0fc25dca2b", // Foo Bun
  "2733b531-f700-4c8a-969e-bd2c070195d6", // Figments
  "0a2639af-c443-4579-b5fc-a3bb939c6868", // Heir’s The Catch
  "5a29d33c-af89-4957-849d-89402f20418b", // Pumpkin Matcha Latte
  "9abf57d5-d74d-4f04-8fc3-8441c12c3ef8", // Signs Point To Bobbie
  "4737d4d7-062c-4cf0-b6c6-c336c6fc5bda", // Idiots Don’t Catch Colds
  "15e7f2d2-2f3d-4750-94b3-ce8c418d66be", // I’m Mortal
  "72d601a1-6e98-4c69-a577-666600fea15d", // Love & Hex
  "89164347-f0de-4556-8a64-0f6a040bdfaf" // Bubbling Over
]

const spicyComicSeriesUuids = [
  "01c6a940-eaa4-40f4-93cb-3033dbe08638", // He Wolf
  "72d601a1-6e98-4c69-a577-666600fea15d", // Love & Hex
  "807f4864-6d9e-4ff4-8c85-f673d3db9fe4", // American Prince
  "46fa042a-e528-490c-9ae8-bc1af9759a8c", // God Has Spite
  "5bf22084-d57e-4c68-a62d-39cbbc4c7916", // Bootleg Cookie
  "6f888cc4-cbd2-4731-bc17-faef01cc16cc", // Guiltless Mischief
  "54beb38b-2cd2-43d6-aa1c-3f4aea7da3b5", // 10 of Swords
  "a047dcf9-d7dc-4c7d-ba93-2c182b2fe40c", // The Art Of Running Away
]

const LGBTComicSeriesUuids = [
  "5c3b4b58-09b7-4009-8112-edd6f1069ad8", // River Of Souls
  "3be54437-5b28-4ef1-8594-a47ab137a2c0", // Honey & Cigarettes
  "f508e414-bf0a-4ac5-b5a3-4eec9cce1ba5", // Stellarum
  "6f888cc4-cbd2-4731-bc17-faef01cc16cc", // Guiltless Mischief
  "3d2a93f4-6b2d-425b-b60f-927c1cb18876", // Love In Ruins
  "076bd028-1b7a-4738-9ff9-b84513a2f7bf", // How To Be Human
  "3bdb4f69-9887-4c3c-b449-0cb543be0ae4", // Sublime Trilemma
  "f9e936f7-9537-4aee-8de9-d90003cc0729", // Found Hope In The Demon
  "d0dc2b76-5541-4316-95be-5c5944d8e90e", // The Leftover Cannibals
  "807f4864-6d9e-4ff4-8c85-f673d3db9fe4", // American Prince
  "56388dd4-c802-4dae-990f-60f86f0bc108", // Tamed Rogue
  "3a2e6ff2-f3a1-42b4-92e1-87d9bc910eb8" // Espero: Part 1
]

const monsterLoversComicSeriesUuids = [
  "ae78ecda-b05c-4fba-9b00-9211f6223907", // The Giant Of Greywater
  "48e86fe7-65d5-4269-932e-6c11ed3863ad", // Netvor
  "076bd028-1b7a-4738-9ff9-b84513a2f7bf", // How To Be Human
  "01c6a940-eaa4-40f4-93cb-3033dbe08638", // He Wolf
  "00901700-67d4-40ef-b92a-3db444fcb4eb", // 1 And A Half
  "807f4864-6d9e-4ff4-8c85-f673d3db9fe4", // American Prince
  "ca3d7b03-d701-4ac5-aed1-a128062cf593", // Pirates And Monsters
  "115fd066-a99c-44e5-9878-13cfca1e58c0", // Scary Cute
  "bbada132-2508-47fb-937a-22fbe12708be" // Pirates of the Hard Nox
]

const featuredComicSeriesUuidsSet = new Set([
  ...mostPopularComicSeriesUuids,
  ...friendsToLoversComicSeriesUuids,
  ...enemiesToLoversComicSeriesUuids,
  ...femaleLeadComicSeriesUuids,
  ...isekaiComicSeriesUuids,
  ...spookyToonsComicSeriesUuids,
  ...wholesomeComicSeriesUuids,
  ...spicyComicSeriesUuids,
  ...LGBTComicSeriesUuids,
  ...monsterLoversComicSeriesUuids,
])

export const featuredComicSeriesUuids = Array.from(featuredComicSeriesUuidsSet);

export const curatedListsData: { [key: string]: ListModel } = {
  "1": {
    id: "1",
    name: 'Most Recommended',
    description: "Here is a list of the most recommended comics on Inkverse.",
    bannerImageUrl: 'https://ink0.inkverse.co/curated-lists/most-recommended.webp',
    type: ListType.COMICSERIES,
    privacyType: PrivacyType.PUBLIC,
    userId: 2,
    uuids : mostPopularComicSeriesUuids,
  },
  "2": {
    id: "2",
    name: 'Friends to Lovers',
    description: "Heartwarming stories where friendship blossoms into romance! These Webtoons showcase the beautiful journey of characters who find love in their closest companions.",
    bannerImageUrl: 'https://ink0.inkverse.co/curated-lists/friends-to-lovers.webp',
    type: ListType.COMICSERIES,
    privacyType: PrivacyType.PUBLIC,
    userId: 2,
    uuids : friendsToLoversComicSeriesUuids,
  },
  "3": {
    id: "3",
    name: 'Enemies to Lovers',
    description: "Fierce rivals and sworn enemies discover that there can be a thin line between love and hate.",
    bannerImageUrl: 'https://ink0.inkverse.co/curated-lists/enemies-to-lovers.webp',
    type: ListType.COMICSERIES,
    privacyType: PrivacyType.PUBLIC,
    userId: 2,
    uuids : enemiesToLoversComicSeriesUuids,
  },
  "4": {
    id: "4",
    name: 'Female Leads',
    description: "Dive into these compelling stories featuring strong female protagonists! From action-packed adventures to slice-of-life tales, these heroines will captivate you with their strength and determination.",
    bannerImageUrl: 'https://ink0.inkverse.co/curated-lists/female-leads.webp',
    type: ListType.COMICSERIES,
    privacyType: PrivacyType.PUBLIC,
    userId: 2,
    uuids : femaleLeadComicSeriesUuids,
  },
  "5": {
    id: "5",
    name: 'Sent to Another World',
    description: "Join in on extraordinary adventures and be transported to another world. Follow the protagonists as they navigate magical realms, face unexpected challenges, and discover their true potential in a fantastical new dimension.",
    bannerImageUrl: 'https://ink0.inkverse.co/curated-lists/sent-to-another-world.webp',
    type: ListType.COMICSERIES,
    privacyType: PrivacyType.PUBLIC,
    userId: 2,
    uuids : isekaiComicSeriesUuids,
  },
  "6": {
    id: "6",
    name: 'Spooky Toons',
    description: "From supernatural mysteries to gothic horror, these series will keep you on the edge of your seat.",
    bannerImageUrl: 'https://ink0.inkverse.co/curated-lists/spooky-toons.webp',
    type: ListType.COMICSERIES,
    privacyType: PrivacyType.PUBLIC,
    userId: 2,
    uuids : spookyToonsComicSeriesUuids,
  },
  "7": {
    id: "7",
    name: 'Wholesome Comics',
    description: "Find your happy place with these heartwarming and uplifting Webtoons. These series offer sweet moments, genuine connections, and stories that will leave you with a smile.",
    bannerImageUrl: 'https://ink0.inkverse.co/curated-lists/comfort-comics.webp',
    type: ListType.COMICSERIES,
    privacyType: PrivacyType.PUBLIC,
    userId: 2,
    uuids : wholesomeComicSeriesUuids,
  },
  "8": {
    id: "8",
    name: 'Spicy',
    description: "From steamy romances to dramatic encounters, these series will keep you coming back for more.",
    bannerImageUrl: 'https://ink0.inkverse.co/curated-lists/spicy.webp',
    type: ListType.COMICSERIES,
    privacyType: PrivacyType.PUBLIC,
    userId: 2,
    uuids : spicyComicSeriesUuids,
  },
  "9": {
    id: "9",
    name: 'LGBT',
    description: "These stories portray various identities that is meant to resonate with readers from all walks of life.",
    bannerImageUrl: 'https://ink0.inkverse.co/curated-lists/lgbt.webp',
    type: ListType.COMICSERIES,
    privacyType: PrivacyType.PUBLIC,
    userId: 2,
    uuids : LGBTComicSeriesUuids,
  },
  "10": {
    id: "10",
    name: 'Monster Lovers',
    description: "From gentle giants to misunderstood creatures, these series prove that beauty comes in all forms.",
    bannerImageUrl: 'https://ink0.inkverse.co/curated-lists/moster-lovers.webp',
    type: ListType.COMICSERIES,
    privacyType: PrivacyType.PUBLIC,
    userId: 2,
    uuids : monsterLoversComicSeriesUuids,
  }
}