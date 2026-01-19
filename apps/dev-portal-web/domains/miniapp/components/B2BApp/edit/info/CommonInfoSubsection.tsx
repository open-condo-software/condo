import { Form, Row, Col } from 'antd'
import pick from 'lodash/pick'
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Input, Button } from '@open-condo/ui'

import { MarkdownEditor } from '@/domains/common/components/MarkdownEditor'
import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { useMutationCompletedHandler } from '@/domains/miniapp/hooks/useMutationCompletedHandler'

import type { RowProps } from 'antd'

import { useGetB2BAppQuery, useUpdateB2BAppMutation } from '@/gql'

const FORM_BUTTON_ROW_GUTTER: RowProps['gutter'] = [32, 32]
const FULL_COL_SPAN = 24
const MAX_DESCRIPTION_LENGTH = 5000
const MD_AREA_MAX_HEIGHT = '300px'
const MD_AREA_MIN_HEIGHT = '200px'

type CommonInfoFormValues = {
    name: string
    developer?: string
}

export const CommonInfoSubsection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const AppNameLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.name.label' })
    const DeveloperNameLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.developer.label' })
    const DeveloperNamePlaceholder = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.developer.placeholder' })
    const DeveloperUrlLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.developerUrl.label' })
    const DeveloperUrlPlaceholder = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.developerUrl.placeholder' })
    const DetailedDescriptionLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.detailedDescription.label' })
    const DetailedDescriptionPlaceholder = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.detailedDescription.placeholder' })
    const SaveLabel = intl.formatMessage({ id: 'global.actions.save' })

    const [form] = Form.useForm()

    const variables = { id }

    const { data } = useGetB2BAppQuery({ variables })

    const onCompleted = useMutationCompletedHandler()
    const onError = useMutationErrorHandler()
    const [updateB2BAppMutation] = useUpdateB2BAppMutation({
        onError,
        onCompleted,
    })

    const { trimValidator, urlValidator } = useValidations()

    const handleSubmit = useCallback((values: CommonInfoFormValues) => {
        console.log(values)
        // updateB2BAppMutation({
        //     variables: {
        //         id,
        //         data: {
        //             dv: 1,
        //             sender: getClientSideSenderInfo(),
        //             ...values,
        //         },
        //     },
        // })
    }, [id, updateB2BAppMutation])

    return (
        <Form
            name='common-app-info'
            layout='vertical'
            form={form}
            onFinish={handleSubmit}
            initialValues={pick(data?.app, ['name', 'developer', 'developerUrl'])}
        >
            <Row gutter={FORM_BUTTON_ROW_GUTTER}>
                <Col span={FULL_COL_SPAN}>
                    <Form.Item name='name' label={AppNameLabel} rules={[trimValidator]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name='developer' label={DeveloperNameLabel}>
                        <Input placeholder={DeveloperNamePlaceholder}/>
                    </Form.Item>
                    <Form.Item name='developerUrl' label={DeveloperUrlLabel} rules={[urlValidator]}>
                        <Input placeholder={DeveloperUrlPlaceholder}/>
                    </Form.Item>
                    <Form.Item name='detailedDescription' label={DetailedDescriptionLabel}>
                        <MarkdownEditor
                            // maxLength={MAX_DESCRIPTION_LENGTH}
                            maxLength={100}
                            maxHeight={MD_AREA_MAX_HEIGHT}
                            minHeight={MD_AREA_MIN_HEIGHT}
                            placeholder={DetailedDescriptionPlaceholder}
                            overflowPolicy='show'
                        />
                    </Form.Item>
                </Col>
                <Col span={FULL_COL_SPAN}>
                    <Button type='primary' htmlType='submit'>{SaveLabel}</Button>
                </Col>
            </Row>
        </Form>
    )
}