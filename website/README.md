# Inkverse Website

## Quick Setup (Using Production Inkverse API)

1. Install dependencies

```
yarn install - W
```

We use yarn workspaces to install packages for the whole project, including the shared modules.

This project contains 2 shared modules: shared & public:
- shared: contains shared code for both the Web & React Native apps. ex) GraphQL Queries and Mutations needed for the app.
- public: contains constants used for all Inkverse repos.

Using -W installs dependencies for the whole project, including the shared modules.

2.Setup config file

Inside `config.ts`, change developmentConfig to developmentConfigButProductionData. This will use Inkverse's production API.


3. Localhost vs inkverse.test

We use custom localhost (inkverse.test) vs localhost, the benefit is that on your local machine you dont mix up cookies and other brower data between different localhost projects.

To set it up, add this to your hosts file, by `sudo vim /etc/hosts` on Mac/Linux.

```
127.0.0.1               localhost
127.0.0.1               inkverse.test
```

Now you can use `inkverse.test` as an alias for `localhost`, like we do in the config file.

4. Start the app

```
   yarn dev
```

The web app will now be running on [inkverse.test:8082](http://inkverse.test:8082).

## Local Development Setup

If you want to build new features or fix bugs, you will need to setup your own local server. See [graphql-server/README.md](https://github.com/taddyorg/inkverse-graphql-server) for instructions on how to setup a local server. Once you have your local server running, you can use the following steps to setup the React Native app to use your local server.

1. Reset config file back to developmentConfig.

Inside `config.ts`, if you have updated developmentConfig to developmentConfigButProductionData, make sure to reset it back to developmentConfig. This will use your local server.

2. Run the app

```
   yarn start
```

If you get an Apollo error, your local server is not running or it is not pointing to the correct url.