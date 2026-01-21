import { Form, notification } from 'antd'
import get from 'lodash/get'
import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Select, type SelectProps } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import { PublishForm } from '@/domains/miniapp/components/B2BApp/edit/publishing/PublishForm'
import {
    DEV_ENVIRONMENT,
    PROD_ENVIRONMENT,
    PUBLISH_REQUEST_APPROVED_STATUS,
} from '@dev-portal-api/domains/miniapp/constants/publishing'

import { RequestStatusInfo } from './RequestStatusInfo'

import type { AppEnvironment } from '@/gql'

import { useAllB2BAppPublishRequestsLazyQuery, usePublishB2BAppMutation, GetB2BAppDocument } from '@/gql'

type PublishFormValues = {
    environment: AppEnvironment
    info?: boolean
}

const DEFAULT_STAND = DEV_ENVIRONMENT

export const PublishingSection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const PublishingTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.publishing.title' })
    const SelectStandLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.publishing.publishForm.items.stand.label' })
    const DevStandLabel = intl.formatMessage({ id: 'global.miniapp.environments.development.label' })
    const ProdStandLabel = intl.formatMessage({ id: 'global.miniapp.environments.production.label' })
    const ChangesPublishedTitle = intl.formatMessage({ id: 'pages.apps.any.id.notifications.successPublish.title' })

    const [form] = Form.useForm()
    const [environment, setEnvironment] = useState(DEFAULT_STAND)
    const [isPublishing, setIsPublishing] = useState(false)

    const [fetchPublishRequests, { data: requestsData, loading: requestsLoading }] = useAllB2BAppPublishRequestsLazyQuery({
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

    const onError = useMutationErrorHandler()
    const onCompleted = useCallback(() => {
        notification.success( { message: ChangesPublishedTitle })
    }, [ChangesPublishedTitle])
    const [publishMutation] = usePublishB2BAppMutation({
        onError,
        onCompleted,
        refetchQueries: [{ query: GetB2BAppDocument, variables: { id } }],
    })

    const handlePublish = useCallback((values: PublishFormValues) => {
        setIsPublishing(true)
        publishMutation({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    app: { id },
                    environment: values.environment,
                    options: {
                        info: values.info,
                    },
                },
            },
        }).finally(() => setIsPublishing(false))
    }, [id, publishMutation])

    return (
        <Section>
            <SubSection title={PublishingTitle}>
                <Form
                    name='publish-b2b-app-form'
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
                        ? <PublishForm isPublishing={isPublishing}/>
                        : <RequestStatusInfo request={publishRequest} appId={id} loading={requestsLoading}/>
                    }
                </Form>
            </SubSection>
        </Section>
    )
}