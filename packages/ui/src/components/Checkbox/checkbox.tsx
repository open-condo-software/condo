import React from 'react'
import { Checkbox as DefaultCheckbox, CheckboxProps as DefaultCheckboxProps } from 'antd'

const CHECKBOX_CLASS_PREFIX = 'condo-checkbox'

export type CheckboxProps = Pick<DefaultCheckboxProps, 'autoFocus' | 'defaultChecked' | 'disabled' | 'onChange'>

const Checkbox: React.FC<CheckboxProps> = (props) => {
    const { ...rest } = props

    return (
        <DefaultCheckbox
            {...rest}
            prefixCls={CHECKBOX_CLASS_PREFIX}
        />
    )
}

export {
    Checkbox,
}
