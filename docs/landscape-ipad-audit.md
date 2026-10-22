# Landscape + iPad Audit Checklist

Every web route and mobile screen to check for landscape and iPad support. Mobile uses `useLayout()` (`react-native/app/components/ui/Layout.tsx`) with `BREAKPOINTS` and `MAX_CONTENT_WIDTH` from `react-native/constants/Layout.ts`.

## How to test

### Devices / viewports
| Code | Target | Size (pt / px) |
|---|---|---|
| **P** | iPhone portrait (baseline) | 393×852 |
| **L** | iPhone landscape (notch / Dynamic Island side insets) | 852×393 |
| **iP** | iPad portrait | 820×1180 |
| **iL** | iPad landscape | 1180×820 |
| **W-md / W-lg** | Web at 768 and 1024+ (iPad Safari, desktop) | — |
| **W-L** | Web on an iPhone in landscape (short viewport) | 852×393 |

### Checks for every screen (☐ = check each one)
1. **Rotate live:** rotate while on the screen (P→L→P) and confirm the layout reflows with no stale widths.
2. **Safe areas:** in landscape, content and buttons stay clear of the notch / home indicator (`insets.left/right`).
3. **Content width:** text and lists are capped at `MAX_CONTENT_WIDTH.page` (768) or `.reader` (576) and centred, not stretched edge to edge.
4. **Grids:** column count changes with width (e.g. 3 → 4–6) and tiles keep their aspect ratio.
5. **Images:** covers, banners and comic panels aren't cropped or blurry, and keep their aspect ratio.
6. **Scrolling:** nothing is cut off in a short landscape viewport, and sticky headers and footers don't eat the screen.
7. **Keyboard:** in landscape, inputs stay visible above the keyboard and the submit button is reachable.
8. **Modals / sheets:** iPad shows a page sheet / form sheet correctly; swipe-to-dismiss still works.
9. **Navigation:** the tab bar, header back button and share button are positioned correctly and tappable.
10. **Light + dark theme** both still look right.

---

## Mobile (React Native): `react-native/app/screens/`

### Known risks: fix these first
`Dimensions.get('window')` is read once and **does not update on rotation**. Replace it with `useLayout()` / `useWindowDimensions()`:
- [ ] `screens/profile.tsx` (lines 40, 382)
- [ ] `screens/trending.tsx` (line 71)
- [ ] `screens/comicslist.tsx` (line 93)
- [ ] `components/creator/CreatorDetails.tsx` (module-level `const { width }` on line 26: the worst case)
- [ ] `components/list/ListDetails.tsx` (imports `Dimensions`)

Already on `useLayout()` (still verify them):
- [ ] `screens/comicseries.tsx`, `components/comics/ComicSeriesDetails.tsx`, `components/comics/GridOfComicIssues.tsx`

### Tabs and stacks
| Screen | File | P | L | iP | iL | Screen-specific checks |
|---|---|---|---|---|---|---|
| Tab bar | `root.tsx` | ☐ | ☐ | ☐ | ☐ | Icon/label layout on iPad; landscape height |
| Home | `home.tsx`, `components/home/Header.tsx` | ☐ | ☐ | ☐ | ☐ | Horizontal carousels, featured banner aspect, header logo |
| Search | `search.tsx` | ☐ | ☐ | ☐ | ☐ | Search bar width, results list/grid, keyboard in landscape |
| Profile (own) | `profile.tsx` | ☐ | ☐ | ☐ | ☐ | **Dimensions fix**; avatar header; saved-comics grid columns |
| Comic series | `comicseries.tsx` | ☐ | ☐ | ☐ | ☐ | Banner/cover, tagline, expandable description, episode grid |
| Comic issue (reader) | `comicissue.tsx`, `components/comics/StoryImage.tsx` | ☐ | ☐ | ☐ | ☐ | **Highest priority.** Panel width (`reader` 576 cap vs full width), image height math on rotation, keep scroll position after rotating, tap-to-hide header, ReadNextEpisode, footer, comments preview |
| Creator | `creator.tsx`, `CreatorDetails.tsx`, `CreatorComics.tsx`, `CreatorLinks.tsx` | ☐ | ☐ | ☐ | ☐ | **Dimensions fix**; avatar, links row, comics grid |
| List | `list.tsx`, `components/list/ListDetails.tsx` | ☐ | ☐ | ☐ | ☐ | **Dimensions fix**; list header image, items |
| Comics list (tag / genre) | `comicslist.tsx` | ☐ | ☐ | ☐ | ☐ | **Dimensions fix**; grid columns |
| Trending (most liked / discussed) | `trending.tsx` | ☐ | ☐ | ☐ | ☐ | **Dimensions fix**; ranked list layout |
| Notifications | `notifications.tsx` | ☐ | ☐ | ☐ | ☐ | Row width cap, empty state |
| Notification settings | `notification-settings.tsx` | ☐ | ☐ | ☐ | ☐ | Toggle rows width cap |
| Settings | `settings.tsx` | ☐ | ☐ | ☐ | ☐ | Row width cap |
| Claim creator | `claim-creator.tsx` | ☐ | ☐ | ☐ | ☐ | Form + keyboard |

