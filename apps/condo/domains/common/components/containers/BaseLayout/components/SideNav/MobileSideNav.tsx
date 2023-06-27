/** @jsx jsx */import { jsx } from '@emotion/react'
import { Layout } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect } from 'react'

import { Close } from '@open-condo/icons'
import { useOrganization } from '@open-condo/next/organization'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { OrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'

import {
    MobileMenuItemsContainer,
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
            className='menu mobile-menu'
            width='100%'
            collapsedWidth={0}
        >
            <MobileSideNavHeader>
                <Close size='medium' onClick={toggleCollapsed}/>
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
