# Inkverse React Native App

This is the main React Native app for Inkverse, a comic reading platform. It creates a native app that can be run on iOS and Android.

## Steps to Setup

If you haven't already, follow the steps in the [root README](../README.md) to setup the database, queues and install dependencies.

## Quick Setup (Using Production Inkverse API)

1. Setup config file

Inside `config.ts`, change developmentConfig to developmentConfigButProductionData. This will use Inkverse's production API.

2. Start the app

```
cd react-native
yarn dev
```

You can now select `i` to run the app on the iOS Simulator or `a` to run the app on the Android Emulator.

## Local Development Setup (Using your own local server)

If you want to build new features or fix bugs, you will need to setup your own local server. See [../graphql-server/README.md](../graphql-server/README.md) for instructions on how to setup a local server.

1. Reset config file back to developmentConfig.

Inside `config.ts`, if you have updated developmentConfig to developmentConfigButProductionData, make sure to reset it back to developmentConfig. This will use your local server.

2. Run the app

```
yarn dev
```

If you get an Apollo error, your local server is not running or your config is not pointing to the correct url.

### Docs

Documentation for this application is in the [docs](./docs) folder. In particular, the [architecture.md](./docs/architecture.md) file contains a high-level overview of the application.