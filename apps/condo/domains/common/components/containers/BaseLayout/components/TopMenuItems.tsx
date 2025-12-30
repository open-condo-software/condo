import React from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { Space } from '@open-condo/ui'

import { UserMessagesList } from '@condo/domains/notification/components/UserMessagesList'
import { InlineOrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'
import { SBBOLIndicator } from '@condo/domains/organization/components/SBBOLIndicator'
import { SubscriptionDaysIndicator, UpgradePlanButton } from '@condo/domains/subscription/components'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'
import { UserMenu } from '@condo/domains/user/components/UserMenu'


export interface ITopMenuItemsProps {
    headerAction?: React.ElementType
}

export const TopMenuItems: React.FC<ITopMenuItemsProps> = (props) => {
    const auth = useAuth()
    const { organization } = useOrganization()
    const { hasSubscription } = useOrganizationSubscription()

    if (auth.isLoading) return null

    return (
        <>
            {props.headerAction ? props.headerAction : null}
            <Space direction='horizontal' size={40} className='top-menu-items'>
                <UpgradePlanButton />
                <SubscriptionDaysIndicator />
                <Space size={12}>
                    <SBBOLIndicator organization={organization} />
                    <InlineOrganizationSelect />
                </Space>
                <UserMenu />
                <div style={{ maxHeight: '24px' }}>
                    <UserMessagesList disabled={!hasSubscription} />
                </div>
            </Space>
        </>
    )
}
