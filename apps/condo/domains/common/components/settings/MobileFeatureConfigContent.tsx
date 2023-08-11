import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import React from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useOrganization } from '@open-condo/next/organization'

import { CardsContainer } from '@condo/domains/common/components/Card/CardsContainer'
import { SettingCardSkeleton } from '@condo/domains/common/components/settings/SettingCard'
import { MOBILE_FEATURE_CONFIGURATION, TICKET_SUBMITTING_FORM_RESIDENT_MOBILE_APP, SUBMIT_ONLY_PROGRESSION_METER_READINGS } from '@condo/domains/common/constants/featureflags'
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
    const hasMobileFeatureConfigurationFeature = useFlag(MOBILE_FEATURE_CONFIGURATION)
    const hasTicketSubmittingSettingFeature = useFlag(TICKET_SUBMITTING_FORM_RESIDENT_MOBILE_APP)
    const hasOnlyProgressionMeterReadingsSettingFeature = useFlag(SUBMIT_ONLY_PROGRESSION_METER_READINGS)

    if (!hasMobileFeatureConfigurationFeature) {
        return null
    }

    return (
        <Row gutter={CONTENT_GUTTER}>
            <Col span={24}>
                <CardsContainer cardsPerRow={2}>
                    {
                        !hasTicketSubmittingSettingFeature ? null : (loading
                            ? <SettingCardSkeleton/>
                            : <TicketSubmittingSettingCard mobileConfig={mobileConfig}/>)
                    }
                    {
                        !hasOnlyProgressionMeterReadingsSettingFeature ? null : (loading
                            ? <SettingCardSkeleton />
                            : <OnlyProgressionMeterReadingsSettingCard mobileConfig={mobileConfig}/>)
                    }
                </CardsContainer>
            </Col>
        </Row>
    )
}
