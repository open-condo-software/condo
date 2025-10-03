import { B2BAppNewsSharingConfig } from '@app/condo/schema'
import { Col, FormInstance, notification, Row, Form } from 'antd'
import classNames from 'classnames'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { CheckCircle, Copy, Sparkles } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import {
    Button,
    Input,
    Tooltip,
    Typography,
} from '@open-condo/ui'

import AIInputNotification from '@condo/domains/ai/components/AIInputNotification'
import { FLOW_TYPES } from '@condo/domains/ai/constants'
import { useAIConfig, useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { analytics } from '@condo/domains/common/utils/analytics'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'
import { getBodyTemplateChangedRule, getTitleTemplateChangedRule, type TemplatesType } from '@condo/domains/news/components/NewsForm/BaseNewsForm'
import { TemplatesSelect } from '@condo/domains/news/components/TemplatesSelect'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'

import styles from './InputStepForm.module.css'

import { NewsItemDataType } from './index'

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
    handleFormTitleChange: (form: FormInstance) => (value: string) => void
    handleFormBodyChange: (form: FormInstance) => (value: string) => void

    template: {
        title: string
        body: string
        type?: string
        id?: string
        label?: string
        category?: string
    }
}

const REFRESH_COPY_BUTTON_INTERVAL_IN_MS = 3000

interface DefaultAiTextAreaProps {
    inputType: 'title' | 'body'
    value: string
    textForContext: string
    handleFormTextChange: (value: string) => void
    autoFocus?: boolean
}

