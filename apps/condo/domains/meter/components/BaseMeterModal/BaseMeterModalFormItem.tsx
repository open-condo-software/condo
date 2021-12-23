import React from 'react'
import { FormItemProps } from 'antd/es'
import { Form } from 'antd'

const LABEL_COL_FORM_ITEM_PROPS = {
    style: {
        padding: 0,
        margin: 0,
    },
}

export const BaseMeterModalFormItem: React.FC<FormItemProps> = ({ children, ...formItemProps }) => (
    <Form.Item
        labelCol={LABEL_COL_FORM_ITEM_PROPS}
        {...formItemProps}
    >
        {children}
    </Form.Item>
)