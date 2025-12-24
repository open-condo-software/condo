import { useApolloClient } from '@apollo/client'
import { GetActualOrganizationEmployeesDocument } from '@app/condo/gql'
import { OrganizationTypeType } from '@app/condo/schema'
import { Layout } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { Menu } from '@open-condo/icons'
import { useMutation } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { Space } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Logo } from '@condo/domains/common/components/Logo'
import { ResidentActions } from '@condo/domains/common/components/ResidentActions/ResidentActions'
import { UserMessagesList } from '@condo/domains/notification/components/UserMessagesList'
import { UserMessagesListContextProvider } from '@condo/domains/notification/contexts/UserMessagesListContext'
import { InlineOrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'
import { SBBOLIndicator } from '@condo/domains/organization/components/SBBOLIndicator'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'
import { ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION } from '@condo/domains/organization/gql'
import { useOrganizationEmployeeRequests } from '@condo/domains/organization/hooks/useOrganizationEmployeeRequests'
import { useOrganizationInvites } from '@condo/domains/organization/hooks/useOrganizationInvites'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'
import { UserMenu } from '@condo/domains/user/components/UserMenu'

import { ITopMenuItemsProps, TopMenuItems } from './components/TopMenuItems'

const ORGANIZATION_TYPES: Array<OrganizationTypeType> = [OrganizationTypeType.ManagingCompany, OrganizationTypeType.ServiceProvider]

interface IHeaderProps {
    headerAction?: React.ElementType
    TopMenuItems?: React.FC<ITopMenuItemsProps>
}

export const Header: React.FC<IHeaderProps> = (props) => {
    const client = useApolloClient()
    const { toggleCollapsed, isMobileView } = useLayoutContext()
    const router = useRouter()

    const { isAuthenticated } = useAuth()
    const { organization } = useOrganization()
    const { hasSubscription } = useOrganizationSubscription()

    const hasAccessToAppeals = get(organization, 'type', MANAGING_COMPANY_TYPE) !== SERVICE_PROVIDER_TYPE
    const organizationIdsToFilterMessages = useMemo(() => [organization?.id], [organization?.id])

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
    const { ChooseEmployeeRoleModal } = useOrganizationEmployeeRequests()

    const handleLogoClick = useCallback(() => {
        if (isAuthenticated) {
            router.push('/')
        } else {
            router.push('/auth')
        }
    }, [isAuthenticated, router])

    return (
        <UserMessagesListContextProvider disabled={!hasSubscription} organizationIdsToFilter={organizationIdsToFilterMessages}>
            {ChooseEmployeeRoleModal}
            {
                isMobileView ?
                    <>
                        <div id='tasks-container' className='tasks-container' />
                        <Layout.Header className='header mobile-header'>
                            <div className='context-bar'>
                                <UserMessagesList disabled={!hasSubscription} />
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
                    </> :
                    <Layout.Header className='header desktop-header'>
                        <TopMenuItems headerAction={props.headerAction}/>
                    </Layout.Header>

            }
        </UserMessagesListContextProvider>
    )
}
