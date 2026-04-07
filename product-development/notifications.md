# Notifications System - Implementation Plan

## Context

Inkverse currently has fire-and-forget push notifications for `NEW_EPISODE_RELEASED` only. No notification history is stored, so users can't see past notifications. This plan adds a full notification system: persistent storage, in-app notification feed, push delivery for new event types, bundling for creators, and a notification settings screen.

**Key decisions:**
- Bell icon on Profile screen header (next to settings gear), only on own profile
- Reader & Creator events have different default settings for events
- Email: enabled with placeholder templates (creator events ON by default, reader events OFF by default)
- Notification settings use override model: defaults in code, user overrides stored in DB

---

## Phase 1: Database Schema

### Migration 26: `user_notifications` table

```
user_notifications:
  id              bigIncrements (PK)
  created_at      bigInteger (epoch)
  user_id         bigInteger (NOT NULL, FK users.id)
  actor_id        bigInteger (nullable, FK users.id) — who triggered this (can be null for system notifications)
  event_type      string (NOT NULL) — see enum below
  target_uuid     string (NOT NULL) — the entity this is about (item UUID, comment UUID)
  target_type     string (NOT NULL) — COMICISSUE, COMMENT, COMICSERIES
  parent_uuid     string — context for navigation (e.g., series UUID)
  parent_type     string — e.g., COMICSERIES

  Indexes:
  - [user_id] — user lookup
  - [user_id, created_at DESC] — main feed query
  - [user_id, event_type, target_uuid] — aggregation queries
```

Every event creates its own row. Bundling/aggregation is handled:
- **Client-side**: group by (event_type + target_uuid) for display (e.g., "15 people liked Episode 5")
- **Batch jobs**: aggregate when composing email/push messages

### Migration 27: `notification_settings` table

Override model: no row = use code-level default. A row means the user has explicitly changed this setting from the default. Defaults are defined in code per event_type+channel (see Delivery Channel Matrix).

```
notification_settings:
  id              bigIncrements (PK)
  created_at      bigInteger (epoch)
  updated_at      bigInteger (epoch)
  user_id         bigInteger (NOT NULL, FK users.id)
  event_type      string (NOT NULL)
  channel         string (NOT NULL) — 'PUSH' | 'EMAIL'
  is_enabled      boolean (NOT NULL)

  Unique: [user_id, event_type, channel]
  Index: [user_id]
```

### Notification Event Types

```typescript
enum NotificationEventType {
  // Reader
  NEW_EPISODE_RELEASED = 'NEW_EPISODE_RELEASED',
  COMMENT_REPLY = 'COMMENT_REPLY',
  COMMENT_LIKED = 'COMMENT_LIKED',

  // Creator
  CREATOR_EPISODE_LIKED = 'CREATOR_EPISODE_LIKED',
  CREATOR_EPISODE_COMMENTED = 'CREATOR_EPISODE_COMMENTED',
}

// Which event types should be aggregated client-side (grouped by event_type + target_uuid)
const AGGREGATED_EVENT_TYPES: Set<NotificationEventType> = new Set([
  NotificationEventType.COMMENT_LIKED,
  NotificationEventType.CREATOR_EPISODE_LIKED,
  NotificationEventType.CREATOR_EPISODE_COMMENTED,
]);
```

### Aggregation (Client-Side)

Every event gets its own row in `user_notifications`. The client uses `AGGREGATED_EVENT_TYPES` to decide which to aggregate:
- Events in `AGGREGATED_EVENT_TYPES`: group by `(event_type, target_uuid)` → "15 people liked Episode 5"
- Events NOT in `AGGREGATED_EVENT_TYPES`: show individual rows (e.g., "Alice replied to your comment")
- Email/push batch jobs also use `AGGREGATED_EVENT_TYPES` when composing messages

### Delivery Channel Matrix

There are two delivery modes based on whether the event is in `AGGREGATED_EVENT_TYPES`:

**Real-time events** (NOT in `AGGREGATED_EVENT_TYPES`): push sent immediately when event occurs

| Event Type | Real-time Push (default) | Email (default) |
|---|---|---|
| NEW_EPISODE_RELEASED | ON (existing) | OFF |
| COMMENT_REPLY | ON | OFF |

**Batched events** (IN `AGGREGATED_EVENT_TYPES`): push + email sent via digest batch job

