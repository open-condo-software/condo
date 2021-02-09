# Error: Cannot find module '@core/codegen'

```
pahaz@PahazMac16 my-new-startup $> yarn createapp
yarn run v1.22.10
$ node ./bin/createapp
internal/modules/cjs/loader.js:983
  throw err;
  ^

Error: Cannot find module '@core/codegen'
Require stack:
- /Users/pahaz/Code/pahaz/my-new-startup/bin/createapp
    at Function.Module._resolveFilename (internal/modules/cjs/loader.js:980:15)
    at Function.Module._load (internal/modules/cjs/loader.js:862:27)
    at Module.require (internal/modules/cjs/loader.js:1042:19)
    at require (internal/modules/cjs/helpers.js:77:18)
    at Object.<anonymous> (/Users/pahaz/Code/pahaz/my-new-startup/bin/createapp:3:23)
    at Module._compile (internal/modules/cjs/loader.js:1156:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1176:10)
    at Module.load (internal/modules/cjs/loader.js:1000:32)
    at Function.Module._load (internal/modules/cjs/loader.js:899:14)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:74:12) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [ '/Users/pahaz/Code/pahaz/my-new-startup/bin/createapp' ]
}
error Command failed with exit code 1.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
```

You should run `yarn` to install dependencies and link packages workspaces.
