# Inkverse Website

This is the main website for Inkverse, a comic reading platform.

## Steps to Setup

If you haven't already, follow the steps in the [root README](../README.md) to setup the database, queues and install dependencies.

## Quick Setup (Using Production Inkverse API)

1. Setup config file

Inside `config.ts`, change developmentConfig to developmentConfigButProductionData. This will use Inkverse's production API instead of your local server.

2. Start the app

```
   yarn dev
```

The web app will now be running on [inkverse.test:8082](http://inkverse.test:8082).

## Local Development Setup

If you want to build new features or fix bugs, you will need to setup your own local server. See [../graphql-server/README.md](../graphql-server/README.md) for instructions on how to setup a local server. Once you have your local server running, you can use the following steps to setup the Website to use your local server.

1. Reset config file back to developmentConfig.

Inside `config.ts`, if you have updated developmentConfig to developmentConfigButProductionData, make sure to reset it back to developmentConfig. This will use your local server.

2. Run the app

```
   yarn start
```

The website will now be running on [inkverse.test:8082](http://inkverse.test:8082).

If you get an Apollo error, your local server is not running or it is not pointing to the correct url.

### Docs

Documentation for this application is in the [docs](./docs) folder. In particular, the [architecture.md](./docs/architecture.md) file contains a high-level overview of the application.