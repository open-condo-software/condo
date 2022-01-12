import React from 'react'
import { Col, InputProps, Typography } from 'antd'
import { colors } from '../constants/style'
import { TextAreaProps } from 'antd/es/input'

type AntdInputProps = InputProps | TextAreaProps

type InputWithCounterProps = AntdInputProps & {
    InputComponent: React.FC<InputProps | TextAreaProps>
    currentLength: number
}

export const InputWithCounter: React.FC<InputWithCounterProps> = ({
    InputComponent,
    currentLength,
    maxLength,
    ...inputProps
}) => (
    <Col>
        <InputComponent maxLength={maxLength} {...inputProps} />
        <Typography.Text style={{ color: colors.sberGrey[5], fontSize: '12px', float: 'right' }}>
            {currentLength}/{maxLength}
        </Typography.Text>
    </Col>
)
