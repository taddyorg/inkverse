# Inkverse Server setup instructions

This is the main server for Inkverse, a GraphQL API.

## Steps to Setup

0. Basic setups
  - Have or Install node >= 20.
  - Install yarn (npm install -g yarn)
  - Download & install Docker for Mac: https://store.docker.com/editions/community/docker-ce-desktop-mac

1. Create a .env file

- Copy the `.env.copy` file to `.env` in this project's root. You will fill in these values in the next couple of steps.

2. Setup databases

Inkverse's server requires the following databases:
- Postgres (main database)

### To setup Postgres

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

3. Setup AWS SQS Queues locally

```
docker run -d --name inkverse-queues -p 4102:4100 admiralpiett/goaws
```

This is a local message queue system that mimics AWS SQS queues. We use queues to handle sending emails, push notifications, etc.

Everytime you restart the docker container (or restart your laptop) you will have to create the queues again and all messages in your queues will be deleted.

See Step 7 below for adding `us-east-1.goaws.com` to your hosts file.

4. Setup JWT keys

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

5. Install packages for this project

```
yarn install
```

We use yarn workspaces to install packages for the whole project, including the shared modules.

This project contains 2 shared modules: shared & public:
- shared: contains shared code for backend Inkverse repos. ex) CRUD for Database.
- public: contains constants used on both frontend & backend.

6. Run database migrations

```
yarn run migrate
```

You may run into an error where it states you cannot update a table because it has not exist yet. This is because the migrations are current not run in a specific order. 

To fix this, move all the update table migrations to another folder, then run migrate again. Next, move the update table migrations back to the original folder and run migrate again.

7. Localhost vs inkverse.test

We use custom localhost (inkverse.test) vs localhost, the benefit is that you dont mix up cookies and other brower data between different localhost projects.

To set it up, add this to your hosts file, by `sudo vim /etc/hosts` on Mac/Linux.

```
127.0.0.1               localhost
127.0.0.1               inkverse.test
127.0.0.1               us-east-1.goaws.com
```

You should also add `us-east-1.goaws.com` to your hosts file, as it is used by inkverse-queues.

8. Run the server!

```
yarn run dev
```

Inkverse is now running on [inkverse.test:3010](http://inkverse.test:3010/).

---

## Helpful commands

If you ever need to start the containers (after a computer restart)

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

This will generate the types in `src/shared/graphql`. Each repo has a `graphql-codegen.yml` file that is used to generate the types for that repo.