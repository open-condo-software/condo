const { GQLError, GQLErrorCode: { INTERNAL_ERROR } } = require('@open-condo/keystone/errors')
const { getByCondition } = require('@open-condo/keystone/schema')

const { SHARED_ID_CONSTRAINT } = require('@dev-portal-api/domains/common/constants/errors')

const SHARED_ID_CONSTRAINT_ERROR = {
    code: INTERNAL_ERROR,
    type: SHARED_ID_CONSTRAINT,
    message: 'Object creation violates shared ID constraint, please try again',
}

function getSharedConstraintsValidator (sharedModelNames) {
    return async function validateSharedConstraint ({ resolvedData, context }) {
        const id = resolvedData['id']
        if (!id) return
        const objs = await Promise.all(sharedModelNames
            .map(modelName => getByCondition(modelName, { id, deletedAt: null })))
        const hasShared = objs.some(Boolean)
        if (hasShared) {
            throw new GQLError(SHARED_ID_CONSTRAINT_ERROR, context)
        }
    }
}

module.exports = {
    getSharedConstraintsValidator,
}