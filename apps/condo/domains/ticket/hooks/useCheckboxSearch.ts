import debounce from 'lodash/debounce'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'

import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { getFiltersFromQuery, updateQuery } from '@condo/domains/common/utils/helpers'
import { FiltersFromQueryType } from '@condo/domains/common/utils/tables.utils'


type UseCheckboxSearchOutputType = [boolean, (isChecked: boolean) => void, () => void, (filters) => void]

const getStateFromQuery = (filtersFromQuery, fieldName) => get(filtersFromQuery, fieldName, false) === 'true'

export const useCheckboxSearch = <F> (fieldName: string): UseCheckboxSearchOutputType => {
    const router = useRouter()
    const filtersFromQuery = useMemo(() => getFiltersFromQuery<F>(router.query), [router.query])
    const [value, setValue] = useState<boolean>(getStateFromQuery(filtersFromQuery, fieldName))

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

    const handleChangeCheckbox = useCallback(async (isChecked: boolean) => {
        setValue(isChecked)
        await changeQuery(isChecked)
    }, [changeQuery])

    const handleChangeCheckboxWithoutUpdateQuery = useCallback((filters) => {
        setValue(getStateFromQuery(filters, fieldName))
    }, [fieldName])

    const handleResetCheckboxWithoutUpdateQuery = useCallback(() => {
        setValue(false)
    }, [])

    return [value, handleChangeCheckbox, handleResetCheckboxWithoutUpdateQuery, handleChangeCheckboxWithoutUpdateQuery]
}
