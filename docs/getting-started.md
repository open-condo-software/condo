# Init repo

You should have `docker-compose`, `git` and `node` commands.
You can create a fork of [boilerplate](https://github.com/8iq/nodejs-hackathon-boilerplate-starter-kit) by click on github `Use Template` button or fork the repo.

```bash
# 1) Clone the repo
git clone git@github.com:open-condo-software/open-condo-platform.git my-condo
cd my-condo

# 2) Install dependencies and link workspaces
yarn

# 3) startup redis and postgres
docker-compose up -d postgresdb redis

# 4) create base .env file
cp .env.example .env

# 5) create databases for all apps and apps/.env files
node ./bin/prepare.js
```

[continue to some advanced topics](getting-started-adv.md)
