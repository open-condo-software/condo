/** @jsx jsx */
import { jsx } from '@emotion/core'
import { Layout } from 'antd'
import get from 'lodash/get'
import React from 'react'
import { useOrganization } from '@core/next/organization'
import { useResponsive } from '@condo/domains/common/hooks/useResponsive'
import { ResidentActions } from '@condo/domains/common/components/ResidentActions/ResidentActions'
import { Logo } from '@condo/domains/common/components/Logo'
import {
    MenuItemsContainer,
    SIDE_MENU_WIDTH,
    sideMenuDesktopCss,
    substrateDesktopCss,
} from './styles'

import { ServiceSubscriptionIndicator } from '@condo/domains/subscription/components/ServiceSubscriptionIndicator'

interface ISideMenuProps {
    onLogoClick: (...args) => void
    menuData?: React.ElementType
}

export const SideMenu: React.FC<ISideMenuProps> = (props) => {
    const { onLogoClick, menuData } = props
    const { link } = useOrganization()
    const { isSmall } = useResponsive()
    const isEmployeeBlocked = get(link, 'isBlocked', false)

    if (isEmployeeBlocked) {
        return null
    }

    // TODO: (Dimitreee) implement mobile nav later
    if (isSmall) {
        return null
    }

    return (
        <>
            <Layout.Sider
                theme='light'
                css={sideMenuDesktopCss}
                width={SIDE_MENU_WIDTH}
                className='side-menu'
            >
                <Logo onClick={onLogoClick} />
                <MenuItemsContainer>
                    <ResidentActions/>
                    <MenuItemsContainer>
                        {menuData}
                    </MenuItemsContainer>
                </MenuItemsContainer>
                <ServiceSubscriptionIndicator/>
            </Layout.Sider>
            {menuData && <div css={substrateDesktopCss} className='side-menu-substrate' />}
        </>
    )
}
