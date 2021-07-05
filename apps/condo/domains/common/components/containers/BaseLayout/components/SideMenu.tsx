/** @jsx jsx */
import { jsx } from '@emotion/core'
import { Drawer, Layout, Typography, Space } from 'antd'
import get from 'lodash/get'
import React, { useCallback } from 'react'
import { useRouter } from 'next/router'
import classnames from 'classnames'
import Link from 'next/link'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import {
    ItemContainer,
    MenuItem,
    SIDE_MENU_WIDTH,
    sideMenuDesktopCss,
    sideMenuMobileCss,
    substrateDesktopCss,
} from './styles'
import { Logo } from '@condo/domains/common/components/Logo'
import { Button } from '@condo/domains/common/components/Button'
import { PlusCircleFilled } from '@ant-design/icons'

const MenuItems = (props) => {
    const router = useRouter()
    const intl = useIntl()

    const isItemActive = useCallback((path) => {
        if (path === '/') {
            return router.route === path
        }

        return router.route.includes(path)
    }, [router])

    return (
        props.menuData
            ? (
                <ItemContainer>
                    {
                        props.menuData.map((item) => {
                            if (item.hideInMenu) {
                                return null
                            }

                            const Icon = item.icon

                            const menuItemClassNames = classnames({
                                'active': isItemActive(item.path),
                            })

                            return (
                                <Link href={item.path} key={item.path}>
                                    <MenuItem className={menuItemClassNames}>
                                        <Icon className='icon' />
                                        <Typography.Text className='label'>
                                            {intl.formatMessage({ id: item.locale })}
                                        </Typography.Text>
                                    </MenuItem>
                                </Link>
                            )
                        })
                    }
                </ItemContainer>
            )
            : null
    )
}

type MenuItem = {
    hideInMenu: boolean
    locale: boolean
    name: string
    icon: React.ElementType
    path: string
}

interface ISideMenuProps {
    onLogoClick: (...args) => void
    menuData: Array<MenuItem>,
    localeRender: (...args) => React.ElementType
    onClickMenuItem: (...args) => void
    isMobile: boolean
    isSideMenuCollapsed: boolean
    toggleSideMenuCollapsed: (...args) => void
}

const TicketCreateButton = () => {
    const intl = useIntl()

    return (
        <Link href={'/ticket/create'} >
            <a>
                <Button type='sberDefault' >
                    <PlusCircleFilled />
                    {intl.formatMessage({ id: 'CreateTicket' })}
                </Button>
            </a>
        </Link>
    )
}

export const SideMenu: React.FC<ISideMenuProps> = (props) => {
    const { onLogoClick, menuData, isMobile, isSideMenuCollapsed, toggleSideMenuCollapsed } = props
    const organization = useOrganization()
    const isEmployeeBlocked = get(organization, ['link', 'isBlocked'], false)

    if (isEmployeeBlocked) {
        return null
    }

    const MobileSideNav = (
        <Drawer
            closable={false}
            visible={!isSideMenuCollapsed}
            placement='left'
            style={{
                padding: 0,
                height: '100vh',
            }}
            width={SIDE_MENU_WIDTH}
            bodyStyle={{ height: '100vh', padding: 0 }}
            className='side-menu'
            onClose={toggleSideMenuCollapsed}
        >
            <Layout.Sider
                theme='light'
                css={sideMenuMobileCss}
                width={SIDE_MENU_WIDTH}
                onCollapse={toggleSideMenuCollapsed}
            >
                <Logo onClick={onLogoClick} />
                <Space size={60} direction={'vertical'}>
                    <MenuItems menuData={menuData} />
                    <TicketCreateButton />
                </Space>
            </Layout.Sider>
        </Drawer>
    )

    const DesktopSideNav = (
        <>
            <Layout.Sider
                theme='light'
                css={sideMenuDesktopCss}
                width={SIDE_MENU_WIDTH}
                onCollapse={toggleSideMenuCollapsed}
                className='side-menu'
            >
                <Logo onClick={onLogoClick} />
                <Space size={60} direction={'vertical'}>
                    <MenuItems menuData={menuData} />
                    <TicketCreateButton />
                </Space>
            </Layout.Sider>
            {menuData && <div css={substrateDesktopCss} className='side-menu-substrate' />}
        </>
    )

    return isMobile ? MobileSideNav : DesktopSideNav
}