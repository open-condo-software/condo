import React from 'react'

import { Dropdown, DropdownProps, ItemType } from './dropdown'

import { ExtendedButton, ExtendedButtonProps } from '../Button/extendedButton'


export type DropdownButtonProps = {
    children: string
    items: Array<ItemType>
    id?: string
    disabled?: boolean
    type: ExtendedButtonProps['type']
    buttonProps?: Omit<ExtendedButtonProps, 'type'>,
    dropdownProps?: Omit<DropdownProps, 'items' | 'children' | 'triggerId' | 'disabled'>,
}

const DropdownButton: React.FC<DropdownButtonProps> = (props) => {
    const { children, items = [], buttonProps, dropdownProps, id: triggerId, disabled, type } = props

    return (
        <Dropdown overlayStyle={{ maxWidth: '100%' }} {...dropdownProps} triggerId={triggerId} disabled={disabled} items={items}>
            <ExtendedButton {...buttonProps} type={type} disabled={disabled} id={triggerId} children={children} />
        </Dropdown>
    )
}

export { DropdownButton }
