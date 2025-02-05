import { B2BAppNewsSharingConfig } from '@app/condo/schema'
import { Col, Form, FormInstance, Row } from 'antd'
import isNull from 'lodash/isNull'
import transform from 'lodash/transform'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useInputWithCounter } from '@condo/domains/common/hooks/useInputWithCounter'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'
import { getBodyTemplateChangedRule, getTitleTemplateChangedRule, type TemplatesType } from '@condo/domains/news/components/NewsForm/BaseNewsForm'
import { TemplatesSelect } from '@condo/domains/news/components/TemplatesSelect'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'

import { NewsItemDataType } from './index'

const NO_RESIZE_STYLE: React.CSSProperties = { resize: 'none' }
const BIG_MARGIN_BOTTOM_STYLE: React.CSSProperties = { marginBottom: '60px' }
const MARGIN_BOTTOM_32_STYLE: React.CSSProperties = { marginBottom: '32px' }
const MARGIN_BOTTOM_10_STYLE: React.CSSProperties = { marginBottom: '10px' }
const FORM_FILED_COL_PROPS = { style: { width: '100%', padding: 0, height: '44px' } }

const buildCounterStyle = (textLength: number, type: 'Body' | 'Title'): React.CSSProperties => {
    const style: React.CSSProperties = {
        position: 'absolute',
        right: 0,
        margin: '12px',
        padding: '2px 10px',
        borderRadius: '100px',
        backgroundColor: `${colors.gray[7]}`,
    }

    if (textLength > 0) {
        style.backgroundColor = `${colors.black}`
    }

    if (type === 'Body') {
        style.bottom = '12px'
    }
    if (type === 'Title') {
        style.bottom = '12px'
    }

    return style
}

interface InputStepFormProps {
    TitleInput: ReturnType<typeof useInputWithCounter>
    BodyInput: ReturnType<typeof useInputWithCounter>
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
    handleFormBodyChange,
    TitleInput: Title,
    BodyInput: Body,
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

    const titleRule = useMemo(() => ({
        whitespace: true,
        required: true,
        message: TitleErrorMessage,
    }), [TitleErrorMessage])
    const MemoizedTitleTemplateChangedRule = useMemo(() => getTitleTemplateChangedRule(TemplateBlanksNotFilledErrorMessage), [TemplateBlanksNotFilledErrorMessage])
    const bodyRule = useMemo(() => ({
        whitespace: true,
        required: true,
        message: BodyErrorMessage,
    }), [BodyErrorMessage])
    const MemoizedBodyTemplateChangedRule = useMemo(() => getBodyTemplateChangedRule(TemplateBlanksNotFilledErrorMessage), [TemplateBlanksNotFilledErrorMessage])

    const commonTemplates = useMemo(() => {
        return transform(templates, (result, value, key) => {
            if (value.type === NEWS_TYPE_COMMON || isNull(value.type)) {
                result[key] = value
            }
        }, {})
    }, [templates])

    const emergencyTemplates = useMemo(() => {
        return transform(templates, (result, value, key) => {
            if (value.type === NEWS_TYPE_EMERGENCY || isNull(value.type)) {
                result[key] = value
            }
        }, {})
    }, [templates])

    const emergencyTemplatesTabsProps = useMemo(() => Object.keys(emergencyTemplates).map(id => ({
        key: id,
        label: emergencyTemplates[id].label || emergencyTemplates[id].title,
        category: emergencyTemplates[id].category,
    })), [emergencyTemplates])

    const commonTemplatesTabsProps = useMemo(() => Object.keys(commonTemplates).map(id => ({
        key: id,
        label: commonTemplates[id].label || emergencyTemplates[id].title,
        category: commonTemplates[id].category,
    })), [commonTemplates])

    return (
        <>
            {
                isCustomForm ? (
                    <Col style={{ marginLeft: '-10px', minHeight: '500px' }} span={formFieldsColSpan}>
                        <IFrame
                            src={
                                `${newsSharingConfig.customFormUrl}?ctxId=${sharingAppId}&title=${selectedTitle}&body=${selectedBody}&type=${newsItemData.type}&initialValues=${JSON.stringify(processedInitialValues)}`
                            }
                            reloadScope='organization'
                            withLoader
                            withPrefetch
                            withResize
                        />
                    </Col>
                ) : (
                    <Col span={formFieldsColSpan}>
                        <Row>
                            <Col span={24} style={MARGIN_BOTTOM_32_STYLE}>
                                <Typography.Title level={2}>
                                    {MakeTextLabel}
                                </Typography.Title>
                            </Col>

                            {templates && (
                                <Col span={24} style={BIG_MARGIN_BOTTOM_STYLE}>
                                    <Form.Item
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
                                    </Form.Item>
                                </Col>
                            )}

                            <Col span={24}>
                                <Col span={24} style={MARGIN_BOTTOM_10_STYLE}>
                                    <Typography.Title level={4}>{SelectTextLabel}</Typography.Title>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        label={TitleLabel}
                                        labelCol={FORM_FILED_COL_PROPS}
                                        name='title'
                                        required
                                        rules={[titleRule, MemoizedTitleTemplateChangedRule]}
                                        validateFirst={true}
                                        data-cy='news__create-title-input'
                                    >
                                        <Title.InputWithCounter
                                            style={NO_RESIZE_STYLE}
                                            rows={4}
                                            placeholder={TitlePlaceholderMessage}
                                            onChange={e=>handleFormTitleChange(e.target.value)}
                                        />
                                    </Form.Item>
                                    <Col style={buildCounterStyle(Title.textLength, 'Title')}>
                                        <Title.Counter type='inverted'/>
                                    </Col>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        label={BodyLabel}
                                        labelCol={FORM_FILED_COL_PROPS}
                                        name='body'
                                        required
                                        rules={[bodyRule, MemoizedBodyTemplateChangedRule]}
                                        validateFirst={true}
                                        data-cy='news__create-body-input'
                                    >
                                        <Body.InputWithCounter
                                            autoFocus={autoFocusBody}
                                            style={NO_RESIZE_STYLE}
                                            rows={7}
                                            placeholder={BodyPlaceholderMessage}
                                            onChange={e=>handleFormBodyChange(e.target.value)}
                                        />
                                    </Form.Item>
                                    <Col style={buildCounterStyle(Body.textLength, 'Body')}>
                                        <Body.Counter type='inverted'/>
                                    </Col>
                                </Col>
                            </Col>
                        </Row>
                    </Col>
                )
            }
        </>
    )
}