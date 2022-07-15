/** @jsx jsx */
import { jsx, css } from '@emotion/react'
import { Layout } from 'antd'
import get from 'lodash/get'
import React from 'react'
import { useOrganization } from '@core/next/organization'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { ResidentActions } from '@condo/domains/common/components/ResidentActions/ResidentActions'
import { ServiceSubscriptionIndicator } from '@condo/domains/subscription/components/ServiceSubscriptionIndicator'
import { Logo } from '@condo/domains/common/components/Logo'
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
import { ArrowIconLeft, ArrowIconRight } from '../../../../icons/ArrowIcons'

interface ISideNavProps {
    onLogoClick: (...args) => void
    menuData?: React.ElementType
}

const sideNavButtonCss = css`
    &.ant-btn {
        border-color: transparent;!IMPORTANT
        border-radius: 10px;
    }
`

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
                        css={sideNavButtonCss}
                        size={'small'}
                        icon={isCollapsed ? <ArrowIconRight/> : <ArrowIconLeft/> }
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
