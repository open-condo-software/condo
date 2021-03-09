/** @jsx jsx */
import { jsx } from '@emotion/core'
import { Drawer, Layout, Typography } from 'antd'
import React, { useCallback } from 'react'
import { useRouter } from 'next/router'
import classnames from 'classnames'
import Link from 'next/link'
import { useIntl } from '@core/next/intl'
import {
    ItemContainer,
    MenuItem,
    SIDE_MENU_WIDTH,
    sideMenuDesktopCss,
    sideMenuMobileCss,
    substrateDesktopCss,
} from './styles'
import { Logo } from '../../../components/Logo'

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
                                        <Icon className='icon'/>
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
    localeRender: (...args) =>  React.ElementType
    onClickMenuItem: (...args) => void
    isMobile: boolean
    isSideMenuCollapsed: boolean
    toggleSideMenuCollapsed: (...args) => void
}

export const SideMenu:React.FunctionComponent<ISideMenuProps> = (props) => {
    const { onLogoClick, menuData, isMobile, isSideMenuCollapsed, toggleSideMenuCollapsed } = props

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
                <Logo onClick={onLogoClick}/>
                <MenuItems menuData={menuData}/>
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
                <Logo onClick={onLogoClick}/>
                <MenuItems menuData={menuData}/>
            </Layout.Sider>
            {menuData && <div css={substrateDesktopCss} className='side-menu-substrate'/>}
        </>
    )

    return isMobile ? MobileSideNav : DesktopSideNav
}