import styled from '@emotion/styled'
import classnames from 'classnames'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import type { IconProps } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { transitions } from '@condo/domains/common/constants/style'
import { analytics } from '@condo/domains/common/utils/analytics'
import { renderLink } from '@condo/domains/common/utils/Renders'
import { getEscaped } from '@condo/domains/common/utils/string.utils'
import { INoOrganizationToolTipWrapper } from '@condo/domains/onboarding/hooks/useNoOrganizationToolTip'

import { useLayoutContext } from './LayoutContext'


interface IMenuItemWrapperProps {
    padding?: string
    isCollapsed?: boolean
    labelFontSize?: string
    className?: string
}

const MenuItemWrapper = styled.div<IMenuItemWrapperProps>`
  cursor: pointer;
  padding: ${props => props.padding ? props.padding : '12px 0'};
  display: flex;
  border-radius: 8px;
  flex-direction: row;
  align-items: center;
  justify-content: ${({ isCollapsed }) => isCollapsed ? 'center' : 'flex-start'};
  vertical-align: center;
  color: ${colors.gray['7']};
  
  &:hover,
  &.active {
    color: ${colors.black};
  }

  .condo-typography, 
  .icon {
    transition: ${transitions.allDefault};
  }
  
  .condo-typography {
    width: max-content;
  }

  // NOTE: Fix width to reduce flick effect on collapse / expand
  &.side:not(.width-full) {
    .condo-typography {
      width: 155px;
    }
  }

  &.disabled {
    opacity: 0.4;
  }
`

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
    <Tooltip title={Message} placement='right' overlayStyle={{ position: 'fixed' }}>
        {/* NOTE: Antd tooltip doesn't work with spans, so icons must have a div wrapper */}
        <div>
            {content}
        </div>
    </Tooltip>
)

const MenuItemIconProps: IconProps = {
    size: 'medium',
    className: 'icon',
}

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
    const { breakpoints } = useLayoutContext()
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

    const menuItemClassNames = classnames(wrapperClassName, {
        'side': breakpoints.TABLET_LARGE,
        'active': isActive,
        'disabled': disabled,
    })

    const linkContent = isCollapsed
        ? (
            <Icon {...MenuItemIconProps} />
        ) : (
            <Space size={12} align='center' direction='horizontal' className='menu-item'>
                <Icon {...MenuItemIconProps} />
                <Typography.Title ellipsis={{ rows: 2 }} level={5}>
                    {Message}
                </Typography.Title>
            </Space>
        )

    const menuItemIdProp = id ? { id: id } : {}

    const menuItem = (
        <MenuItemWrapper onClick={handleClick} className={menuItemClassNames} isCollapsed={isCollapsed} {...menuItemIdProp} {...restWrapperProps}>
            {(isCollapsed && !disabled) ? addToolTipForCollapsedMenu(linkContent, Message) : linkContent}
        </MenuItemWrapper>
    )

    const nextjsLink = !path || disabled ? menuItem : renderLink(menuItem, path, false)

    return toolTipDecorator ? toolTipDecorator({ element: nextjsLink, placement: 'right' }) : nextjsLink
}
