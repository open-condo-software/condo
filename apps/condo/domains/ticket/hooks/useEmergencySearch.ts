import { useCallback, useEffect, useState } from 'react'
import { pickBy, get, debounce } from 'lodash'
import qs from 'qs'
import { useRouter } from 'next/router'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'

import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { setFiltersToQuery } from '@condo/domains/common/utils/filters.utils'

export const useEmergencySearch = <F>(loading): [boolean, (e: CheckboxChangeEvent) => void] => {
    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<F>(router.query)

    const attributes = get(filtersFromQuery, 'attributes', [])
    const searchValue = !!attributes.find(atr => atr === 'isEmergency')

    const [isEmergency, setIsEmergency] = useState(searchValue)

    useEffect(() => {
        setIsEmergency(searchValue)
    }, [searchValue])

    const searchChange = useCallback(debounce(async (isEmergency) => {
        const queryAttributes = isEmergency ? [...attributes, isEmergency && 'isEmergency'] : attributes.filter(attr => attr !== 'isEmergency')

        await setFiltersToQuery(router, { ...filtersFromQuery, attributes: queryAttributes }, true)
    }, 400), [loading])

    const handleEmergencyChange = (e: CheckboxChangeEvent): void => {
        setIsEmergency(e.target.checked)
        searchChange(e.target.checked)
    }

    return [isEmergency, handleEmergencyChange]
}
