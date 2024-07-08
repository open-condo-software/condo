import get from 'lodash/get'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Select } from '@open-condo/ui'

interface Template {
    key: string
    label: string
}

interface INewsFormProps {
    items: Template[],
    onChange?: (value: string) => void
}

export const TemplatesSelect: React.FC<INewsFormProps> = ({ items, onChange }) => {
    const intl = useIntl()
    const TemplatesPlaceholderLabel = intl.formatMessage({ id: 'news.fields.template.placeholder' })
    
    return (
        <Select
            showSearch
            defaultValue={items[0].key}
            placeholder={TemplatesPlaceholderLabel}
            displayMode='fill-parent'
            optionFilterProp='label'
            onChange={onChange}
            options={items}
            filterOption={(inputValue, option) => {
                const optionText = get(option, ['children', 'props', 'children'], '')
                if (optionText.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0) { return true }
            }}
        />
    )
}
