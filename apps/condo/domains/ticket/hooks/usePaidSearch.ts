import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import debounce from 'lodash/debounce'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'

import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { setFiltersToQuery } from '@condo/domains/common/utils/filters.utils'

export const usePaidSearch = <F>(loading: boolean): [boolean, (e: CheckboxChangeEvent) => void] => {
    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<F>(router.query)

    const attributes = get(filtersFromQuery, 'attributes', [])
    const hasPaid = attributes.includes('isPaid')

    const [isPaid, setIsPaid] = useState(hasPaid)

    useEffect(() => {
        setIsPaid(hasPaid)
    }, [hasPaid])

    const searchChange = useCallback(debounce(async (isPaid) => {
        const queryAttributes = isPaid ? [...attributes, isPaid && 'isPaid'] : attributes.filter(attr => attr !== 'isPaid')

        await setFiltersToQuery(router, { ...filtersFromQuery, attributes: queryAttributes }, true)
    }, 400), [loading])

    const handleIsPaidChange = (e: CheckboxChangeEvent): void => {
        setIsPaid(e.target.checked)
        searchChange(e.target.checked)
    }

    return [isPaid, handleIsPaidChange]
}
