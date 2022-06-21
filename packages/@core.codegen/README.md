# how to test it ?

```
export APP=name7 
yarn createapp ${APP}
yarn workspace @app/${APP} createschema user.User "name:Text; email:Text; password?:Password; isAdmin:Checkbox; manager?:Relationship:User:SET_NULL; isMan:Select:man,woman"
yarn workspace @app/${APP} createschema user.Friend "name:Text; friend1:Relationship:User:SET_NULL"
yarn workspace @app/${APP} maketypes
yarn workspace @app/${APP} makemigrations

yarn workspace @app/${APP} createservice User.UpdateFriendsService --type queries|mutations

yarn workspace @app/${APP} migrate

yarn workspace @app/${APP} migrate:down
```
