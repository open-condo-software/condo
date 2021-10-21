import { useCallback, useState } from 'react'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'
import { useRouter } from 'next/router'
import qs from 'qs'
import { pickBy, get, debounce } from 'lodash'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'

export const useEmergencySearch = <F>(loading): [boolean, (e: CheckboxChangeEvent) => void] => {
    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<F>(router.query)
    const searchValue = get(filtersFromQuery, 'isEmergency') === 'true'
    const [isEmergency, setIsEmergency] = useState(searchValue)

    const searchChange = useCallback(debounce((e) => {
        const isEmergency = e ? `${e}` : null

        const query = qs.stringify(
            { ...router.query, filters: JSON.stringify(pickBy({ ...filtersFromQuery, isEmergency })) },
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
