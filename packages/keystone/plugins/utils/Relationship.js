const {
    Relationship: RelationshipBase,
} = require('@open-keystone/fields')
const {
    AuthedRelationship: AuthedRelationshipBase,
} = require('@open-keystone/fields-authed-relationship')
const { get, isEmpty } = require('lodash')

async function internalResolveNestedOperations (
    resolveNestedOperations, operations, item, context, getItem, mutationState
) {
    // we have a special case for skipAccessControl flag and connection id case
    // parameter operations - can hold create/connect/disconnect/currentValue fields combinations
    // we should make sure only connect operation provided by the adapter
    const connectId = get(operations, 'connect.id')
    if (context.skipAccessControl && Object.keys(operations).length === 1 && !isEmpty(connectId)) {
        return {
            create: [],
            connect: [connectId],
            disconnect: [],
            currentValue: undefined,
        }
    }

    return await resolveNestedOperations(operations, item, context, getItem, mutationState)
}

class Relationship extends RelationshipBase.implementation {
    async resolveNestedOperations (operations, item, context, getItem, mutationState) {
        return await internalResolveNestedOperations(
            super.resolveNestedOperations.bind(this), operations, item, context, getItem, mutationState,
        )
    }
}

class AuthedRelationship extends AuthedRelationshipBase.implementation {
    async resolveNestedOperations (operations, item, context, getItem, mutationState) {
        return await internalResolveNestedOperations(
            super.resolveNestedOperations.bind(this), operations, item, context, getItem, mutationState,
        )
    }
}


module.exports = {
    Relationship: {
        ...RelationshipBase,
        implementation: Relationship,
    },
    AuthedRelationship: {
        ...AuthedRelationshipBase,
        implementation: AuthedRelationship,
    },
}