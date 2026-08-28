import { Form, notification } from 'antd'
import get from 'lodash/get'
import React, { useCallback, useEffect, useState } from 'react'
import { useIntl } from 'react-intl'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Select, type SelectProps } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import { AutoPublishView } from '@/domains/miniapp/components/Publishing/AutoPublishView'
import {
    DEV_ENVIRONMENT,
    PROD_ENVIRONMENT,
    PUBLISH_REQUEST_APPROVED_STATUS,
} from '@dev-portal-api/domains/miniapp/constants/publishing'

import { RequestStatusInfo } from './RequestStatusInfo'

import type { AppEnvironment } from '@/gql'

import { useAllB2BAppPublishRequestsLazyQuery } from '@/gql'


const DEFAULT_STAND = PROD_ENVIRONMENT as AppEnvironment

export const PublishingSection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const PublishingTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.publishing.title' })
    const SelectStandLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.publishing.publishForm.items.stand.label' })
    const DevStandLabel = intl.formatMessage({ id: 'global.miniapp.environments.development.label' })
    const ProdStandLabel = intl.formatMessage({ id: 'global.miniapp.environments.production.label' })

    const [form] = Form.useForm()
    const [environment, setEnvironment] = useState<AppEnvironment>(DEFAULT_STAND)

    const [fetchPublishRequests, { data: requestsData, loading: requestsLoading }] = useAllB2BAppPublishRequestsLazyQuery({
        variables: { appId: id },
    })

    const publishRequest = get(requestsData, ['requests', '0'], null)
    const publishRequestStatus = get(publishRequest, 'status')

    const handleEnvironmentChange = useCallback<Required<SelectProps>['onChange']>((value) => {
        setEnvironment(value as AppEnvironment)
    }, [])

    useEffect(() => {
        if (environment === PROD_ENVIRONMENT) {
            fetchPublishRequests()
        }
    }, [environment, fetchPublishRequests])

    return (
        <Section>
            <SubSection title={PublishingTitle}>
                <Form
                    name='publish-b2b-app-form'
                    layout='vertical'
                    form={form}
                    initialValues={{ environment: DEFAULT_STAND }}
                >
                    <Form.Item name='environment' label={SelectStandLabel}>
                        <Select
                            options={[
                                { label: DevStandLabel, value: DEV_ENVIRONMENT, key: DEV_ENVIRONMENT },
                                { label: ProdStandLabel, value: PROD_ENVIRONMENT, key: PROD_ENVIRONMENT },
                            ]}
                            onChange={handleEnvironmentChange}
                        />
                    </Form.Item>
                    {(environment !== PROD_ENVIRONMENT || publishRequestStatus === PUBLISH_REQUEST_APPROVED_STATUS)
                        ? <AutoPublishView environment={environment}/>
                        : <RequestStatusInfo request={publishRequest} appId={id} loading={requestsLoading}/>
                    }
                </Form>
            </SubSection>
        </Section>
    )
}