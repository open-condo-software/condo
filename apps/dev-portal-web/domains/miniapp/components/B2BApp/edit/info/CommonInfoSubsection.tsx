import { Form, Row, Col } from 'antd'
import pick from 'lodash/pick'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Input, Button, Select } from '@open-condo/ui'

import { MarkdownEditor } from '@/domains/common/components/MarkdownEditor'
import { useMarkdownLengthValidation } from '@/domains/common/hooks/useMarkdownLengthValidation'
import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { useMutationCompletedHandler } from '@/domains/miniapp/hooks/useMutationCompletedHandler'

import type { GetB2BAppQuery } from '@/gql'
import type { RowProps } from 'antd'

import { useGetB2BAppQuery, useUpdateB2BAppMutation, B2BAppCategoryType } from '@/gql'

const FORM_BUTTON_ROW_GUTTER: RowProps['gutter'] = [32, 32]
const FULL_COL_SPAN = 24
const MAX_DETAILED_DESCRIPTION_LENGTH = 5000
const MAX_SHORT_DESCRIPTION_LENGTH = 70
const MD_AREA_MAX_HEIGHT = '300px'
const MD_AREA_MIN_HEIGHT = '200px'

type CommonInfoFormValues = {
    name: string
    developer?: string
    developerUrl?: string
    detailedDescription?: string
    shortDescription?: string
    category?: B2BAppCategoryType
}

function getInitialValues (app: GetB2BAppQuery['app']): Record<string, string | undefined> {
    return Object.fromEntries(
        Object.entries(pick(app, ['name', 'developer', 'developerUrl', 'detailedDescription', 'shortDescription', 'category'])).map(([key, value]) => [key, value ?? undefined])
    ) as Record<string, string | undefined>
}

export const CommonInfoSubsection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const AppNameLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.name.label' })
    const CategoryLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.category.label' })
    const DeveloperNameLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.developer.label' })
    const DeveloperNamePlaceholder = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.developer.placeholder' })
    const DeveloperUrlLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.developerUrl.label' })
    const DeveloperUrlPlaceholder = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.developerUrl.placeholder' })
    const DetailedDescriptionLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.detailedDescription.label' })
    const DetailedDescriptionPlaceholder = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.detailedDescription.placeholder' })
    const DetailedDescriptionTooltip = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.detailedDescription.tooltip' })
    const DetailedDescriptionTooLongErrorText = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.detailedDescription.errors.tooLong.message' })
    const ShortDescriptionLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.shortDescription.label' })
    const ShortDescriptionPlaceholder = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.shortDescription.placeholder' })
    const ShortDescriptionTooltip = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.form.items.shortDescription.tooltip' })
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
    const markdownValidator = useMarkdownLengthValidation({
        form,
        fieldName: 'detailedDescription',
        message: DetailedDescriptionTooLongErrorText,
        maxLength: MAX_DETAILED_DESCRIPTION_LENGTH,
        minHeaderLevel: 2,
        maxHeaderLevel: 3,
    })

    const categoryOptions = useMemo(() =>
        Object.values(B2BAppCategoryType)
            .map((category) => ({
                label: intl.formatMessage({ id:`pages.apps.b2b.id.sections.info.commonInfo.form.items.category.options.${category}.label` }),
                value: category,
            })), [intl])

    const handleSubmit = useCallback((values: CommonInfoFormValues) => {
        updateB2BAppMutation({
            variables: {
                id,
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    ...values,
                },
            },
        })
    }, [id, updateB2BAppMutation])

    return (
        <Form
            name='common-app-info'
            layout='vertical'
            form={form}
            onFinish={handleSubmit}
            initialValues={getInitialValues(data?.app)}
        >
            <Row gutter={FORM_BUTTON_ROW_GUTTER}>
                <Col span={FULL_COL_SPAN}>
                    <Form.Item name='name' label={AppNameLabel} rules={[trimValidator]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name='category' label={CategoryLabel}>
                        <Select options={categoryOptions}/>
                    </Form.Item>
                    <Form.Item name='developer' label={DeveloperNameLabel}>
                        <Input placeholder={DeveloperNamePlaceholder}/>
                    </Form.Item>
                    <Form.Item name='developerUrl' label={DeveloperUrlLabel} rules={[urlValidator]}>
                        <Input placeholder={DeveloperUrlPlaceholder}/>
                    </Form.Item>
                    <Form.Item
                        name='detailedDescription'
                        label={DetailedDescriptionLabel}
                        rules={[markdownValidator]}
                        validateTrigger='onBlur'
                        tooltip={DetailedDescriptionTooltip}
                    >
                        <MarkdownEditor
                            maxLength={MAX_DETAILED_DESCRIPTION_LENGTH}
                            maxHeight={MD_AREA_MAX_HEIGHT}
                            minHeight={MD_AREA_MIN_HEIGHT}
                            placeholder={DetailedDescriptionPlaceholder}
                            overflowPolicy='show'
                        />
                    </Form.Item>
                    <Form.Item
                        name='shortDescription'
                        label={ShortDescriptionLabel}
                        tooltip={ShortDescriptionTooltip}
                    >
                        <Input.TextArea maxLength={MAX_SHORT_DESCRIPTION_LENGTH} placeholder={ShortDescriptionPlaceholder}/>
                    </Form.Item>
                </Col>
                <Col span={FULL_COL_SPAN}>
                    <Button type='primary' htmlType='submit'>{SaveLabel}</Button>
                </Col>
            </Row>
        </Form>
    )
}