import React from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { Space } from '@open-condo/ui'

import { PLATFORM_NOTIFICATIONS } from '@condo/domains/common/constants/featureflags'
import { UserMessagesList } from '@condo/domains/notification/components/UserMessagesList'
import { InlineOrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'
import { SBBOLIndicator } from '@condo/domains/organization/components/SBBOLIndicator'
import { ServiceSubscriptionIndicator } from '@condo/domains/subscription/components/ServiceSubscriptionIndicator'
import { UserMenu } from '@condo/domains/user/components/UserMenu'


export interface ITopMenuItemsProps {
    headerAction?: React.ElementType
}

export const TopMenuItems: React.FC<ITopMenuItemsProps> = (props) => {
    const auth = useAuth()
    const { organization } = useOrganization()

    const { useFlag } = useFeatureFlags()
    const isPlatformNotificationsFeatureEnabled = useFlag(PLATFORM_NOTIFICATIONS)

    if (auth.isLoading) return null

    return (
        <>
            {props.headerAction ? props.headerAction : null}
            <Space direction='horizontal' size={40} className='top-menu-items'>
                {isPlatformNotificationsFeatureEnabled && <UserMessagesList />}
                <Space size={12}>
                    <SBBOLIndicator organization={organization} />
                    <ServiceSubscriptionIndicator />
                    <InlineOrganizationSelect />
                </Space>
                <UserMenu />
            </Space>
        </>
    )
}
