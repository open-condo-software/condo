import styled from '@emotion/styled'
import classnames from 'classnames'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState } from 'react'

import type { IconProps } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { transitions } from '@condo/domains/common/constants/style'
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
  padding: ${props => props.padding ? props.padding : '18px 0'};
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

  &.active {
    .condo-typography {
      font-weight: 700;
    }
  }

  &.disabled {
    opacity: 0.4;
  }
`

interface IMenuItemProps {
    path?: string
    icon: React.ElementType
    label: string
    disabled?: boolean
    hideInMenu?: boolean
    menuItemWrapperProps?: IMenuItemWrapperProps
    isCollapsed?: boolean
    onClick?: () => void
    eventName?: string

    toolTipDecorator? (params: INoOrganizationToolTipWrapper): JSX.Element
}

const makeLink = (content: JSX.Element, path: string) => {
    return (
        <Link href={path}>
            <a>
                {content}
            </a>
        </Link>
    )
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
    } = props
    const { isSmall } = useLayoutContext()
    const { route } = useRouter()
    const intl = useIntl()
    const { getTrackingWrappedCallback } = useTracking()
    const { className: wrapperClassName, ...restWrapperProps } = menuItemWrapperProps

    const [isActive, setIsActive] = useState(false)

    useEffect(() => {
        const regex = new RegExp(`^${path}`)
        setIsActive(path === '/' ? route === path : regex.test(route))
    }, [route, path])

    const handleClick = useMemo(
        () => getTrackingWrappedCallback(eventName, null, onClick),
        [eventName, getTrackingWrappedCallback, onClick]
    )

    if (hideInMenu) {
        return null
    }

    const Message = intl.formatMessage({ id: label })

    const menuItemClassNames = classnames(wrapperClassName, {
        'side': !isSmall,
        'active': isActive,
        'disabled': disabled,
    })

    const linkContent = isCollapsed
        ? (
            <ClientRenderedIcon icon={icon} iconProps={MenuItemIconProps}/>
        ) : (
            <Space size={12} align='center' direction='horizontal'>
                <ClientRenderedIcon icon={icon} iconProps={MenuItemIconProps}/>
                <Typography.Paragraph ellipsis={{ rows: 2 }}>
                    {Message}
                </Typography.Paragraph>
            </Space>
        )

    const menuItem = (
        <MenuItemWrapper onClick={handleClick} className={menuItemClassNames} isCollapsed={isCollapsed} {...restWrapperProps}>
            {(isCollapsed && !disabled) ? addToolTipForCollapsedMenu(linkContent, Message) : linkContent}
        </MenuItemWrapper>
    )

    const nextjsLink = !path || disabled ? menuItem : makeLink(menuItem, path)

    return <div>{toolTipDecorator ? toolTipDecorator({ element: nextjsLink, placement: 'right' }) : nextjsLink}</div>
}
