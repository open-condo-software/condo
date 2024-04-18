import { Form } from 'antd'
import get from 'lodash/get'
import React, { useMemo } from 'react'

import { Select } from '@open-condo/ui'

import { Loader } from '../../common/components/Loader'
import { DocumentCategory } from '../utils/clientSchema'


type DocumentCategoryFormItemProps = {
    initialValue?: string
}

export const DocumentCategoryFormItem: React.FC<DocumentCategoryFormItemProps> = ({ initialValue }) => {
    const { objs: categories, allDataLoaded: allCategoriesLoaded } = DocumentCategory.useAllObjects({})

    const categoryOptions = useMemo(() => categories.map(category =>
        ({ label: get(category, 'name'), value: get(category, 'id') })
    ), [categories])

    const loading = !allCategoriesLoaded

    return (
        <Form.Item
            label='Категория'
            name='category'
            required
            labelCol={{ span: 24 }}
            initialValue={initialValue}
        >
            <Select
                options={categoryOptions}
                placeholder='Выбор категории'
                loading={loading}
            />
        </Form.Item>
    )
}