### Profile edit
| Screen | File | P | L | iP | iL | Screen-specific checks |
|---|---|---|---|---|---|---|
| Edit profile index | `profile-edit/index.tsx` | ☐ | ☐ | ☐ | ☐ | Row width cap |
| Edit username | `profile-edit/edit-username.tsx` | ☐ | ☐ | ☐ | ☐ | Keyboard in landscape |
| Edit age | `profile-edit/edit-age.tsx`, `SetupAge.tsx` (uses Modal) | ☐ | ☐ | ☐ | ☐ | Picker modal on iPad / landscape |
| Edit email | `profile-edit/edit-email.tsx` | ☐ | ☐ | ☐ | ☐ | Keyboard |
| Edit Patreon | `profile-edit/edit-patreon.tsx` | ☐ | ☐ | ☐ | ☐ | OAuth browser return after rotation |
| Edit Bluesky | `profile-edit/edit-bluesky.tsx` | ☐ | ☐ | ☐ | ☐ | Keyboard |

### Signup flow (modal stack, can't be dismissed)
| Screen | File | P | L | iP | iL | Screen-specific checks |
|---|---|---|---|---|---|---|
| Signup main | `signup/index.tsx` | ☐ | ☐ | ☐ | ☐ | Hero/art scaling, buttons reachable in landscape |
| Email | `signup/signup-email.tsx` | ☐ | ☐ | ☐ | ☐ | Keyboard |
| Reset (magic link) | `signup/signup-reset.tsx` | ☐ | ☐ | ☐ | ☐ | Deep link while rotated |
| Username | `signup/signup-username.tsx` | ☐ | ☐ | ☐ | ☐ | Keyboard |
| Age | `signup/signup-age.tsx` | ☐ | ☐ | ☐ | ☐ | Picker |
| Notifications | `signup/signup-notifications.tsx` | ☐ | ☐ | ☐ | ☐ | Illustration fits |
| Patreon | `signup/signup-patreon.tsx` | ☐ | ☐ | ☐ | ☐ | — |
| Bluesky | `signup/signup-bluesky.tsx` | ☐ | ☐ | ☐ | ☐ | Keyboard |
| Complete | `signup/signup-complete.tsx` | ☐ | ☐ | ☐ | ☐ | — |

### Root modals (`presentation: 'modal'`: on iPad these show as a page sheet)
| Screen | File | P | L | iP | iL | Screen-specific checks |
|---|---|---|---|---|---|---|
| Comments | `comments.tsx`, `CommentForm.tsx`, `CommentItem.tsx` | ☐ | ☐ | ☐ | ☐ | Keyboard + input bar in landscape; CommentItem action Modal |
| Edit tagline | `edit-tagline.tsx` | ☐ | ☐ | ☐ | ☐ | Keyboard |
| Reports | `reports.tsx` | ☐ | ☐ | ☐ | ☐ | Option list scrolls in landscape |
| Blog (webview) | `blog.tsx` | ☐ | ☐ | ☐ | ☐ | WebView resizes on rotation |
| Wrapped deep-link screens | `wrapped-screens/*` (comicseries, comicissue, creator, list, tagged, trending, profile, claimcreator, hostingprovider, apihostingprovider) | ☐ | ☐ | ☐ | ☐ | Open each via a deep link in both orientations; close button visible in the iPad sheet |

### Shared mobile UI
- [ ] `components/ui/ScreenHeader.tsx`, `HeaderBackButton.tsx`, `HeaderShareButton.tsx`: landscape insets
- [ ] `components/ui/DropdownMenu.tsx`: anchored position after rotation
- [ ] `components/ui/Screen.tsx`: safe-area edges include left/right
- [ ] `components/ui/ExpandableText.tsx`: line clamp recalculates when width changes
- [ ] `components/creator/CreatorForIssue.tsx`: uses `useWindowDimensions` (verify)
- [ ] App launch / splash (`AppLoaderProvider`) in landscape and on iPad
- [ ] Share sheet / action sheets need an anchor on iPad (otherwise they crash or show a popover)
- [ ] Push-notification deep link opens correctly while in landscape

---

## Web (React Router): `website/app/routes/`
Check: **W-L** (phone landscape), **iP/iL** (iPad Safari, 820 and 1180), **W-lg** (desktop), and resizing the browser live.

