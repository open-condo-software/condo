import { Form, notification } from 'antd'
import get from 'lodash/get'
import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Select } from '@open-condo/ui'
import type { SelectProps } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import {
    DEV_ENVIRONMENT,
    PROD_ENVIRONMENT,
    PUBLISH_REQUEST_APPROVED_STATUS,
} from '@dev-portal-api/domains/miniapp/constants/publishing'

import { PublishForm } from './PublishForm'
import { RequestStatusInfo } from './RequestStatusInfo'

import type { PublishB2CAppMutationVariables } from '@/lib/gql'

import { usePublishB2CAppMutation, useAllB2CAppPublishRequestsLazyQuery, GetB2CAppDocument } from '@/lib/gql'


const DEFAULT_STAND = DEV_ENVIRONMENT

type PublishFormValues = {
    environment: PublishB2CAppMutationVariables['data']['environment']
    info?: boolean
    buildId?: string
}

export const PublishingSection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const PublishingTitle = intl.formatMessage({ id: 'apps.b2c.sections.publishing.title' })
    const SelectStandLabel = intl.formatMessage({ id: 'apps.b2c.sections.publishing.publishForm.items.stand.label' })
    const DevStandLabel = intl.formatMessage({ id: 'apps.environments.development.label' })
    const ProdStandLabel = intl.formatMessage({ id: 'apps.environments.production.label' })
    const ChangesPublishedTitle = intl.formatMessage({ id: 'apps.id.notifications.successPublish.title' })

    const [form] = Form.useForm()
    const [isPublishing, setIsPublishing] = useState(false)
    const [environment, setEnvironment] = useState(DEFAULT_STAND)

    const onError = useMutationErrorHandler()
    const onCompleted = useCallback(() => {
        notification.success( { message: ChangesPublishedTitle })
    }, [ChangesPublishedTitle])
    const [publishMutation] = usePublishB2CAppMutation({
        onError,
        onCompleted,
        refetchQueries: [{ query: GetB2CAppDocument, variables: { id } }],
    })

    const handlePublish = useCallback((values: PublishFormValues) => {
        const data = {
            dv: 1,
            sender: getClientSideSenderInfo(),
            app: { id },
            environment: values.environment,
            options: {
                info: values.info,
                build: values.buildId ? { id: values.buildId } : undefined,
            },
        }
        setIsPublishing(true)
        publishMutation({
            variables: {
                data,
            },
        }).finally(() => { setIsPublishing(false) })
    }, [id, publishMutation])

    const [fetchPublishRequests, { data: requestsData, loading: requestsLoading }] = useAllB2CAppPublishRequestsLazyQuery({
        variables: { appId: id },
    })

    const publishRequest = get(requestsData, ['requests', '0'], null)
    const publishRequestStatus = get(publishRequest, 'status')

    const handleEnvironmentChange = useCallback<Required<SelectProps>['onChange']>((value) => {
        setEnvironment(value as string)
        if (value === PROD_ENVIRONMENT) {
            fetchPublishRequests()
        }
    }, [fetchPublishRequests])

    return (
        <Section>
            <SubSection title={PublishingTitle}>
                <Form
                    name='b2c-app-publishing'
                    layout='vertical'
                    form={form}
                    onFinish={handlePublish}
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
                        ? (
                            <PublishForm id={id} isPublishing={isPublishing}/>
                        ) : (
                            <RequestStatusInfo request={publishRequest} appId={id} loading={requestsLoading}/>
                        )}
                </Form>
            </SubSection>
        </Section>
    )
}