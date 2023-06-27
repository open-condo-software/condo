import styled from '@emotion/styled'
import classnames from 'classnames'
import { useRouter } from 'next/router'
import React, { useMemo, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import type { IconProps } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { transitions } from '@condo/domains/common/constants/style'
import { renderLink } from '@condo/domains/common/utils/Renders'
import { INoOrganizationToolTipWrapper } from '@condo/domains/onboarding/hooks/useNoOrganizationToolTip'

import { ClientRenderedIcon } from './icons/ClientRenderedIcon'
import { useLayoutContext } from './LayoutContext'
import { useTracking } from './TrackingContext'


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
    id?: string
    path?: string
    icon: React.ElementType
    label: string
    disabled?: boolean
    hideInMenu?: boolean
    menuItemWrapperProps?: IMenuItemWrapperProps
    isCollapsed?: boolean
    onClick?: () => void
    eventName?: string
    excludePaths?: Array<string>

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
        icon,
        label,
        hideInMenu,
        disabled,
        menuItemWrapperProps = {},
        isCollapsed,
        toolTipDecorator = null,
        onClick,
        eventName,
        excludePaths = [],
    } = props
    const { breakpoints } = useLayoutContext()
    const { asPath } = useRouter()
    const intl = useIntl()
    const { getTrackingWrappedCallback } = useTracking()
    const { className: wrapperClassName, ...restWrapperProps } = menuItemWrapperProps

    const [isActive, setIsActive] = useState(false)

    useDeepCompareEffect(() => {
        const escapedPath = path ? path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : undefined
        const regex = new RegExp(`^${escapedPath}`)
        setIsActive(path === '/'
            ? asPath === path
            : regex.test(asPath) && excludePaths.every(exPath => !asPath.includes(exPath)))
    }, [path, asPath, excludePaths])

    const handleClick = useMemo(
        () => getTrackingWrappedCallback(eventName, null, onClick),
        [eventName, getTrackingWrappedCallback, onClick]
    )

    if (hideInMenu) {
        return null
    }

    const Message = intl.formatMessage({ id: label })

    const menuItemClassNames = classnames(wrapperClassName, {
        'side': breakpoints.TABLET_LARGE,
        'active': isActive,
        'disabled': disabled,
    })

    const linkContent = isCollapsed
        ? (
            <ClientRenderedIcon icon={icon} iconProps={MenuItemIconProps}/>
        ) : (
            <Space size={12} align='center' direction='horizontal' className='menu-item'>
                <ClientRenderedIcon icon={icon} iconProps={MenuItemIconProps}/>
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
