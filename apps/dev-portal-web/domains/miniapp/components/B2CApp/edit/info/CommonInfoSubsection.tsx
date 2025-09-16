import { Form, Row, Col } from 'antd'
import get from 'lodash/get'
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Input, Button } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { useMutationCompletedHandler } from '@/domains/miniapp/hooks/useMutationCompletedHandler'
import { useAuth } from '@/domains/user/utils/auth'

import type { RowProps } from 'antd'

import { useUpdateB2CAppMutation, AllAppsDocument, GetB2CAppDocument, useGetB2CAppQuery } from '@/gql'

const FORM_BUTTON_ROW_GUTTER: RowProps['gutter'] = [32, 32]
const FULL_COL_SPAN = 24

type CommonInfoFormValues = {
    name: string
    developer?: string
}

export const CommonInfoSubsection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const AppNameLabel = intl.formatMessage({ id: 'global.newAppForm.items.name.label' })
    const DeveloperNameLabel = intl.formatMessage({ id: 'global.newAppForm.items.developer.label' })
    const DeveloperNamePlaceholder = intl.formatMessage({ id: 'global.newAppForm.items.developer.placeholder' })
    const SaveLabel = intl.formatMessage({ id: 'global.actions.save' })

    const [form] = Form.useForm()

    const { user } = useAuth()
    const variables = { id, creator: { id: user?.id } }

    const { data } = useGetB2CAppQuery({ variables })

    const onCompleted = useMutationCompletedHandler()
    const onError = useMutationErrorHandler()
    const [updateB2CAppMutation] = useUpdateB2CAppMutation({
        refetchQueries: [
            AllAppsDocument,
            {
                query: GetB2CAppDocument,
                variables,
            },
        ],
        onError,
        onCompleted,
    })

    const { trimValidator } = useValidations()

    const appName = get(data, ['app', 'name'])
    const appDeveloper = get(data, ['app', 'developer'])

    const handleSubmit = useCallback((values: CommonInfoFormValues) => {
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
            name='common-app-info'
            layout='vertical'
            form={form}
            onFinish={handleSubmit}
            initialValues={{ name: appName, developer: appDeveloper }}
        >
            <Row gutter={FORM_BUTTON_ROW_GUTTER}>
                <Col span={FULL_COL_SPAN}>
                    <Form.Item name='name' label={AppNameLabel} rules={[trimValidator]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name='developer' label={DeveloperNameLabel}>
                        <Input placeholder={DeveloperNamePlaceholder}/>
                    </Form.Item>
                </Col>
                <Col span={FULL_COL_SPAN}>
                    <Button type='primary' htmlType='submit'>{SaveLabel}</Button>
                </Col>
            </Row>
        </Form>
    )
}