import getConfig from 'next/config'
import get from 'lodash/get'
import { AddressMeta, AddressValue } from './AddressMeta'

type SuggestionsResponse = Promise<{ suggestions: Array<AddressMeta> }>

export interface IAddressApi {
    getAddressMeta(address: string): AddressMeta
    getSuggestions(query: string): SuggestionsResponse
    cacheAddressMeta(address: string, addressMeta: AddressMeta): void
}

export class AddressApi implements IAddressApi {
    constructor () {
        this.setAddressSuggestionsConfig()
    }

    public getSuggestions (query: string): SuggestionsResponse {
        return fetch(this.suggestionsUrl, this.getAddressSuggestionRequestParams(query))
            .then(response => response.text())
            .then((res) => JSON.parse(res))
    }

    public getAddressMeta (address: string): AddressMeta | undefined {
        const addressMeta = this.addressMetaCache.get(address)

        if (!addressMeta) {
            throw new Error('addressMetaError')
        }

        return addressMeta
    }

    public cacheAddressMeta (address: string, addressMeta: AddressMeta): void {
        this.addressMetaCache.set(address, addressMeta)
    }

    private setAddressSuggestionsConfig () {
        const {
            publicRuntimeConfig: { addressSuggestionsConfig },
        } = getConfig()
        const apiUrl = get(addressSuggestionsConfig, 'apiUrl', '')
        const apiToken = get(addressSuggestionsConfig, 'apiToken', '')
        if (!apiToken || !apiUrl) console.error('Wrong AddressSuggestionsConfig! no apiUrl/apiToken')

        this.apiToken = apiToken
        this.suggestionsUrl = apiUrl
    }

    private getAddressSuggestionRequestParams (query: string) {
        return {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Token ${this.apiToken}`,
            },
            body: JSON.stringify(
                {
                    query,
                    ...this.defaultSearchApiParams,
                }
            ),
        }
    }

    private suggestionsUrl: string
    private apiToken: string
    private defaultSearchApiParams = {
        from_bound: { value: 'country' },
        to_bound: { value: 'house' },
        restrict_value: true,
    }
    private addressMetaCache: Map<AddressValue, AddressMeta> = new Map()
}