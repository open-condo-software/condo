import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import React, { useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useOrganization } from '@open-condo/next/organization'

import { CardsContainer } from '@condo/domains/common/components/Card/CardsContainer'
import { SettingCardSkeleton } from '@condo/domains/common/components/settings/SettingCard'
import { TICKET_SUBMITTING_FORM_RESIDENT_MOBILE_APP } from '@condo/domains/common/constants/featureflags'
import {
    OnlyProgressionMeterReadingsSettingCard,
} from '@condo/domains/settings/components/ticketSubmitting/OnlyProgressionMeterReadingsSettingCard'
import { TicketSubmittingSettingCard } from '@condo/domains/settings/components/ticketSubmitting/TicketSubmittingSettingCard'
import { MobileFeatureConfig as MobileFeatureConfigAPI } from '@condo/domains/settings/utils/clientSchema'


const CONTENT_GUTTER: Gutter | [Gutter, Gutter] = [0, 40]

export const MobileFeatureConfigContent: React.FC = () => {
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'], null)
    const { obj: mobileConfig, loading } = MobileFeatureConfigAPI.useObject({
        where: {
            organization: { id: userOrganizationId },
        },
    })
    const { useFlag } = useFeatureFlags()
    const hasTicketSubmittingSettingFeature = useFlag(TICKET_SUBMITTING_FORM_RESIDENT_MOBILE_APP)

    const content = useMemo(() => ([
        !hasTicketSubmittingSettingFeature ? undefined : (loading
            ? <SettingCardSkeleton/>
            : <TicketSubmittingSettingCard mobileConfig={mobileConfig}/>),

        loading ? <SettingCardSkeleton/>
            : <OnlyProgressionMeterReadingsSettingCard mobileConfig={mobileConfig}/>,
    ]).filter(Boolean), [hasTicketSubmittingSettingFeature, mobileConfig, loading])


    return (
        <Row gutter={CONTENT_GUTTER}>
            <Col span={24}>
                <CardsContainer cardsPerRow={2} children={content}/>
            </Col>
        </Row>
    )
}
