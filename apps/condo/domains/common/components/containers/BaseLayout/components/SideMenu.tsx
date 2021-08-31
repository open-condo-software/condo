/** @jsx jsx */
import { jsx } from '@emotion/core'
import { Drawer, Layout, Space, Popover, Divider } from 'antd'
import get from 'lodash/get'
import React from 'react'
import Link from 'next/link'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import {
    MenuItemsContainer,
    SIDE_MENU_WIDTH,
    sideMenuDesktopCss,
    sideMenuMobileCss,
    substrateDesktopCss,
} from './styles'
import { Logo } from '@condo/domains/common/components/Logo'
import { Button } from '@condo/domains/common/components/Button'
import styled from '@emotion/styled'
import { AppealIcon } from '@condo/domains/common/components/icons/AppealIcon'
import { MeterIcon } from '@condo/domains/common/components/icons/MeterIcon'

interface ISideMenuProps {
    isMobile: boolean
    onLogoClick: (...args) => void
    isSideMenuCollapsed: boolean
    toggleSideMenuCollapsed: (...args) => void
    menuData?: React.ElementType
}

const ResidentAppealPopoverContentWrapper = styled.div`
  width: 216px;
  height: 107px;
  
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`

const AppealPopoverItem = styled.div`
  padding-left: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  & a {
    color: black;
    font-size: 14px;
  }
`

const ResidentAppealPopoverContent = () => {
    const intl = useIntl()
    const CreateAppealMessage = intl.formatMessage({ id: 'CreateAppeal' })
    const CreateMeterReadingMessage = intl.formatMessage({ id: 'CreateMeterReading' })

    return (
        <ResidentAppealPopoverContentWrapper>
            <Link href={'/ticket/create'}>
                <AppealPopoverItem>
                    <AppealIcon />
                    <a>{CreateAppealMessage}</a>
                </AppealPopoverItem>
            </Link>
            <Divider style={{ margin: 0 }}/>
            <Link href={'/meter/create'}>
                <AppealPopoverItem>
                    <MeterIcon />
                    <a>{CreateMeterReadingMessage}</a>
                </AppealPopoverItem>
            </Link>
        </ResidentAppealPopoverContentWrapper>
    )
}

const ResidentAppealPopover = () => {
    const intl = useIntl()
    return (
        <Popover
            content={ResidentAppealPopoverContent}
            placement={'bottom'}
        >
            <Button type='sberDefault'>
                {intl.formatMessage({ id: 'ResidentAppeal' })}
            </Button>
        </Popover>
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
                    <ResidentAppealPopover/>
                    <MenuItemsContainer>
                        {menuData}
                    </MenuItemsContainer>
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
                <MenuItemsContainer>
                    <ResidentAppealPopover/>
                    <MenuItemsContainer>
                        {menuData}
                    </MenuItemsContainer>
                </MenuItemsContainer>
            </Layout.Sider>
            {menuData && <div css={substrateDesktopCss} className='side-menu-substrate' />}
        </>
    )

    return isMobile ? MobileSideNav : DesktopSideNav
}
