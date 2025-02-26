import { useApolloClient } from '@apollo/client'
import { GetActualOrganizationEmployeesDocument } from '@app/condo/gql'
import { OrganizationTypeType } from '@app/condo/schema'
import { Layout } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Menu } from '@open-condo/icons'
import { useMutation } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { Space } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Logo } from '@condo/domains/common/components/Logo'
import { ResidentActions } from '@condo/domains/common/components/ResidentActions/ResidentActions'
import { PLATFORM_NOTIFICATIONS } from '@condo/domains/common/constants/featureflags'
import { UserMessagesList } from '@condo/domains/notification/components/UserMessagesList'
import { UserMessagesListContextProvider } from '@condo/domains/notification/contexts/UserMessagesListContext'
import { InlineOrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'
import { SBBOLIndicator } from '@condo/domains/organization/components/SBBOLIndicator'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'
import { ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION } from '@condo/domains/organization/gql'
import { useOrganizationInvites } from '@condo/domains/organization/hooks/useOrganizationInvites'
import { UserMenu } from '@condo/domains/user/components/UserMenu'

import { ITopMenuItemsProps, TopMenuItems } from './components/TopMenuItems'


const ORGANIZATION_TYPES: Array<OrganizationTypeType> = [OrganizationTypeType.ManagingCompany, OrganizationTypeType.ServiceProvider]

interface IHeaderProps {
    headerAction?: React.ElementType
    TopMenuItems?: React.FC<ITopMenuItemsProps>
}

export const Header: React.FC<IHeaderProps> = (props) => {
    const client = useApolloClient()
    const { breakpoints, toggleCollapsed } = useLayoutContext()
    const { useFlag } = useFeatureFlags()
    const router = useRouter()

    const { isAuthenticated } = useAuth()
    const { organization } = useOrganization()

    const hasAccessToAppeals = get(organization, 'type', MANAGING_COMPANY_TYPE) !== SERVICE_PROVIDER_TYPE

    const [acceptOrReject] = useMutation(ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION, {
        onCompleted: async (result) => {
            const isAcceptedInvite = result?.obj
                && result.obj.isAccepted
                && !result.obj.isBlocked
                && !result.obj.isRejected
                && [OrganizationTypeType.ManagingCompany, OrganizationTypeType.ServiceProvider].includes(result.obj.organization.type)

            if (isAcceptedInvite) {
                await client.refetchQueries({
                    include: [GetActualOrganizationEmployeesDocument],
                })
            }
        },
    })

    useOrganizationInvites(ORGANIZATION_TYPES, acceptOrReject)

    const handleLogoClick = useCallback(() => {
        if (isAuthenticated) {
            router.push('/')
        } else {
            router.push('/auth/signin')
        }
    }, [isAuthenticated, router])

    const isPlatformNotificationsFeatureEnabled = useFlag(PLATFORM_NOTIFICATIONS)

    if (isPlatformNotificationsFeatureEnabled) {
        return (
            <UserMessagesListContextProvider>
                {
                    !breakpoints.TABLET_LARGE
                        ? (
                            <>
                                <div id='tasks-container' className='tasks-container' />
                                <Layout.Header className='header mobile-header'>
                                    <div className='context-bar'>
                                        <UserMessagesList />
                                        <div className='organization-user-block'>
                                            <Space direction='horizontal' size={4}>
                                                <SBBOLIndicator organization={organization} />
                                                <InlineOrganizationSelect/>
                                            </Space>
                                            <UserMenu/>
                                        </div>
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
                            </>
                        )
                        : (
                            <Layout.Header className='header desktop-header'>
                                <TopMenuItems headerAction={props.headerAction}/>
                            </Layout.Header>
                        )
                }
            </UserMessagesListContextProvider>
        )
    }

    return (
        !breakpoints.TABLET_LARGE
            ? (
                <>
                    <div id='tasks-container' className='tasks-container' />
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
                </>
            )
            : (
                <Layout.Header className='header desktop-header'>
                    <TopMenuItems headerAction={props.headerAction}/>
                </Layout.Header>
            )
    )
}
