import { AddressMetaField } from '@app/condo/schema'
import getConfig from 'next/config'

import { getClientSideFingerprint } from '@open-condo/miniapp-utils/helpers/sender'

import { makeId } from './makeid.utils'

type TSuggestion = AddressMetaField & {
    rawValue: string
    type: 'building' | 'village' | null
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
        this.setSessionConfig()
    }

    public getSuggestions (query: string): SuggestionsResponse {
        return fetch(`${this.suggestionsUrl}?s=${query}&context=suggestHouse&session=${this.session}`, {
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

    private setSessionConfig () {
        const user = getClientSideFingerprint()
        const session = makeId(8)
        this.session = `${user}-${session}`
    }

    private suggestionsUrl: string
    private session: string
    private rawAddressCache: Map<string, string> = new Map()
}
