import { B2BAppNewsSharingConfig } from '@app/condo/schema'
import { Col, FormInstance, notification, Row } from 'antd'
import classNames from 'classnames'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { CheckCircle, Copy, Sparkles } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Input, Tooltip, Typography } from '@open-condo/ui'


import AIInputNotification from '@condo/domains/ai/components/AIInputNotification'
import { FLOW_TYPES } from '@condo/domains/ai/constants'
import { useAIConfig, useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { FormItem } from '@condo/domains/common/components/Form/FormItem'
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
    selectedText: string
    textForContext: string
    handleFormTextChange: (value: string) => void
    autoFocus?: boolean
}

const DefaultAiTextArea: React.FC<DefaultAiTextAreaProps> = ({
    inputType,
    selectedText,
    textForContext,
    handleFormTextChange,
    autoFocus,
}) => {
    const intl = useIntl()

    const TitlePlaceholderMessage = intl.formatMessage({ id: 'news.fields.title.placeholder' })
    const BodyPlaceholderMessage = intl.formatMessage({ id: 'news.fields.body.placeholder' })
    const CopyTooltipText = intl.formatMessage({ id: 'Copy' })
    const CopiedTooltipText = intl.formatMessage({ id: 'Copied' })
    const UpdateTextMessage = intl.formatMessage({ id: 'ai.updateText' })
    const GenericErrorMessage = intl.formatMessage({ id: 'ServerErrorPleaseTryAgainLater' })

    const { enabled: aiFeaturesEnabled, features: {
        rewriteNewsText: rewriteNewsEnabled,
    } } = useAIConfig()

    const rewriteNewsTextEnabled = useMemo(() => aiFeaturesEnabled && rewriteNewsEnabled,
        [aiFeaturesEnabled, rewriteNewsEnabled])

    const newsTextAreaRef = useRef(null)

    const [prevRewriteNewsText, setPrevRewriteNewsText] = useState('')
    const [newsTextAiNotificationShow, setNewsTextAiNotificationShow] = useState(false)
    const [isUpdateLoading, setIsUpdateLoading] = useState(false)
    const [copied, setCopied] = useState<boolean>()

    const [runRewriteTitleAIFlow, {
        loading: rewriteNewsTextLoading,
        data: rewriteNewsTextData,
        error: rewriteNewsTextError,
    }] = useAIFlow<{ answer: string }>({
        flowType: FLOW_TYPES.NEWS_REWRITE_TEXT_FLOW_TYPE,
    })

    const hasNewsText = useMemo(() => selectedText.length > 0, [selectedText])

    const handleRewriteNewsTextClick = useCallback(async () => {
        const context = {
            promptType: inputType,
            title: inputType === 'title' ? selectedText : textForContext,
            body: inputType === 'body' ? selectedText : textForContext,
        }

        analytics.track('click', {
            value: inputType,
            location: window.location.href,
            component: 'Button',
            type: 'news_rewrite_text_flow',
        })

        const result = await runRewriteTitleAIFlow({ context })
        setNewsTextAiNotificationShow(true)

        if (result.error) {
            notification.error({ message: result.localizedErrorText || GenericErrorMessage })
        }
    }, [GenericErrorMessage, inputType, runRewriteTitleAIFlow, selectedText, textForContext])

    const handleCopyTextClick = useCallback(async () => {
        if (copied) return

        try {
            await navigator.clipboard.writeText(selectedText)
            setCopied(true)

            setTimeout(() => setCopied(false), REFRESH_COPY_BUTTON_INTERVAL_IN_MS)
        } catch (e) {
            console.error('Unable to copy to clipboard', e)
        }
    }, [copied, selectedText])

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
        if (!rewriteNewsTextError?.cause) handleFormTextChange(rewriteNewsTextData?.answer)
    }, [inputType, handleCloseAINotificationText, rewriteNewsTextError?.cause, handleFormTextChange, rewriteNewsTextData?.answer])

    const handleRegenerateMessage = useCallback(() => {
        analytics.track('click', {
            value: `${inputType}`,
            type: 'regenerate_comment',
            location: window.location.href,
            component: 'Button',
        })
        setIsUpdateLoading(true)
        setPrevRewriteNewsText(rewriteNewsTextData?.answer)

        handleRewriteNewsTextClick()
            .then(() => setIsUpdateLoading(false))
            .catch(() => setIsUpdateLoading(false))
    }, [handleRewriteNewsTextClick, inputType, rewriteNewsTextData?.answer])
    
    return (
        <AIInputNotification
            updateLoading={isUpdateLoading}
            result={rewriteNewsTextData?.answer || prevRewriteNewsText}
            onApply={handleApplyGeneratedMessage}
            errorMessage={GenericErrorMessage}
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
                value={selectedText}
                autoSize={{ minRows: 1, maxRows: 5 }}
                disabled={rewriteNewsTextLoading}
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
                            disabled={!hasNewsText || rewriteNewsTextLoading}
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
                            disabled={!hasNewsText || rewriteNewsTextLoading}
                            loading={rewriteNewsTextLoading && !isUpdateLoading}
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
                                            <DefaultAiTextArea
                                                inputType='title'
                                                selectedText={selectedTitle}
                                                textForContext={selectedBody}
                                                handleFormTextChange={handleFormTitleChange(form)}
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
                                        <DefaultAiTextArea
                                            inputType='body'
                                            selectedText={selectedBody}
                                            textForContext={selectedTitle}
                                            handleFormTextChange={handleFormBodyChange(form)}
                                            autoFocus={autoFocusBody}
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