| Event Type | Digest Push (default) | Digest Email (default) |
|---|---|---|
| COMMENT_LIKED | ON | OFF |
| CREATOR_EPISODE_LIKED | ON | ON |
| CREATOR_EPISODE_COMMENTED | ON | ON |

In-app notification rows are created unless the user has disabled both push AND email for that event type (i.e., fully opted out = no in-app either).

**No seeding needed:** Defaults are defined in code (see `NOTIFICATION_DEFAULTS` map). The `notification_settings` table only stores user overrides.

### Digest Batch Job

Multi-step process following the `hosting-provider/start.ts` pattern:

**File:** `worker/src/scripts/notifications/start.ts` — orchestrator

Each step writes output to files in `output/`, one file per recipient. Steps can be re-run independently and memory stays flat.

```typescript
async function main() {
  const timeWindow = { start: yesterday9amPST, end: today9amPST };
  const outputDir = path.join(process.cwd(), 'output');

  // Setup: clean output folder
  await cleanDir(path.join(outputDir, 'digests'));

  // Step 1: Query notifications → output/digests/{user_id}.json (one file per user)
  await getRecipients(timeWindow, path.join(outputDir, 'digests'));

  // Step 2: Aggregate + send digests (reads output/digests/, sends push + email)
  await buildAndSendDigests(path.join(outputDir, 'digests'));

  console.log('[send-notification-digests] Program finished.');
  process.exit(0);
}
```

**File:** `worker/src/scripts/notifications/get-recipients.ts`
- Queries all `user_notifications` where `event_type` IN `AGGREGATED_EVENT_TYPES` and `created_at` between window start/end
- Streams results and writes one file per `user_id` to `output/digests/{user_id}.json`
- Each file contains an array of that user's notification rows (full details: event_type, target_uuid, target_type, actor_id, parent_uuid, parent_type, created_at)
- Uses streaming to avoid loading all notifications into memory

**File:** `worker/src/scripts/notifications/build-and-send-digests.ts`
- Reads all files in `output/digests/` folder
- For each file (one per user):
  1. Parse the notification rows
  2. Aggregate by `(event_type, target_uuid)` → count + list of actor_ids
  3. Check user's `notification_settings` for digest push + digest email preferences
  4. Skip if both push + email disabled for all their event types
  5. If digest push enabled: send a single aggregated push via Expo SDK
  6. If digest email enabled: send a single aggregated email via `sendDigestEmail()`
- Processes files sequentially to keep memory flat

**Timing:** Assumes all users are in PST (future: add timezone column to users table). Job runs daily at 9am PST. Window: 9am PST yesterday → 9am PST today.

### Email Implementation

- Use existing AWS SES infrastructure (`packages/shared-server/src/messaging/email/index.ts`)
- Create placeholder email templates with basic HTML (user will fill in actual designs later)
- Single digest email per user: "Congrats, you're a superstar! Your comic got 5 new likes and 1 new comment"
- Includes unsubscribe link

---

### Scale Considerations

For `NEW_EPISODE_RELEASED` with high-subscriber series (e.g., 1M subs):
- Batch insert via worker in chunks of 1000 rows (same pattern as existing push notification batching in `sendPushNotification`)
- The worker already paginates subscriber queries — notification row creation piggybacks on this loop
- With `(user_id, created_at DESC)` index, individual user queries stay fast regardless of table size

### Cleanup Job

**File:** `worker/src/scripts/notifications/cleanup-old-notifications.ts`

- Runs daily (cron job or scheduled worker task)
- Deletes all `user_notifications` rows where `created_at < (now - 6 months)`
- Batch deletes in chunks of 10,000 to avoid long-running transactions
- Logs count of deleted rows

---

## Phase 2: Server-Side Models & Notification Service

### New Model: `UserNotification`
**File:** `packages/shared-server/src/models/user_notification.ts`

Key methods:
- `createNotification(params)` — Insert a single notification row
- `createBatchNotifications(params[])` — For bulk insert (like NEW_EPISODE_RELEASED)
- `getNotificationsForUser(userId, limit, offset)` — Paginated feed, ordered by `created_at DESC`

### New Model: `NotificationSetting`
**File:** `packages/shared-server/src/models/notification_setting.ts`

