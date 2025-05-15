# Inkverse setup instructions

Inkverse is a comic reading platform.

## Monorepo Structure

- `/website`: React web frontend
- `/react-native`: React Native mobile app
- `/graphql-server`: Node.js GraphQL backend
- `/worker`: Background job processor
- `/cloud`: Cloudflare edge services
- `/packages`: Internal packages (shared utilities and types)
  - `packages/shared-client`: Shared client code (Frontend shared utilities)
  - `packages/shared-server`: Shared server code (Backend shared utilities)
  - `packages/public`: Shared constants and types

## Steps to Setup

### 0. Basic setups
  - Have or Install node >= 20.
  - Install yarn (npm install -g yarn)
  - Download & install Docker for Mac: https://store.docker.com/editions/community/docker-ce-desktop-mac

### 1. Create a .env file

- Copy the .env file from `packages/shared-server/.env.example` to `packages/shared-server/.env`. You will fill in these values in the next couple of steps.

### 2. Setup databases

Inkverse's backend requires the following databases:
- Postgres (main database)

#### To setup Postgres

Make up a USERNAME, PASSWORD, and DB-NAME for your local database. Pass these in as environment variables to the command below.

```
docker run --name inkverse-postgres -e POSTGRES_USER=USERNAME -e POSTGRES_PASSWORD=PASSWORD -e POSTGRES_DB=DB-NAME -d  -v ~/docker-vms/inkverse-postgresdata:/var/lib/postgresql/data -p "5432:5432" postgres:13.16
```

Update the `.env` file in the following format:
```
DATABASE_USERNAME=USERNAME
DATABASE_PASSWORD=PASSWORD
DATABASE_NAME=DB-NAME
DATABASE_ENDPOINT=localhost
DATABASE_PORT=5432
```

#### FYI - Docker Coles notes:
Docker has 2 main components: images & containers. A image is a definition of what you want to create and a container is an instance of the image.

You may have noticed a couple of flags in the command above:

**-e**: pass a value as an environment variable when you create the container.  
**-v**: Volume mounting. ie) Maps a directory in the container to a local directory of your choosing. This means whenever you restart your computer, you dont lose all the data you have created previously as the data keeps persisted in a folder on your local disk even if the container dies.
**-p**: Maps the port in your container to your localhost port.

Some helpful docker commands:

**docker ps -a** - Lists all containers, even stopped containers  
**docker run** - You only need to run the `docker run` command once to create a container. After you have run the docker run command, you can just start/stop the containers going forward.
**docker start <containerId>** - Starts a container, once you have it setup your containers you can start and stop them ex) when your computer restarts.  
**docker stop <containerId>** - Stops a container

### 3. Setup AWS SQS Queues locally

```
docker run -d --name inkverse-queues -p 4102:4100 admiralpiett/goaws
```

This is a local message queue system that mimics AWS SQS queues. We use queues to handle sending emails, push notifications, etc.

Everytime you restart the docker container (or restart your laptop) you will have to create the queues again and all messages in your queues will be deleted.

In Step 7 below, we will finalize setting up the queue by adding `us-east-1.goaws.com` to your hosts file.

### 4. Setup JWT keys

We need to generate a private & public key for signing & verifying JWT tokens. We use JWT tokens for user authentication. 

- Run the following code to create a `jwt.key` file (Don't add passphrase when asked). This will create a private key that is used for signing JWT tokens.

```
ssh-keygen -t rsa -b 4096 -m PEM -f jwt.key
```

- Run the following code to generate a `jwt.key.pub` file. This will create a public key for verifying JWT tokens.

```
openssl rsa -in jwt.key -pubout -outform PEM -out jwt.key.pub
```

Update the `.env` file with the following values (you will need to remove newlines and replace them with \n so that the whole key is on one line):

```
PUBLIC_JWT=
PRIVATE_JWT=
```

You can delete the `jwt.key` and `jwt.key.pub` files (after you've copied them to the `.env` file).

### 5. Install packages for this project

```
yarn install
```

### 6. Run database migrations

```
yarn run migrate
```

### 7. Localhost vs inkverse.test

We use a custom localhost (inkverse.test) vs localhost, the benefit is that you dont mix up cookies and other brower data between different localhost projects.

To set it up, add this to your hosts file, by `sudo vim /etc/hosts` on Mac/Linux.

```
127.0.0.1               localhost
127.0.0.1               inkverse.test // Custom localhost for Inkverse
127.0.0.1               us-east-1.goaws.com // Used by inkverse-queues (from Step 3)
```

Note: We added `inkverse.test` and `us-east-1.goaws.com` to the hosts file.

### 8. Run Inkverse!

To run the backend server, run the following command:

```
cd graphql-server
yarn run dev
```

To run the website, run the following command:

```
cd website
yarn run dev
```

To run the iOS app, or Android app, run the following command:

```
cd react-native
yarn run ios
```

```
cd react-native
yarn run android
```


Inkverse is now running on [inkverse.test:3010](http://inkverse.test:3010/).

---

## Helpful commands

If you ever need to start the docker containers used for Inkverse (after a computer restart)

```
docker start inkverse-postgres && docker start inkverse-queues
```

If you ever need to stop the containers

```
docker stop inkverse-postgres && docker stop inkverse-queues
```

### Update GraphQL Types

If you make changes to the GraphQL schema, run the following command to generate types.

```
yarn run graphql-codegen
```

### Docs

Documentation for the project are in the [docs](./docs) folder. 

- [CLAUDE.md](./CLAUDE.md) - Claude AI instructions for working with the project.
- [architecture.md](./docs/architecture.md) - High-level overview of the application.