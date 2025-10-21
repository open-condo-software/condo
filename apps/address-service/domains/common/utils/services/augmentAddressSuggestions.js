const { AddressSource } = require('@address-service/domains/address/utils/serverSchema')
const { BUILDING_ADDRESS_TYPE } = require('@address-service/domains/common/constants/addressTypes')

/**
 * Augments the suggestions list with data from AddressSource.
 * * This function takes an initial list of address suggestions (e.g., from Google Places API)
 * and enriches it with matching addresses found in the local AddressSource.
 * It's designed to solve the issue of missing custom-added addresses in the search results.
 *
 * @see https://github.com/open-condo-software/condo/issues/6485
 * @param {object} context - The context required to execute Keystone queries.
 * @param {Array<NormalizedSuggestion>} suggestions - The normalized array of suggestions from AddressProvider.
 * @returns {Promise<Array<object>>} A new array containing both original and augmented suggestions.
 */

async function getAugmentedSuggestions (context, suggestions) {
    if (!suggestions) return []
    if (!context) return suggestions

    const uniqueNormalizedSuggestions = new Set(
        suggestions
            .map(suggestion => suggestion?.value?.toLowerCase())
            .filter(Boolean)
    )

    if (uniqueNormalizedSuggestions.size === 0) {
        return suggestions
    }

    const searchPromises = Array.from(uniqueNormalizedSuggestions).map(query =>
        AddressSource.getAll(
            context,
            { source_starts_with: query, deletedAt: null },
            'source address { id key address meta }',
            { first: 3 }
        )
    )

    const resultsFromDB = await Promise.all(searchPromises)

    const allFoundSources = resultsFromDB.flat()
    const newSuggestionsToAdd = []

    for (const source of allFoundSources) {
        if (!source?.source || !source?.address?.meta) {
            continue
        }

        const normalizedSource = source.source.toLowerCase()

        if (!uniqueNormalizedSuggestions.has(normalizedSource)) {
            const capitalizedAddressValue = normalizedSource
                .split(',')
                .map(word => word.trim().charAt(0).toUpperCase() + word.trim().slice(1))
                .join(', ')

            newSuggestionsToAdd.push({
                ...source.address.meta,
                isAugmentedAddress: true,
                value: capitalizedAddressValue,
                type: BUILDING_ADDRESS_TYPE,
            })

            uniqueNormalizedSuggestions.add(normalizedSource)
        }
    }

    const combinedSuggestions = [...suggestions, ...newSuggestionsToAdd]

    return combinedSuggestions.sort((a, b) => {
        if (a.value < b.value) {
            return -1
        }

        return 1
    })
}

module.exports = {
    getAugmentedSuggestions,
}