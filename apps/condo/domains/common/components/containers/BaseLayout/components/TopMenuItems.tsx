import React, { useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { Space } from '@open-condo/ui'

import { InlineOrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'
import { SBBOLIndicator } from '@condo/domains/organization/components/SBBOLIndicator'
import { ServiceSubscriptionIndicator } from '@condo/domains/subscription/components/ServiceSubscriptionIndicator'
import { UserMenu } from '@condo/domains/user/components/UserMenu'

import { NotificationCounter } from './NotificationCounter'


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
            <Space direction='horizontal' size={12} className='top-menu-items'>
                <NotificationCounter count={0} />
                <SBBOLIndicator organization={organization} />
                <ServiceSubscriptionIndicator />
                <Space size={40}>
                    <InlineOrganizationSelect />
                    <UserMenu />
                </Space>
            </Space>
        </>
    )
}
