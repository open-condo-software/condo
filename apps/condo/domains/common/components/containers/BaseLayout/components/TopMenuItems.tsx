import React from 'react'
import { Space } from 'antd'
import { useAuth } from '@core/next/auth'
import { UserMenu } from '@condo/domains/user/components/UserMenu'
import { useOrganization } from '@core/next/organization'
import { OrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'
import { useOrganizationInvites } from '@condo/domains/organization/hooks/useOrganizationInvites'
import { ServiceSubscriptionIndicator } from '@condo/domains/subscription/components/ServiceSubscriptionIndicator'

export interface ITopMenuItemsProps {
    headerAction?: React.ElementType
}

export const TopMenuItems: React.FC<ITopMenuItemsProps> = (props) => {
    const auth = useAuth()
    const { isLoading } = useOrganization()
    const { loading: isInvitesLoading } = useOrganizationInvites()

    if (!isLoading && !auth.isLoading && !isInvitesLoading) {
        return (
            <>
                {props.headerAction && props.headerAction}
                <Space direction={'horizontal'} size={40} style={{ marginLeft: 'auto' }}>
                    <ServiceSubscriptionIndicator/>
                    <OrganizationSelect/>
                    <UserMenu/>
                </Space>
            </>
        )
    }
    return null
}