### Shared web UI
- [ ] `components/ui/NavBar.tsx`: collapse breakpoint, sticky height in a short landscape viewport
- [ ] `components/ui/Footer.tsx`
- [ ] `components/ui/GetAppButton.tsx`: iPad detection (iPadOS reports a desktop UA)
- [ ] Modals: `ConfirmModal.tsx`, `ReportModal.tsx`, `EditTaglineModal.tsx`, `profile/SignupModal.tsx`: fit within a 393px-tall viewport, scroll internally
- [ ] `components/ui/NotFound.tsx`, `routes/error.tsx`

### Routes
| Route | File | W-L | iP | iL | W-lg | Screen-specific checks |
|---|---|---|---|---|---|---|
| `/` Home | `home.tsx` | ☐ | ☐ | ☐ | ☐ | Carousels, hero |
| `/comics/:shortUrl` | `comicseries.tsx` | ☐ | ☐ | ☐ | ☐ | Banner, tagline, genre pills, episode grid |
| `/comics/:shortUrl/:episodeId` | `comicissue.tsx` | ☐ | ☐ | ☐ | ☐ | **Reader**: panel width, fixed header/footer in landscape, comments |
| `/creators/:shortUrl` | `creator.tsx` | ☐ | ☐ | ☐ | ☐ | CreatorsForIssue layout |
| `/lists/:id` | `list.tsx` | ☐ | ☐ | ☐ | ☐ | — |
| `/tagged/:tag` | `tag.tsx` | ☐ | ☐ | ☐ | ☐ | Grid columns |
| `/genre/:genre` | `genre.tsx` | ☐ | ☐ | ☐ | ☐ | Grid columns |
| `/search/:term/:types?` | `search.tsx` | ☐ | ☐ | ☐ | ☐ | Input + results |
| `/most-liked` | `most-liked.tsx` | ☐ | ☐ | ☐ | ☐ | — |
| `/most-discussed` | `most-discussed.tsx` | ☐ | ☐ | ☐ | ☐ | — |
| `/:username` | `profile.tsx` | ☐ | ☐ | ☐ | ☐ | — |
| `/profile/setup` | `profile/setup.tsx` | ☐ | ☐ | ☐ | ☐ | Multi-step forms, keyboard |
| `/profile/settings` | `profile/settings.tsx` | ☐ | ☐ | ☐ | ☐ | — |
| `/profile/notifications` | `profile/notifications.tsx` | ☐ | ☐ | ☐ | ☐ | — |
| `/profile/notification-settings` | `profile/notification-settings.tsx` | ☐ | ☐ | ☐ | ☐ | — |
| `/profile/edit` (+ username, age, email, patreon, bluesky) | `profile/edit*.tsx` | ☐ | ☐ | ☐ | ☐ | Forms, keyboard |
| `/claim-creator/:uuid` | `claim-creator.tsx` | ☐ | ☐ | ☐ | ☐ | — |
| `/hosting-provider/:uuid` | `hosting-provider.tsx` | ☐ | ☐ | ☐ | ☐ | — |
| `/blog`, `/blog/:slug` | `blog.tsx`, `blog-post.tsx`, `components/blog/*` | ☐ | ☐ | ☐ | ☐ | RankedListPostPage, JumpToRank, GenreFilterBar |
| `/updates/:slug?` | `updates.tsx` | ☐ | ☐ | ☐ | ☐ | Notion content |
| `/open-source/:slug?` | `open-source.tsx` | ☐ | ☐ | ☐ | ☐ | Notion content |
| `/terms-of-service/:slug?` | `terms-of-service.tsx` | ☐ | ☐ | ☐ | ☐ | — |
| `/about-us` | `about-us.tsx` | ☐ | ☐ | ☐ | ☐ | — |
| `/our-roadmap` | `our-roadmap.tsx` | ☐ | ☐ | ☐ | ☐ | — |
| `/brand-kit` | `brand-kit.tsx` | ☐ | ☐ | ☐ | ☐ | (currently being edited) |
| `/download-app` | `download-app.tsx` | ☐ | ☐ | ☐ | ☐ | Store badges, iPad UA |
| `/discord-art-challenge-2026` | `discord-art-challenge-2026.tsx` | ☐ | ☐ | ☐ | ☐ | — |
| `/reset`, `/logout`, `/canny-login` | `reset.tsx`, `logout.tsx`, `canny-login.tsx` | ☐ | ☐ | ☐ | ☐ | Transient pages; quick check |

---

## Sign-off
- [ ] App Store: iPad screenshots added
- [ ] All "Known risks" `Dimensions.get` cases fixed
- [ ] Every mobile row checked on a real iPad + iPhone (simulator rotation: ⌘← / ⌘→)
- [ ] Every web row checked in iPad Safari + responsive devtools

