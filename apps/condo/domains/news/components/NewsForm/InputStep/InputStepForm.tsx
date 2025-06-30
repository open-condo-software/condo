import { B2BAppNewsSharingConfig } from '@app/condo/schema'
import { Col, FormInstance, Row } from 'antd'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { TextArea } from '@condo/domains/common/components/TextArea'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'
import { getBodyTemplateChangedRule, getTitleTemplateChangedRule, type TemplatesType } from '@condo/domains/news/components/NewsForm/BaseNewsForm'
import { TemplatesSelect } from '@condo/domains/news/components/TemplatesSelect'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'

import { NewsItemDataType } from './index'

import './styles.css'

interface InputStepFormProps {
    newsSharingConfig: B2BAppNewsSharingConfig
    isSharingStep: boolean
    newsItemData: NewsItemDataType
    selectedBody: string
    selectedTitle: string
    form: FormInstance
    sharingAppId: string
    autoFocusBody: boolean
    templates: TemplatesType

    processedInitialValues: {
        formValues: Record<string, unknown>
        preview: {
            renderedTitle: string
            renderedBody: string
        }
        isValid: boolean
    }

    handleTemplateChange: (form: FormInstance) => (value: string) => void
    handleFormTitleChange: (value: string) => void
    handleFormBodyChange: (value: string) => void

    template: {
        title: string
        body: string
        type?: string
        id?: string
        label?: string
        category?: string
    }
}


