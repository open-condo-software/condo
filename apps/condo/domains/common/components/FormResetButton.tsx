import { Form } from 'antd'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Button, CustomButtonProps } from './Button'

export const FormResetButton: React.FC<CustomButtonProps> = (props) => {
    const intl = useIntl()
    const CancelMessage = intl.formatMessage({ id: 'Cancel' })

    return (
        <Form.Item noStyle shouldUpdate>
            {({ isFieldsTouched, resetFields }) => {
                const isTouched = isFieldsTouched()

                return (
                    <Button {...props} onClick={() => resetFields()} disabled={!isTouched}>
                        {CancelMessage}
                    </Button>
                )
            }}
        </Form.Item>
    )
}
