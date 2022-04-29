/** @jsx jsx */
import { CloseOutlined } from '@ant-design/icons'
import { jsx } from '@emotion/core'
import { Layout } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect } from 'react'
import { useOrganization } from '@core/next/organization'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { ServiceSubscriptionIndicator } from '@condo/domains/subscription/components/ServiceSubscriptionIndicator'
import { OrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'
import {
    MobileMenuItemsContainer,
    MOBILE_SIDE_NAV_STYLES,
    MobileSideNavHeader,
    OrganizationSelectWrapper,
} from '../styles'

interface ISideNavProps {
    menuData?: React.ElementType
}

export const MobileSideNav: React.FC<ISideNavProps> = (props) => {
    const { menuData } = props
    const { link } = useOrganization()
    const { toggleCollapsed, isCollapsed } = useLayoutContext()
    const router = useRouter()

    const hideSideNav = useCallback(() => {
        if (!isCollapsed) {
            toggleCollapsed()
        }
    }, [isCollapsed])

    useEffect(() => {
        router.events.on('routeChangeComplete', hideSideNav)

        return () => {
            router.events.off('routeChangeComplete', hideSideNav)
        }
    }, [router])


    if (get(link, 'isBlocked', false)) {
        return null
    }

    return (
        <Layout.Sider
            collapsed={isCollapsed}
            theme='light'
            css={MOBILE_SIDE_NAV_STYLES}
            width={'100%'}
            collapsedWidth={0}
        >
            <MobileSideNavHeader>
                <CloseOutlined onClick={toggleCollapsed}/>
                <OrganizationSelectWrapper>
                    <OrganizationSelect/>
                </OrganizationSelectWrapper>
            </MobileSideNavHeader>
            <MobileMenuItemsContainer>
                {menuData}
            </MobileMenuItemsContainer>
        </Layout.Sider>
    )
}
