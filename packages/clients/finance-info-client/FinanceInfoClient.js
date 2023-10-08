const { get } = require('lodash')
const fetch = require('node-fetch')

const conf = require('@open-condo/config')
const { getRedisClient } = require('@open-condo/keystone/redis')

const { apiToken: API_KEY } = conf['ADDRESS_SUGGESTIONS_CONFIG'] ? JSON.parse(conf['ADDRESS_SUGGESTIONS_CONFIG']) : {}

const CACHE_TTL = 10 * 24 * 60 * 60 // 10 days


/**
 * @typedef {Object} BankInfo
 * @property {string} routingNumber - The Bank Identification Code (BIC).
 * @property {string} bankName - The name of the bank.
 * @property {string} offsettingAccount - The correspondent account of the bank.
 * @property {string} territoryCode - The territory code of the bank.
 */

/**
 * @typedef {Object} OrganizationInfo
 * @property {string} timezone - The timezone of the organization.
 * @property {string} territoryCode - The territory code of the organization.
 * @property {string} iec - The IEC (KPP) of the organization.
 * @property {string} tin - The TIN (INN) of the organization.
 * @property {string} psrn - Primary State Registration Number (OGRN)
 * @property {string} name - The name of the organization (either short name or full name).
 * @property {string} country - The lowercase country code of the organization.
 */

/**
 * Class representing a DaData API client with caching
 */
class FinanceInfoClient {

    urls = {
        base: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs',
        inn: '/findById/party',
        bank: '/findById/bank',
    }

    redis = getRedisClient('company-info-cache')

    /**
     * Get organization details by Taxpayer Identification Number (TIN).
     * @async
     * @param {string} requestTin - The Taxpayer Identification Number (TIN) to look up.
     * @throws {Error} Throws an error if input validation fails.
     * @returns {OrganizationInfo}
     */
    async getOrganization (requestTin) {
        if (typeof requestTin !== 'string' || (requestTin.length !== 10 && requestTin.length !== 12)) {
            throw new Error(`Invalid TIN: ${requestTin}`)
        }
        const cachedValue = await this.#getFromCache(`ORGANIZATION_${requestTin}`)
        if (cachedValue) {
            return cachedValue
        }
        const info = await this.#fetchOrganization(requestTin)
        const {
            data: {
                kpp: iec, inn: tin, oktmo: territoryCode, ogrn: psrn,
                name: {
                    full_with_opf: organizationFullName,
                    short_with_opf: organizationShortName,
                },
                address: {
                    data: {
                        country_iso_code: organizationCountry,
                        timezone,
                    },
                },
            },
        } = info
        const result = { timezone, territoryCode, iec, tin, psrn, name: organizationShortName || organizationFullName, country: organizationCountry.toLowerCase() }
        await this.#setToCache(`ORGANIZATION_${requestTin}`, result)
        return result
    }


    /**
     * Get bank details by Bank Identification Code (BIC).
     * @async
     * @param {string} routingNumber - The Bank Identification Code (BIC) to look up.
     * @throws {Error} Throws an error if input validation fails.
     * @returns {BankInfo}
     */
    async getBank (routingNumber) {
        if (typeof routingNumber !== 'string' || !routingNumber.startsWith('04') || routingNumber.length !== 9) {
            throw new Error(`Invalid routing number: ${routingNumber}`)
        }
        const cachedValue = await this.#getFromCache(`BANK_${routingNumber}`)
        if (cachedValue) {
            return cachedValue
        }
        const {
            value: bankName,
            data: {
                correspondent_account: offsettingAccount,
                address: {
                    data: {
                        oktmo: territoryCode,
                    },
                },
            },
        } = await this.#fetchBank(routingNumber)
        const result = { routingNumber, bankName, offsettingAccount, territoryCode }
        await this.#setToCache(`BANK_${routingNumber}`, result)
        return result
    }

    async #getFromCache (key) {
        const cachedValue = await this.redis.get(key)
        if (cachedValue) {
            return JSON.parse(cachedValue)
        }
    }

    async #setToCache (key, value) {
        await this.redis.set(key, JSON.stringify(value))
        await this.redis.expire(key, CACHE_TTL)
    }

    /**
     * Constructs request parameters for API calls.
     * @async
     * @param {object} query - The request query object.
     * @param {object} [headers={}] - Additional request headers.
     * @returns {object} Request parameters object.
     * @private
     */
    #requestParams (query, headers = {}) {
        return {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Token ${API_KEY}`,
                ...headers,
            },
            body: JSON.stringify(query),
        }
    }

    async #fetchBank (routingNumber) {
        return await this.#fetch(this.urls.bank, this.#requestParams({ query: routingNumber }))
    }

    async #fetchOrganization (tin) {
        return await this.#fetch(this.urls.inn, this.#requestParams({ query: tin }))
    }

    /**
     * Fetch data from the DaData API.
     * @async
     * @param {string} url - The API endpoint URL.
     * @param {object} [requestParams={}] - Request parameters for the fetch.
     * @throws {Error} Throws an error if the fetch request fails or if the response status code is not in the 200-299 range.
     * @returns {Promise<object>} A promise that resolves to the fetched data.
     * @private
     */
    async #fetch (url, requestParams = {}) {
        const response = await fetch(`${this.urls.base}${url}`, requestParams)
        if (response.ok) {
            const json = await response.json()
            return get(json, 'suggestions[0]')
        } else {
            throw new Error(`Failed to fetch: ${url}`)
        }
    }

}

module.exports = {
    FinanceInfoClient,
}