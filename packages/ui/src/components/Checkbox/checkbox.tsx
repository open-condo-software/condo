import { Checkbox as DefaultCheckbox, CheckboxProps as DefaultCheckboxProps } from 'antd'
import React from 'react'

import { Typography, TypographyTextProps } from '../Typography'

const CHECKBOX_CLASS_PREFIX = 'condo-checkbox'

type CondoCheckboxProps = {
    label?: string
    labelProps?: TypographyTextProps
}

export type CheckboxProps = Pick<DefaultCheckboxProps, 'autoFocus' | 'defaultChecked' | 'disabled' | 'onChange' | 'indeterminate' | 'checked'> & CondoCheckboxProps

const Checkbox: React.FC<CheckboxProps> = (props) => {
    const { label, labelProps, disabled, ...rest } = props
    return (
        <DefaultCheckbox
            {...rest}
            prefixCls={CHECKBOX_CLASS_PREFIX}
            disabled={disabled}
        >
            <Typography.Text
                size='medium'
                disabled={disabled}
                {...labelProps}
            >
                {label}
            </Typography.Text>
        </DefaultCheckbox>
    )
}

export {
    Checkbox,
}
