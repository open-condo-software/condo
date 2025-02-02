# KV-migration utils

Create KV DB:
```bash
docker compose up -d redis
```

Fill db with random keys using [fill-kv-db.js](fill-kv-db.js). Use empty prefix combined with other to mix DB conditions
```bash
node fill-kv-db.js
```

In parallel, run [rename-kv-db.js](rename-kv-db.js) to rename existing keys and [emulate-kv-load.js](emulate-kv-load.js) to emulate parallel write load

```bash
node rename-kv-db.js & node emulate-kv-load.js
```

Run [check-kv-db.js](check-kv-db.js) to verify, that all keys are renamed
```bash
node check-kv-db.js
```

