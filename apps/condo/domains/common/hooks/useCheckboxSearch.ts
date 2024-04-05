import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { getFiltersFromQuery, updateQuery } from '@condo/domains/common/utils/helpers'
import { FiltersFromQueryType } from '@condo/domains/common/utils/tables.utils'


type UseCheckboxSearchOutputType = {
    value: boolean
    handleChange: (isChecked: boolean) => Promise<void>
    handleFilterChanges: (filters) => void
    handleResetWithoutUpdateQuery: () => void
}

const getCheckboxValue = (filtersFromQuery, fieldName) => get(filtersFromQuery, fieldName, false) === 'true'

export const useCheckboxSearch = <F> (fieldName: string): UseCheckboxSearchOutputType => {
    const router = useRouter()
    const filtersFromQuery = useMemo(() => getFiltersFromQuery<F>(router.query), [router.query])
    const checkboxValueFromQuery = useMemo(() => getCheckboxValue(filtersFromQuery, fieldName), [fieldName, filtersFromQuery])
    const [value, setValue] = useState<boolean>(checkboxValueFromQuery)

    const changeQuery = useMemo(() => debounce(async (isChecked: boolean) => {
        const newFilters = { ...filtersFromQuery } as FiltersFromQueryType
        if (isChecked) {
            newFilters[fieldName] = String(!!isChecked)
        } else {
            delete newFilters[fieldName]
        }

        const newParameters = getFiltersQueryData(newFilters)
        await updateQuery(router, { newParameters }, { routerAction: 'replace' })
    }, 400), [fieldName, filtersFromQuery, router])

    const handleChange: UseCheckboxSearchOutputType['handleChange'] = useCallback(async (isChecked: boolean) => {
        setValue(isChecked)
        await changeQuery(isChecked)
    }, [changeQuery])

    const handleFilterChanges: UseCheckboxSearchOutputType['handleFilterChanges'] = useCallback((filters) => {
        setValue(getCheckboxValue(filters, fieldName))
    }, [fieldName])

    const handleResetWithoutUpdateQuery: UseCheckboxSearchOutputType['handleResetWithoutUpdateQuery'] = useCallback(() => {
        setValue(false)
    }, [])

    useEffect(() => {
        if (!isEqual(checkboxValueFromQuery, value)) {
            setValue(checkboxValueFromQuery)
        }
    }, [checkboxValueFromQuery])

    return { value, handleChange, handleFilterChanges, handleResetWithoutUpdateQuery }
}
