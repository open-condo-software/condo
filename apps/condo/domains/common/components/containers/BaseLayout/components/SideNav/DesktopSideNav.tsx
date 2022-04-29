/** @jsx jsx */
import { jsx } from '@emotion/core'
import { Layout } from 'antd'
import get from 'lodash/get'
import React from 'react'
import { useOrganization } from '@core/next/organization'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { ResidentActions } from '@condo/domains/common/components/ResidentActions/ResidentActions'
import { ServiceSubscriptionIndicator } from '@condo/domains/subscription/components/ServiceSubscriptionIndicator'
import { Logo } from '@condo/domains/common/components/Logo'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button } from '../../../../Button'
import {
    LayoutTriggerWrapper,
    LogoContainer,
    SIDE_NAV_STYLES,
    ActionsContainer,
    MenuItemsContainer,
    SIDE_MENU_WIDTH,
    COLLAPSED_SIDE_MENU_WIDTH,
} from '../styles'

interface ISideNavProps {
    onLogoClick: (...args) => void
    menuData?: React.ElementType
}

export const DesktopSideNav: React.FC<ISideNavProps> = (props) => {
    const { onLogoClick, menuData } = props
    const { link } = useOrganization()
    const { isSmall, toggleCollapsed, isCollapsed } = useLayoutContext()

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
                collapsed={isCollapsed}
                theme='light'
                css={SIDE_NAV_STYLES}
                width={SIDE_MENU_WIDTH}
                collapsedWidth={COLLAPSED_SIDE_MENU_WIDTH}
            >
                <LogoContainer>
                    <Logo onClick={onLogoClick} minified={isCollapsed}/>
                </LogoContainer>
                <LayoutTriggerWrapper>
                    <Button
                        onClick={toggleCollapsed}
                        size={'small'}
                        shape={'circle'}
                        icon={isCollapsed ? <RightOutlined style={{ fontSize: '13px' }} /> : <LeftOutlined style={{ fontSize: '13px' }}/>}
                    />
                </LayoutTriggerWrapper>
                <ActionsContainer minified={isCollapsed}>
                    <ResidentActions minified={isCollapsed}/>
                </ActionsContainer>
                <MenuItemsContainer>
                    {menuData}
                </MenuItemsContainer>
                <ServiceSubscriptionIndicator/>
            </Layout.Sider>
            <Layout.Sider
                collapsed={isCollapsed}
                width={SIDE_MENU_WIDTH}
                collapsedWidth={COLLAPSED_SIDE_MENU_WIDTH}
            />
        </>
    )
}
