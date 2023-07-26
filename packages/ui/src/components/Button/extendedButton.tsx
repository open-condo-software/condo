import { Button as DefaultButton } from 'antd'
import classNames from 'classnames'
import React from 'react'

import { MoreHorizontal } from '@open-condo/icons'

import { ButtonProps } from './button'


const BUTTON_CLASS_PREFIX = 'condo-btn'

export type ExtendedButtonProps = Omit<ButtonProps, 'icon' | 'href'>

const VerticalDividerSvg: React.FC = () => {
    return (
        <svg className={`${BUTTON_CLASS_PREFIX}-vertical-divider`} xmlns='http://www.w3.org/2000/svg' width='1' height='48' viewBox='0 0 1 48' fill='none'>
            <rect width='1' height='48' fill='currentColor' />
        </svg>
    )
}

const ExtendedButton: React.FC<ExtendedButtonProps> = (props) => {
    const { children, type, stateless, className, ...rest } = props

    const buttonClasses = classNames(
        {
            [`${BUTTON_CLASS_PREFIX}-${type}`]: type,
            [`${BUTTON_CLASS_PREFIX}-stateless`]: stateless,
        },
        className,
    )

    return (
        <DefaultButton
            {...rest}
            prefixCls={BUTTON_CLASS_PREFIX}
            className={buttonClasses}
        >
            <span className={`${BUTTON_CLASS_PREFIX}-label`}>
                {children}
            </span>
            <VerticalDividerSvg />
            <span className={`${BUTTON_CLASS_PREFIX}-ellipsis`}>
                <MoreHorizontal />
            </span>
        </DefaultButton>
    )
}

export { ExtendedButton }
