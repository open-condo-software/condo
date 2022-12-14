import React from 'react'
import { Checkbox as DefaultCheckbox, CheckboxProps as DefaultCheckboxProps } from 'antd'

const CHECKBOX_CLASS_PREFIX = 'condo-checkbox'

type CondoCheckboxProps = {
    children?: string
}

export type CheckboxProps = Pick<DefaultCheckboxProps, 'autoFocus' | 'defaultChecked' | 'disabled' | 'onChange'> & CondoCheckboxProps

const Checkbox: React.FC<CheckboxProps> = (props) => {
    const { children, ...rest } = props

    return (
        <DefaultCheckbox
            {...rest}
            prefixCls={CHECKBOX_CLASS_PREFIX}
        >
            {children}
        </DefaultCheckbox>
    )
}

export {
    Checkbox,
}
