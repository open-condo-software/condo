import { Dropdown, Button as DefaultButton } from 'antd'
import { MenuItemType  } from 'antd/lib/menu/hooks/useItems'
import classNames from 'classnames'
import get from 'lodash/get'
import React from 'react'

import { MoreHorizontal } from '@open-condo/icons'

import { ButtonProps } from './button'
import { useItems } from './hooks/useItems'

import { Either } from '../_utils/types'


export const DROPDOWN_CLASS_PREFIX = 'condo-dropdown'
const BUTTON_CLASS_PREFIX = 'condo-btn'


export interface IDropdownButtonItem {
    disabled?: boolean,
    label: string
    onClick?: MenuItemType['onClick']
    key?: React.Key
    id?: string
}

export interface IDropdownButtonItemWithDescription extends IDropdownButtonItem {
    description: string
}

export interface IDropdownButtonItemWithIcon extends IDropdownButtonItem {
    icon: React.ReactNode
}

export type ItemType = Either<Either<IDropdownButtonItem, IDropdownButtonItemWithDescription>, IDropdownButtonItemWithIcon>

export type DropdownButtonProps = Omit<ButtonProps, 'icon' | 'children' | 'href'> & {
    children: string
    items: Array<ItemType>
}

const VerticalDividerSvg: React.FC = () => {
    return (
        <svg className={`${BUTTON_CLASS_PREFIX}-vertical-divider`} xmlns='http://www.w3.org/2000/svg' width='1' height='48' viewBox='0 0 1 48' fill='none'>
            <rect width='1' height='48' fill='currentColor' />
        </svg>
    )
}

const DropdownButton: React.ForwardRefExoticComponent<DropdownButtonProps & React.RefAttributes<HTMLButtonElement>> = React.forwardRef((props, ref) => {
    const { children, items = [], type, stateless, className, id: triggerId, block, disabled, ...rest } = props

    const buttonClasses = classNames(
        {
            [`${BUTTON_CLASS_PREFIX}-${type}`]: type,
            [`${BUTTON_CLASS_PREFIX}-stateless`]: stateless,
        },
        className,
    )

    const dropdownWrapperClasses = classNames({
        [`${BUTTON_CLASS_PREFIX}-dropdown-wrapper`]: true,
        [`${BUTTON_CLASS_PREFIX}-dropdown-block`]: block,
    })

    const menuItems = useItems(items, triggerId)

    return (
        <div className={`${BUTTON_CLASS_PREFIX}-container`}>
            <Dropdown
                disabled={disabled}
                prefixCls={DROPDOWN_CLASS_PREFIX}
                className={`${BUTTON_CLASS_PREFIX}-dropdown`}
                menu={{ items: menuItems }}
                overlayClassName={dropdownWrapperClasses}
                getPopupContainer={(target) => {
                    return get(target, 'parentElement') || get(document, 'body') || undefined
                }}
            >
                <DefaultButton
                    {...rest}
                    id={triggerId}
                    prefixCls={BUTTON_CLASS_PREFIX}
                    className={buttonClasses}
                    ref={ref}
                    block={block}
                    disabled={disabled}
                >
                    <span className={`${BUTTON_CLASS_PREFIX}-label`}>
                        {children}
                    </span>
                    <VerticalDividerSvg />
                    <span className={`${BUTTON_CLASS_PREFIX}-ellipsis`}>
                        <MoreHorizontal />
                    </span>
                </DefaultButton>
            </Dropdown>
        </div>
    )
})

DropdownButton.displayName = 'DropdownButton'

export {
    DropdownButton,
}
