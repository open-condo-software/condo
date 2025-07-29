import { Form, FormInstance, InputRef } from 'antd'
import classNames from 'classnames'
import cookie from 'js-cookie'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { CheckCircle, Copy, Paperclip, Sparkles } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Input, Button, Tour, Tooltip } from '@open-condo/ui'

import AIInputNotification from '@condo/domains/ai/components/AIInputNotification'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { Module, useMultipleFileUploadHook } from '@condo/domains/common/components/MultipleFileUpload'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { analytics } from '@condo/domains/common/utils/analytics'
import { GENERATE_COMMENT_TOUR_STEP_CLOSED_COOKIE, UPDATE_COMMENT_TOUR_STEP_CLOSED_COOKIE } from '@condo/domains/ticket/constants/common'

import styles from './Comments.module.css'

import { CommentWithFiles } from './index'

const REFRESH_COPY_BUTTON_INTERVAL_IN_MS = 3000
const ENTER_KEY_CODE = 13
const TourStepZIndex = 1071

interface IRewriteTextButtonProps {
    hasText: boolean
    isInputDisable: boolean
    rewriteTextLoading: boolean
    onClick: () => void
}

const RewriteTextButton: React.FC<IRewriteTextButtonProps> = ({
    hasText,
    isInputDisable,
    rewriteTextLoading,
    onClick,
}) => {
    const intl = useIntl()
    const UpdateTextMessage = intl.formatMessage({ id: 'ai.updateText' })
    const TourUpdateTextTitle = intl.formatMessage({ id: 'ai.updateText.tour.title' })
    const TourUpdateTextMessage = intl.formatMessage({ id: 'ai.updateText.tour.message' })

    const { currentStep, setCurrentStep } = Tour.useTourContext()

    const closeTourStep = useCallback(() => {
        if (currentStep === 2) {
            cookie.set(UPDATE_COMMENT_TOUR_STEP_CLOSED_COOKIE, true)
            setCurrentStep(0)
        }
    }, [currentStep, setCurrentStep])

    return (
        <Tour.TourStep
            step={2}
            key='aiButton'
            placement='top'
            zIndex={TourStepZIndex}
            title={TourUpdateTextTitle}
            message={TourUpdateTextMessage}
            onClose={closeTourStep}
        >
            <Button
                compact
                minimal
                type='secondary'
                size='medium'
                disabled={!hasText || isInputDisable}
                loading={rewriteTextLoading}
                icon={<Sparkles size='small' />}
                onClick={onClick}
                className={classNames(styles.rewriteTextButton, styles.rewriteButtonWithText)}
            >
                {UpdateTextMessage}
            </Button>

            <Tooltip title={UpdateTextMessage} placement='top' className={styles.rewriteButtonTextWithTooltip}>
                <Button
                    compact
                    minimal
                    type='secondary'
                    size='medium'
                    disabled={!hasText || isInputDisable}
                    loading={rewriteTextLoading}
                    icon={<Sparkles size='small' />}
                    onClick={onClick}
                    className={styles.rewriteTextButton}
                />
            </Tooltip>
        </Tour.TourStep>
    )
}

interface ICommentFormProps {
    commentForm: FormInstance
    ticketId: string
    action: (formValues, syncModifiedFiles) => Promise<any>
    fieldName?: string
    initialValue?: string
    editableComment: CommentWithFiles
    setEditableComment: React.Dispatch<React.SetStateAction<CommentWithFiles>>
    sending: boolean
    FileModel: Module
    relationField: string
    setSending: React.Dispatch<React.SetStateAction<boolean>>
    generateCommentLoading: boolean
    rewriteTextLoading: boolean
    generateCommentAnswer?: string
    errorMessage?: string
    setGenerateCommentAnswer: (value: string) => void
    setErrorMessage: (value: string) => void
    rewriteTextAnswer?: string
    setRewriteTextAnswer: (value: string) => void
    generateCommentClickHandler: () => Promise<void>
    rewriteTextOnClickHandler: () => Promise<void>
    commentTextAreaRef: null | React.MutableRefObject<InputRef>
    rewriteCommentEnabled: boolean
    aiNotificationShow: boolean
    setAiNotificationShow: (value: boolean) => void
}

