import { Col, InputProps, Typography } from 'antd'
import React, { CSSProperties, useCallback, useState } from 'react'
import { TextAreaProps } from 'antd/es/input'
import { colors } from '../constants/style'
import { get } from 'lodash'

type AntdInputProps = InputProps | TextAreaProps

export const useInputWithCounter = (InputComponent, maxLength) => {
    const [textLength, setTextLength] = useState<number>(0)

    const InputWithCounter: React.FC<AntdInputProps> = useCallback((inputProps) => (
        <InputComponent
            maxLength={maxLength}
            {...inputProps}
            onChange={(e) => {
                const valueLength = get(e, ['target', 'value', 'length'])
                setTextLength(valueLength)

                inputProps.onChange && inputProps.onChange(e)
            }}
        />
    ), [InputComponent, maxLength])

    const Counter = useCallback((props) => (
        <Typography.Text {...props}>
            {textLength}/{maxLength}
        </Typography.Text>
    ), [maxLength, textLength])

    return { InputWithCounter, Counter, textLength, setTextLength }
}