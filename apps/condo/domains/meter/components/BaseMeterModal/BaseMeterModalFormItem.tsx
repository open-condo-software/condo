import React from 'react'
import { FormItemProps } from 'antd/es'
import { Form } from 'antd'
import styled from '@emotion/styled'

import { colors } from '@condo/domains/common/constants/style'

const LABEL_COL_FORM_ITEM_PROPS = {
    style: {
        padding: 0,
        margin: 0,
    },
}

const StyledFormItem = styled(Form.Item)`
    .ant-form-item-label > label {
        color: ${colors.textSecondary};
    }
`

export const BaseMeterModalFormItem: React.FC<FormItemProps> = ({ children, ...formItemProps }) => (
    <StyledFormItem labelCol={LABEL_COL_FORM_ITEM_PROPS} {...formItemProps}>
        {children}
    </StyledFormItem>
)
