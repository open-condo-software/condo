import { useCallback } from 'react'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import debounce from 'lodash/debounce'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'

import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { updateQuery } from '@condo/domains/common/utils/filters.utils'

type UseReturnedSearchOutputType = [boolean, (e: CheckboxChangeEvent) => void]

export const useReturnedSearch = <F>(loading: boolean): UseReturnedSearchOutputType => {
    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<F>(router.query)

    const attributes = get(filtersFromQuery, 'attributes', [])
    const isReturned = attributes.includes('statusReopenedCounter')

    const setIsReturned = useCallback(debounce(async (e: CheckboxChangeEvent) => {
        const isReturned = get(e, ['target', 'checked'])
        const queryAttributes = isReturned ? [...attributes, 'statusReopenedCounter'] : attributes.filter(attr => attr !== 'statusReopenedCounter')

        await updateQuery(router, { ...filtersFromQuery, attributes: queryAttributes })
    }, 400), [loading, isReturned, attributes])

    return [isReturned, setIsReturned]
}
