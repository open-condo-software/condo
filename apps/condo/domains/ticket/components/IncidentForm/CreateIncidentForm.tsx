import { useCreateIncidentMutation } from '@app/condo/gql'
import { Form } from 'antd'
import Router from 'next/router'
import React, { ComponentProps, useCallback, useMemo } from 'react'

import { QuestionCircle } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Space, Switch, Tooltip, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { useAIConfig } from '@condo/domains/ai/hooks/useAIFlow'

import { BaseIncidentForm, BaseIncidentFormProps } from './BaseIncidentForm'


export const CreateIncidentActionBar: React.FC<ComponentProps<BaseIncidentFormProps['ActionBar']>> = (props) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'incident.form.save.label' })
    const GenerateNewsLabel = intl.formatMessage({ id: 'incident.generateNews.switch.label' })
    const GenerateNewsHint = intl.formatMessage({ id: 'incident.generateNews.switch.hint' })

    const { handleSave, isLoading } = props

    const { employee } = useOrganization()
    const canManageNewsItems = useMemo(() => employee?.role?.canManageNewsItems || false, [employee])

    const { enabled: aiEnabled, features: { generateNewsByIncident: generateNewsByIncidentEnabled } } = useAIConfig()

    return (
        <ActionBar
            actions={[
                <Button
                    key='submit'
                    type='primary'
                    children={SaveLabel}
                    onClick={handleSave}
                    disabled={isLoading}
                    loading={isLoading}
                />,
                ...((aiEnabled && generateNewsByIncidentEnabled && canManageNewsItems)
                    ? [
                        <label
                            key='generateNews'
                        >
                            <Space size={4}>
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
                                <Tooltip
                                    title={GenerateNewsHint}
                                >
                                    <div style={{ display: 'flex' }}>
                                        <QuestionCircle size='small' color={colors.gray[7]}/>
                                    </div>
                                </Tooltip>
                            </Space>
                        </label>,
                    ] 
                    : []
                ),
            ]}
        />
    )
}


export const CreateIncidentForm: React.FC = () => {
    const { organization } = useOrganization()
    const organizationId = useMemo(() => organization?.id, [organization])

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
            action={action}
            afterAction={async () => {
                await Router.push('/incident')
            }}
            organizationId={organizationId}
            ActionBar={CreateIncidentActionBar}
        />
    )
}