const DefaultAiTextArea: React.FC<DefaultAiTextAreaProps> = ({
    inputType,
    value,
    textForContext,
    handleFormTextChange,
    autoFocus,
}) => {
    const intl = useIntl()

    const TitlePlaceholderMessage = intl.formatMessage({ id: 'news.fields.title.placeholder' })
    const BodyPlaceholderMessage = intl.formatMessage({ id: 'news.fields.body.placeholder' })
    const CopyTooltipText = intl.formatMessage({ id: 'Copy' })
    const CopiedTooltipText = intl.formatMessage({ id: 'Copied' })
    const UpdateTextMessage = intl.formatMessage({ id: 'ai.improveText' })
    const GenericErrorMessage = intl.formatMessage({ id: 'ServerErrorPleaseTryAgainLater' })

    const { status: validationStatus } = Form.Item.useStatus()
    const inputHasError = validationStatus === 'error'

    const { enabled: aiFeaturesEnabled, features: {
        rewriteNewsText: rewriteNewsEnabled,
    } } = useAIConfig()

    const rewriteNewsTextEnabled = useMemo(() => aiFeaturesEnabled && rewriteNewsEnabled,
        [aiFeaturesEnabled, rewriteNewsEnabled])

    const newsTextAreaRef = useRef(null)

    const [rewriteNewsText, setRewriteNewsText] = useState('')
    const [newsTextAiNotificationShow, setNewsTextAiNotificationShow] = useState(false)
    const [copied, setCopied] = useState<boolean>()

    const [runRewriteNewsTextAIFlow, {
        loading: isRewriteNewsTextLoading,
        data: rewriteNewsTextData,
        error: rewriteNewsTextError,
    }] = useAIFlow<{ answer: string }>({
        flowType: FLOW_TYPES.NEWS_REWRITE_TEXT,
    })

    const hasNewsText = useMemo(() => value.length > 0, [value])

    const handleRewriteNewsTextClick = useCallback(async () => {
        const context = {
            promptType: inputType,
            title: inputType === 'title' ? value : textForContext,
            body: inputType === 'body' ? value : textForContext,
        }

        analytics.track('click', {
            value: inputType,
            location: window.location.href,
            component: 'Button',
            type: 'news_rewrite_text_flow',
        })

        const result = await runRewriteNewsTextAIFlow({ context })
        setNewsTextAiNotificationShow(true)

        if (result.error) {
            notification.error({ message: result.localizedErrorText || GenericErrorMessage })
        }
        setRewriteNewsText(result?.data?.answer)
    }, [GenericErrorMessage, inputType, runRewriteNewsTextAIFlow, value, textForContext])

    const handleCloseAINotificationText = useCallback(() => {
        analytics.track('click', {
            value: `${inputType}`,
            type: 'close_ai_notification',
            location: window.location.href,
            component: 'Button',
        })

        setNewsTextAiNotificationShow(false)
    }, [inputType])

    const handleApplyGeneratedMessage = useCallback(() => {
        analytics.track('click', {
            value: `${inputType}`,
            type: 'apply_generated_message',
            location: window.location.href,
            component: 'Button',
        })

        newsTextAreaRef.current?.focus()

        handleCloseAINotificationText()
        if (!rewriteNewsTextError?.cause) {
            handleFormTextChange(rewriteNewsTextData?.answer)
        }
    }, [inputType, handleCloseAINotificationText, rewriteNewsTextError?.cause, handleFormTextChange, rewriteNewsTextData?.answer])

    const handleRegenerateMessage = useCallback(async () => {
        analytics.track('click', {
            value: `${inputType}`,
            type: 'regenerate_comment',
            location: window.location.href,
            component: 'Button',
        })

        await handleRewriteNewsTextClick()
    }, [handleRewriteNewsTextClick, inputType])

    const handleCopyTextClick = useCallback(async () => {
        if (copied) return

        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)

            setTimeout(() => setCopied(false), REFRESH_COPY_BUTTON_INTERVAL_IN_MS)
        } catch (e) {
            console.error('Unable to copy to clipboard', e)
        }
    }, [copied, value])
    
    return (
        <AIInputNotification
            updateLoading={isRewriteNewsTextLoading}
            disableUpdateButton={inputHasError}
            result={rewriteNewsText}
            onApply={handleApplyGeneratedMessage}
            errorMessage={rewriteNewsTextError && GenericErrorMessage}
            onClose={handleCloseAINotificationText}
            onUpdate={handleRegenerateMessage}
            open={newsTextAiNotificationShow}
        >
            <Input.TextArea
                autoFocus={autoFocus}
                className='text-area-no-resize'
                placeholder={inputType === 'title' ? TitlePlaceholderMessage : BodyPlaceholderMessage}
                onChange={e => handleFormTextChange(e.target.value)}
                name={inputType}
                ref={newsTextAreaRef}
                value={value}
                autoSize={{ minRows: 2, maxRows: 5 }}
                disabled={isRewriteNewsTextLoading}
                bottomPanelUtils={[
                    <Tooltip
                        title={copied ? CopiedTooltipText : CopyTooltipText }
                        placement='top'
                        key='copyButton'
                    >
                        <Button
                            minimal
                            compact
                            type='secondary'
                            size='medium'
                            disabled={inputHasError || !hasNewsText || isRewriteNewsTextLoading}
                            onClick={handleCopyTextClick}
                            icon={copied ? (<CheckCircle size='small' />) : (<Copy size='small'/>) }
                        />
                    </Tooltip>,
                    ...(rewriteNewsTextEnabled ? [
                        <Button
                            key='improveButton'
                            compact
                            minimal
                            type='secondary'
                            size='medium'
                            disabled={inputHasError || !hasNewsText || isRewriteNewsTextLoading}
                            loading={isRewriteNewsTextLoading}
                            icon={<Sparkles size='small' />}
                            onClick={handleRewriteNewsTextClick}
                            className={classNames(styles.rewriteTextButton, styles.rewriteButtonWithText)}
                        >
                            {UpdateTextMessage}
                        </Button>,
                    ] : []),
                ]}
            />
        </AIInputNotification>
    )
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
    const BodyLabel = intl.formatMessage({ id: 'news.fields.body.label' })
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
                    <Col className={styles.customForm} span={formFieldsColSpan}>
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
                        <Row gutter={[0, 40]}>
                            <Col span={24}>
                                <Row gutter={[0, 24]}>
                                    <Col span={24}>
                                        <Typography.Title level={2}>
                                            {MakeTextLabel}
                                        </Typography.Title>
                                    </Col>

                                    {templates && (
                                        <Col span={24}>
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
                                </Row>
                            </Col>

                            <Col span={24}>
                                <Row gutter={[0, 24]}>
                                    <Col span={24} >
                                        <Typography.Title level={4}>{SelectTextLabel}</Typography.Title>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            label={TitleLabel}
                                            labelCol={{ className: styles.customFormItemLabel }}
                                            name='title'
                                            required
                                            rules={titleRule}
                                            validateFirst={true}
                                            data-cy='news__create-title-input'
                                        >
                                            <DefaultAiTextArea
                                                inputType='title'
                                                value={selectedTitle}
                                                textForContext={selectedBody}
                                                handleFormTextChange={handleFormTitleChange(form)}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            label={BodyLabel}
                                            labelCol={{ className: styles.customFormItemLabel }}
                                            name='body'
                                            required
                                            rules={bodyRule}
                                            validateFirst={true}
                                            data-cy='news__create-body-input'
                                        >
                                            <DefaultAiTextArea
                                                inputType='body'
                                                value={selectedBody}
                                                textForContext={selectedTitle}
                                                handleFormTextChange={handleFormBodyChange(form)}
                                                autoFocus={autoFocusBody}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                )
            }
        </>
    )
}