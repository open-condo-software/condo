import { useCallback, useEffect, useState } from 'react'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'
import { useRouter } from 'next/router'
import qs from 'qs'
import { pickBy, get, debounce } from 'lodash'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'

export const usePaidSearch = <F>(loading): [boolean, (e: CheckboxChangeEvent) => void] => {
    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<F>(router.query)

    const attributes = get(filtersFromQuery, 'attributes', [])
    const searchValue = !!attributes.find(atr => atr === 'isPaid')

    const [isPaid, setIsPaid] = useState(searchValue)

    useEffect(() => {
        setIsPaid(searchValue)
    }, [searchValue])

    const searchChange = useCallback(debounce((e) => {
        const queryAttributes = e ? [...attributes, e && 'isPaid'] : attributes.filter(attr => attr !== 'isPaid')

        const query = qs.stringify(
            { ...router.query, filters: JSON.stringify(pickBy({ ...filtersFromQuery, attributes: queryAttributes })) },
            { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
        )

        router.push(router.route + query)
    }, 400), [loading])

    const handleIsPaidChange = (e: CheckboxChangeEvent): void => {
        setIsPaid(e.target.checked)
        searchChange(e.target.checked)
    }

    return [isPaid, handleIsPaidChange]
}
