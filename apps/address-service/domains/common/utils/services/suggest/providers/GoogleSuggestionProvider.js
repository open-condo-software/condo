const { AbstractSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers/AbstractSuggestionProvider')
const { GOOGLE_PROVIDER } = require('@address-service/domains/common/constants/providers')
const conf = require('@open-condo/config')
const get = require('lodash/get')
const fetch = require('node-fetch')

/**
 * @typedef {Object} GooglePredictionObjectStructuredFormatting
 * @property {string} main_text
 * @property {{offset: number, length: number}[]} main_text_matched_substrings
 * @property {string} secondary_text
 * @property {{offset: number, length: number}[]} secondary_text_matched_substrings
 */

/**
 * @typedef {Object} GooglePredictionObject
 * @property {string} description
 * @property {{offset: number, length: number}[]} matched_substrings
 * @property {string} place_id
 * @property {GooglePredictionObjectStructuredFormatting} structured_formatting
 * @property {{offset: number, value: string}[]} terms
 * @property {string[]} types
 */

const CONFIG_KEY = 'GOOGLE_API_KEY'

class GoogleSuggestionProvider extends AbstractSuggestionProvider {

    constructor () {
        super()

        const apiKey = get(conf, CONFIG_KEY)
        if (!apiKey) {
            throw new Error(`There is no '${CONFIG_KEY}' in config.`)
        }

        this.apiKey = apiKey
    }

    getProviderName () {
        return GOOGLE_PROVIDER
    }

    /**
     * @returns {Promise<GooglePredictionObject[]>}
     */
    async get ({ query, context = null, count = 20 }) {
        const autocompleteResults = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&language=ru&key=${this.apiKey}`)

        /**
         * @see https://developers.google.com/maps/documentation/places/web-service/autocomplete#place_autocomplete_responses
         */

        const status = autocompleteResults.status

        if (status === 200) {
            /**
             * @type {{status: string, predictions: GooglePredictionObject[]}}
             */
            const result = await autocompleteResults.json()

            /**
             * @see https://developers.google.com/maps/documentation/places/web-service/autocomplete#PlacesAutocompleteStatus
             * Autocomplete results are too poor to extract any data into the internal format.
             * Maybe we need to call GoogleSearchProvider.getByPlaceId() to get full info
             */
            if (result.status === 'OK') {
                return result.predictions
            } else if (result.status === 'ZERO_RESULTS') {
                return []
            }
        }

        return null
    }

    /**
     * @param {GooglePredictionObject[]} data
     * @returns {NormalizedSuggestion[]}
     */
    normalize (data) {
        return data.map((item) => ({
            value: item.description,
            rawValue: `googlePlaceId:${item.place_id}`,
        }))
    }
}

module.exports = { GoogleSuggestionProvider }
