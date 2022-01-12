import styled from '@emotion/styled'
import { Space, Typography } from 'antd'
import classnames from 'classnames'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { colors } from '../constants/style'
import { transitions } from '@condo/domains/common/constants/style'
import { ClientRenderedIcon } from './icons/ClientRenderedIcon'
import { Tooltip } from './Tooltip'

const IconWrapper = styled.div``

interface IMenuItemWrapperProps {
    padding?: string
    isCollapsed?: boolean
    labelFontSize?: string
}

const MenuItemWrapper = styled.span<IMenuItemWrapperProps>`
    cursor: pointer;
    padding: ${(props) => (props.padding ? props.padding : '12px 0')};
    display: flex;
    border-radius: 8px;
    flex-direction: row;
    align-items: center;
    justify-content: ${({ isCollapsed }) => (isCollapsed ? 'center' : 'flex-start')};
    vertical-align: center;

    .label {
        font-size: ${(props) => (props.labelFontSize ? props.labelFontSize : '16px')};
        transition: ${transitions.allDefault};
        white-space: nowrap;
    }

    .icon {
        color: ${colors.lightGrey[5]};
        font-size: 20px;
        transition: ${transitions.allDefault};
    }

    &:hover {
        .icon {
            color: ${colors.black};
        }
    }

    &.active {
        .label {
            font-weight: 700;
        }

        .icon {
            color: ${colors.black};
        }
    }

    &.disabled {
        opacity: 0.4;
        pointer-events: none;
    }
`

interface IMenuItemProps {
    path: string
    icon: React.ElementType
    label: string
    disabled?: boolean
    hideInMenu?: boolean
    menuItemWrapperProps?: IMenuItemWrapperProps
    isCollapsed?: boolean
}

export const MenuItem: React.FC<IMenuItemProps> = (props) => {
    const { path, icon, label, hideInMenu, disabled, menuItemWrapperProps, isCollapsed } = props
    const { route } = useRouter()
    const intl = useIntl()

    const [isActive, setIsActive] = useState(false)

    useEffect(() => {
        setIsActive(path === '/' ? route === path : route.includes(path))
    }, [route, path])

    if (hideInMenu) {
        return null
    }

    const Message = intl.formatMessage({ id: label })

    const menuItemClassNames = classnames({
        active: isActive,
        disabled: disabled,
    })

    if (isCollapsed) {
        return (
            <Link href={path}>
                <a>
                    <MenuItemWrapper className={menuItemClassNames} isCollapsed {...menuItemWrapperProps}>
                        <Tooltip title={Message} placement={'right'} color={colors.black} textColor={colors.white}>
                            <IconWrapper className="icon">
                                <ClientRenderedIcon icon={icon} />
                            </IconWrapper>
                        </Tooltip>
                    </MenuItemWrapper>
                </a>
            </Link>
        )
    }

    return (
        <Link href={path}>
            <a>
                <MenuItemWrapper className={menuItemClassNames} {...menuItemWrapperProps}>
                    <Space size={14}>
                        <IconWrapper className="icon">
                            <ClientRenderedIcon icon={icon} />
                        </IconWrapper>
                        <Typography.Text className="label">{Message}</Typography.Text>
                    </Space>
                </MenuItemWrapper>
            </a>
        </Link>
    )
}
