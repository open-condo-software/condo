import { Dropdown as DefaultDropdown, DropdownProps as DefaultDropdownProps } from 'antd'
import { MenuItemType } from 'antd/lib/menu/hooks/useItems'
import React from 'react'

import { useItems } from './hooks/useItems'

import { Either } from '../_utils/types'


export const DROPDOWN_CLASS_PREFIX = 'condo-dropdown'


export interface IDropdownItem {
    disabled?: boolean,
    label: string
    onClick?: MenuItemType['onClick']
    key?: React.Key
    id?: string
}

export interface IDropdownItemWithDescription extends IDropdownItem {
    description: string
}

export interface IDropdownItemWithIcon extends IDropdownItem {
    icon: React.ReactNode
}

export type ItemType = Either<Either<IDropdownItem, IDropdownItemWithDescription>, IDropdownItemWithIcon>


export type DropdownProps = {
    items: Array<ItemType>
    triggerId?: string
} & Omit<DefaultDropdownProps, 'menu' | 'visible' | 'prefixCls'>

const Dropdown: React.FC<DropdownProps> = ({ items = [], triggerId, ...props }) => {

    const menuItems = useItems(items, triggerId)

    return (
        <DefaultDropdown
            prefixCls={DROPDOWN_CLASS_PREFIX}
            menu={{ items: menuItems }}
            {...props}
        />
    )
}

export { Dropdown }
