# some helpful code snippets

## GQL Apollo logging plugin

`inedx.js`
```
const { Keystone } = require('@open-keystone/keystone')

...

const keystone = new Keystone({
    ...
})

...

class CustomGQLPluginExample {
    serverWillStart () {
        console.log('Server starting!')
    }

    requestDidStart (requestContext) {
        console.log('GQL!o :', requestContext.operation)
        console.log('GQL!op:', requestContext.request.operationName)
        console.log('GQL!q :', requestContext.request.query.replace(/\n/g, '').replace(/\s+/g, ' '))
        console.log('GQL!v :', requestContext.request.variables)
        console.log('GQL!u :', requestContext.context.authedItem && requestContext.context.authedItem.id)
        console.log('GQL!l :', requestContext.context.authedListKey)
        console.log('req!req:', requestContext.context.req)
        const { req } = requestContext.context
        console.log('REQ.body:', req.body)
        console.log('REQ.query:', req.query)
        console.log('REQ.cookies:', req.cookies)
        console.log('REQ.hostname:', req.hostname)
        console.log('REQ.headers:', req.headers)
        console.log('REQ.rawHeaders:', req.rawHeaders)
        console.log('REQ.ip:', req.ip)
        console.log('REQ.ips:', req.ips)
        console.log('REQ.protocol:', req.protocol)
        console.log('REQ.method:', req.method)
        console.log('REQ.sessionID:', req.sessionID)
        console.log('REQ.id:', req.id)
        console.log('REQ.originalUrl:', req.originalUrl)
        console.log('REQ.url:', req.url)
        console.log('Request starting!', requestContext)
    }
}

...

module.exports = {
    ...,
    keystone,
    apps: [
        ...,
        new GraphQLApp({
            apollo: {
                ...,
                plugins: [new CustomGQLPluginExample()],
                ...,
            },
        }),
        ...,
    ],
    ...,
}

```

## Express logging plugin

`inedx.js`
```
const express = require('express')
const { Keystone } = require('@open-keystone/keystone')

...

const keystone = new Keystone({
    ...
})

...

class CustomExpressPluginExample {
    prepareMiddleware ({ keystone, dev, distDir }) {
        const app = express()
        app.use(function (req, res, next) {
            console.log('Time:', Date.now())
            // console.log('REQ.body:', req.body) // doesn't work without body-parser
            console.log('REQ.query:', req.query)
            console.log('REQ.cookies:', req.cookies)
            console.log('REQ.hostname:', req.hostname)
            console.log('REQ.headers:', req.headers)
            console.log('REQ.rawHeaders:', req.rawHeaders)
            console.log('REQ.ip:', req.ip)
            console.log('REQ.ips:', req.ips)
            console.log('REQ.protocol:', req.protocol)
            console.log('REQ.method:', req.method)
            console.log('REQ.sessionID:', req.sessionID)
            console.log('REQ.id:', req.id)
            console.log('REQ.originalUrl:', req.originalUrl)
            console.log('REQ.url:', req.url)
            next()
        })
        return app
    }
}

...

module.exports = {
    ...,
    keystone,
    apps: [
        ...,
        new CustomExpressPluginExample(),
        ...,
    ],
    ...,
}

```

## Customize express

`index.js`
```
...

module.exports = {
  configureExpress: app => {
    // The express application variable trust proxy must be set to support reverse proxying
    app.set('trust proxy', true)
    ...
  },
  ...
}
```