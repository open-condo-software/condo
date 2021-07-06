Migrations guide
=====

Migrations should not be changed if they have already been merged in master ;)
Don't change migration files by hands If you don't really understand how the `kmigrator` works!

## Snippets

Drop database and reapply all migrations:

```
docker-compose down &&
docker-compose up -d postgresdb redis &&
docker-compose run app yarn workspace @app/condo makemigrations &&
docker-compose run app yarn workspace @app/condo migrate
```

To reflect changes, made on Keystone schemas, with database schema, create migration file, that will be added into `apps/condo/migrations`:

```
docker-compose run app yarn workspace @app/condo makemigrations
```

Migrate current database to new schema, this will run all migrations, that was not applied:

```
docker-compose run app yarn workspace @app/condo migrate
```

Rollback last applied migration:

```
docker-compose run app yarn workspace @app/condo kmigrator down
```

## Workflow cases

### Changed a schema during work in progress — recreate corresponding migration

Suppose, You changed structure of a schema, you are working with.
You need changes to be reflected in a corresponding migration file.
Don't change migration file by hands.
Instead, recreate it completely.

1. Roll it back:

```
docker-compose run app yarn workspace @app/condo kmigrator down
```

2. Delete the migration file

3. Recreate migrations:

```
docker-compose run app yarn workspace @app/condo makemigrations
```

### Do not merge migration files by hands

If Your work results to several migration files, that You need to merge into one, don't do it by hands.
It's not enough just to merge SQL-contents of migration files, because a special system comment "KMIGRATOR…" will not be conformed with the file anymore.

To merge several sequential migration files into one:

1. Roll them back, one by one using

```
# roll one step back
docker-compose run app yarn workspace @app/condo kmigrator down
# roll one more step back
docker-compose run app yarn workspace @app/condo kmigrator down
# etc.
``` 

2. Delete files
3. Generate new migration file using:

```
docker-compose run app yarn workspace @app/condo makemigrations
```

### Stay in sync with other's migrations

If You are ready to ship Your work, make a rebase and look at migrations, created by others.
Maybe, your migration number is not ahead of others anymore.

1. Roll back your migration

```
docker-compose run app yarn workspace @app/condo kmigrator down
```   

2. Delete your migration file

3. Generate new migration

```
docker-compose run app yarn workspace @app/condo makemigrations
```

## Errors and solutions

### CommandError: Conflicting migrations detected

It's better to roll back your migration and recreate it. But sometimes you should do:

```
docker-compose run app python apps/condo/.kmigrator/manage.py makemigrations --merge
```

If the util ask You to provide a default value, it expects it in Python syntax.