import { B2BAppNewsSharingConfig } from '@app/condo/schema'
import { Col, FormInstance, notification, Row } from 'antd'
import classNames from 'classnames'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { CheckCircle, Copy, Sparkles } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Input, Tooltip, Typography } from '@open-condo/ui'

import AIInputNotification from '@condo/domains/ai/components/AIInputNotification'
import { FLOW_TYPES } from '@condo/domains/ai/constants'
import { useAIConfig, useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
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

const REFRESH_COPY_BUTTON_INTERVAL_IN_MS = 3000

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
    const { type: selectedType, validBefore } = newsItemData

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
    const CopyTooltipText = intl.formatMessage({ id: 'Copy' })
    const CopiedTooltipText = intl.formatMessage({ id: 'Copied' })
    const UpdateTextMessage = intl.formatMessage({ id: 'ai.updateText' })
    const GenericErrorMessage = intl.formatMessage({ id: 'ServerErrorPleaseTryAgainLater' })

    const isCustomForm = !!newsSharingConfig?.customFormUrl && isSharingStep

    const { enabled: aiFeaturesEnabled, features: {
        rewriteNewsText: rewriteNewsEnabled,
    } } = useAIConfig()

    const rewriteNewsTextEnabled = useMemo(() => aiFeaturesEnabled && rewriteNewsEnabled,
        [aiFeaturesEnabled, rewriteNewsEnabled])

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

    const [errorMessage, setErrorMessage] = useState('')
    const [errorMessageBody, setErrorMessageBody] = useState('')
    const [rewriteNewsTitleTextAnswer, setRewriteNewsTitleTextAnswer] = useState('')
    const [rewriteNewsBodyTextAnswer, setRewriteNewsBodyTextAnswer] = useState('')
    const [newsTitleAiNotificationShow, setNewsTitleAiNotificationShow] = useState(false)
    const [newsBodyAiNotificationShow, setNewsBodyAiNotificationShow] = useState(false)
    const [isUpdateLoading, setIsUpdateLoading] = useState(false)
    const [isUpdateBodyLoading, setIsUpdateBodyLoading] = useState(false)
    const [newsTitleValue, setNewsTitleValue] = useState('')
    const [newsBodyValue, setNewsBodyValue] = useState('')
    const [copied, setCopied] = useState<boolean>()

    const [runRewriteTextAIFlow, {
        loading: rewriteTextLoading,
        data: rewriteNewsTextData,
    }] = useAIFlow<{ answer: string }>({
        flowType: FLOW_TYPES.NEWS_REWRITE_TEXT_FLOW_TYPE,
    })

    const [runRewriteNewsBodyAIFlow, {
        loading: rewriteNewsBodyLoading,
        data: rewriteNewsBodyTextData,
    }] = useAIFlow<{ answer: string }>({
        flowType: FLOW_TYPES.NEWS_REWRITE_TEXT_FLOW_TYPE,
    })

    useEffect(() => {
        setRewriteNewsTitleTextAnswer(rewriteNewsTextData?.answer)
    }, [rewriteNewsTextData?.answer])

    useEffect(() => {
        setRewriteNewsBodyTextAnswer(rewriteNewsBodyTextData?.answer)
    }, [rewriteNewsBodyTextData?.answer])

    const commentTextAreaRef = useRef(null)
    const newsBodyTextAreaRef = useRef(null)

    const handleRewriteNewsTitleTextClick = async () => {
        const context = {
            promptType: 'header',
            newsTitle: newsTitleValue,
            newsBody: newsBodyValue,

            newsType: selectedType,
            validBefore: validBefore || '',
            // incidents: { type: 'string' },
            // lastNewsTitle: { type: 'string' },
            // lastNewsBody: { type: 'string' },
        }

        // analytics.track('click', {
        //     value: ticketId,
        //     location: window.location.href,
        //     component: 'Button',
        //     type: 'rewrite_text',
        // })

        const result = await runRewriteTextAIFlow({ context })

        if (result.error) {
            setErrorMessage(result.localizedErrorText || GenericErrorMessage)
            notification.error({ message: result.localizedErrorText || GenericErrorMessage })
        }
    }

    const handleRewriteNewsBodyTextClick = async () => {
        const context = {
            promptType: 'body',
            newsTitle: newsTitleValue,
            newsBody: newsBodyValue,

            newsType: selectedType,
            validBefore: validBefore || '',
            // incidents: { type: 'string' },
            // lastNewsTitle: { type: 'string' },
            // lastNewsBody: { type: 'string' },
        }

        // analytics.track('click', {
        //     value: ticketId,
        //     location: window.location.href,
        //     component: 'Button',
        //     type: 'rewrite_text',
        // })

        const result = await runRewriteNewsBodyAIFlow({ context })

        if (result.error) {
            setErrorMessageBody(result.localizedErrorText || GenericErrorMessage)
            notification.error({ message: result.localizedErrorText || GenericErrorMessage })
        }
    }

    const handleCopyTitleClick = useCallback(async () => {
        if (copied) return

        try {
            await navigator.clipboard.writeText(newsTitleValue)
            setCopied(true)

            setTimeout(() => setCopied(false), REFRESH_COPY_BUTTON_INTERVAL_IN_MS)
        } catch (e) {
            console.error('Unable to copy to clipboard', e)
        }
    }, [copied, newsTitleValue])

    const handleCopyBodyClick = useCallback(async () => {
        if (copied) return

        try {
            await navigator.clipboard.writeText(newsBodyValue)
            setCopied(true)

            setTimeout(() => setCopied(false), REFRESH_COPY_BUTTON_INTERVAL_IN_MS)
        } catch (e) {
            console.error('Unable to copy to clipboard', e)
        }
    }, [copied, newsBodyValue])

    const hasTitleText = useMemo(() => newsTitleValue.length > 0, [newsTitleValue])
    const hasBodyText = useMemo(() => newsBodyValue.length > 0, [newsBodyValue])
    const isInputDisable = rewriteTextLoading || rewriteNewsBodyLoading

    const closeAINotification = useCallback((type) => {
        if (type === 'title') {
            setNewsTitleAiNotificationShow(false)
            setRewriteNewsTitleTextAnswer('')
            setErrorMessage('')
        } else {
            setNewsBodyAiNotificationShow(false)
            setRewriteNewsBodyTextAnswer('')
            setErrorMessageBody('')
        }

    }, [])

    const handleCloseAINotificationTitle = () => {
        // analytics.track('click', {
        //     value: `ticketId: ${ticketId}`,
        //     type: 'close_ai_notification',
        //     location: window.location.href,
        //     component: 'Button',
        // })

        closeAINotification('title')
    }

    const handleCloseAINotificationBody = () => {
        // analytics.track('click', {
        //     value: `ticketId: ${ticketId}`,
        //     type: 'close_ai_notification',
        //     location: window.location.href,
        //     component: 'Button',
        // })

        closeAINotification('body')
    }

    const handleApplyGeneratedMessage = () => {
        // analytics.track('click', {
        //     value: `ticketId: ${ticketId}`,
        //     type: 'apply-generated_message',
        //     location: window.location.href,
        //     component: 'Button',
        // })

        commentTextAreaRef.current.focus()

        closeAINotification('title')
        if (!errorMessage) setNewsTitleValue(rewriteNewsTitleTextAnswer)
    }

    const handleApplyBodyGeneratedMessage = () => {
        // analytics.track('click', {
        //     value: `ticketId: ${ticketId}`,
        //     type: 'apply-generated_message',
        //     location: window.location.href,
        //     component: 'Button',
        // })

        newsBodyTextAreaRef.current.focus()

        closeAINotification('body')
        if (!errorMessage) setNewsBodyValue(rewriteNewsBodyTextAnswer)
    }

    const handleRegenerateMessage = () => {
        // analytics.track('click', {
        //     value: `ticketId: ${ticketId}`,
        //     type: 'regenerate_comment',
        //     location: window.location.href,
        //     component: 'Button',
        // })
        setIsUpdateLoading(true)

        if (rewriteNewsTitleTextAnswer) handleRewriteNewsTitleTextClick().then(() => setIsUpdateLoading(false))
    }

    const handleRegenerateBodyMessage = () => {
        // analytics.track('click', {
        //     value: `ticketId: ${ticketId}`,
        //     type: 'regenerate_comment',
        //     location: window.location.href,
        //     component: 'Button',
        // })
        setIsUpdateBodyLoading(true)

        if (rewriteNewsTitleTextAnswer) handleRewriteNewsBodyTextClick().then(() => setIsUpdateBodyLoading(false))
    }

    useEffect(() => {
        if (( errorMessage || rewriteNewsTitleTextAnswer)) {
            setNewsTitleAiNotificationShow(true)
        }

        if (( errorMessageBody || rewriteNewsBodyTextAnswer)) {
            setNewsBodyAiNotificationShow(true)
        }
    }, [errorMessage, errorMessageBody, rewriteNewsTitleTextAnswer, rewriteNewsBodyTextAnswer, setNewsTitleAiNotificationShow, setNewsBodyAiNotificationShow])

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
                                            <AIInputNotification
                                                targetRef={commentTextAreaRef}
                                                updateLoading={isUpdateLoading}
                                                result={rewriteNewsTitleTextAnswer}
                                                onApply={handleApplyGeneratedMessage}
                                                errorMessage={errorMessage}
                                                onClose={handleCloseAINotificationTitle}
                                                onUpdate={handleRegenerateMessage}
                                                open={newsTitleAiNotificationShow}
                                            >
                                                <Input.TextArea
                                                    className='text-area-no-resize'
                                                    rows={4}
                                                    placeholder={TitlePlaceholderMessage}
                                                    onChange={e => setNewsTitleValue(e.target.value)}
                                                    // name={fieldName}
                                                    ref={commentTextAreaRef}
                                                    value={newsTitleValue}
                                                    autoSize={{ minRows: 1, maxRows: 5 }}
                                                    disabled={isInputDisable}
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
                                                                disabled={!hasTitleText || isInputDisable}
                                                                onClick={handleCopyTitleClick}
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
                                                                disabled={!hasTitleText || isInputDisable}
                                                                loading={rewriteTextLoading}
                                                                icon={<Sparkles size='small' />}
                                                                onClick={handleRewriteNewsTitleTextClick}
                                                                className={classNames(styles.rewriteTextButton, styles.rewriteButtonWithText)}
                                                            >
                                                                {UpdateTextMessage}
                                                            </Button>,
                                                        ] : []),
                                                    ]}
                                                />
                                            </AIInputNotification>
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
                                        <AIInputNotification
                                            targetRef={newsBodyTextAreaRef}
                                            updateLoading={isUpdateBodyLoading}
                                            result={rewriteNewsBodyTextAnswer}
                                            onApply={handleApplyBodyGeneratedMessage}
                                            errorMessage={errorMessageBody}
                                            onClose={handleCloseAINotificationBody}
                                            onUpdate={handleRegenerateBodyMessage}
                                            open={newsBodyAiNotificationShow}
                                        >
                                            <Input.TextArea
                                                autoFocus={autoFocusBody}
                                                rows={7}
                                                className='text-area-no-resize'
                                                placeholder={BodyPlaceholderMessage}
                                                onChange={e => setNewsBodyValue(e.target.value)}
                                                // name={fieldName}
                                                ref={newsBodyTextAreaRef}
                                                value={newsBodyValue}
                                                autoSize={{ minRows: 1, maxRows: 5 }}
                                                disabled={isInputDisable}
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
                                                            disabled={!hasBodyText || isInputDisable}
                                                            onClick={handleCopyBodyClick}
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
                                                            disabled={!hasBodyText || isInputDisable}
                                                            loading={rewriteNewsBodyLoading}
                                                            icon={<Sparkles size='small' />}
                                                            onClick={handleRewriteNewsBodyTextClick}
                                                            className={classNames(styles.rewriteTextButton, styles.rewriteButtonWithText)}
                                                        >
                                                            {UpdateTextMessage}
                                                        </Button>,
                                                    ] : []),
                                                ]}
                                            />
                                        </AIInputNotification>
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