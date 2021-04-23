import getConfig from 'next/config'
import React, { useCallback, useMemo, useState } from 'react'
import { Dropdown, Input, Menu, Spin } from 'antd'
import debounce from 'lodash/debounce'
import pickBy from 'lodash/pickBy'
import identity from 'lodash/identity'

const DEBOUNCE_TIMEOUT = 800

function getAddressSuggestionsConfig () {
    const {
        publicRuntimeConfig: { addressSuggestionsConfig },
    } = getConfig()
    const { apiUrl, apiToken } = addressSuggestionsConfig
    if (!apiToken || !apiUrl) console.error('Wrong AddressSuggestionsConfig! no apiUrl/apiToken')
    return { apiUrl, apiToken }
}

// https://dadata.ru/api/suggest/address/#request
enum HouseType {
    house = 'д',
}

// Generated from API response using http://json2ts.com
type DadataAddressSuggestion = {
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

async function searchAddress (query) {
    const { apiUrl, apiToken } = getAddressSuggestionsConfig()

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Token ${apiToken}`,
        },
        body: JSON.stringify({ query }),
    })

    const { suggestions } = await response.json()
    // FORMAT: { suggestions: [ { value: "Address1", meta1: value1, meta2: value2, ... }, ... ] }

    return suggestions
        .filter((suggestion: DadataAddressSuggestion) => (
            suggestion.data.house_type === HouseType.house
        ))
        .map((suggestion: DadataAddressSuggestion) => {
            const cleanedSuggestion = pickBy(suggestion, identity)

            return {
                text: suggestion.value,
                value: JSON.stringify({ ...cleanedSuggestion, address: suggestion.value }),
            }
        })
}

interface AddressInputProps {
    value?: string;
    onChange?: (value: string) => void;
}

export const AddressSearchInput: React.FC<AddressInputProps> = (props) => {
    const [value, setValue] = useState(props.value)
    const [fetching, setFetching] = useState(false)
    const [suggestions, setSuggestions] = useState([])

    const searchSuggestions = useCallback(async (term) => {
        setFetching(true)
        const data = await searchAddress(term)
        setFetching(false)
        setSuggestions(data)
    }, [searchAddress])

    const debouncedSearchSuggestions = useMemo(() => {
        return debounce(searchSuggestions, DEBOUNCE_TIMEOUT)
    }, [searchSuggestions])

    const handleChange = (text, addressMeta) => {
        setValue(text)
        props.onChange?.(matchesSuggestions(text) ? addressMeta : null)
        if (text) {
            debouncedSearchSuggestions(text)
        }
    }

    const matchesSuggestions = (address) => (
        suggestions.filter(({ text }) => text === address).length > 0
    )

    return (
        <Dropdown
            placement="bottomCenter"
            overlay={
                <Menu>
                    {fetching ? (
                        <Spin size="small"/>
                    ) : suggestions.map((item, i) => (
                        <Menu.Item
                            key={i}
                            onClick={() => handleChange(item.text, item.value)}
                        >
                            {item.text}
                        </Menu.Item>
                    ))}
                </Menu>
            }
        >
            <Input
                value={value}
                allowClear
                onChange={e => handleChange(e.target.value)}
            />
        </Dropdown>
    )
}
