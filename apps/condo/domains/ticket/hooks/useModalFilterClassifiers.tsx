import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'


import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'

import Select from '@condo/domains/common/components/antd/Select'
import { getFiltersModalPopupContainer } from '@condo/domains/common/utils/filters.utils'
import { FiltersFromQueryType, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { ClassifiersQueryLocal } from '@condo/domains/ticket/utils/clientSchema/classifierSearch'

const getInitialClassifierValues = (filters: FiltersFromQueryType, keyword: string) => {
    const initialValueFromFilter = get(filters, keyword)

    if (!isEmpty(initialValueFromFilter)) {
        return Array.isArray(initialValueFromFilter) ? initialValueFromFilter : [initialValueFromFilter]
    } else {
        return []
    }
}

const MULTIPLE_SELECT_STYLE: CSSProperties = { width: '100%' }

function FilterModalBaseClassifierSelect ({ form, type }) {
    const intl = useIntl()
    const SelectMessage = intl.formatMessage({ id: 'Select' })
    const LoadingMessage = intl.formatMessage({ id: 'LoadingInProgress' })

    const client = useApolloClient()
    const ClassifierLoader = useMemo(() => new ClassifiersQueryLocal(client), [client])
    const router = useRouter()

    const [options, setOptions] = useState([])
    const [selected, setSelected] = useState([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLoading(true)
        ClassifierLoader.init().then(async () => {
            const classifiers = await ClassifierLoader.search('', type, null, 500)
            setOptions(classifiers)
            setLoading(false)
        })
    }, [ClassifierLoader, type])

    useEffect(() => {
        const { filters } = parseQuery(router.query)
        const initialValueFromQuery = getInitialClassifierValues(filters, `${type}Classifier`)
        const initialValueFromForm = form.getFieldValue(`${type}Classifier`)

        if (initialValueFromQuery || initialValueFromForm) {
            const initialValue = initialValueFromForm ? initialValueFromForm : initialValueFromQuery
            setSelected(initialValue)
        }
    }, [form, options, router.query, type])

    const handleSelectChange = useCallback((value) => {
        form.setFieldsValue({ [`${type}Classifier`]: value })
        setSelected(value)
    }, [form, type])

    const onFocus = useCallback(() => {
        setOpen(false)
        const selectedPlaces = form.getFieldValue('placeClassifier')
        const selectedCategories = form.getFieldValue('categoryClassifier')
        const selectedProblems = form.getFieldValue('problemClassifier')

        const rules = ClassifierLoader.findRulesBySelectedClassifiers(type, selectedPlaces, selectedCategories, selectedProblems)

        setOptions(ClassifierLoader.rulesToOptions(rules, type))
        setOpen(true)
    }, [ClassifierLoader, form, type])

    const handleBlur = useCallback(() => {
        setOpen(false)
    }, [])

    const renderOptions = useMemo(() =>
        options
            .map(classifier => ({ label: classifier.name, value: classifier.id }))
            .filter(option => !isEmpty(option.label)),
    [options])

    return (
        <Select
            id={`${type}-classifier-select`}
            showArrow
            filterOption
            optionFilterProp='label'
            value={loading ? [] : selected}
            mode='multiple'
            onChange={handleSelectChange}
            options={renderOptions}
            onFocus={onFocus}
            onBlur={handleBlur}
            open={open}
            getPopupContainer={getFiltersModalPopupContainer}
            disabled={loading}
            placeholder={loading ? LoadingMessage : SelectMessage}
            style={MULTIPLE_SELECT_STYLE}
        />
    )
}

export function FilterModalPlaceClassifierSelect ({ form }) {
    return (
        <FilterModalBaseClassifierSelect
            form={form}
            type='place'
        />
    )
}

export function FilterModalCategoryClassifierSelect ({ form }) {
    return (
        <FilterModalBaseClassifierSelect
            form={form}
            type='category'
        />
    )
}

export function FilterModalProblemClassifierSelect ({ form }) {
    return (
        <FilterModalBaseClassifierSelect
            form={form}
            type='problem'
        />
    )
}
