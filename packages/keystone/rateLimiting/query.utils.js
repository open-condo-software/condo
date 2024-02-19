/**
 * Extract where scaling factor based on joins / nested level
 * @param {Record<string, unknown>}  where
 * @param {number} scalingFactor
 * @param {number} pageLimit
 * @return number
 */
function extractWhereComplexityFactor (where, scalingFactor, pageLimit) {
    /** @type number */
    const fieldsComplexity = Object.entries(where).map(([fieldName, fieldValue]) => {
        if (Array.isArray(fieldValue)) {
            // OR / AND / _in cases

            // For OR / AND cases just sum up complexities of all sub-queries
            if (fieldName === 'AND' || fieldName === 'OR') {
                return fieldValue.reduce(
                    (totalComplexity, item) => totalComplexity + extractWhereComplexityFactor(item, scalingFactor, pageLimit),
                    0.0
                )
            } else if (fieldName.endsWith('_in')) {
                // _in case does not generate join, but it can be computationally costly on a large scale
                // So, if simple query with no joins and 1000 objects cost us 1 complexity,
                // lets just add 1 complexity per 1000 objects
                return Math.ceil(fieldValue.length / pageLimit)
            } else {
                // Other cases like JSON equality
                return 0.0
            }
        } else if (typeof fieldValue === 'object' && fieldValue !== null) {
            // Nested objects = relation = join
            // Calculate complexity of its where (1 if no joins / ins / ors) and scale it by scalingFactor
            // since this itself generates join
            return scalingFactor * extractWhereComplexityFactor(fieldValue, scalingFactor, pageLimit)
        } else {
            // Other fields does not increase complexity
            return 0.0
        }
    }).reduce((acc, curr) => acc + curr, 0.0)

    // 0 is possible when all fields are simple, so it can ruin multiplier
    return Math.max(1.0, fieldsComplexity)
}

/**
 * Extracts the total amount of sub-queries to be made by list selection
 * @param {import('./request.utils').Selection}  selectionSet
 * @param {string} listKey
 * @param {Record<string, Record<string>>} relations
 */
function extractRelationsComplexityFactor (selectionSet, listKey, relations) {
    const listRelations = relations[listKey]

    // NOTE: By default no complexity. Example { id name } = single request
    let complexity = 1.0
    for (const selection in selectionSet) {
        // NOTE: If a field is not a relation, it does not generate a join, and thus does not increase complexity.
        // Otherwise, an additional flat sub-query will be made, so we need to count it and all other sub-queries it generates
        // by calling function recursively we can achieve that
        if (listRelations[selection.name] && selection.selectionSet) {
            complexity += extractRelationsComplexityFactor(selection.selectionSet, listRelations[selection.name], relations)
        }
    }

    return complexity
}

module.exports = {
    extractRelationsComplexityFactor,
    extractWhereComplexityFactor,
}

