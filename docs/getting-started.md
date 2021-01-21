# Init your own monorepo Fork

You should have `docker-compose`, `git` and `node` commands.
You can create a fork of [boilerplate](https://github.com/8iq/nodejs-hackathon-boilerplate-starter-kit) by click on github `Use Template` button or fork the repo.

```bash
# 1) Fork https://github.com/8iq/nodejs-hackathon-boilerplate-starter-kit

# 2) Clone your fork!
git clone git@github.com:USERNAME/REPOSITORY.git my-new-startup
cd my-new-startup

# 3) Add template origin for easy updates from 8iq repo
git remote add template git@github.com:8iq/nodejs-hackathon-boilerplate-starter-kit.git

# 4) Install dependencies and link workspaces
yarn
```

# Create new application

```bash
# 1) run create app command
yarn createapp APPNAME

# 2) follow the README quick start (check ./apps/APPNAME/ folder)
```

[continue to some advanced topics](getting-started-adv.md)
