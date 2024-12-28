import React from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { Space } from '@open-condo/ui'

import { InlineOrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'
import { SBBOLIndicator } from '@condo/domains/organization/components/SBBOLIndicator'
import { ServiceSubscriptionIndicator } from '@condo/domains/subscription/components/ServiceSubscriptionIndicator'
import { UserMenu } from '@condo/domains/user/components/UserMenu'

import { UserMessagesList } from './UserMessagesList'


export interface ITopMenuItemsProps {
    headerAction?: React.ElementType
}

export const TopMenuItems: React.FC<ITopMenuItemsProps> = (props) => {
    const auth = useAuth()
    const { organization } = useOrganization()

    if (auth.isLoading) return null

    return (
        <>
            {props.headerAction ? props.headerAction : null}
            <Space direction='horizontal' size={40} className='top-menu-items'>
                <UserMessagesList />
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
