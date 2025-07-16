# Inkverse Website

This is the main website for Inkverse, a comic reading platform.

## Quick Setup

If you want to quickly setup the website app and see it in action you can setup the website to point to Inkverse's production API. This allows you to tweak code and styles without having to setup your own local server.

### 0. Basic setups
  - Have or Install node >= 20.
  - Install yarn (npm install -g yarn)
  - Download the Inkverse project from GitHub.

### 1. Install packages for the whole Inkverse project

```
yarn install
```

### 2. Localhost vs inkverse.test

We use a custom localhost (inkverse.test) vs localhost, the benefit is that you dont mix up cookies and other brower data between your different localhost projects.

To set it up, add this to your hosts file, by `sudo vim /etc/hosts` on Mac/Linux.

```
127.0.0.1               localhost
127.0.0.1               inkverse.test // Custom localhost for Inkverse
```

This maps both `inkverse.test` and `localhost` to 127.0.0.1, but allows cookies to be isolated for this project. 

### 3. Setup config file

Inside `website/config.ts`, change developmentConfig to developmentConfigButProductionData. This will use Inkverse's production API server.

### 4. Build and Watch for changes in shared packages

This will build the shared packages and watch for any changes you make to them.

```
yarn watch:internal-packages
```

### 5. Start the app

Start a new tab in your terminal and run the following command to start the website.

```
cd website
yarn dev
```

The website will now be running on [inkverse.test:8082](http://inkverse.test:8082).

### 6. To login with your production Inkverse account

Signup with Google or Apple or Email do not work in local development mode for security reasons (CORS). However, you can run the react native apps locally and login with your production Inkverse account.

## Full Local Setup

To build new features or fix bugs, you will need to setup your own local server. This includes following the steps in the [root README](../README.md) to setup the database, queues and install dependencies and then following the instructions in [graphql-server/README.md](../graphql-server/README.md) for instructions on how to setup a local server. Once you have setup the local server, continue with the instructions below.

### 1. Reset config file back to developmentConfig.

Inside `config.ts`, if you have updated developmentConfig to developmentConfigButProductionData, make sure to reset it back to developmentConfig. This will use your local server.

### 2. Run the app

```
   yarn start
```

The website will now be running on [inkverse.test:8082](http://inkverse.test:8082).

If you get an Apollo error, your local server is not running or it is not pointing to the correct url.

## Docs

Documentation for this application is in the [docs](./docs) folder. In particular, the [architecture.md](./docs/architecture.md) file contains a high-level overview of the application.