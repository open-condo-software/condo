const { fetch } = require('cross-fetch')
const { print } = require('graphql')

module.exports = function makeRemoteExecutor (url) {
    return async ({ document, variables, context }) => {
        const query = typeof document === 'string' ? document : print(document)
        const headers = {
            'Content-Type': 'application/json',
        }
        // NOTE: Use parameter isCondo (?) and set proper token from context
        if (context && context.authHeader) {
            headers.Authorization = context.authHeader
        }
        const fetchResult = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ query, variables }),
        })

        return fetchResult.json()
    }
}