export const InputStepForm: React.FC<InputStepFormProps> = ({
    sharingAppId,
    newsSharingConfig,
    isSharingStep,
    selectedTitle,
    selectedBody,
    newsItemData,
    templates,
    processedInitialValues,
    form,
    autoFocusBody,
    handleTemplateChange,
    handleFormTitleChange,
    template,
    handleFormBodyChange,
}) => {
    const { type: selectedType } = newsItemData

    const intl = useIntl()

    const MakeTextLabel = intl.formatMessage({ id: 'news.fields.makeText.label' })
    const SelectTextLabel = intl.formatMessage({ id: 'news.fields.text.label' })
    const TitleLabel = intl.formatMessage({ id: 'news.fields.title.label' })
    const TitlePlaceholderMessage = intl.formatMessage({ id: 'news.fields.title.placeholder' })
    const BodyLabel = intl.formatMessage({ id: 'news.fields.body.label' })
    const BodyPlaceholderMessage = intl.formatMessage({ id: 'news.fields.body.placeholder' })
    const TitleErrorMessage = intl.formatMessage({ id: 'news.fields.title.error.length' })
    const BodyErrorMessage = intl.formatMessage({ id: 'news.fields.body.error.length' })
    const TemplateBlanksNotFilledErrorMessage = intl.formatMessage({ id: 'news.fields.template.blanksNotFilledError' })

    const isCustomForm = !!newsSharingConfig?.customFormUrl && isSharingStep

    const { breakpoints } = useLayoutContext()

    const isMediumWindow = !breakpoints.DESKTOP_SMALL
    const formFieldsColSpan = isMediumWindow ? 24 : 14

    const titleRule = useMemo(() => {
        return [{
            whitespace: true,
            required: true,
            message: TitleErrorMessage,
        }, getTitleTemplateChangedRule(TemplateBlanksNotFilledErrorMessage),
        ]}, [TitleErrorMessage, TemplateBlanksNotFilledErrorMessage])
    const bodyRule = useMemo(() => {
        return [{
            whitespace: true,
            required: true,
            message: BodyErrorMessage,
        }, getBodyTemplateChangedRule(TemplateBlanksNotFilledErrorMessage)]
    }, [BodyErrorMessage, TemplateBlanksNotFilledErrorMessage])

    const commonTemplates = useMemo(() => {
        return Object.entries(templates).reduce((result, [key, value]) => {
            if (value.type === NEWS_TYPE_COMMON || value.type === null) {
                result[key] = value
            }
            return result
        }, {} as typeof templates)
    }, [templates])

    const emergencyTemplates = useMemo(() => {
        return Object.entries(templates).reduce((result, [key, value]) => {
            if (value.type === NEWS_TYPE_EMERGENCY || value.type === null) {
                result[key] = value
            }
            return result
        }, {} as typeof templates)
    }, [templates])


    const emergencyTemplatesTabsProps = useMemo(() => Object.keys(emergencyTemplates).map(id => ({
        key: id,
        value: id,
        label: emergencyTemplates[id].label || emergencyTemplates[id].title,
        category: emergencyTemplates[id].category,
    })), [emergencyTemplates])

    const commonTemplatesTabsProps = useMemo(() => Object.keys(commonTemplates).map(id => ({
        key: id,
        value: id,
        label: commonTemplates[id].label || commonTemplates[id].title,
        category: commonTemplates[id].category,
    })), [commonTemplates])

    return (
        <>
            {
                isCustomForm ? (
                    <Col className='custom-form' span={formFieldsColSpan}>
                        <IFrame
                            src={
                                `${newsSharingConfig.customFormUrl}?${[
                                    `ctxId=${sharingAppId}`,
                                    `title=${selectedTitle}`,
                                    `body=${selectedBody}`,
                                    `type=${newsItemData.type}`,
                                    `initialValues=${JSON.stringify(processedInitialValues)}`,
                                    `template=${JSON.stringify(template)}`,
                                ].join('&')
                                }`}
                            reloadScope='organization'
                            withLoader
                            withPrefetch
                            withResize
                        />
                    </Col>
                ) : (
                    <Col span={formFieldsColSpan}>
                        <Row gutter={[0, 60]}>
                            <Col span={24}>
                                <Row gutter={[0, 32]}>
                                    <Col span={24}>
                                        <Typography.Title level={2}>
                                            {MakeTextLabel}
                                        </Typography.Title>
                                    </Col>

                                    {templates && (
                                        <Col span={24}>
                                            <FormItem
                                                name='template'
                                            >
                                                {selectedType === NEWS_TYPE_COMMON && (
                                                    <TemplatesSelect
                                                        onChange={handleTemplateChange(form)}
                                                        items={commonTemplatesTabsProps}
                                                        hasCategories
                                                    />
                                                )}
                                                {selectedType === NEWS_TYPE_EMERGENCY && (
                                                    <TemplatesSelect
                                                        onChange={handleTemplateChange(form)}
                                                        items={emergencyTemplatesTabsProps}
                                                        hasCategories
                                                    />
                                                )}
                                            </FormItem>
                                        </Col>
                                    )}
                                </Row>
                            </Col>

                            <Col span={24}>
                                <Row gutter={[0, 5]}>
                                    <Col span={24} >
                                        <Typography.Title level={4}>{SelectTextLabel}</Typography.Title>
                                    </Col>
                                    <Col span={24}>
                                        <FormItem
                                            label={TitleLabel}
                                            name='title'
                                            required
                                            rules={titleRule}
                                            validateFirst={true}
                                            data-cy='news__create-title-input'
                                        >
                                            <TextArea
                                                className='text-area-no-resize'
                                                rows={4}
                                                placeholder={TitlePlaceholderMessage}
                                                onChange={e=>handleFormTitleChange(e.target.value)}
                                            />
                                        </FormItem>
                                    </Col>
                                </Row>
                                <Col span={24}>
                                    <FormItem
                                        label={BodyLabel}
                                        name='body'
                                        required
                                        rules={bodyRule}
                                        validateFirst={true}
                                        data-cy='news__create-body-input'
                                    >
                                        <TextArea
                                            autoFocus={autoFocusBody}
                                            rows={7}
                                            placeholder={BodyPlaceholderMessage}
                                            onChange={e=>handleFormBodyChange(e.target.value)}
                                        />
                                    </FormItem>
                                </Col>
                            </Col>
                        </Row>
                    </Col>
                )
            }
        </>
    )
}