Code-level constants:
```typescript
// Which event types are batched into digests (grouped by event_type + target_uuid)
// Non-aggregated events get real-time push; aggregated events get digest push + digest email
const AGGREGATED_EVENT_TYPES: Set<NotificationEventType> = new Set([
  NotificationEventType.COMMENT_LIKED,
  NotificationEventType.CREATOR_EPISODE_LIKED,
  NotificationEventType.CREATOR_EPISODE_COMMENTED,
]);

// Default channel settings per event type (no override row = use these)
// In-app notifications always created — no toggle needed
const NOTIFICATION_DEFAULTS: Record<NotificationEventType, Record<string, boolean>> = {
  // Real-time events (not aggregated) — only PUSH toggle matters
  NEW_EPISODE_RELEASED:    { PUSH: true, EMAIL: false },
  COMMENT_REPLY:           { PUSH: true, EMAIL: false },
  // Batched events (aggregated) — PUSH = digest push, EMAIL = digest email
  COMMENT_LIKED:           { PUSH: true, EMAIL: false },
  CREATOR_EPISODE_LIKED:      { PUSH: true, EMAIL: true },
  CREATOR_EPISODE_COMMENTED:  { PUSH: true, EMAIL: true },
};
```

Key methods:
- `getOverridesForUser(userId)` — All override rows for one user
- `getOverridesForUsers(userIds, eventType)` — Batch query: `SELECT * FROM notification_settings WHERE user_id IN (...) AND event_type = $eventType`. Returns `Map<userId, { PUSH: boolean, EMAIL: boolean }>`. One query for the whole batch.
- `updateSetting(userId, eventType, channel, isEnabled)` — Upsert override row

### Notification Service — Unified Entry Point
**File:** `packages/shared-server/src/messaging/notifications/index.ts`

All notification creation goes through `createNotification()` — the single entry point for all event types, including `NEW_EPISODE_RELEASED`. This replaces the current direct call to `sendPushNotification()`.

```typescript
// Single-recipient version (used by resolvers for likes, comments, replies)
async function createNotification(params: {
  userId: number;
  actorId: number;
  eventType: NotificationEventType;
  targetUuid: string;
  targetType: InkverseType;
  parentUuid?: string;
  parentType?: string;
}): Promise<void> {
  // 1. Skip self-notifications
  if (params.userId === params.actorId) return;

  // 2. Resolve user's effective settings (overrides merged with defaults)
  const overrides = await NotificationSetting.getOverridesForUser(userId);
  const defaults = NOTIFICATION_DEFAULTS[eventType];
  const pushEnabled = overrides[eventType]?.PUSH ?? defaults.PUSH;
  const emailEnabled = overrides[eventType]?.EMAIL ?? defaults.EMAIL;

  // 3. If user has disabled both push + email, skip entirely (no in-app row either)
  if (!pushEnabled && !emailEnabled) return;

  // 4. Create in-app notification row
  await UserNotification.createNotification(params);

  // 5. For real-time events (NOT aggregated): send push + email immediately
  if (!AGGREGATED_EVENT_TYPES.has(eventType)) {
    if (pushEnabled) {
      const pushPayload = await getPushNotificationPayload({ type: eventType, ...params });
      await sendPushToUser(userId, pushPayload);
    }
    if (emailEnabled) {
      const emailPayload = await getNotificationEmailPayload({ type: eventType, ...params });
      await sendNotificationEmail(userId, emailPayload);
    }
  }

  // 6. Aggregated events: no immediate push/email — handled by digest batch job
}

// Batch version — custom logic per event type (mirrors sendPushNotification pattern)
async function createNotificationBatch(message: SendPushNotificationQueueMessage): Promise<void> {
  switch (message.pushNotificationType) {
    case 'NEW_EPISODE_RELEASED': {
      const { issueUuid, seriesUuid } = message;
      if (!issueUuid || !seriesUuid) throw new Error('issueUuid and seriesUuid required');

      // Build payloads (async — fetches comic details internally)
      const pushPayload = await getPushNotificationPayload({
        type: 'NEW_EPISODE_RELEASED', targetUuid: issueUuid, targetType: 'COMICISSUE', parentUuid: seriesUuid, parentType: 'COMICSERIES',
      });
      const emailPayload = await getNotificationEmailPayload({
        type: 'NEW_EPISODE_RELEASED', targetUuid: issueUuid, targetType: 'COMICISSUE', parentUuid: seriesUuid, parentType: 'COMICSERIES',
      });

      // Paginate through all users by ID range, check subscription
      const batchSize = 1000;
      const maxId = await User.getMaxId();
      let currentMinId = 0;

      while (currentMinId < maxId) {
        const currentMaxId = currentMinId + batchSize;

        // Get users in this ID range who are subscribed to this series
        const userIds = await UserSeriesSubscription.getSubscribedUserIdsInRange(
          seriesUuid, currentMinId, currentMaxId
        );

        if (userIds.length > 0) {
          // Check overrides — filter out fully opted-out users
          const overridesMap = await NotificationSetting.getOverridesForUsers(
            userIds, 'NEW_EPISODE_RELEASED'
          );
          const defaults = NOTIFICATION_DEFAULTS['NEW_EPISODE_RELEASED'];

          const activeIds: number[] = [];
          const pushEnabledUserIds: number[] = [];
          const emailEnabledUserIds: number[] = [];
          for (const id of userIds) {
            const o = overridesMap.get(id);
            const pushOn = o?.PUSH ?? defaults.PUSH;
            const emailOn = o?.EMAIL ?? defaults.EMAIL;
            if (!pushOn && !emailOn) continue;
            activeIds.push(id);
            if (pushOn) pushEnabledUserIds.push(id);
            if (emailOn) emailEnabledUserIds.push(id);
          }

          // Batch-insert in-app notification rows
          await UserNotification.createBatchNotifications(
            activeIds.map(id => ({
              userId: id,
              actorId: null,
              eventType: 'NEW_EPISODE_RELEASED',
              targetUuid: issueUuid,
              targetType: 'COMICISSUE',
              parentUuid: seriesUuid,
              parentType: 'COMICSERIES',
            }))
          );

          // Send push to enabled users
          if (pushEnabledUserIds.length > 0) {
            await sendBatchPushToUsers(pushEnabledUserIds, pushPayload);
          }

          // Send email to enabled users (real-time, not aggregated)
          if (emailEnabledUserIds.length > 0) {
            await sendBatchNotificationEmails(emailEnabledUserIds, emailPayload);
          }
        }

        currentMinId = currentMaxId;
      }
      return;
    }
    default:
      throw new Error(`Unknown pushNotificationType: ${message.pushNotificationType}`);
  }
}
```

