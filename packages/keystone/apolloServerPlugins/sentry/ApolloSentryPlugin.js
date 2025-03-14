const Sentry = require('@sentry/node')

const IGNORED_ERRORS = [
    'No or incorrect authentication credentials',
    'Your request exceeded server limits',
    'You do not have access to this resource',
]

class ApolloSentryPlugin {
    requestDidStart ({ request }) {
        const transaction = Sentry.startTransaction({
            op: 'gql',
            name: 'GraphQLTransaction',
        })

        if (request.operationName) {
            transaction.setName(request.operationName)
        }


        return {
            willSendResponse () {
                transaction.finish()
            },
            executionDidStart () {
                return {
                    willResolveField ({ info }) {
                        const span = transaction.startChild({
                            op: 'resolver',
                            description: `${info.parentType.name}.${info.fieldName}`,
                        })
                        return () => { span.finish() }
                    },
                }
            },
            didEncounterErrors (requestContext) {
                if (!requestContext.operation) return

                const filteredErrors = requestContext.errors.filter(error => !IGNORED_ERRORS.includes(error))

                for (const error of filteredErrors) {
                    Sentry.withScope(scope => {
                        scope.setTag('kind', requestContext.operation.operation)
                        scope.setExtra('query', requestContext.context.query)
                        scope.setExtra('variables', requestContext.request.variables)
                        if (error.path) {
                            scope.addBreadcrumb({
                                category: 'query-path',
                                message: error.path.join(' > '),
                            })
                        }
                        Sentry.captureException(error)
                    })
                }
            },
        }
    }
}

module.exports = { ApolloSentryPlugin }
