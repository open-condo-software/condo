# {{ name }}

```
cat > .env << ENDOFFILE
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1/main
NODE_ENV=development
DISABLE_LOGGING=true
COOKIE_SECRET=random
SERVER_URL=http://localhost:3000
TESTS_FAKE_CLIENT_MODE=true

# production docker deploy envs!
DOCKER_FILE_INSTALL_COMMAND=python3 -m pip install 'psycopg2-binary>=2.8.5' && python3 -m pip install 'Django>=3.0.6'
DOCKER_FILE_BUILD_COMMAND=echo yarn workspace @app/{{ name }} build
DOCKER_COMPOSE_APP_IMAGE_TAG={{ name }}
DOCKER_COMPOSE_START_APP_COMMAND=yarn workspace @app/{{ name }} start
DOCKER_COMPOSE_DATABASE_URL=postgresql://postgres:postgres@postgresdb/main
DOCKER_COMPOSE_COOKIE_SECRET=random
DOCKER_COMPOSE_SERVER_URL=http://localhost:3003
ENDOFFILE

docker-compose up -d postgresdb
yarn

bash ./bin/warm-docker-cache
docker-compose build

# migrate!
docker-compose run app yarn workspace @app/{{ name }} migrate

yarn workspace @app/{{ name }} dev
```

# create postgres schema migration

```
# create migration script at migrations/20201212124723-00xx_name.js
docker-compose run app yarn workspace @app/{{ name }} makemigrations

# migrate current DB to new schema
docker-compose run app yarn workspace @app/{{ name }} migrate
```
