import { Row, Col } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import type { SelectProps } from '@open-condo/ui'
import { Select } from '@open-condo/ui'

import { Spin } from '@/domains/common/components/Spin'
import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import { EditUserForm } from '@/domains/miniapp/components/User/edit/EditUserForm'
import { RegisterUserForm } from '@/domains/miniapp/components/User/edit/RegisterUserForm'
import { getEnvironment } from '@/domains/miniapp/utils/query'
import { DEV_ENVIRONMENT, PROD_ENVIRONMENT } from '@dev-portal-api/domains/miniapp/constants/publishing'

import type { RowProps } from 'antd'

import { AppEnvironment, useAllB2CAppAccessRightsQuery } from '@/gql'

const SELECT_GUTTER: RowProps['gutter'] = [40, 40]
const FULL_COL_SPAN = 24

export const ServiceUserSection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const ServiceUserSectionTitle = intl.formatMessage({ id: 'apps.b2c.sections.serviceUser.title' })
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

    const { data, loading, error } = useAllB2CAppAccessRightsQuery({
        variables: {
            environment: selectedEnvironment,
            appId: id,
        },
    })

    const rights = data?.rights || []

    return (
        <Section>
            <SubSection title={ServiceUserSectionTitle}>
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
                        {loading && <Spin size='large'/>}
                        {!loading && !error && (
                            rights.length
                                ? <EditUserForm id={id} environment={selectedEnvironment} email={rights[0]?.condoUserEmail}/>
                                : <RegisterUserForm id={id} environment={selectedEnvironment}/>
                        )}
                    </Col>
                </Row>
            </SubSection>
        </Section>
    )
}