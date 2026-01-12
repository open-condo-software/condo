import { useCreateIncidentMutation } from '@app/condo/gql'
import { Form, Col, Row, notification } from 'antd'
import Router from 'next/router'
import React, { ComponentProps, useCallback, useMemo } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Space, Switch, Typography } from '@open-condo/ui'

import { useAIConfig } from '@condo/domains/ai/hooks/useAIFlow'
import { LabeledField } from '@condo/domains/common/components/LabeledField'
import { AnalyticalNewsSources } from '@condo/domains/news/constants/sources'
import { NoSubscriptionTooltip } from '@condo/domains/subscription/components'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

import { BaseIncidentForm, BaseIncidentFormProps } from './BaseIncidentForm'


export const CreateIncidentActionBar: React.FC<ComponentProps<BaseIncidentFormProps['ActionBar']>> = (props) => {
    const intl = useIntl()
    const CreateLabel = intl.formatMessage({ id: 'incident.form.create.label' })
    const GenerateNewsLabel = intl.formatMessage({ id: 'incident.generateNews.switch.label' })
    const GenerateNewsHint = intl.formatMessage({ id: 'incident.generateNews.switch.hint' })

    const { handleSave, isLoading, withNewsGeneration } = props

    const { employee } = useOrganization()
    const canManageNewsItems = useMemo(() => employee?.role?.canManageNewsItems || false, [employee])

    const { enabled: aiEnabled, features: { generateNewsByIncident: generateNewsByIncidentEnabled } } = useAIConfig()

    const { isFeatureAvailable } = useOrganizationSubscription()
    const hasAiFeature = isFeatureAvailable('ai')
    const hasNewsFeature = isFeatureAvailable('news')
    const hasRequiredFeatures = hasAiFeature && hasNewsFeature

    return (
        <ActionBar
            actions={[
                <Button
                    key='submit'
                    type='primary'
                    children={CreateLabel}
                    onClick={handleSave}
                    disabled={isLoading}
                    loading={isLoading}
                />,
                ...((withNewsGeneration && aiEnabled && generateNewsByIncidentEnabled && canManageNewsItems)
                    ? [
                        hasRequiredFeatures ? (
                            <LabeledField
                                key='generateNews'
                                hint={GenerateNewsHint}
                            >
                                <Space size={8}>
                                    <Form.Item
                                        name='generateNews'
                                        valuePropName='checked'
                                        initialValue={true}
                                    >
                                        <Switch
                                            id='generateNews'
                                            size='small'
                                        />
                                    </Form.Item>
                                    <Typography.Text>
                                        {GenerateNewsLabel}
                                    </Typography.Text>
                                </Space>
                            </LabeledField>
                        ) : (
                            <NoSubscriptionTooltip key='generateNews'>
                                <div>
                                    <LabeledField hint={GenerateNewsHint}>
                                        <Space size={8}>
                                            <Switch
                                                id='generateNews'
                                                size='small'
                                                disabled
                                            />
                                            <Typography.Text type='secondary'>
                                                {GenerateNewsLabel}
                                            </Typography.Text>
                                        </Space>
                                    </LabeledField>
                                </div>
                            </NoSubscriptionTooltip>
                        ),
                    ] 
                    : []
                ),
            ]}
        />
    )
}


export const CreateIncidentForm: React.FC = () => {
    const intl = useIntl()
    const GoToNewsMessage = intl.formatMessage({ id: 'incident.notification.button.goToNews' })
    const ReadyMessage = intl.formatMessage({ id: 'Ready' })
    const CreatedDescriptionMessage = intl.formatMessage({ id: 'incident.notification.description.created' })
    const AlsoCreateNewsMessage = intl.formatMessage({ id: 'incident.notification.description.alsoCreateNews' })

    const { organization } = useOrganization()
    const organizationId = useMemo(() => organization?.id, [organization])

    const onCompletedMessage = useCallback((_, newsInitialValue) => {
        let DescriptionMessage = CreatedDescriptionMessage
        if (newsInitialValue) {
            DescriptionMessage += ` ${AlsoCreateNewsMessage}`
        }

        return {
            message: (
                <Typography.Text strong>{ReadyMessage}</Typography.Text>
            ),
            description: (
                <Row gutter={[0, 16]}>
                    <Col span={24}>
                        <Typography.Text size='medium' type='secondary'>{DescriptionMessage}</Typography.Text>
                    </Col>
                    {
                        newsInitialValue && (
                            <Col span={24}>
                                <Button
                                    type='primary'
                                    onClick={() => {
                                        window.open(`/news/create?initialValue=${encodeURIComponent(JSON.stringify(newsInitialValue))}&initialStep=${encodeURIComponent(JSON.stringify(1))}&source=${AnalyticalNewsSources.INCIDENT_CREATE_NOTIFY}`, '_blank')
                                        notification.destroy()
                                    }}>
                                    {GoToNewsMessage}
                                </Button>
                            </Col>
                        )
                    }
                </Row>
            ),
            duration: 10,
        }
    }, [AlsoCreateNewsMessage, CreatedDescriptionMessage, GoToNewsMessage, ReadyMessage])

    const [createIncident] = useCreateIncidentMutation()
    const action: BaseIncidentFormProps['action'] = useCallback(async (values) => await createIncident({
        variables: {
            data: {
                ...values,
                organization: { connect: { id: organizationId } },
                dv: 1,
                sender: getClientSideSenderInfo(),
            },
        },
    }), [createIncident, organizationId])

    return (
        <BaseIncidentForm
            withNewsGeneration
            action={action}
            afterAction={async () => {
                await Router.push('/incident')
            }}
            organizationId={organizationId}
            ActionBar={CreateIncidentActionBar}
            onCompletedMessage={onCompletedMessage}
            formType='create'
        />
    )
}
