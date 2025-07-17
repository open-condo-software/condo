import classnames from 'classnames'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useIntl } from '@open-condo/next/intl'
import { Space, Typography, Tooltip } from '@open-condo/ui'

import { analytics } from '@condo/domains/common/utils/analytics'
import { renderLink } from '@condo/domains/common/utils/Renders'
import { getEscaped } from '@condo/domains/common/utils/string.utils'
import { INoOrganizationToolTipWrapper } from '@condo/domains/onboarding/hooks/useNoOrganizationToolTip'

import styles from './MenuItem.module.css'


interface IMenuItemWrapperProps {
    padding?: string
    isCollapsed?: boolean
    labelFontSize?: string
    className?: string
}

interface IMenuItemProps {
    id: string
    path?: string
    icon: React.ElementType
    label: string
    labelRaw?: true
    disabled?: boolean
    hideInMenu?: boolean
    menuItemWrapperProps?: IMenuItemWrapperProps
    isCollapsed?: boolean
    onClick?: () => void
    excludePaths?: Array<RegExp>

    toolTipDecorator? (params: INoOrganizationToolTipWrapper): JSX.Element
}

const addToolTipForCollapsedMenu = (content: JSX.Element, Message: string) => (
    <Tooltip title={<Typography.Paragraph size='medium'>{Message}</Typography.Paragraph>} placement='right'>
        {content}
    </Tooltip>
)

export const MenuItem: React.FC<IMenuItemProps> = (props) => {
    const {
        id,
        path,
        icon: Icon,
        label,
        hideInMenu,
        disabled,
        menuItemWrapperProps = {},
        isCollapsed,
        toolTipDecorator = null,
        onClick,
        excludePaths = [],
        labelRaw,
    } = props
    const router = useRouter()
    const asPath = router.asPath
    const intl = useIntl()
    const { className: wrapperClassName, ...restWrapperProps } = menuItemWrapperProps

    const [isActive, setIsActive] = useState(false)

    useDeepCompareEffect(() => {
        const escapedPath = path ? getEscaped(path) : undefined
        // not a ReDoS issue: running on end user browser
        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
        const regex = new RegExp(`^${escapedPath}`)
        setIsActive(path === '/'
            ? asPath === path
            : regex.test(asPath) && excludePaths.every(exPath => !exPath.test(asPath)))
    }, [path, asPath, excludePaths])

    const handleClick: React.MouseEventHandler<HTMLDivElement> = useCallback(() => {
        analytics.track('click', { component: 'MenuItem', id, location: window.location.href })
        onClick?.()
    }, [id, onClick])

    if (hideInMenu) {
        return null
    }

    const Message = labelRaw
        ? label
        : intl.formatMessage({ id: label as FormatjsIntl.Message['ids'] })

    const linkContent = (
        <Space size={12} align='center' direction='horizontal' className={styles.menuItem}>
            <Icon size='medium' />
            {!isCollapsed && (<div>
                <Typography.Title ellipsis={{ rows: 2 }} level={5}>
                    {Message}
                </Typography.Title>
            </div>)}
        </Space>
    )

    const menuItemIdProp = id ? { id: id } : {}

    const menuItemClassName = classnames(
        styles.menuItemWrapper,
        {
            [styles.active]: isActive,
            [styles.disabled]: disabled,
        },
        wrapperClassName,
    )

    const menuItem = (
        <div
            onClick={handleClick}
            className={menuItemClassName}
            {...menuItemIdProp}
            {...restWrapperProps}
        >
            {
                (isCollapsed && !disabled)
                    ? addToolTipForCollapsedMenu(linkContent, Message)
                    : linkContent
            }
        </div>
    )

    const nextjsLink = !path || disabled ? menuItem : renderLink(menuItem, path, false)

    return toolTipDecorator ? toolTipDecorator({ element: nextjsLink, placement: 'right' }) : nextjsLink
}