### Push Notification Helpers
**File:** `packages/shared-server/src/messaging/push-notifications/index.ts`

- `sendPushToUser(userId, pushPayload)` — looks up one user's devices, sends via Expo SDK
- `sendBatchPushToUsers(userIds, pushPayload)` — batch version, reuses existing batching logic (100 devices at a time)
- `getPushNotificationPayload(params)` — async. Fetches comic/series details internally based on event type (e.g., ComicIssue, ComicSeries lookups for NEW_EPISODE_RELEASED). Returns `PushNotificationPayload`.

### Queue Changes
**File:** `packages/shared-server/src/queues/utils.ts`

- Keep `SEND_PUSH_NOTIFICATION` queue message type (no rename)
- Update `doWork()` handler: call `createNotificationBatch(message)` instead of `sendPushNotification(message)` directly

### Update Test Scripts

**File:** `worker/src/scripts/push-notifications/mock-push-notification.ts`
- Remove `validPushTypes` array (L36) and manual validation (L37-41)
- Use `NotificationEventType` enum from GraphQL/shared types to validate `pushNotificationType`
- Update usage examples to reference the enum values

**File:** `worker/src/scripts/push-notifications/test-push-direct.ts`
- Update hardcoded `type: 'NEW_EPISODE_RELEASED'` (L60) to accept event type as CLI arg
- Use `NotificationEventType` enum for validation

### Webhook — No Changes
**File:** `packages/shared-server/src/taddy/process-webhook.ts` (L137-143)

- No changes needed — still queues `SEND_PUSH_NOTIFICATION` with `{ issueUuid, seriesUuid }`
- `doWork()` routes it to `createNotificationBatch()` which handles in-app rows + push

**New file:** `packages/shared-server/src/messaging/email/notification-emails.ts`

- `getNotificationEmailPayload(params)` — async. Fetches details internally based on event type. Builds email payload (subject, body HTML). Returns `EmailPayload`.
- `sendBatchNotificationEmails(userIds, emailPayload)` — batch version, reuses existing batching logic (100 users at a time)
- `sendDigestEmail(userId, aggregatedNotifications)` — builds a single digest email from aggregated notification data
- Placeholder templates with basic HTML (user will fill in actual designs later)
- Includes unsubscribe link

