import getConfig from 'next/config'
import get from 'lodash/get'

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

/*
* AddressMetaCache includes normalized addressMeta, used for getting addressMeta for address value.
* */
// Generated from API response using http://json2ts.com
type AddressMeta = {
    value: string;
    unrestricted_value: string;
    data: {
        postal_code: string;
        country: string;
        country_iso_code: string;
        federal_district?: string;
        region_fias_id: string;
        region_kladr_id: string;
        region_iso_code: string;
        region_with_type: string;
        region_type: string;
        region_type_full: string;
        region: string;
        area_fias_id?: string;
        area_kladr_id?: string;
        area_with_type?: string;
        area_type?: string;
        area_type_full?: string;
        area?: string;
        city_fias_id: string;
        city_kladr_id: string;
        city_with_type: string;
        city_type: string;
        city_type_full: string;
        city: string;
        city_area?: string;
        city_district_fias_id?: string;
        city_district_kladr_id?: string;
        city_district_with_type?: string;
        city_district_type?: string;
        city_district_type_full?: string;
        city_district?: string;
        settlement_fias_id?: string;
        settlement_kladr_id?: string;
        settlement_with_type?: string;
        settlement_type?: string;
        settlement_type_full?: string;
        settlement?: string;
        street_fias_id: string;
        street_kladr_id: string;
        street_with_type: string;
        street_type: string;
        street_type_full: string;
        street: string;
        house_fias_id: string;
        house_kladr_id: string;
        house_type: string;
        house_type_full: string;
        house: string;
        block_type?: string;
        block_type_full?: string;
        block?: string;
        entrance?: string;
        floor?: string;
        flat_fias_id?: string;
        flat_type?: string;
        flat_type_full?: string;
        flat?: string;
        flat_area?: string;
        square_meter_price?: string;
        flat_price?: string;
        postal_box?: string;
        fias_id: string;
        fias_code: string;
        fias_level: string;
        fias_actuality_state: string;
        kladr_id: string;
        geoname_id: string;
        capital_marker: string;
        okato: string;
        oktmo: string;
        tax_office: string;
        tax_office_legal: string;
        timezone?: string;
        geo_lat: string;
        geo_lon: string;
        beltway_hit?: string;
        beltway_distance?: string;
        metro?: string;
        qc_geo: string;
        qc_complete?: string;
        qc_house?: string;
        history_values: string[];
        unparsed_parts?: string;
        source?: string;
        qc?: string;
    };
}

type AddressValue = string
