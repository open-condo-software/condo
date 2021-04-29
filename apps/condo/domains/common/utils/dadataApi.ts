import getConfig from 'next/config'

export interface IDadataApi {
    // TODO(Dimitreee): remove any
    getSuggestions(query: string): Promise<any>
    // TODO(Dimitreee): remove any
    normalizeAddress(query: string): Promise<any>
}

export class DadataApi implements IDadataApi {
    constructor () {
        this.getAddressSuggestionsConfig()
    }

    // TODO(Dimitreee): remove any
    public getSuggestions (query: string): Promise<any> {
        return fetch(this.suggestionsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Token ${this.apiToken}`,
            },
            body: JSON.stringify({ query }),
        }).then(response => response.text())
            .then((res) => JSON.parse(res))
    }

    // TODO(Dimitreee): remove any
    public normalizeAddress (query: string): Promise<any> {
        // TODO(Dimitreee): implement later
        return Promise.resolve()
    }

    private getAddressSuggestionsConfig () {
        const {
            publicRuntimeConfig: { addressSuggestionsConfig },
        } = getConfig()
        const { apiUrl, apiToken } = addressSuggestionsConfig
        if (!apiToken || !apiUrl) console.error('Wrong AddressSuggestionsConfig! no apiUrl/apiToken')

        this.apiToken = apiToken
        this.suggestionsUrl = apiUrl
    }

    private suggestionsUrl: string
    private apiToken: string
}
