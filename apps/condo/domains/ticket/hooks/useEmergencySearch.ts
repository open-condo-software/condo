import { useCallback, useEffect, useState } from 'react'
import { pickBy, get, debounce } from 'lodash'
import qs from 'qs'
import { useRouter } from 'next/router'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'

import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'

export const useEmergencySearch = <F>(loading): [boolean, (e: CheckboxChangeEvent) => void] => {
    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<F>(router.query)

    const attributes = get(filtersFromQuery, 'attributes', [])
    const searchValue = !!attributes.find(atr => atr === 'isEmergency')

    const [isEmergency, setIsEmergency] = useState(searchValue)

    useEffect(() => {
        setIsEmergency(searchValue)
    }, [searchValue])

    const searchChange = useCallback(debounce((e) => {
        const queryAttributes = e ? [...attributes, e && 'isEmergency'] : attributes.filter(attr => attr !== 'isEmergency')

        const query = qs.stringify(
            { ...router.query, filters: JSON.stringify(pickBy({ ...filtersFromQuery, attributes: queryAttributes })) },
            { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
        )

        router.push(router.route + query)
    }, 400), [loading])

    const handleEmergencyChange = (e: CheckboxChangeEvent): void => {
        setIsEmergency(e.target.checked)
        searchChange(e.target.checked)
    }

    return [isEmergency, handleEmergencyChange]
}
