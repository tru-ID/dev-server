# 4Auth Node Server

The 4Auth Node Server provides basic example code to be used with a 4Auth Client using the Phone Check product.

## Before you being

You will need:

- Node.JS installed
- a 4Auth account
- a local tunnel solution if you wish to recieve Phone Check callbacks

## Getting Started

Clone or unzip the 4Auth Node Server into a directory.

### Create a 4Auth Project

- Install the [4Auth CLI](https://4auth.io/docs/reference/cli)
- Setup the CLI with the `client_id` and `client_secret` from the [4Auth Console](https://4auth.io/console)
- Create a project with the CLI pointing to the 4Auth Node Server directory `$ 4auth projects:create --project_dir PATH_TO_DIR`. This will create a `4auth.json` file in the directory.

### Install dependencies:

```
npm install
```

or

```
yarn install
```

## Configuration

If required, you can make configuration changes with the following environment variables:

- `PORT` : change the port that the server listens on
- `DEBUG` : determines whether debug information is logged via `console.log`
- `CONFIG_PATH` : the path to the `4auth.json` configuration file for the 4Auth project
- `API_BASE_URL` : the 4Auth base URL. Defaults to `https://eu.api.4auth.io`

### Phone Check callbacks

If you wish to receive Phone Check HTTP callbacks when the Phone Check enters and end state, you must:

1. Run a local tunnel solution to expose your local running server to the Internet
2. Configure your Project to have a `phonecheck_callback_url

From the project directory run the following command replacing `{local_tunnel_url}` with the URL exposing your localhost server to the Internet:

```
$ 4auth projects:update --phonecheck-callback {local_tunnel_url}/callback
```

### Run the server

```
npm start
```

or 

```
yarn start
```