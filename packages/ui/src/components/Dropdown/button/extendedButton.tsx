import './style.less'

import classNames from 'classnames'
import React from 'react'

import { MoreHorizontal } from '@open-condo/icons'

import { ButtonProps, Button as CondoButton } from '../../Button'
import { BUTTON_CLASS_PREFIX } from '../../Button/button'


export type ExtendedButtonProps = Omit<ButtonProps, 'icon' | 'href'>

/**
 * For internal use only
 */
const ExtendedButton: React.FC<ExtendedButtonProps> = (props) => {
    const { children, className, ...rest } = props

    const buttonClasses = classNames(
        `${BUTTON_CLASS_PREFIX}-extended`,
        className,
    )

    return (
        <CondoButton
            {...rest}
            prefixCls={BUTTON_CLASS_PREFIX}
            className={buttonClasses}
        >
            {/* NOTE: We ignore typing errors to put custom content in the CondoButton. */}
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            <>
                <span className={`${BUTTON_CLASS_PREFIX}-label`}>
                    {children}
                </span>
                <div className={`${BUTTON_CLASS_PREFIX}-vertical-divider`} />
                <span className={`${BUTTON_CLASS_PREFIX}-ellipsis`}>
                    <MoreHorizontal />
                </span>
            </>
        </CondoButton>
    )
}

export { ExtendedButton }
