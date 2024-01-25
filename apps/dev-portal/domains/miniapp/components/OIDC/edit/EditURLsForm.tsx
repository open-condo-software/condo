import { Form, Row, Col } from 'antd'
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { Input, Button } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { getClientSideSenderInfo } from '@/domains/common/utils/userid.utils'
import { useMutationCompletedHandler } from '@/domains/miniapp/hooks/useMutationCompletedHandler'

import type { RowProps } from 'antd'

import { useUpdateOidcClientMutation } from '@/lib/gql'

const FORM_BUTTON_ROW_GUTTER: RowProps['gutter'] = [32, 32]
const FULL_COL_SPAN = 24

type EditURLsFormProps = {
    id: string
    developmentRedirectUri?: string | null
    productionRedirectUri?: string | null
}

type EditURLsFormValues = { [key in keyof Omit<EditURLsFormProps, 'id'>]?: string }

const DEV_URL_EXAMPLE = 'https://dev.miniapp.com/oidc/callback'
const PROD_URL_EXAMPLE = 'https://prod.miniapp.com/oidc/callback'

export const EditURLsForm: React.FC<EditURLsFormProps> = ({ id, developmentRedirectUri, productionRedirectUri }) => {
    const intl = useIntl()
    const DevUriLabel = intl.formatMessage({ id: 'apps.b2c.sections.oidc.editUrlsSubsection.form.items.developmentRedirectUri.label' })
    const ProdUriLabel = intl.formatMessage({ id: 'apps.b2c.sections.oidc.editUrlsSubsection.form.items.productionRedirectUri.label' })
    const SaveButtonLabel = intl.formatMessage({ id: 'apps.b2c.sections.oidc.editUrlsSubsection.form.actions.save' })

    const [form] = Form.useForm()
    const { urlValidator } = useValidations()
    const onError = useMutationErrorHandler()
    const onCompleted = useMutationCompletedHandler()
    const [updateClientMutation] = useUpdateOidcClientMutation({
        onError,
        onCompleted,
    })

    const updateClient = useCallback((values: EditURLsFormValues) => {
        updateClientMutation({
            variables: {
                id,
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    ...values,
                },
            },
        })
    }, [updateClientMutation, id])

    return (
        <Form
            name='edit-oidc-urls'
            layout='vertical'
            form={form}
            onFinish={updateClient}
        >
            <Row gutter={FORM_BUTTON_ROW_GUTTER}>
                <Col span={FULL_COL_SPAN}>
                    <Form.Item
                        name='developmentRedirectUri'
                        label={DevUriLabel}
                        rules={[urlValidator]}
                    >
                        <Input placeholder={DEV_URL_EXAMPLE} defaultValue={developmentRedirectUri || undefined}/>
                    </Form.Item>
                    <Form.Item
                        name='productionRedirectUri'
                        label={ProdUriLabel}
                        rules={[urlValidator]}
                    >
                        <Input placeholder={PROD_URL_EXAMPLE} defaultValue={productionRedirectUri || undefined}/>
                    </Form.Item>
                </Col>
                <Col span={FULL_COL_SPAN}>
                    <Button type='primary' htmlType='submit'>{SaveButtonLabel}</Button>
                </Col>
            </Row>
        </Form>
    )
}