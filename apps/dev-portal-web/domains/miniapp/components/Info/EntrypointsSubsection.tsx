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
    useGetB2BAppQuery,
    useGetB2CAppQuery,
    AppEnvironment,
    B2BAppEntryPointsFragment,
    B2CAppEntryPointsFragment,
    useUpdateB2BAppMutation,
    useUpdateB2CAppMutation,
    GetB2BAppDocument,
    GetB2CAppDocument,
} from '@/gql'

const FORM_BUTTON_ROW_GUTTER: RowProps['gutter'] = [48, 48]
const FULL_COL_SPAN = 24
const EXAMPLES: Record<AppEnvironment, string> = {
    [AppEnvironment.Development]: 'https://my-app.test.example.com',
    [AppEnvironment.Production]: 'https://my-app.example.com',
}
const B2C_APP_TYPE = 'b2c'
const B2B_APP_TYPE = 'b2b'
type EntrypointsFormValues = Omit<B2CAppEntryPointsFragment, '__typename'> & Omit<B2BAppEntryPointsFragment, '__typename'>
type EntrypointsSubsectionProps = {
    id: string
    type: typeof B2C_APP_TYPE | typeof B2B_APP_TYPE
}

export const EntrypointsSubsection: React.FC<EntrypointsSubsectionProps> = ({ id, type }) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'global.actions.save' })
    const [form] = Form.useForm()

    const variables = useMemo(() => ({ id }), [id])

    const { data: b2cApp } = useGetB2CAppQuery({ variables, skip: type !== 'b2c' })
    const { data: b2bApp } = useGetB2BAppQuery({ variables, skip: type !== 'b2b' })

    const appData = useMemo(() => type === B2C_APP_TYPE
        ? b2cApp
        : b2bApp,
    [b2cApp, b2bApp, type])

    const { remoteUrlValidator } = useValidations()

    const initialValues = useMemo(() => {
        const result: EntrypointsFormValues = {}

        for (const environment of Object.values(AppEnvironment)) {
            const fieldName = `${environment}AppUrl` as const
            result[fieldName] = get(appData, ['app', fieldName])
        }

        return result
    }, [appData])

    const FormItems = useMemo(() => {
        const nullNormalizer = (value: unknown) => {
            return value || null
        }

        return (Object.values(AppEnvironment).map(environment => {
            const StandLabel = intl.formatMessage({ id: `global.miniapp.environments.${environment}.label.genitive` })
            const ItemLabel = intl.formatMessage({ id: 'pages.apps.any.id.sections.info.entrypoints.form.items.appUrl.label' }, {
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
    const refetchQueries = useMemo(() => type === 'b2c'
        ? [{ query: GetB2CAppDocument, variables }]
        : [{ query: GetB2BAppDocument, variables }],
    [type, variables])

    const [updateB2CAppMutation] = useUpdateB2CAppMutation({
        refetchQueries,
        onError,
        onCompleted,
    })
    const [updateB2BAppMutation] = useUpdateB2BAppMutation({
        refetchQueries,
        onError,
        onCompleted,
    })


    const handleSubmit = useCallback((values: EntrypointsFormValues) => {
        const variables = {
            id,
            data: {
                dv: 1,
                sender: getClientSideSenderInfo(),
                ...values,
            },
        }
        if (type === B2C_APP_TYPE) {
            void updateB2CAppMutation({ variables })
        } else {
            void updateB2BAppMutation({ variables })
        }
    }, [id, type, updateB2BAppMutation, updateB2CAppMutation])

    return (
        <Form
            name={`update-${type}-app-entrypoints-form`}
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