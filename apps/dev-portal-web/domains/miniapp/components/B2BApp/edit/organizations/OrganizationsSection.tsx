import { Row, Col } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { Select } from '@open-condo/ui'
import type { SelectProps } from '@open-condo/ui'


import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import { EmptySubSectionView } from '@/domains/miniapp/components/EmptySubSectionView'
import { getEnvironment } from '@/domains/miniapp/utils/query'
import { DEV_ENVIRONMENT, PROD_ENVIRONMENT } from '@dev-portal-api/domains/miniapp/constants/publishing'

import { OrganizationsTable } from './OrganizationsTable'

import type { AppEnvironment } from '@/gql'
import type { RowProps } from 'antd'

import { useGetB2BAppQuery } from '@/gql'

const SELECT_GUTTER: RowProps['gutter'] = [40, 40]
const FULL_COL_SPAN = 24

export const OrganizationsSection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const OrganizationsTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.organizations.title' })
    const DevStandLabel = intl.formatMessage({ id: 'global.miniapp.environments.development.label' })
    const ProdStandLabel = intl.formatMessage({ id: 'global.miniapp.environments.production.label' })
    const ManagementNotAvailableTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.organizations.waitingView.title' })
    const ManagementNotAvailableText = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.organizations.waitingView.text' })


    const router = useRouter()
    const { env } = router.query
    const queryEnvironment = getEnvironment(env)

    const [selectedEnvironment, setSelectedEnvironment] = useState<AppEnvironment>(queryEnvironment)

    const environmentOptions = useMemo(() => ([
        { label: DevStandLabel, value: DEV_ENVIRONMENT, key: DEV_ENVIRONMENT },
        { label: ProdStandLabel, value: PROD_ENVIRONMENT, key: PROD_ENVIRONMENT },
    ]), [DevStandLabel, ProdStandLabel])

    const handleEnvironmentChange = useCallback<Required<SelectProps>['onChange']>((newEnv) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { p, s, ...restQuery } = router.query
        router.replace({ query: { ...restQuery, env: newEnv as AppEnvironment } }, undefined, { locale: router.locale })
        setSelectedEnvironment(newEnv as AppEnvironment)
    }, [router])

    const { data } = useGetB2BAppQuery({
        variables: {
            id,
        },
    })

    const isOrganizationsAvailable = selectedEnvironment === PROD_ENVIRONMENT
        ? Boolean(data?.app?.productionExportId)
        : Boolean(data?.app?.developmentExportId)

    return (
        <Section>
            <SubSection title={OrganizationsTitle}>
                <Row gutter={SELECT_GUTTER}>
                    <Col span={FULL_COL_SPAN}>
                        <Select options={environmentOptions} value={selectedEnvironment} onChange={handleEnvironmentChange}/>
                    </Col>
                    <Col span={FULL_COL_SPAN}>
                        {isOrganizationsAvailable ? (
                            <OrganizationsTable id={id} environment={selectedEnvironment}/>
                        ) : (
                            <EmptySubSectionView
                                dino='waiting'
                                title={ManagementNotAvailableTitle}
                                description={ManagementNotAvailableText}
                            />
                        )}
                    </Col>
                </Row>
            </SubSection>
        </Section>
    )
}