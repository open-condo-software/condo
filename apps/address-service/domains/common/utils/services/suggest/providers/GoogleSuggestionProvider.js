const get = require('lodash/get')
const { v4: uuid } = require('uuid')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')

const { BUILDING_ADDRESS_TYPE } = require('@address-service/domains/common/constants/addressTypes')
const { GOOGLE_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { AbstractSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers/AbstractSuggestionProvider')

// https://developers.google.com/maps/faq#languagesupport
const SUPPORTED_LANGUAGES = ['af', 'ja', 'sq', 'kn', 'am', 'kk', 'ar', 'km', 'hy', 'ko', 'az', 'ky', 'eu', 'lo', 'be', 'lv', 'bn', 'lt', 'bs', 'mk', 'bg', 'ms', 'my', 'ml', 'ca', 'mr', 'zh', 'mn', 'zh-CN', 'ne', 'zh-HK', 'no', 'zh-TW', 'pl', 'hr', 'pt', 'cs', 'pt-BR', 'da', 'pt-PT', 'nl', 'pa', 'en', 'ro', 'en-AU', 'ru', 'en-GB', 'sr', 'et', 'si', 'fa', 'sk', 'fi', 'sl', 'fil', 'es', 'fr', 'es-419', 'fr-CA', 'sw', 'gl', 'sv', 'ka', 'ta', 'de', 'te', 'el', 'th', 'gu', 'tr', 'iw', 'uk', 'hi', 'ur', 'hu', 'uz', 'is', 'vi', 'id', 'zu', 'it']
const DEFAULT_LOCALE = get(conf, 'DEFAULT_LOCALE', 'en')
const LANGUAGE = SUPPORTED_LANGUAGES.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : 'en'

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

function normalizedGoogleAddressValue (item) {
    const main_text = get(item, ['structured_formatting', 'main_text'], '')
    const secondary_text = get(item, ['structured_formatting', 'secondary_text'], '')
    const description = item.description
    if (!main_text || !secondary_text) return description
    const parts1 = secondary_text.split(', ')
    parts1.reverse()
    return `${parts1.join(', ')}, ${main_text}`
}

class GoogleSuggestionProvider extends AbstractSuggestionProvider {

    /**
     * @param {ProviderDetectorArgs} args
     */
    constructor (args) {
        super(args)

        const apiKey = get(conf, CONFIG_KEY)
        if (!apiKey) {
            throw new Error(`There is no '${CONFIG_KEY}' in .env.`)
        }

        this.apiKey = apiKey
    }

    getProviderName () {
        return GOOGLE_PROVIDER
    }

    /**
     * @returns {Promise<GooglePredictionObject[]>}
     */
    async get ({ query, session = '', context = '', language = '', count = 20, helpers = {} }) {
        const sessionToken = session || uuid()
        const params = new URLSearchParams({
            input: query,
            language: SUPPORTED_LANGUAGES.includes(language) ? language : LANGUAGE,
            sessiontoken: sessionToken,
            key: this.apiKey,
            ...this.getContext(context),
        })

        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
        this.logger.info({ msg: 'request autocomplete googleapis', url })

        try {
            const autocompleteResults = await fetch(url)

            /**
             * @see https://developers.google.com/maps/documentation/places/web-service/autocomplete#place_autocomplete_responses
             */
            const status = autocompleteResults.status

            if (status === 200) {
                /**
                 * @type {{status: string, predictions: GooglePredictionObject[]}}
                 */
                const result = await autocompleteResults.json()
                this.logger.info({ msg: 'response autocomplete googleapis', url, data: result, status })

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
            } else {
                const result = await autocompleteResults.text()
                this.logger.info({ msg: 'response autocomplete googleapis', url, data: result, status })
            }
        } catch (err) {
            this.logger.error({ msg: 'googleapis autocomplete error', url, err })
        }

        return []
    }

    /**
     * @param {GooglePredictionObject[]} data
     * @returns {NormalizedSuggestion[]}
     */
    normalize (data) {
        return data.map((item) => {
            const types = get(item, 'types', [])
            return {
                value: normalizedGoogleAddressValue(item),
                unrestricted_value: item.description,
                rawValue: `googlePlaceId:${item.place_id}`,
                data: {},
                provider: {
                    name: GOOGLE_PROVIDER,
                    rawData: item,
                },
                type: (
                    types.includes('street_address') ||
                    types.includes('premise') ||
                    types.includes('subpremise')
                ) ? BUILDING_ADDRESS_TYPE : null,
            }
        })
    }
}

module.exports = { GoogleSuggestionProvider }