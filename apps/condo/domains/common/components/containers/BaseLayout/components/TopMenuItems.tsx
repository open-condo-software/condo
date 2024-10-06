import React from 'react'

import { Space } from '@open-condo/ui'

import { useAuth } from '@/domains/common/utils/next/auth'
import { useOrganization } from '@/domains/common/utils/next/organization'
import { InlineOrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'
import { SBBOLIndicator } from '@condo/domains/organization/components/SBBOLIndicator'
import { ServiceSubscriptionIndicator } from '@condo/domains/subscription/components/ServiceSubscriptionIndicator'
import { UserMenu } from '@condo/domains/user/components/UserMenu'


export interface ITopMenuItemsProps {
    headerAction?: React.ElementType
}

export const TopMenuItems: React.FC<ITopMenuItemsProps> = (props) => {
    const auth = useAuth()
    const { isLoading, organization } = useOrganization()

    if (!isLoading && !auth.isLoading) {
        return (
            <>
                { props.headerAction ? props.headerAction : null }
                <Space direction='horizontal' size={12} className='top-menu-items'>
                    <SBBOLIndicator organization={organization} />
                    <ServiceSubscriptionIndicator/>
                    <Space size={40}>
                        <InlineOrganizationSelect/>
                        <UserMenu/>
                    </Space>
                </Space>
            </>
        )
    }
    return null
}
