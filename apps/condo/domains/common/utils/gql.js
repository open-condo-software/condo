const { getDirectiveValues, getNamedType, GraphQLIncludeDirective, GraphQLSkipDirective, isAbstractType, Kind } = require('graphql')

function isFieldRequested (info, fieldName) {
    const { fieldNodes, fragments, returnType, schema, variableValues } = info
    const objectType = getNamedType(returnType)
    const visitedFragments = new Set()

    function includesField (selectionSet) {
        return selectionSet?.selections.some(selection => {
            if (getDirectiveValues(GraphQLSkipDirective, selection, variableValues)?.if === true ||
                getDirectiveValues(GraphQLIncludeDirective, selection, variableValues)?.if === false) return false
            if (selection.kind === Kind.FIELD) return selection.name.value === fieldName

            let fragment = selection
            if (selection.kind === Kind.FRAGMENT_SPREAD) {
                const name = selection.name.value
                if (visitedFragments.has(name)) return false
                visitedFragments.add(name)
                fragment = fragments[name]
            }
            if (!fragment) return false

            if (fragment.typeCondition) {
                const condition = schema.getType(fragment.typeCondition.name.value)
                if (condition !== objectType && !(isAbstractType(condition) && schema.isSubType(condition, objectType))) return false
            }
            return includesField(fragment.selectionSet)
        }) ?? false
    }

    return fieldNodes.some(node => includesField(node.selectionSet))
}

module.exports = { isFieldRequested }