const CommentForm: React.FC<ICommentFormProps> = ({
    commentForm,
    rewriteCommentEnabled,
    commentTextAreaRef,
    ticketId,
    initialValue,
    action,
    fieldName,
    editableComment,
    sending,
    FileModel,
    relationField,
    generateCommentLoading,
    rewriteTextOnClickHandler,
    generateCommentAnswer,
    rewriteTextLoading,
    rewriteTextAnswer,
    setRewriteTextAnswer,
    setSending,
    setEditableComment,
    errorMessage,
    setGenerateCommentAnswer,
    setErrorMessage,
    generateCommentClickHandler,
    aiNotificationShow,
    setAiNotificationShow,
}) => {
    const intl = useIntl()
    const PlaceholderMessage = intl.formatMessage({ id: 'Comments.form.placeholder' })
    const UploadTooltipText = intl.formatMessage({ id: 'component.uploadlist.AddFileLabel' })
    const CopyTooltipText = intl.formatMessage({ id: 'Copy' })
    const CopiedTooltipText = intl.formatMessage({ id: 'Copied' })

    const editableCommentFiles = editableComment?.files
    const [commentValue, setCommentValue] = useState('')
    const [copied, setCopied] = useState<boolean>()
    const [isUpdateLoading, setIsUpdateLoading] = useState(false)

    const { currentStep, setCurrentStep } = Tour.useTourContext()

    const { UploadComponent, syncModifiedFiles, resetModifiedFiles, filesCount } = useMultipleFileUploadHook({
        Model: FileModel,
        relationField: relationField,
        initialFileList: editableCommentFiles,
        initialCreateValues: { ticket: { connect: { id: ticketId } } },
        dependenciesForRerenderUploadComponent: [editableComment],
    })

    useEffect(() => {
        if (editableComment && commentForm) {
            const editableCommentContent = editableComment.content

            setCommentValue(editableCommentContent)
            commentForm.setFieldsValue({ [fieldName]: editableCommentContent })
        }
    }, [editableComment, fieldName, commentForm])

    const submitComment = useCallback((form: FormInstance) => {
        if (commentValue && commentValue.trim().length > 0 || filesCount > 0) {
            setSending(true)
            form.submit()

            analytics.track('ticket_comment_submit', {})
        }
    }, [commentValue, filesCount, setSending])

    const handelSendMessage = useCallback((form: FormInstance) => {
        submitComment(form)
    }, [submitComment])

    const handleKeyUp = useCallback((form: FormInstance) => async (event) => {
        if (event.keyCode === ENTER_KEY_CODE && !event.shiftKey) {
            submitComment(form)
        }
    }, [submitComment])

    const handleKeyDown = useCallback((event) => {
        if (event.keyCode === ENTER_KEY_CODE) {
            event.preventDefault()
        }
    }, [])

    const { trimValidator } = useValidations()

    const validations = useMemo(() => ({
        [fieldName]: filesCount > 0 ? [] : [trimValidator],
    }), [fieldName, filesCount, trimValidator])

    const actionWithSyncComments = useCallback(async (values) => {
        values.content = commentForm.getFieldValue(fieldName)
        commentForm.setFieldsValue({ [fieldName]: null })

        await action(values, syncModifiedFiles)
        await resetModifiedFiles()
        setSending(false)
        setCommentValue('')
    }, [action, fieldName, commentForm, resetModifiedFiles, setSending, syncModifiedFiles])

    const isInputDisable = sending || generateCommentLoading || rewriteTextLoading

    const MemoizedUploadComponent = useCallback(() => {
        return (
            <UploadComponent
                initialFileList={editableCommentFiles}
                UploadButton={
                    <Tooltip title={UploadTooltipText} placement='top' key='copyButton'>
                        <Button
                            type='secondary'
                            size='medium'
                            minimal
                            compact
                            disabled={isInputDisable}
                            icon={<Paperclip size='small' />}
                        />
                    </Tooltip>
                }
                uploadProps={ <Paperclip size='large' /> }
            />
        )
    }, [UploadComponent, UploadTooltipText, editableCommentFiles, isInputDisable])

    const initialCommentFormValues = useMemo(() => ({
        [fieldName]: initialValue,
    }), [fieldName, initialValue])

    useEffect(() => {
        if (( errorMessage || generateCommentAnswer || rewriteTextAnswer)) {
            setAiNotificationShow(true)
        }
    }, [errorMessage, generateCommentAnswer, rewriteTextAnswer, setAiNotificationShow])

    const handleCopyClick = useCallback(async () => {
        if (copied) return

        try {
            await navigator.clipboard.writeText(commentValue)
            setCopied(true)

            setTimeout(() => setCopied(false), REFRESH_COPY_BUTTON_INTERVAL_IN_MS)
        } catch (e) {
            console.error('Unable to copy to clipboard', e)
        }
    }, [copied, commentValue])

    useEffect(() => {
        commentForm.setFieldsValue({ [fieldName]: commentValue })
    }, [commentForm, commentValue, fieldName])

    const hasText = useMemo(() => commentValue.length > 0, [commentValue])
    const canSendMessage = useMemo(() => hasText || filesCount > 0, [filesCount, hasText])

    useEffect(() => {
        if (canSendMessage && currentStep === 1) {
            cookie.set(GENERATE_COMMENT_TOUR_STEP_CLOSED_COOKIE, true)
            setCurrentStep(2)
        }
    }, [canSendMessage, currentStep, setCurrentStep])

    useEffect(() => {
        if (canSendMessage && currentStep === 2) {
            cookie.set(UPDATE_COMMENT_TOUR_STEP_CLOSED_COOKIE, true)
            setCurrentStep(0)
        }
    }, [canSendMessage, currentStep, setCurrentStep])

    useEffect(() => {
        const isTipHidden = cookie.get(UPDATE_COMMENT_TOUR_STEP_CLOSED_COOKIE) || false
        setCurrentStep(isTipHidden ? 0 : 2)
    }, [setCurrentStep])

    const closeAINotification = () => {
        setAiNotificationShow(false)
        setGenerateCommentAnswer('')
        setRewriteTextAnswer('')
        setErrorMessage('')
    }

    const handleCloseAINotification = () => {
        analytics.track('click', {
            value: `ticketId: ${ticketId}`,
            type: 'close_ai_notification',
            location: window.location.href,
            component: 'Button',
        })

        closeAINotification()
    }

    const handleApplyGeneratedMessage = () => {
        analytics.track('click', {
            value: `ticketId: ${ticketId}`,
            type: 'apply-generated_message',
            location: window.location.href,
            component: 'Button',
        })

        commentTextAreaRef.current.focus()

        closeAINotification()
        if (!errorMessage) setCommentValue(generateCommentAnswer || rewriteTextAnswer)
    }

    const handleUpdateComment = () => {
        rewriteTextOnClickHandler()
    }

    const handleRegenerateMessage = () => {
        analytics.track('click', {
            value: `ticketId: ${ticketId}`,
            type: 'regenerate_comment',
            location: window.location.href,
            component: 'Button',
        })
        setIsUpdateLoading(true)

        if (rewriteTextAnswer) rewriteTextOnClickHandler().then(() => setIsUpdateLoading(false))
        if (generateCommentAnswer) generateCommentClickHandler().then(() => setIsUpdateLoading(false))
    }

    return (
        <FormWithAction
            formInstance={commentForm}
            initialValues={initialCommentFormValues}
            action={actionWithSyncComments}
            resetOnComplete={true}
        >
            <div className={classNames(styles.commentTextAreaWrapper, filesCount > 0 ? styles.withFile : '')}>
                <Form.Item
                    name={fieldName}
                    rules={validations.comment}
                >
                    <AIInputNotification
                        targetRef={commentTextAreaRef}
                        updateLoading={isUpdateLoading}
                        result={generateCommentAnswer || rewriteTextAnswer}
                        onApply={handleApplyGeneratedMessage}
                        errorMessage={errorMessage}
                        onClose={handleCloseAINotification}
                        onUpdate={handleRegenerateMessage}
                        open={aiNotificationShow}
                    >
                        <Input.TextArea
                            name={fieldName}
                            ref={commentTextAreaRef}
                            value={commentValue}
                            onKeyDown={handleKeyDown}
                            className={styles.textAreaNoResize}
                            placeholder={PlaceholderMessage}
                            onKeyUp={handleKeyUp(commentForm)}
                            isSubmitDisabled={!canSendMessage}
                            autoSize={{ minRows: 1, maxRows: 5 }}
                            disabled={isInputDisable}
                            onSubmit={()=>handelSendMessage(commentForm)}
                            onChange={(event) => setCommentValue(event.target.value)}
                            bottomPanelUtils={[
                                <MemoizedUploadComponent
                                    key='uploadButton'
                                />,
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
                                        disabled={!hasText || isInputDisable}
                                        onClick={handleCopyClick}
                                        icon={copied ? (<CheckCircle size='small' />) : (<Copy size='small'/>) }
                                    />
                                </Tooltip>,
                                ...(rewriteCommentEnabled ? [
                                    <RewriteTextButton
                                        key='rewriteButton'
                                        hasText={hasText}
                                        isInputDisable={isInputDisable}
                                        rewriteTextLoading={rewriteTextLoading}
                                        onClick={handleUpdateComment}
                                    />,
                                ] : []),
                            ]}
                        />
                    </AIInputNotification>
                </Form.Item>
            </div>
        </FormWithAction>
    )
}

CommentForm.defaultProps = {
    fieldName: 'content',
    initialValue: '',
}

export default CommentForm