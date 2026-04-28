import { Col, Form, Row } from 'antd'
import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Button, Input } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { useMutationCompletedHandler } from '@/domains/miniapp/hooks/useMutationCompletedHandler'

import type { RowProps } from 'antd'

import {
    useGetB2CAppQuery,
    AppEnvironment,
    B2CAppEntryPointsFragment,
    useUpdateB2CAppMutation,
    GetB2CAppDocument,
} from '@/gql'

const FORM_BUTTON_ROW_GUTTER: RowProps['gutter'] = [48, 48]
const FULL_COL_SPAN = 24
const EXAMPLES: Record<AppEnvironment, string> = {
    [AppEnvironment.Development]: 'https://my-app.test.example.com',
    [AppEnvironment.Production]: 'https://my-app.example.com',
}

type EntrypointsFormValues = Omit<B2CAppEntryPointsFragment, '__typename'>

export const EntrypointsSubsection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'global.actions.save' })
    const [form] = Form.useForm()

    const variables = { id }

    const { data } = useGetB2CAppQuery({ variables })
    const { remoteUrlValidator } = useValidations()

    const initialValues = useMemo(() => {
        const result: EntrypointsFormValues = {}

        for (const environment of Object.values(AppEnvironment)) {
            const fieldName = `${environment}AppUrl` as const
            result[fieldName] = get(data, ['app', fieldName])
        }

        return result
    }, [data])

    const FormItems = useMemo(() => {
        const nullNormalizer = (value: unknown) => {
            return value || null
        }

        return (Object.values(AppEnvironment).map(environment => {
            const StandLabel = intl.formatMessage({ id: `global.miniapp.environments.${environment}.label.genitive` })
            const ItemLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.entrypoints.form.items.appUrl.label' }, {
                environment: StandLabel.toLowerCase(),
            })
            return (
                <Form.Item
                    key={`${environment}AppUrl`}
                    name={`${environment}AppUrl`}
                    label={ItemLabel}
                    rules={[remoteUrlValidator]}
                    normalize={nullNormalizer}
                >
                    <Input placeholder={EXAMPLES[environment]}/>
                </Form.Item>
            )
        }))
    }, [intl, remoteUrlValidator])

    const onCompleted = useMutationCompletedHandler()
    const onError = useMutationErrorHandler()
    const [updateB2CAppMutation] = useUpdateB2CAppMutation({
        refetchQueries: [
            {
                query: GetB2CAppDocument,
                variables,
            },
        ],
        onError,
        onCompleted,
    })

    const handleSubmit = useCallback((values: EntrypointsFormValues) => {
        updateB2CAppMutation({
            variables: {
                id,
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    ...values,
                },
            },
        })
    }, [id, updateB2CAppMutation])

    return (
        <Form
            name='update-b2c-app-entrypoints-form'
            layout='vertical'
            form={form}
            initialValues={initialValues}
            onFinish={handleSubmit}
        >
            <Row gutter={FORM_BUTTON_ROW_GUTTER}>
                <Col span={FULL_COL_SPAN}>
                    {FormItems}
                </Col>
                <Col>
                    <Button type='primary' htmlType='submit'>{SaveLabel}</Button>
                </Col>
            </Row>
        </Form>
    )
}