import { Col, Row } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import type { SelectProps } from '@open-condo/ui'
import { Select } from '@open-condo/ui'

import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import { PublishingSettingsForm } from '@/domains/miniapp/components/B2CApp/edit/publishing/PublishingSettingsForm'
import { getEnvironment } from '@/domains/miniapp/utils/query'
import { DEV_ENVIRONMENT, PROD_ENVIRONMENT } from '@dev-portal-api/domains/miniapp/constants/publishing'

import { PublishingSubsection } from './PublishingSubsection'

import type { RowProps } from 'antd'

import { AppEnvironment, B2CAppTypeType, useGetB2CAppQuery } from '@/gql'


const SELECT_GUTTER: RowProps['gutter'] = [40, 40]
const FULL_COL_SPAN = 24

export const PublishingSection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const PublishingTitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.title' })
    const DevStandLabel = intl.formatMessage({ id: 'global.miniapp.environments.development.label' })
    const ProdStandLabel = intl.formatMessage({ id: 'global.miniapp.environments.production.label' })

    const router = useRouter()
    const { env } = router.query
    const queryEnvironment = getEnvironment(env)
    const { data } = useGetB2CAppQuery({
        variables: {
            id,
        },
    })

    const [selectedEnvironment, setSelectedEnvironment] = useState<AppEnvironment>(queryEnvironment)

    const handleEnvironmentChange = useCallback<Required<SelectProps>['onChange']>((newEnv) => {
        router.replace({ query: { ...router.query, env: newEnv as AppEnvironment } })
        setSelectedEnvironment(newEnv as AppEnvironment)
    }, [router])

    return (
        <Section>
            <SubSection title={PublishingTitle}>
                <Row gutter={SELECT_GUTTER}>
                    <Col span={FULL_COL_SPAN}>
                        <Select
                            options={[
                                { label: DevStandLabel, value: DEV_ENVIRONMENT, key: DEV_ENVIRONMENT },
                                { label: ProdStandLabel, value: PROD_ENVIRONMENT, key: PROD_ENVIRONMENT },
                            ]}
                            value={selectedEnvironment}
                            onChange={handleEnvironmentChange}
                        />
                    </Col>
                    {Boolean(data?.app?.type === B2CAppTypeType.Cordova) && (
                        <Col span={FULL_COL_SPAN}>
                            <PublishingSettingsForm id={id} environment={selectedEnvironment}/>
                        </Col>
                    )}
                    <Col span={FULL_COL_SPAN}>
                        <PublishingSubsection id={id} environment={selectedEnvironment}/>
                    </Col>
                </Row>
            </SubSection>
        </Section>
    )
}