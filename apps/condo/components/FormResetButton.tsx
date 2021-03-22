import React from 'react'
import { Form } from 'antd'
import { useIntl } from '@core/next/intl'
import { Button, CustomButtonProps } from './Button'

export const FormResetButton:React.FC<CustomButtonProps> = (props) => {
    const intl = useIntl()

    return (
        <Form.Item noStyle shouldUpdate>
            {({ isFieldsTouched, resetFields }) => {
                const isTouched = isFieldsTouched()

                return (
                    <Button {...props} onClick={() => resetFields()} disabled={!isTouched}>
                        {intl.formatMessage({ id: 'Cancel' })}
                    </Button>
                )
            }}
        </Form.Item>
    )
}
