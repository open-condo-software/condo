import {
    Button as DefaultButton,
    ButtonProps as DefaultButtonProps,
} from 'antd'
import classNames from 'classnames'
import React, { useCallback } from 'react'

import { sendAnalyticsClickEvent, extractChildrenContent } from '../../_utils/analytics'
import { BUTTON_CLASS_PREFIX } from '../button'

const ICON_BUTTON_CLASS_PREFIX = 'condo-icon-btn'

type CondoIconButtonProps = {
    focus?: boolean
    size?: 'small' | 'medium'
    pressed?: boolean
}

export type IconButtonProps = Omit<DefaultButtonProps, 'shape' | 'size' | 'style' | 'ghost' | 'type' | 'prefix' | 'prefixCls' | 'icon' | 'danger' | 'block'>
& CondoIconButtonProps

const IconButton: React.ForwardRefExoticComponent<IconButtonProps & React.RefAttributes<HTMLButtonElement>> = React.forwardRef((props, ref) => {
    const { className, children, onClick, id, focus, size, pressed, ...rest } = props
    const mergedSize = size || 'medium'
    const ariaLabel = rest['aria-label']
    const classes = classNames(
        {
            [BUTTON_CLASS_PREFIX]: true,
            [`${ICON_BUTTON_CLASS_PREFIX}-pressed`]: pressed,
            [`${ICON_BUTTON_CLASS_PREFIX}-focus`]: focus,
            [`${ICON_BUTTON_CLASS_PREFIX}-${mergedSize}`]: mergedSize,
        },
        className,
    )

    const wrappedContent = children
        ? <span className={`${ICON_BUTTON_CLASS_PREFIX}-content`}>{children}</span>
        : null

    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement> & React.MouseEvent<HTMLAnchorElement>) => {
        const stringContent = extractChildrenContent(children) || ariaLabel
        if (stringContent || id) {
            sendAnalyticsClickEvent('IconButton', { value: stringContent, id })
        }

        if (onClick) {
            onClick(event)
        }
    }, [ariaLabel, children, id, onClick])

    return (
        <DefaultButton
            {...rest}
            id={id}
            icon={wrappedContent}
            prefixCls={ICON_BUTTON_CLASS_PREFIX}
            className={classes}
            ref={ref}
            type='default'
            onClick={handleClick}
        />
    )
})

IconButton.displayName = 'IconButton'

export {
    IconButton,
}
