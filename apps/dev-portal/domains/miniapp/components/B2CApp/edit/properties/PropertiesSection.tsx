import { Col, Row } from 'antd'
import omit from 'lodash/omit'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import type { SelectProps } from '@open-condo/ui'
import { Select } from '@open-condo/ui'

import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import { DEV_ENVIRONMENT, PROD_ENVIRONMENT } from '@dev-api/domains/miniapp/constants/publishing'

import { PropertiesTable } from './PropertiesTable'
import { WaitingSectionView } from './WaitingSectionView'

import type { RowProps } from 'antd'

import { AppEnvironment, useGetB2CAppQuery } from '@/lib/gql'


const SELECT_GUTTER: RowProps['gutter'] = [40, 40]
const FULL_COL_SPAN = 24

export const PropertiesSection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const PropertiesTitle = intl.formatMessage({ id: 'apps.b2c.sections.properties.title' })
    const DevStandLabel = intl.formatMessage({ id: 'apps.b2c.sections.publishing.publishForm.items.stand.options.development.label' })
    const ProdStandLabel = intl.formatMessage({ id: 'apps.b2c.sections.publishing.publishForm.items.stand.options.production.label' })

    const router = useRouter()

    const [selectedEnvironment, setSelectedEnvironment] = useState<AppEnvironment>(AppEnvironment.Development)

    const handleEnvironmentChange = useCallback<Required<SelectProps>['onChange']>((newEnv) => {
        router.replace({ query: omit(router.query, ['p']) }, undefined, { locale: router.locale })
        setSelectedEnvironment(newEnv as AppEnvironment)
    }, [router])

    const { data } = useGetB2CAppQuery({
        variables: {
            id,
        },
    })

    const isPropertiesAvailable = selectedEnvironment === PROD_ENVIRONMENT
        ? Boolean(data?.app?.productionExportId)
        : Boolean(data?.app?.developmentExportId)

    return (
        <Section>
            <SubSection title={PropertiesTitle}>
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
                        {isPropertiesAvailable ? (
                            <PropertiesTable id={id} environment={selectedEnvironment}/>
                        ) : (
                            <WaitingSectionView/>
                        )}
                    </Col>
                </Row>
            </SubSection>
        </Section>
    )
}