import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import keyBy from 'lodash/keyBy'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Select } from '@open-condo/ui'

interface Template {
    key: string
    label: string
    category?: string
}

interface INewsFormProps {
    items: Template[],
    onChange?: (value: string) => void
    hasCategories?: boolean,
}

export const TemplatesSelect: React.FC<INewsFormProps> = ({ items, onChange, hasCategories }) => {
    const intl = useIntl()
    const TemplatesPlaceholderLabel = intl.formatMessage({ id: 'news.fields.template.placeholder' })

    const templatesByCategory = useMemo(() => {
        if (hasCategories) { return groupBy(items, 'category') }
        else { return null }
    }, [items, hasCategories])

    const templatesByKey = useMemo(() => {
        return keyBy(items, 'key')
    }, [items])

    const processedOptions = useMemo(() => {
        if (hasCategories) {
            const result = []
            for (const category of Object.keys(templatesByCategory)) {
                result.push({
                    label: category,
                    options: templatesByCategory[category],
                })
            }
            return result
        }
        return items
    }, [hasCategories, items])

    return (
        <Select
            showSearch
            defaultValue={null}
            placeholder={TemplatesPlaceholderLabel}
            displayMode='fill-parent'
            optionFilterProp='label'
            onChange={onChange}
            options={processedOptions}
            filterOption={(inputValue, option) => {
                // Search on item: if input is like item -> show this option
                const optionText = get(option, ['children', 'props', 'children'], '')
                if (optionText.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0) { return true }

                // Search on category: if input is like category -> show all options inside this category
                if (hasCategories) {
                    const templateKey = get(option, 'value', null)
                    if (!templateKey) { return false }
                    const templateCategory = get(templatesByKey, [templateKey, 'category'], '')
                    if (templateCategory.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0) { return true }
                }
            }}
        />
    )
}
