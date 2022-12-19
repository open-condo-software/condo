import React from 'react'
import { Checkbox as DefaultCheckbox, CheckboxProps as DefaultCheckboxProps } from 'antd'
import { Typography } from '../Typography'

const CHECKBOX_CLASS_PREFIX = 'condo-checkbox'

type CondoCheckboxProps = {
    children?: string
    boldLabel?: boolean
}

export type CheckboxProps = Pick<DefaultCheckboxProps, 'autoFocus' | 'defaultChecked' | 'disabled' | 'onChange' | 'indeterminate' | 'checked'> & CondoCheckboxProps

const Checkbox: React.FC<CheckboxProps> = (props) => {
    const { children, boldLabel, disabled, ...rest } = props
    return (
        <DefaultCheckbox
            {...rest}
            prefixCls={CHECKBOX_CLASS_PREFIX}
            disabled={disabled}
        >
            <Typography.Text
                size='medium'
                strong={boldLabel}
                disabled={disabled}
            >
                {children}
            </Typography.Text>
        </DefaultCheckbox>
    )
}

export {
    Checkbox,
}
