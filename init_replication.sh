#!/bin/bash

docker exec -i master psql -U postgres -d main -c "CREATE PUBLICATION my_publication FOR ALL TABLES;"
docker exec -i replica1 psql -U postgres -d main -c "CREATE SUBSCRIPTION my_subscription CONNECTION 'host=master dbname=main user=postgres password=postgres' PUBLICATION my_publication;"