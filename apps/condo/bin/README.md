# HowTo run ?

Use `yarn workspace @app/condo node ./bin/test-sbbol-oauth-by-hands.js` command

# SBBOL change-client-secret examples #

Use: `yarn workspace @app/condo node ./bin/sbbol/credentials.js change-client-secret`

# Create OIDC client #

Use: `yarn workspace @app/condo node ./bin/create-oidc-client.js client1 secret1 http://localhost:3001/oidc/callback` command

# HowTo organise ?

Try to avoid to use common scripts. It's better to group the scripts by tasks, like `sbbol`.

# Deleting Meters with MeterReadings in certain Property

Use: `yarn workspace @app/condo node ./bin/delete-meter-readings-by-property-ids.js propertyId1 propertyId2` command