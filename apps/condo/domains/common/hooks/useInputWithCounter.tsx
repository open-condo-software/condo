import { InputProps } from 'antd'
import { TextAreaProps } from 'antd/es/input'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useState } from 'react'

import { Typography } from '@open-condo/ui'

type AntdInputProps = InputProps | TextAreaProps

const TARGET_VALUE_LENGTH_PATH = ['target', 'value', 'length']

export const useInputWithCounter = (InputComponent, maxLength) => {
    const [textLength, setTextLength] = useState<number>(0)

    const handleInputChange = useCallback((e, inputProps) => {
        const valueLength = get(e, TARGET_VALUE_LENGTH_PATH, 0)
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