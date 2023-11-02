import { Form, Row, Col } from 'antd'
import get from 'lodash/get'
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { Input, Button } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { getClientSideSenderInfo } from '@/domains/common/utils/userid.utils'
import { useMutationCompletedHandler } from '@/domains/miniapp/hooks/useMutationCompletedHandler'

import type { RowProps } from 'antd'

import { useAuth } from '@/lib/auth'
import { useUpdateB2CAppMutation, AllAppsDocument, GetB2CAppDocument, useGetB2CAppQuery } from '@/lib/gql'

const FORM_BUTTON_ROW_GUTTER: RowProps['gutter'] = [32, 32]
const FULL_COL_SPAN = 24

type CommonInfoFormValues = {
    name: string
}

export const CommonInfoSubsection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const AppNameLabel = intl.formatMessage({ id: 'global.newAppForm.appName.label' })
    const SaveLabel = intl.formatMessage({ id: 'global.action.save' })

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

    const appName = get(data, ['objs', '0', 'name'])

    const handleSubmit = useCallback((values: CommonInfoFormValues) => {
        const data = {
            dv: 1,
            sender: getClientSideSenderInfo(),
            ...values,
        }
        updateB2CAppMutation({
            variables: {
                id,
                data,
            },
        })
    }, [id, updateB2CAppMutation])

    return (
        <Form
            name='common-app-info'
            layout='vertical'
            form={form}
            onFinish={handleSubmit}
        >
            <Row gutter={FORM_BUTTON_ROW_GUTTER}>
                <Col span={FULL_COL_SPAN}>
                    <Form.Item name='name' label={AppNameLabel} rules={[trimValidator]}>
                        <Input defaultValue={appName}/>
                    </Form.Item>
                </Col>
                <Col span={FULL_COL_SPAN}>
                    <Button type='primary' htmlType='submit'>{SaveLabel}</Button>
                </Col>
            </Row>
        </Form>
    )
}