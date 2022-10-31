import { useCallback } from 'react'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import debounce from 'lodash/debounce'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'

import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { updateQuery } from '@condo/domains/common/utils/filters.utils'

type UseAttributeSearchOutputType = [boolean, (e: CheckboxChangeEvent) => void]

export const useAttributeSearch = <F>(attributeName: string): UseAttributeSearchOutputType => {
    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<F>(router.query)

    const attributes = get(filtersFromQuery, 'attributes', [])
    const isIncluded = attributes.includes(attributeName)

    const setIsReturned = useCallback(debounce(async (e: CheckboxChangeEvent) => {
        const isIncluded = get(e, ['target', 'checked'])
        const queryAttributes = isIncluded ? [...attributes, attributeName] : attributes.filter(attr => attr !== attributeName)

        await updateQuery(router, { ...filtersFromQuery, attributes: queryAttributes })
    }, 400), [isIncluded, attributes])

    return [isIncluded, setIsReturned]
}
