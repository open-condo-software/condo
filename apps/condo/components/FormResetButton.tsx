import React from 'react'
import { Form } from 'antd'
import { Button, CustomButtonProps } from './Button'

export const FormResetButton:React.FC<CustomButtonProps> = (props) => {
    return (
        <Form.Item noStyle shouldUpdate>
            {({ isFieldsTouched, resetFields }) => {
                const isTouched = isFieldsTouched()

                return (
                    <Button {...props} onClick={() => resetFields()} disabled={!isTouched}>
                        Отменить
                    </Button>
                )
            }}
        </Form.Item>
    )
}
