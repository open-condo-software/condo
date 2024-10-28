# Database upgrades

We try to update dependencies from time to time, including - databases. 
This guide will help you migrate from older versions to newer ones.

> Please note that this guide is aimed mostly at local development 
> and is not intended for migrating real production data, because in reality 
> the configuration of databases on real stands may differ significantly from the standard ones 
> specified in docker-compose, and their migration should be done with replication and no downtime.
> 
> This guide is intended to avoid losing locally accumulated database state with test data from docker-compose.


## Postgresql upgrade

### Prerequisites

In order to operate on containers you will need to know their name or ID. You can do this with the following command:

```bash
docker ps
```

### Case 1: You are not afraid of losing local data

If you're not afraid of losing local data, the easiest way to upgrade Postgres is 
to simply delete the old database and bring up the new one using the following docker-compose commands:

```bash
docker compose down postgresdb-replica postgresdb-master
```

```bash
docker compose up -d postgresdb
```

### Case 2: You want to save local data

In order to move local data from the old database to the new one, it is easiest to use the `pg_dumpall` command 
to get a complete database cast.

> This method is perfect for a small local database, but the size and speed of the dump makes this method 
ineffective on large databases. 
But since this guide is aimed at a small local development environment, we will describe this method. 
If you want to migrate large production bases, you should look at `pg_basebackup` and the infrastructure engineering team.

#### Step 1. Create a dump of existing base
Start by creating a directory where the backups will be stored, if you haven't already done so previously:

```bash
mkdir "backups"
```

Then obtain database container id / name from `docker ps` and run the following:

```bash
docker exec -it open-condo-postgresdb-master-1 pg_dumpall -U postgres > backups/pg.sql
```

Then make sure that the pg.sql file has been created in the `backups` directory. 
You can also run your eyes over it to get a quick look at its validity...

#### Step 2. Recreate database with newer version

At this stage its safe to kill existing databases with the following command:

```bash
docker compose down postgresdb-replica postgresdb-master
```

You can now create new databases as follows:

```bash
docker compose up -d postgresdb
```

#### Step 3. Restore dump on the new database

To restore the dump to a new base, use the following command:

```bash
cat backups/pg.sql | docker exec -i open-condo-postgresdb-master-1 psql -U postgres
```

After that, the migration should be complete. You can verify this by restarting the applications.

#### Step 4. Cleanup

At this point, you can safely delete the previously created dump as it is no longer needed:

```bash
rm -rf backups/pg.sql
```