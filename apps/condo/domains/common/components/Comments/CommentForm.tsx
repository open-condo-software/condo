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
import { getIconByMimetype } from '@condo/domains/common/utils/clientSchema/files'
import { GENERATE_COMMENT_TOUR_STEP_CLOSED_COOKIE, UPDATE_COMMENT_TOUR_STEP_CLOSED_COOKIE } from '@condo/domains/ticket/constants/common'

import styles from './Comments.module.css'

import { CommentWithFiles } from './index'

const REFRESH_COPY_BUTTON_INTERVAL_IN_MS = 3000
const ENTER_KEY_CODE = 13

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
    onOpen: () => void
    setGenerateCommentAnswer: (value: string) => void
    setErrorMessage: (value: string) => void

    rewriteTextAnswer?: string
    setRewriteTextAnswer: (value: string) => void
    generateCommentClickHandler: () => Promise<void>
    rewriteTextOnClickHandler: () => Promise<void>
    commentTextAreaRef: null | React.MutableRefObject<InputRef>
}

const CommentForm: React.FC<ICommentFormProps> = ({
    commentForm,
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
    onOpen,
    errorMessage,
    setGenerateCommentAnswer,
    setErrorMessage,
    generateCommentClickHandler,
}) => {
    const intl = useIntl()
    const PlaceholderMessage = intl.formatMessage({ id: 'Comments.form.placeholder' })
    const UpdateTextMessage = intl.formatMessage({ id: 'ai.updateText' })
    const TourUpdateTextTitle = intl.formatMessage({ id: 'ai.updateText.tour.title' })
    const TourUpdateTextMessage = intl.formatMessage({ id: 'ai.updateText.tour.message' })
    const UploadTooltipText = intl.formatMessage({ id: 'component.uploadlist.AddFileLabel' })
    const CopyTooltipText = intl.formatMessage({ id: 'Copy' })
    const CopiedTooltipText = intl.formatMessage({ id: 'Copied' })

    const editableCommentFiles = editableComment?.files
    const [commentValue, setCommentValue] = useState('')
    const [copied, setCopied] = useState<boolean>()
    const [isUpdateLoading, setIsUpdateLoading] = useState(false)
    const [aiNotificationShow, setAiNotificationShow] = useState(false)

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

    const handleKeyUp = useCallback((form: FormInstance) => async (event) => {
        if (event.keyCode === ENTER_KEY_CODE && !event.shiftKey) {
            if (commentValue && commentValue.trim().length > 0 || filesCount > 0) {
                setSending(true)
                form.submit()

                analytics.track('ticket_comment_submit', {})
            }
        }
    }, [commentValue, filesCount, setSending])

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

    const MemoizedUploadComponent = useCallback(() => {
        return (
            <UploadComponent
                initialFileList={editableCommentFiles}
                UploadButton={
                    <Tooltip title={UploadTooltipText} placement='top' key='copyButton'>
                        <Button
                            key={1}
                            type='secondary'
                            size='medium'
                            minimal
                            compact
                            icon={<Paperclip size='small' />}
                        />
                    </Tooltip>
                }
                uploadProps={{
                    iconRender: (file) => {
                        return getIconByMimetype(file.type)
                    },
                }}
            />
        )
    }, [UploadComponent, editableCommentFiles])

    const initialCommentFormValues = useMemo(() => ({
        [fieldName]: initialValue,
    }), [fieldName, initialValue])

    useEffect(() => {
        if (( errorMessage || generateCommentAnswer || rewriteTextAnswer)) {
            setAiNotificationShow(true)
        }
    }, [errorMessage, generateCommentAnswer, rewriteTextAnswer, onOpen])

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

    const handelSendMessage = useCallback((form: FormInstance) => {
        if (commentValue && commentValue.trim().length > 0 || filesCount > 0) {
            setSending(true)
            form.submit()

            analytics.track('ticket_comment_submit', {})
        }
    }, [filesCount, setSending, commentValue])

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

    const closeTourStep = useCallback(() => {
        if (currentStep === 2) {
            cookie.set(UPDATE_COMMENT_TOUR_STEP_CLOSED_COOKIE, true)
            setCurrentStep(0)
        }
    }, [currentStep, setCurrentStep])

    const closeAINotification = () => {
        setAiNotificationShow(false)
        setTimeout(()=> {
            setGenerateCommentAnswer('')
            setRewriteTextAnswer('')
            setErrorMessage('')
        }, 100)
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
        closeTourStep()
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

        if (rewriteTextAnswer) rewriteTextOnClickHandler().then(()=>setIsUpdateLoading(false))
        if (generateCommentAnswer) generateCommentClickHandler().then(()=>setIsUpdateLoading(false))
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
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            disabled={sending || generateCommentLoading || rewriteTextLoading}
                            onSubmit={()=>handelSendMessage(commentForm)}
                            onChange={(event) => {
                                if (editableComment) setEditableComment(prev=> ({ ...prev, content: event.target.value }))
                                else setCommentValue(event.target.value)
                            }}
                            bottomPanelUtils={[
                                <MemoizedUploadComponent
                                    key='uploadButton'
                                />,
                                <Tooltip title={copied ? CopiedTooltipText : CopyTooltipText } placement='top' key='copyButton'>
                                    <Button
                                        minimal
                                        compact
                                        type='secondary'
                                        size='medium'
                                        disabled={!hasText}
                                        onClick={handleCopyClick}
                                        icon={copied ? (<CheckCircle size='small' />) : (<Copy size='small'/>) }
                                    />
                                </Tooltip>,
                                <Tour.TourStep
                                    step={2}
                                    key='aiButton'
                                    placement='top'
                                    title={TourUpdateTextTitle}
                                    message={TourUpdateTextMessage}
                                    onClose={closeTourStep}
                                    getPopupContainer={() => document.body}
                                >
                                    <Button
                                        compact
                                        minimal
                                        type='secondary'
                                        size='medium'
                                        disabled={!hasText}
                                        loading={rewriteTextLoading}
                                        icon={<Sparkles size='small' />}
                                        onClick={handleUpdateComment}
                                        className={styles.rewriteTextButton}
                                    >
                                        {UpdateTextMessage}
                                    </Button>
                                </Tour.TourStep>,
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