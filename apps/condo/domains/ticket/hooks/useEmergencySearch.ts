import { useCallback } from 'react'
import { get, debounce } from 'lodash'
import { useRouter } from 'next/router'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'

import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { updateQuery } from '@condo/domains/common/utils/filters.utils'

export const useEmergencySearch = <F>(loading: boolean): [boolean, (e: CheckboxChangeEvent) => void] => {
    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<F>(router.query)

    const attributes = get(filtersFromQuery, 'attributes', [])
    const isEmergency = attributes.includes('isEmergency')

    const setIsEmergency = useCallback(debounce(async (isEmergency) => {
        const queryAttributes = isEmergency ? [...attributes, 'isEmergency'] : attributes.filter(attr => attr !== 'isEmergency')

        await updateQuery(router, { ...filtersFromQuery, attributes: queryAttributes })
    }, 400), [loading, attributes, isEmergency])

    const handleEmergencyChange = (e: CheckboxChangeEvent): void => {
        setIsEmergency(e.target.checked)
    }

    return [isEmergency, handleEmergencyChange]
}
