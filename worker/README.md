# Worker

The Worker repo is a collection of scripts and useful commands for running various background or scheduled jobs.

## Setup Database and Queues

If you haven't already, follow the steps in the [root README](../README.md) to setup the database and queues locally.

## Environment Variables

There is a `.env.example` file in the root of the worker directory. Make a copy of it and name it `.env`. Fill it in with your values.

## Useful Commands

### Create a queue (worker/src/shared/queues/create-new-queue)

```bash
yarn run create-new-queue INKVERSE_HIGH_PRIORITY
```

### Run tasks in a queue (worker/src/shared/queues/receive-messages)

```bash
yarn run receive-messages
```

### QUEUES Basic Commands

```bash
aws --endpoint-url [http://localhost:4102](http://localhost:4102) sqs list-queues
aws --endpoint-url [http://localhost:4102](http://localhost:4102) sqs receive-message --queue-url [http://localhost:4102/INKVERSE_HIGH_PRIORITY](http://localhost:4102/INKVERSE_HIGH_PRIORITY)
aws --endpoint-url [http://localhost:4102](http://localhost:4102) sqs get-queue-attributes --queue-url [http://localhost:4102/INKVERSE_HIGH_PRIORITY](http://localhost:4102/INKVERSE_HIGH_PRIORITY)
aws --endpoint-url [http://localhost:4102](http://localhost:4102) sqs purge-queue --queue-url [http://localhost:4102/INKVERSE_HIGH_PRIORITY](http://localhost:4102/INKVERSE_HIGH_PRIORITY)
```

### Import all comics from Taddy's API (worker/src/scripts/feeds/import-all-comics.ts)

First, download the [full list of comics from Taddy's API](https://taddy.org/developers/comics-api/bulk-download-comicseries). 

Next, rename the file to `comicseries.txt` and place it in the `worker/input` directory.

Run the following command to import all comics into your database:

```bash
yarn run import-all-comics
```

### Add individual comic from Taddy's API (worker/src/scripts/feeds/add-new-feed-by-uuid)

```bash
yarn run add-new-feed-by-uuid comicseries 96cc49d7-a95d-4266-b408-b57c7d26a62e
yarn run add-new-feed-by-uuid comicseries 96cc49d7-a95d-4266-b408-b57c7d26a62e updated (created by default)
yarn run add-new-feed-by-uuid creator 87aa38ce-2960-4fde-83e6-e638a2d77b2d
```

### Sync a specific piece of content from Taddy's API (worker/src/scripts/feeds/mock-webhook-event)

```bash
yarn run mock-webhook-event comicseries.updated 96cc49d7-a95d-4266-b408-b57c7d26a62e
yarn run mock-webhook-event comicissue.updated 787bddbd-b840-482c-83eb-5191ed4748ba
yarn run mock-webhook-event creator.updated 87aa38ce-2960-4fde-83e6-e638a2d77b2d
yarn run mock-webhook-event creatorcontent.updated 87aa38ce-2960-4fde-83e6-e638a2d77b2d:96cc49d7-a95d-4266-b408-b57c7d26a62e
```

### Audit a comic (worker/src/scripts/feeds/audit-comic)

Checks if a comic and all of its episodes are added to the database.

```bash
yarn run audit-comic 96cc49d7-a95d-4266-b408-b57c7d26a62e
```

### Delete cache (API + Cloudflare)
```bash
yarn run purge-cache everything
yarn run purge-cache-production everything // if you want to delete the production cache
```

### Database Migrations
Run the following command to run a database migration:

```bash
yarn run migrate
```

Run the following command to rollback the last database migration:

```bash
yarn run migrate:rollback
```

### Pre-download comic story height and width
```bash
yarn run pre-download-comic-stories-height-and-width
```

### Send push notification
```bash
yarn run mock-push-notification '{"pushNotificationType": "NEW_EPISODE_RELEASED", "seriesUuid": "abc123", "issueUuid": "def456"}'
```

### Test push notification directly
```bash
yarn run test-push-direct 123
```

### Disconnect hosting provider (worker/src/scripts/user/disconnect-hosting-provider.ts)
```bash
yarn run disconnect-hosting-provider 123
```