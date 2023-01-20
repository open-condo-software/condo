import { AddressMetaField } from '@app/condo/schema'
import getConfig from 'next/config'

type TSuggestion = AddressMetaField & {
    rawValue: string,
}

type SuggestionsResponse = Promise<{ suggestions: Array<TSuggestion> }>

export interface IAddressApi {
    getRawAddress(address: string): string
    getSuggestions(query: string): SuggestionsResponse
    cacheRawAddress(address: string, rawValue: string): void
}

export class AddressApi implements IAddressApi {
    constructor () {
        this.setAddressSuggestionsConfig()
    }

    public getSuggestions (query: string): SuggestionsResponse {
        return fetch(`${this.suggestionsUrl}?s=${query}&context=suggestHouse`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        })
            .then((response) => response.json())
            .then((suggestions) => ({ suggestions }))
    }

    public getRawAddress (address: string): string | undefined {
        const ret = this.rawAddressCache.get(address)

        if (!ret) {
            throw new Error('addressMetaError')
        }

        return ret
    }

    public cacheRawAddress (address: string, rawAddress: string): void {
        this.rawAddressCache.set(address, rawAddress)
    }

    private setAddressSuggestionsConfig () {
        const {
            publicRuntimeConfig: { addressServiceUrl: apiUrl },
        } = getConfig()
        this.suggestionsUrl = `${apiUrl}/suggest`
    }

    private suggestionsUrl: string
    private rawAddressCache: Map<string, string> = new Map()
}
