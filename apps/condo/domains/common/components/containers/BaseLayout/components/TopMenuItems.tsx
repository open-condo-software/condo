import React from 'react'
import { Space } from 'antd'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import { OrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'
import { useOrganizationInvites } from '@condo/domains/organization/hooks/useOrganizationInvites'
import { UserMenu } from '@condo/domains/user/components/UserMenu'
import { ServiceSubscriptionIndicator } from '@condo/domains/subscription/components/ServiceSubscriptionIndicator'

export const TopMenuItems: React.FC = () => {
    const auth = useAuth()
    const { isLoading } = useOrganization()
    const { loading: isInvitesLoading } = useOrganizationInvites()

    if (!isLoading && !auth.isLoading && !isInvitesLoading) {
        return (
            <Space direction={'horizontal'} size={24}>
                <ServiceSubscriptionIndicator/>
                <OrganizationSelect/>
                <UserMenu/>
            </Space>
        )
    }

    return null
}
