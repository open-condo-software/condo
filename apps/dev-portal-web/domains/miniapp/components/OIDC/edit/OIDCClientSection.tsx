import { Col, Row } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { Select } from '@open-condo/ui'
import type { SelectProps } from '@open-condo/ui'

import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import { getEnvironment } from '@/domains/miniapp/utils/query'
import { DEV_ENVIRONMENT, PROD_ENVIRONMENT } from '@dev-portal-api/domains/miniapp/constants/publishing'

import { ClientSettingsSubsection } from './ClientSettingsSubsection'

import type{ RowProps } from 'antd'

import { AppEnvironment } from '@/gql'


const SELECT_GUTTER: RowProps['gutter'] = [40, 40]
const FULL_COL_SPAN = 24

export const OIDCClientSection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const OIDCClientSettingsTitle = intl.formatMessage({ id: 'apps.b2c.sections.oidc.clientSettings.subtitle' })
    const DevStandLabel = intl.formatMessage({ id: 'apps.environments.development.label' })
    const ProdStandLabel = intl.formatMessage({ id: 'apps.environments.production.label' })

    const router = useRouter()
    const { env } = router.query
    const queryEnvironment = getEnvironment(env)

    const [selectedEnvironment, setSelectedEnvironment] = useState<AppEnvironment>(queryEnvironment)

    const handleEnvironmentChange = useCallback<Required<SelectProps>['onChange']>((newEnv) => {
        router.replace({ query: { ...router.query, env: newEnv as AppEnvironment } })
        setSelectedEnvironment(newEnv as AppEnvironment)
    }, [router])

    return (
        <Section>
            <SubSection title={OIDCClientSettingsTitle}>
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
                    <Col span={FULL_COL_SPAN}>
                        <ClientSettingsSubsection id={id} environment={selectedEnvironment}/>
                    </Col>
                </Row>
            </SubSection>
        </Section>
    )
}