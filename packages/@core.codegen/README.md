# how to test it ?

```
export APP=name7 
yarn createapp ${APP}
yarn workspace @app/${APP} createschema User.User "name:Text; email:Text; password?:Password; isAdmin:Checkbox; manager?:Relationship:User:SET_NULL; isMan:Select:man,woman"
yarn workspace @app/${APP} createschema User.Friend "name:Text; friend1:Relationship:User:SET_NULL"
yarn workspace @app/${APP} makemypes
yarn workspace @app/${APP} makemigrations
```
