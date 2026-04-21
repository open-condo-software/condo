import { Form, Collapse } from 'antd'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Checkbox, Alert, Button, Typography } from '@open-condo/ui'

import { SubDivider } from '@/domains/common/components/SubDivider'
import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useMutationCompletedHandler } from '@/domains/miniapp/hooks/useMutationCompletedHandler'

import styles from './PublishingSettingsForm.module.css'


import { AppEnvironment, GetB2CAppDocument } from '@/gql'
import { useGetB2CAppQuery, useUpdateB2CAppMutation } from '@/gql'


type PublishingSettingsFormProps = {
    id: string
    environment: AppEnvironment
}

type SettingsFormValues = {
    [key in `${AppEnvironment}WebTransformEnabled`]?: boolean
}

export const PublishingSettingsForm: React.FC<PublishingSettingsFormProps> = ({ id, environment }) => {
    const intl = useIntl()
    const FormTitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.settings.subtitle' })
    const StandLabel = intl.formatMessage({ id: `global.miniapp.environments.${environment}.label` })
    const WebTransformLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.settings.form.fields.webTransformEnabled.checkbox.label' }, {
        environment: StandLabel.toLowerCase(),
    })
    const WebTransformHintText = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.settings.form.fields.webTransformEnabled.checkbox.hint.text' })
    const WebTransformHintLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.settings.form.fields.webTransformEnabled.checkbox.hint.label' })
    const SaveLabel = intl.formatMessage({ id: 'global.actions.save' })

    const [form] = Form.useForm()

    const transformFieldName = useMemo(() => {
        return `${environment}WebTransformEnabled` as const
    }, [environment])

    const collapseItems = useMemo(() => {
        return [
            {
                label: <Typography.Text size='medium' type='secondary'>{WebTransformHintLabel}</Typography.Text>,
                children: <Alert type='info' showIcon description={WebTransformHintText}/>,
            },
        ]
    }, [WebTransformHintLabel, WebTransformHintText])

    const { data } = useGetB2CAppQuery({
        variables: {
            id,
        },
    })
    const onCompleted = useMutationCompletedHandler()
    const onError = useMutationErrorHandler()
    const [updateB2CApp] = useUpdateB2CAppMutation({
        refetchQueries: [
            {
                query: GetB2CAppDocument,
                variables: { id },
            },
        ],
        onError,
        onCompleted,
    })

    const initialValues = useMemo(() => {
        return {
            [transformFieldName]: data?.app?.[transformFieldName],
        }
    }, [data?.app, transformFieldName])

    const onSubmit = useCallback((values: SettingsFormValues) => {
        updateB2CApp({
            variables: {
                id,
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    ...values,
                },
            },
        })
    }, [id, updateB2CApp])

    return (
        <Form
            name='update-b2c-app-publishing-settings-form'
            layout='vertical'
            form={form}
            initialValues={initialValues}
            onFinish={onSubmit}
        >
            <SubDivider title={FormTitle}/>
            <Form.Item
                name={transformFieldName}
                valuePropName='checked'
                tooltip={WebTransformHintText}
            >
                <Checkbox label={WebTransformLabel}/>
            </Form.Item>
            <Collapse items={collapseItems}/>
            <Button type='primary' htmlType='submit' className={styles.submitButton}>
                {SaveLabel}
            </Button>
        </Form>
    )
}