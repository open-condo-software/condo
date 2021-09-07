/** @jsx jsx */
import { jsx } from '@emotion/core'
import { Drawer, Layout, Space } from 'antd'
import get from 'lodash/get'
import React from 'react'
import Link from 'next/link'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { MenuItemsContainer, SIDE_MENU_WIDTH, sideMenuDesktopCss, sideMenuMobileCss, substrateDesktopCss } from './styles'
import { Logo } from '@condo/domains/common/components/Logo'
import { Button } from '@condo/domains/common/components/Button'
import { PlusCircleFilled } from '@ant-design/icons'

interface ISideMenuProps {
    isMobile: boolean
    onLogoClick: (...args) => void
    isSideMenuCollapsed: boolean
    toggleSideMenuCollapsed: (...args) => void
    menuData?: React.ElementType
}

interface ITicketCreateButton {
    disabled: boolean
}

const TicketCreateButton: React.FC<ITicketCreateButton> = ({ disabled }) => {
    const intl = useIntl()

    return (
        <Link href={'/ticket/create'}>
            <a>
                <Button type="sberDefault" disabled={disabled}>
                    <PlusCircleFilled />
                    {intl.formatMessage({ id: 'CreateTicket' })}
                </Button>
            </a>
        </Link>
    )
}

export const SideMenu: React.FC<ISideMenuProps> = (props) => {
    const { onLogoClick, menuData, isMobile, isSideMenuCollapsed, toggleSideMenuCollapsed } = props
    const { link } = useOrganization()
    const isEmployeeBlocked = get(link, 'isBlocked', false)

    if (isEmployeeBlocked) {
        return null
    }

    const MobileSideNav = (
        <Drawer
            closable={false}
            visible={!isSideMenuCollapsed}
            placement="left"
            style={{
                padding: 0,
                height: '100vh',
            }}
            width={SIDE_MENU_WIDTH}
            bodyStyle={{ height: '100vh', padding: 0 }}
            className="side-menu"
            onClose={toggleSideMenuCollapsed}
        >
            <Layout.Sider theme="light" css={sideMenuMobileCss} width={SIDE_MENU_WIDTH} onCollapse={toggleSideMenuCollapsed}>
                <Logo onClick={onLogoClick} />
                <Space size={60} direction={'vertical'}>
                    <MenuItemsContainer>{menuData}</MenuItemsContainer>
                    <TicketCreateButton disabled={!link} />
                </Space>
            </Layout.Sider>
        </Drawer>
    )

    const DesktopSideNav = (
        <>
            <Layout.Sider
                theme="light"
                css={sideMenuDesktopCss}
                width={SIDE_MENU_WIDTH}
                onCollapse={toggleSideMenuCollapsed}
                className="side-menu"
            >
                <Logo onClick={onLogoClick} />
                <Space size={60} direction={'vertical'}>
                    <MenuItemsContainer>{menuData}</MenuItemsContainer>
                    <TicketCreateButton disabled={!link} />
                </Space>
            </Layout.Sider>
            {menuData && <div css={substrateDesktopCss} className="side-menu-substrate" />}
        </>
    )

    return isMobile ? MobileSideNav : DesktopSideNav
}
