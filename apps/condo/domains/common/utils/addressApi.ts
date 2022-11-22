import getConfig from 'next/config'
import { AddressMetaField } from '@app/condo/schema'

type TSuggestion = AddressMetaField & {
    rawValue: string,
}

type SuggestionsResponse = Promise<{ suggestions: Array<TSuggestion> }>

export interface IAddressApi {
    getAddressMeta(address: string): AddressMetaField
    getSuggestions(query: string): SuggestionsResponse
    cacheAddressMeta(address: string, addressMeta: AddressMetaField): void
}

export class AddressApi implements IAddressApi {
    constructor () {
        this.setAddressSuggestionsConfig()
    }

    public getSuggestions (query: string): SuggestionsResponse {
        return fetch(`${this.suggestionsUrl}?s=${query}`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        })
            .then((response) => response.json())
            .then((suggestions) => ({ suggestions }))
    }

    public getAddressMeta (address: string): AddressMetaField | undefined {
        const addressMeta = this.addressMetaCache.get(address)

        if (!addressMeta) {
            throw new Error('addressMetaError')
        }

        return addressMeta
    }

    public cacheAddressMeta (address: string, addressMeta: AddressMetaField): void {
        this.addressMetaCache.set(address, addressMeta)
    }

    private setAddressSuggestionsConfig () {
        const {
            publicRuntimeConfig: { addressServiceUrl: apiUrl },
        } = getConfig()
        this.suggestionsUrl = `${apiUrl}/suggest`
    }

    private suggestionsUrl: string
    private addressMetaCache: Map<string, AddressMetaField> = new Map()
}
