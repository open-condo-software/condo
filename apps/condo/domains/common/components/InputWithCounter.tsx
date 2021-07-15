import React from 'react'
import { Col, InputProps, Space, Typography } from 'antd'
import { colors } from '../constants/style'
import { TextAreaProps } from 'antd/es/input'

type InputWithCounterProps = (InputProps | TextAreaProps) & {
    InputComponent: React.FC,
    currentLength: number
}

export const InputWithCounter: React.FC<InputWithCounterProps> = ({ InputComponent, currentLength, maxLength, ...inputProps }) => (
    <Col>
        <InputComponent {...inputProps} />
        <Typography.Text style={{ color: colors.sberGrey[5], fontSize: '12px', float: 'right' }}>
            {currentLength}/{maxLength}
        </Typography.Text>
    </Col>
)