---

## Phase 3: GraphQL API

### New File: `graphql-server/src/graphql/notification.ts`

**Types:**
```graphql
enum NotificationEventType {
  NEW_EPISODE_RELEASED
  COMMENT_REPLY
  COMMENT_LIKED
  CREATOR_EPISODE_LIKED
  CREATOR_EPISODE_COMMENTED
}

enum NotificationChannel {
  PUSH
  EMAIL
}

type Notification {
  id: ID!                           # maps to user_notifications.id
  createdAt: Int!
  eventType: NotificationEventType!
  actor: User                       # resolved from actor_id (null for system notifications)
  targetItem: NotificationItem      # resolved from target_uuid + target_type
  parentItem: NotificationItem      # resolved from parent_uuid + parent_type
}

type NotificationItem {
  uuid: ID!
  type: InkverseType!               # COMICISSUE, COMMENT, COMICSERIES — determines which sub-field is populated
  comicIssue: ComicIssue             # populated when type = COMICISSUE
  comment: Comment                   # populated when type = COMMENT
  comicSeries: ComicSeries           # populated when type = COMICSERIES
}

type NotificationFeed {
  userId: ID!
  notifications: [Notification]
  hasMore: Boolean!
}

type NotificationSettingStatus {
  userId: ID!
  eventType: NotificationEventType!
  channel: NotificationChannel!
  isEnabled: Boolean!                # from override row, or code-level default
}
```

**Queries:**
- `getNotificationsForUser(page: Int, limit: Int): NotificationFeed`
- `getNotificationSettings: [NotificationSettingStatus]!`

**Mutations:**
- `addOrUpdateNotificationSetting(eventType: NotificationEventType!, channel: NotificationChannel!, isEnabled: Boolean!): NotificationSettingStatus!`
  - Upserts an override row in `notification_settings` with the given `is_enabled` value

Register in `graphql-server/src/graphql/index.ts`.

---

## Phase 4: Hook Into Existing Resolvers

