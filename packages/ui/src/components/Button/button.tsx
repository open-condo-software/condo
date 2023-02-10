import {
    Button as DefaultButton,
    ButtonProps as DefaultButtonProps,
} from 'antd'
import classNames from 'classnames'
import React, { useCallback } from 'react'

import { sendAnalyticsClickEvent, extractChildrenContent } from '../_utils/analytics'

const BUTTON_CLASS_PREFIX = 'condo-btn'

type CondoButtonProps = {
    type: 'primary' | 'secondary',
    children?: string
    stateless?: boolean
    textAlign?: 'left' | 'center' | 'right'
}

export type ButtonProps = Omit<DefaultButtonProps, 'shape' | 'size' | 'style' | 'ghost' | 'type' | 'prefix' | 'prefixCls'>
& CondoButtonProps

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    const { type, className, icon, children, onClick, stateless, textAlign = 'center', ...rest } = props
    const classes = classNames(
        {
            [`${BUTTON_CLASS_PREFIX}-${type}`]: type,
            [`${BUTTON_CLASS_PREFIX}-stateless`]: stateless,
        },
        `${BUTTON_CLASS_PREFIX}-${textAlign}-text`,
        className,
    )

    const wrappedIcon = icon
        ? <span className={`${BUTTON_CLASS_PREFIX}-icon`}>{icon}</span>
        : null

    const handleClick = useCallback((event) => {
        const stringContent = extractChildrenContent(children)
        if (stringContent) {
            sendAnalyticsClickEvent('Button', { value: stringContent, type })
        }

        if (onClick) {
            onClick(event)
        }
    }, [children, onClick, type])

    return (
        <DefaultButton
            {...rest}
            icon={wrappedIcon}
            prefixCls={BUTTON_CLASS_PREFIX}
            className={classes}
            ref={ref}
            onClick={handleClick}
        >
            <span className={`${BUTTON_CLASS_PREFIX}-text`} data-before={children}>
                {children}
            </span>
        </DefaultButton>
    )
})

Button.displayName = 'Button'

export {
    Button,
}

