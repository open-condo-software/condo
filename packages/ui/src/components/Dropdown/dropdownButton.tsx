import { MenuItemType } from 'antd/lib/menu/hooks/useItems'
import classNames from 'classnames'
import get from 'lodash/get'
import React from 'react'

import { Dropdown, DropdownProps } from './dropdown'
import { DROPDOWN_CLASS_PREFIX } from './dropdown'
import { useItems } from './hooks/useItems'

import { Either } from '../_utils/types'
import { ExtendedButton, ExtendedButtonProps } from '../Button/extendedButton'


export interface IDropdownItem {
    disabled?: boolean,
    label: string
    onClick?: MenuItemType['onClick']
    key: React.Key
}

export interface IDropdownItemWithDescription extends IDropdownItem {
    description: string
}

export interface IDropdownItemWithIcon extends IDropdownItem {
    icon: React.ReactNode
}

export type ItemType = Either<Either<IDropdownItem, IDropdownItemWithDescription>, IDropdownItemWithIcon>

export type DropdownButtonProps = {
    children: string
    items: Array<ItemType>
    id?: string
    disabled?: boolean
    type: ExtendedButtonProps['type']
    buttonProps?: Omit<ExtendedButtonProps, 'type'>,
    dropdownProps?: Omit<DropdownProps, 'children' | 'disabled' | 'menu'>,
}

const DropdownButton: React.FC<DropdownButtonProps> = (props) => {
    const { children, items = [], buttonProps, dropdownProps, id: triggerId, disabled, type } = props

    const dropdownOverlayClasses = classNames(
        {
            [`${DROPDOWN_CLASS_PREFIX}-wrapper`]: true,
        },
        get(dropdownProps, 'className')
    )

    const menuItems = useItems(items)

    return (
        <Dropdown
            {...dropdownProps}
            disabled={disabled}
            overlayClassName={dropdownOverlayClasses}
            menu={{ items: menuItems }}
        >
            <ExtendedButton
                {...buttonProps}
                type={type}
                disabled={disabled}
                id={triggerId}
                children={children}
            />
        </Dropdown>
    )
}

export { DropdownButton }