All calls are fire-and-forget (don't await, catch errors silently with `captureRemoteError`).

| Resolver | File | Hook Point | Notification Created |
|---|---|---|---|
| `addComment` | `graphql-server/src/graphql/usercomment.ts` ~L239 | After comment creation | `COMMENT_REPLY` (if reply, to parent comment author) + `CREATOR_EPISODE_COMMENTED` (to series creator) |
| `likeComment` | `graphql-server/src/graphql/usercomment.ts` ~L394 | After like | `COMMENT_LIKED` (to comment author) |
| `likeComicIssue` | `graphql-server/src/graphql/usercomicseries.ts` ~L166 | After like | `CREATOR_EPISODE_LIKED` (to series creator) |
**Recipient lookup for creator events:** `CreatorContent` model → get `creatorUuid` from `seriesUuid` → `User` model → find user with that `creatorUuid` → that's the `userId`.

### `NEW_EPISODE_RELEASED` — Unified Flow

**Current flow:**
1. Taddy webhook (`process-webhook.ts` L137-143) queues `SEND_PUSH_NOTIFICATION` to SQS
2. Worker (`doWork` in `utils.ts` L68-69) calls `sendPushNotification()`
3. `sendPushNotification()` queries subscribers and sends push in batches of 100

**New flow:** Everything goes through the unified `createNotificationBatch()` entry point:

1. Taddy webhook queues `SEND_NOTIFICATIONS` (renamed from `SEND_PUSH_NOTIFICATION`)
2. Worker `doWork()` handler queries subscriber IDs, then calls `createNotificationBatch()` in batches
3. `createNotificationBatch()` handles both in-app rows + real-time push through the same path as all other events

---

## Phase 5: React Native Client

### 5a. Shared Client — Dispatch & GraphQL

**New file:** `packages/shared-client/src/dispatch/notifications.ts`
- Pattern: follows `comments.ts` (reducer + action creators + dispatch functions)
- State: `{ notifications, isLoading, isLoadingMore, hasMore, page, error }`
- Functions: `loadNotifications`, `loadMoreNotifications`

**New file:** `packages/shared-client/src/dispatch/notification-settings.ts`
- State: `{ settings, isLoading, error }`
- Functions: `loadNotificationSettings`, `addOrUpdateNotificationSetting`

**New GraphQL operations** in `packages/shared-client/src/graphql/`:
- Queries: `GetNotificationFeed`, `GetNotificationSettings`
- Mutations: `addOrUpdateNotificationSetting`

Run `yarn run graphql-codegen` after adding.

### 5b. Navigation

**File:** `react-native/constants/Navigation.ts`
- Add `NOTIFICATIONS_SCREEN` and `NOTIFICATION_SETTINGS_SCREEN` constants
- Add param types to `RootStackParamList`

**File:** `react-native/app/screens/root.tsx`
- Register `NotificationsScreen` in `ProfileStack` (since bell is on profile header)
- Register `NotificationSettingsScreen` in `ProfileStack`

### 5c. Notifications Screen

**New file:** `react-native/app/screens/notifications.tsx`

- `ScreenHeader` with title "Notifications" + settings gear icon
- FlashList of notification items
- Pull-to-refresh via `ThemedRefreshControl`
- Pagination: load more on end reached
- Empty state: "No notifications yet"
- Client-side aggregation: group events in `AGGREGATED_EVENT_TYPES` by `(event_type, target_uuid)` for display

**Notification item rendering:**
- Icon per event type (heart, comment bubble, bell)
- Text varies by type:
  - Individual: "Alice replied to your comment on Episode 5"
  - Aggregated (client-side): "15 people liked Episode 5 of One Piece"
- Relative timestamp ("2h ago", "Yesterday")
- Tap: navigate to relevant content (`COMICISSUE_SCREEN`, comment, etc.)

### 5d. Notification Settings Screen

**New file:** `react-native/app/screens/notification-settings.tsx`

- Accessible from: notifications screen header gear icon + settings screen
- SectionList with two sections: "Reader Notifications" and "Creator Notifications"
- Each row: event type label + toggle switches for Push and Email
- Uses existing `Switch` / toggle patterns
- Toggling creates/updates an override row; UI shows defaults when no override exists

### 5e. Bell Icon on Profile Header

**New file:** `react-native/app/components/profile/HeaderNotificationButton.tsx`
- Similar to `HeaderSettingsButton.tsx` — uses `Ionicons` "notifications-outline"
- Positioned to the left of the settings gear icon

**Modified file:** `react-native/app/screens/profile.tsx` (~L253-255)
- Import and render `HeaderNotificationButton` next to `HeaderSettingsButton`
- Only render both when `isOwnProfile` (already gated by existing logic)

### 5f. NotificationProvider Updates

**File:** `react-native/app/components/providers/NotificationProvider.tsx`
- Add routing for new push notification types (COMMENT_REPLY → navigate to comment, etc.)

### 5g. Settings Screen Link

**File:** `react-native/app/screens/settings.tsx`
- Add "Notification Preferences" row to `allSettingsItems` that navigates to `NOTIFICATION_SETTINGS_SCREEN`

---

## Implementation Order

1. **Migrations** — `user_notifications` + `notification_settings`
2. **Models** — `UserNotification` + `NotificationSetting` (with defaults map) with all methods
3. **Notification service** — Central `createNotification()` orchestrator
4. **Queue changes** — `SEND_TARGETED_PUSH_NOTIFICATION` handler
5. **GraphQL API** — Types, queries, mutations, resolvers
6. **Resolver hooks** — Add `createNotification()` calls to existing mutations
7. **Shared client** — GraphQL operations + dispatch modules + codegen
8. **RN Navigation** — Constants + root.tsx registration
9. **RN Screens** — NotificationsScreen + NotificationSettingsScreen
10. **RN Profile header** — Bell icon with badge
11. **RN Provider** — NotificationProvider routing updates
12. **RN Settings** — Add notification preferences link
13. **Digest job** — Scheduled worker script to send aggregated push + email digests
14. **Cleanup job** — Daily worker script to delete notifications older than 6 months

## Verification

- Create notifications by liking episodes, commenting, replying, subscribing
- Verify individual rows created for each event
- Verify client-side aggregation groups creator events correctly (e.g., multiple likes on same episode)
- Verify notification settings toggles persist and are respected (override defaults)
- Verify push notifications still work for NEW_EPISODE_RELEASED
- Verify email sends for creator events (placeholder templates)
- Verify tap-to-navigate works for each notification type
- Run `npx tsc --noEmit --pretty` from react-native dir
