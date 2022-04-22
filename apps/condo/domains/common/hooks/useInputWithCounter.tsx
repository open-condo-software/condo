import { InputProps, Typography } from 'antd'
import React, { useCallback, useState } from 'react'
import { TextAreaProps } from 'antd/es/input'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'

type AntdInputProps = InputProps | TextAreaProps

const TARGET_VALUE_LENGTH_PATH = ['target', 'value', 'length']

export const useInputWithCounter = (InputComponent, maxLength) => {
    const [textLength, setTextLength] = useState<number>(0)

    const handleInputChange = useCallback((e, inputProps) => {
        const valueLength = get(e, TARGET_VALUE_LENGTH_PATH)
        setTextLength(valueLength)

        if (isFunction(inputProps.onChange)) inputProps.onChange(e)
    }, [])

    const InputWithCounter: React.FC<AntdInputProps> = useCallback((inputProps) => (
        <InputComponent
            maxLength={maxLength}
            {...inputProps}
            onChange={(e) => handleInputChange(e, inputProps)}
        />
    ), [InputComponent, handleInputChange, maxLength])

    const Counter = useCallback((props) => (
        <Typography.Text {...props}>
            {textLength}/{maxLength}
        </Typography.Text>
    ), [maxLength, textLength])

    return { InputWithCounter, Counter, textLength, setTextLength }
}