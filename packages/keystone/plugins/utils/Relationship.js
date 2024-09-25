const {
    Relationship: RelationshipBase,
} = require('@keystonejs/fields')
const {
    AuthedRelationship: AuthedRelationshipBase,
} = require('@keystonejs/fields-authed-relationship')
const { get, isEmpty } = require('lodash')

async function internalResolveNestedOperations (
    resolveNestedOperations, operations, item, context, getItem, mutationState
) {
    // we have a special case for skipResolveRelations flag
    // in case if we are upsert relation field and skipResolveRelations is set up
    // let's skip resolving nested connect operation
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