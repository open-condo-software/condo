/** @jsx jsx */
import { CloseOutlined } from '@ant-design/icons'
import { jsx } from '@emotion/core'
import { Layout } from 'antd'
import get from 'lodash/get'
import React from 'react'
import { useOrganization } from '@core/next/organization'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { ServiceSubscriptionIndicator } from '@condo/domains/subscription/components/ServiceSubscriptionIndicator'
import { OrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'
import {
    MobileMenuItemsContainer,
    mobileSideNavStyles,
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

    const isEmployeeBlocked = get(link, 'isBlocked', false)

    if (isEmployeeBlocked) {
        return null
    }

    return (
        <Layout.Sider
            collapsed={isCollapsed}
            theme='light'
            css={mobileSideNavStyles}
            width={'100%'}
            collapsedWidth={0}
        >
            <MobileSideNavHeader>
                <CloseOutlined onClick={toggleCollapsed}/>
                <OrganizationSelectWrapper>
                    <OrganizationSelect/>
                </OrganizationSelectWrapper>
            </MobileSideNavHeader>
            <ServiceSubscriptionIndicator/>
            <MobileMenuItemsContainer>
                {menuData}
            </MobileMenuItemsContainer>
        </Layout.Sider>
    )
}
