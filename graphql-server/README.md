# Inkverse Server

This is the main server for Inkverse, a GraphQL API.

## Steps to Setup

If you haven't already, follow the steps in the [root README](../README.md) to setup the database, queues and install dependencies.

## Environment Variables

There is a `.env.example` file in the root of the graphql-server directory. Make a copy of it and name it `.env`. Fill it in with your values.

## Run the server!

```
cd graphql-server
yarn run dev
```

Inkverse is now running on [inkverse.test:3010](http://inkverse.test:3010/).

### Docs

Documentation for this application is in the [docs](./docs) folder. In particular, the [architecture.md](./docs/architecture.md) file contains a high-level overview of the application.