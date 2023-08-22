import { Layout } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { Menu } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { Space } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Logo } from '@condo/domains/common/components/Logo'
import { ResidentActions } from '@condo/domains/common/components/ResidentActions/ResidentActions'
import { InlineOrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'
import { SBBOLIndicator } from '@condo/domains/organization/components/SBBOLIndicator'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'
import { useOrganizationInvites } from '@condo/domains/organization/hooks/useOrganizationInvites'
import { UserMenu } from '@condo/domains/user/components/UserMenu'

import { ITopMenuItemsProps, TopMenuItems } from './components/TopMenuItems'

interface IHeaderProps {
    headerAction?: React.ElementType
    TopMenuItems?: React.FC<ITopMenuItemsProps>
}

export const Header: React.FC<IHeaderProps> = (props) => {
    const { breakpoints, toggleCollapsed } = useLayoutContext()
    const router = useRouter()
    const { isAuthenticated } = useAuth()

    const { organization } = useOrganization()

    const hasAccessToAppeals = get(organization, 'type', MANAGING_COMPANY_TYPE) !== SERVICE_PROVIDER_TYPE

    useOrganizationInvites()

    const handleLogoClick = useCallback(() => {
        if (isAuthenticated) {
            router.push('/')
        } else {
            router.push('/auth/signin')
        }
    }, [isAuthenticated, router])

    return (
        !breakpoints.TABLET_LARGE
            ? (
                <Layout.Header className='header mobile-header'>
                    <div className='context-bar'>
                        <Space direction='horizontal' size={4}>
                            <SBBOLIndicator organization={organization} />
                            <InlineOrganizationSelect/>
                        </Space>
                        <UserMenu/>
                    </div>
                    <div className='appeals-bar'>
                        <Menu size='large' onClick={toggleCollapsed}/>
                        <Logo onClick={handleLogoClick} minified/>
                        <div>
                            {hasAccessToAppeals && (
                                <ResidentActions minified/>
                            )}
                        </div>
                    </div>
                </Layout.Header>
            )
            : (
                <Layout.Header className='header desktop-header'>
                    <TopMenuItems headerAction={props.headerAction}/>
                </Layout.Header>
            )
    )
}
