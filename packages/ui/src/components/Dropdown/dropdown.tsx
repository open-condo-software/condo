import { Dropdown as DefaultDropdown, DropdownProps as DefaultDropdownProps } from 'antd'
import React from 'react'

export const DROPDOWN_CLASS_PREFIX = 'condo-dropdown'

export type DropdownProps = Omit<DefaultDropdownProps, 'visible' | 'prefixCls'>


const Dropdown: React.FC<DropdownProps> = (props) => {
    return (
        <DefaultDropdown
            {...props}
            prefixCls={DROPDOWN_CLASS_PREFIX}
        />
    )
}

export { Dropdown }
