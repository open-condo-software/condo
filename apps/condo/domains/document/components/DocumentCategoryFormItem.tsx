import { Form } from 'antd'
import get from 'lodash/get'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Select } from '@open-condo/ui'

import { DocumentCategory } from '@condo/domains/document/utils/clientSchema'


type DocumentCategoryFormItemProps = {
    initialValue?: string
}

export const DocumentCategoryFormItem: React.FC<DocumentCategoryFormItemProps> = ({ initialValue }) => {
    const intl = useIntl()
    const CategoryTitle = intl.formatMessage({ id: 'documents.uploadDocumentsModal.category.title' })
    const CategoryPlaceholder = intl.formatMessage({ id: 'documents.uploadDocumentsModal.category.placeholder' })

    const { objs: categories, allDataLoaded: allCategoriesLoaded } = DocumentCategory.useAllObjects({})

    const categoryOptions = useMemo(() => categories.map(category =>
        ({ label: get(category, 'name'), value: get(category, 'id') })
    ), [categories])

    const loading = !allCategoriesLoaded

    return (
        <Form.Item
            label={CategoryTitle}
            name='category'
            required
            labelCol={{ span: 24 }}
            initialValue={initialValue}
        >
            <Select
                options={categoryOptions}
                placeholder={CategoryPlaceholder}
                loading={loading}
            />
        </Form.Item>
    )
}