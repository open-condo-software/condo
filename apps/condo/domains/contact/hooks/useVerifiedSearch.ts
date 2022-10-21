import { updateQuery } from '@condo/domains/common/utils/filters.utils'

import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'
import { debounce, get } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

export const useVerifiedSearch = <F>(loading: boolean): [boolean, (e: CheckboxChangeEvent) => void] => {
    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<F>(router.query)

    const attributes = get(filtersFromQuery, 'attributes', [])
    const isVerified = attributes.includes('isVerified')

    const setIsVerified = useCallback(debounce(async (isVerified) => {
        const queryAttributes = isVerified ? [...attributes, 'isVerified'] : attributes.filter(attr => attr !== 'isVerified')

        await updateQuery(router, { ...filtersFromQuery, attributes: queryAttributes })
    }, 400), [loading, attributes, isVerified])

    const handleWarrantyChange = (e: CheckboxChangeEvent): void => {
        setIsVerified(e.target.checked)
    }

    return [isVerified, handleWarrantyChange]
}
