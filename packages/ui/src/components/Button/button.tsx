import {
    Button as DefaultButton,
    ButtonProps as DefaultButtonProps,
} from 'antd'
import classNames from 'classnames'
import React, { useCallback } from 'react'

import { sendAnalyticsClickEvent, extractChildrenContent } from '../_utils/analytics'

export const BUTTON_CLASS_PREFIX = 'condo-btn'

type CondoButtonProps = {
    type: 'primary' | 'secondary' | 'accent'
    children?: string
    stateless?: boolean
    focus?: boolean
    minimal?: boolean
    compact?: boolean
    size?: 'medium' | 'large'
}

export type ButtonProps = Omit<DefaultButtonProps, 'shape' | 'size' | 'style' | 'ghost' | 'type' | 'prefix' | 'prefixCls'>
& CondoButtonProps

const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>> = React.forwardRef((props, ref) => {
    const { type, className, icon, children, onClick, stateless, id, focus, minimal, compact, size = 'large', ...rest } = props
    const classes = classNames(
        {
            [`${BUTTON_CLASS_PREFIX}-${type}`]: type,
            [`${BUTTON_CLASS_PREFIX}-${size}`]: size,
            [`${BUTTON_CLASS_PREFIX}-stateless`]: stateless,
            [`${BUTTON_CLASS_PREFIX}-focus`]: focus,
            [`${BUTTON_CLASS_PREFIX}-minimal`]: minimal,
            [`${BUTTON_CLASS_PREFIX}-compact`]: compact,
        },
        className,
    )

    const wrappedIcon = icon
        ? <span className={`${BUTTON_CLASS_PREFIX}-icon`}>{icon}</span>
        : null

    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement> & React.MouseEvent<HTMLAnchorElement>) => {
        const stringContent = extractChildrenContent(children)
        if (stringContent) {
            sendAnalyticsClickEvent('Button', { value: stringContent, type, id })
        }

        if (onClick) {
            onClick(event)
        }
    }, [children, id, onClick, type])

    return (
        <DefaultButton
            {...rest}
            id={id}
            icon={wrappedIcon}
            prefixCls={BUTTON_CLASS_PREFIX}
            className={classes}
            ref={ref}
            onClick={handleClick}
        >
            {
                children && (
                    <span className={`${BUTTON_CLASS_PREFIX}-text`} data-before={children}>
                        {children}
                    </span>
                )
            }
        </DefaultButton>
    )
})

Button.displayName = 'Button'

export {
    Button,
}
