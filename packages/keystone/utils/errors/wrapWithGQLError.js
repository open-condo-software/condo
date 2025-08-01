const { GQLError } = require('@open-condo/keystone/errors')

function wrapWithGQLError (err, context, gqlErrorFields) {
    if (err instanceof GQLError) {
        return err
    }

    return new GQLError(gqlErrorFields, context, [err])
}

module.exports = {
    wrapWithGQLError,
}