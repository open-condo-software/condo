import {
    Button as DefaultButton,
    ButtonProps as DefaultButtonProps,
} from 'antd'
import classNames from 'classnames'
import React, { useCallback } from 'react'

import { sendAnalyticsClickEvent, extractChildrenContent } from '../../_utils/analytics'

export const TEXT_BUTTON_CLASS_PREFIX = 'condo-text-btn'

type CondoTextButtonProps = {
    children?: string
    stateless?: boolean
    focus?: boolean
}

export type TextButtonProps = Omit<DefaultButtonProps, 'shape' | 'size' | 'style' | 'ghost' | 'type' | 'prefix' | 'prefixCls'>
& CondoTextButtonProps

const TextButton: React.ForwardRefExoticComponent<TextButtonProps & React.RefAttributes<HTMLButtonElement>> = React.forwardRef((props, ref) => {
    const { className, icon, children, onClick, stateless, id, focus, ...rest } = props
    const classes = classNames(
        {
            [`${TEXT_BUTTON_CLASS_PREFIX}-stateless`]: stateless,
            [`${TEXT_BUTTON_CLASS_PREFIX}-focus`]: focus,
        },
        className,
    )

    const wrappedIcon = icon
        ? <span className={`${TEXT_BUTTON_CLASS_PREFIX}-icon`}>{icon}</span>
        : null

    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement> & React.MouseEvent<HTMLAnchorElement>) => {
        const stringContent = extractChildrenContent(children)
        if (stringContent) {
            sendAnalyticsClickEvent('TextButton', { value: stringContent, id })
        }

        if (onClick) {
            onClick(event)
        }
    }, [children, id, onClick])

    return (
        <DefaultButton
            {...rest}
            type='text'
            id={id}
            icon={wrappedIcon}
            prefixCls={TEXT_BUTTON_CLASS_PREFIX}
            className={classes}
            ref={ref}
            onClick={handleClick}
        >
            {
                children && (
                    <span className={`${TEXT_BUTTON_CLASS_PREFIX}-text`} data-before={children}>
                        {children}
                    </span>
                )
            }
        </DefaultButton>
    )
})

TextButton.displayName = 'TextButton'

export {
    TextButton,
}

