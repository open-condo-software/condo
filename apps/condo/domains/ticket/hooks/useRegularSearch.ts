import { useCallback } from 'react'
import { get, debounce } from 'lodash'
import { useRouter } from 'next/router'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'

import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { updateQuery } from '@condo/domains/common/utils/filters.utils'

export const useRegularSearch = <F>(loading: boolean): [boolean, (e: CheckboxChangeEvent) => void] => {
    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<F>(router.query)

    const attributes = get(filtersFromQuery, 'attributes', [])
    const isRegular = attributes.includes('isRegular')

    const setIsEmergency = useCallback(debounce(async (isRegular) => {
        const queryAttributes = isRegular ? [...attributes, 'isRegular'] : attributes.filter(attr => attr !== 'isRegular')

        await updateQuery(router, { ...filtersFromQuery, attributes: queryAttributes })
    }, 400), [loading, attributes, isRegular])

    const handleEmergencyChange = (e: CheckboxChangeEvent): void => {
        setIsEmergency(e.target.checked)
    }

    return [isRegular, handleEmergencyChange]
}
