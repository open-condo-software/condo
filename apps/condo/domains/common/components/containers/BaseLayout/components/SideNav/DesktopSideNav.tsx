import { Layout } from 'antd'
import get from 'lodash/get'
import React from 'react'

import { ChevronLeft, ChevronRight } from '@open-condo/icons'
import { useOrganization } from '@open-condo/next/organization'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Logo } from '@condo/domains/common/components/Logo'
import { ResidentActions } from '@condo/domains/common/components/ResidentActions/ResidentActions'
import { SERVICE_PROVIDER_TYPE, MANAGING_COMPANY_TYPE } from '@condo/domains/organization/constants/common'
import { ServiceSubscriptionIndicator } from '@condo/domains/subscription/components/ServiceSubscriptionIndicator'

import {
    SIDE_MENU_WIDTH,
    COLLAPSED_SIDE_MENU_WIDTH,
} from '../styles'

interface ISideNavProps {
    onLogoClick: (...args) => void
    menuData?: React.ElementType
}

export const DesktopSideNav: React.FC<ISideNavProps> = (props) => {
    const { onLogoClick, menuData } = props
    const { link, organization } = useOrganization()

    const hasAccessToAppeals = get(organization, 'type', MANAGING_COMPANY_TYPE) !== SERVICE_PROVIDER_TYPE

    const { breakpoints, toggleCollapsed, isCollapsed } = useLayoutContext()

    const isEmployeeBlocked = get(link, 'isBlocked', false)

    if (isEmployeeBlocked) {
        return null
    }

    // TODO: (Dimitreee) implement mobile nav later
    if (!breakpoints.TABLET_LARGE) {
        return null
    }

    return (
        <>
            <Layout.Sider
                collapsed={isCollapsed}
                theme='light'
                className='menu desktop-menu desktop-sider'
                width={SIDE_MENU_WIDTH}
                collapsedWidth={COLLAPSED_SIDE_MENU_WIDTH}
            >
                <div className='logo-container'>
                    <Logo onClick={onLogoClick} minified={isCollapsed}/>
                </div>
                <div className='expand-button' onClick={toggleCollapsed}>
                    {isCollapsed ? <ChevronRight size='small'/> : <ChevronLeft size='small'/>}
                </div>
                {hasAccessToAppeals && (
                    <div className='actions-container'>
                        <ResidentActions minified={isCollapsed}/>
                    </div>
                )}
                <div className='menu-items-container'>
                    {menuData}
                </div>
                <ServiceSubscriptionIndicator/>
            </Layout.Sider>
            <Layout.Sider
                className='desktop-sider'
                collapsed={isCollapsed}
                width={SIDE_MENU_WIDTH}
                collapsedWidth={COLLAPSED_SIDE_MENU_WIDTH}
            />
        </>
    )
}
