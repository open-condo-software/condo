import getConfig from 'next/config'

export interface IAddressApi {
    // TODO(Dimitreee): remove any
    getSuggestions(query: string): Promise<any>
    // TODO(Dimitreee): remove any
    normalizeAddress(query: string): Promise<any>
}

export class AddressApi implements IAddressApi {
    constructor () {
        this.getAddressSuggestionsConfig()
    }

    // TODO(Dimitreee): remove any
    public getSuggestions (query: string): Promise<Record<string, any>> {
        return fetch(this.suggestionsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Token ${this.apiToken}`,
            },
            body: JSON.stringify(
                {
                    query,
                    ...this.defaultSearchApiParams,
                }
            ),
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
    private defaultSearchApiParams = {
        from_bound: { value: 'country' },
        to_bound: { value: 'house' },
        restrict_value: true,
    }
}

/*
* AddressMetaCache includes normalized addressMeta, used for getting addressMeta for address value.
*
* */
// Generated from API response using http://json2ts.com
type AddressMetaSuggestion = {
    value: string;
    unrestricted_value: string;
    data: {
        postal_code: string;
        country: string;
        country_iso_code: string;
        federal_district?: any;
        region_fias_id: string;
        region_kladr_id: string;
        region_iso_code: string;
        region_with_type: string;
        region_type: string;
        region_type_full: string;
        region: string;
        area_fias_id?: any;
        area_kladr_id?: any;
        area_with_type?: any;
        area_type?: any;
        area_type_full?: any;
        area?: any;
        city_fias_id: string;
        city_kladr_id: string;
        city_with_type: string;
        city_type: string;
        city_type_full: string;
        city: string;
        city_area?: any;
        city_district_fias_id?: any;
        city_district_kladr_id?: any;
        city_district_with_type?: any;
        city_district_type?: any;
        city_district_type_full?: any;
        city_district?: any;
        settlement_fias_id?: any;
        settlement_kladr_id?: any;
        settlement_with_type?: any;
        settlement_type?: any;
        settlement_type_full?: any;
        settlement?: any;
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
        block_type?: any;
        block_type_full?: any;
        block?: any;
        entrance?: any;
        floor?: any;
        flat_fias_id?: any;
        flat_type?: any;
        flat_type_full?: any;
        flat?: any;
        flat_area?: any;
        square_meter_price?: any;
        flat_price?: any;
        postal_box?: any;
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
        timezone?: any;
        geo_lat: string;
        geo_lon: string;
        beltway_hit?: any;
        beltway_distance?: any;
        metro?: any;
        qc_geo: string;
        qc_complete?: any;
        qc_house?: any;
        history_values: string[];
        unparsed_parts?: any;
        source?: any;
        qc?: any;
    };
}
type AddressValue = string
// TODO(Dimitreee): remove any
type AddressMeta = Record<string, AddressMetaSuggestion>
export const AddressMetaCache: Map<AddressValue, AddressMeta> = new Map()