import { updateQuery } from '@condo/domains/common/utils/filters.utils'

import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'
import { debounce, get } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

export const useWarrantySearch = <F>(loading: boolean): [boolean, (e: CheckboxChangeEvent) => void] => {
    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<F>(router.query)

    const attributes = get(filtersFromQuery, 'attributes', [])
    const isWarranty = attributes.includes('isWarranty')

    const setIsWarranty = useCallback(debounce(async (isWarranty) => {
        const queryAttributes = isWarranty ? [...attributes, 'isWarranty'] : attributes.filter(attr => attr !== 'isWarranty')

        await updateQuery(router, { ...filtersFromQuery, attributes: queryAttributes })
    }, 400), [loading, attributes, isWarranty])

    const handleWarrantyChange = (e: CheckboxChangeEvent): void => {
        setIsWarranty(e.target.checked)
    }

    return [isWarranty, handleWarrantyChange]
}
