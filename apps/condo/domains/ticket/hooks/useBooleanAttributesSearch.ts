import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { getFiltersFromQuery, updateQuery } from '@condo/domains/common/utils/helpers'


type UseBooleanAttributesSearchOutputType = [{ [key: string]: boolean }, (isChecked: boolean, attributeName: string) => void, () => void, (filters) => void]

const getAttributesValue = (attributeNames, attributesFromQuery) =>
    Object.fromEntries(attributeNames.map(attribute => [attribute, attributesFromQuery.includes(attribute)]))

export const useBooleanAttributesSearch = <F> (attributeNames: string[]): UseBooleanAttributesSearchOutputType => {
    const router = useRouter()
    const filtersFromQuery = useMemo(() => getFiltersFromQuery<F>(router.query), [router.query])
    const attributesFromQuery = useMemo<string[]>(() => get(filtersFromQuery, 'attributes', []), [filtersFromQuery])
    const attributesValueFromQuery = useMemo(() => getAttributesValue(attributeNames, attributesFromQuery), [attributeNames, attributesFromQuery])
    const [attributes, setAttributes] = useState<{ [key: string]: boolean }>(attributesValueFromQuery)

    const changeQuery = useMemo(() => debounce(async (newAttributes: { [key: string]: boolean }) => {
        const includedAttributes = Object.entries(newAttributes).filter(([_, isChecked]) => isChecked).map(([attributeName]) => attributeName)
        const newParameters = getFiltersQueryData({ ...filtersFromQuery, attributes: includedAttributes })
        await updateQuery(router, { newParameters }, { routerAction: 'replace' })
    }, 400), [filtersFromQuery, router])

    const handleChangeAttribute = useCallback(async (isChecked: boolean, attributeName: string) => {
        const newState = { ...attributes, [attributeName]: isChecked }
        setAttributes(newState)
        await changeQuery(newState)
    }, [attributes, changeQuery])

    const handleChangeAllAttributesWithoutUpdateQuery = useCallback((filters) => {
        const attributes = get(filters, 'attributes', [])
        setAttributes(getAttributesValue(attributeNames, attributes))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleResetAllWithoutUpdateQuery = useCallback(() => {
        setAttributes(getAttributesValue(attributeNames, []))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!isEqual(attributesValueFromQuery, attributes)) {
            setAttributes(attributesValueFromQuery)
        }
    }, [attributesValueFromQuery])

    return [attributes, handleChangeAttribute, handleResetAllWithoutUpdateQuery, handleChangeAllAttributesWithoutUpdateQuery]
}
