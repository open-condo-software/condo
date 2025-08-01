import { useApolloClient } from '@apollo/client'
import {
    CreateTicketCommentMutationHookResult,
    CreateUserTicketCommentReadTimeMutationHookResult,
    GetIncidentsQuery,
    GetTicketLastCommentsTimeQueryHookResult,
    GetUserTicketCommentsReadTimeQueryHookResult,
    UpdateTicketCommentMutationHookResult,
    UpdateUserTicketCommentReadTimeMutationHookResult,
} from '@app/condo/gql'
import { Ticket, TicketComment, TicketCommentFile } from '@app/condo/schema'
import { Form, FormInstance, notification } from 'antd'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { pickBy } from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Radio, RadioGroup, Tour, Typography } from '@open-condo/ui'

import { FLOW_TYPES } from '@condo/domains/ai/constants.js'
import { useAIConfig, useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Module } from '@condo/domains/common/components/MultipleFileUpload'
import { analytics } from '@condo/domains/common/utils/analytics'
import { ORGANIZATION_COMMENT_TYPE, RESIDENT_COMMENT_TYPE } from '@condo/domains/ticket/constants'
import { hasUnreadResidentComments } from '@condo/domains/ticket/utils/helpers'

import CommentForm from './CommentForm'
import styles from './Comments.module.css'
import { CommentsTabContent } from './CommentsTabContent'

const SCROLL_TOP_OFFSET_TO_HIDE_TITLE = 50

export type CommentWithFiles = TicketComment & {
    files: Array<TicketCommentFile> | null
}

type CommentsPropsType = {
    ticketId: string
    ticket: Ticket
    comments: CommentWithFiles[]
    createAction: CreateTicketCommentMutationHookResult[0]
    updateAction: UpdateTicketCommentMutationHookResult[0]
    canCreateComments: boolean
    refetchComments: () => Promise<void>
    FileModel: Module
    ticketCommentTimes: GetTicketLastCommentsTimeQueryHookResult['data']['ticketCommentTimes'][0]
    fileModelRelationField: string
    userTicketCommentReadTime: GetUserTicketCommentsReadTimeQueryHookResult['data']['objs'][0]
    createUserTicketCommentReadTime: CreateUserTicketCommentReadTimeMutationHookResult[0]
    updateUserTicketCommentReadTime: UpdateUserTicketCommentReadTimeMutationHookResult[0]
    loadingUserTicketCommentReadTime: boolean
    actualIncidents?: GetIncidentsQuery['incidents']
}

export const CommentsWrapper: React.FC<CommentsPropsType>  = (props) => {
    return (
        <Tour.Provider>
            <Comments
                {...props}
            />
        </Tour.Provider>
    )
}

const Comments: React.FC<CommentsPropsType> = ({
    ticketId,
    comments,
    createAction,
    updateAction,
    refetchComments,
    canCreateComments,
    FileModel,
    fileModelRelationField,
    ticketCommentTimes,
    userTicketCommentReadTime,
    createUserTicketCommentReadTime,
    updateUserTicketCommentReadTime,
    loadingUserTicketCommentReadTime,
    ticket,
    actualIncidents,
}) => {
    const intl = useIntl()
    const CannotCreateCommentsMessage = intl.formatMessage({ id: 'Comments.cannotCreateComments' })
    const InternalCommentsMessage = intl.formatMessage({ id: 'Comments.tab.organization' })
    const PromptInternalCommentsTitleMessage = intl.formatMessage({ id: 'Comments.tab.organization.prompt.title' })
    const PromptInternalCommentsDescriptionMessage = intl.formatMessage({ id: 'Comments.tab.organization.prompt.description' })
    const ResidentCommentsMessage = intl.formatMessage({ id: 'Comments.tab.resident' })
    const PromptResidentCommentsTitleMessage = intl.formatMessage({ id: 'Comments.tab.resident.prompt.title' })
    const PromptResidentCommentsDescriptionMessage = intl.formatMessage({ id: 'Comments.tab.resident.prompt.description' })
    const PromptResidentAiCommentsDescriptionMessage = intl.formatMessage({ id: 'Comments.tab.resident.ai.prompt.description' })
    const GenericErrorMessage = intl.formatMessage({ id: 'ServerErrorPleaseTryAgainLater' })
    const TitleMessage = intl.formatMessage({ id: 'Comments.title' })
    const YesMessage = intl.formatMessage({ id: 'Yes' })
    const NoMessage = intl.formatMessage({ id: 'No' })

    const { user } = useAuth()
    const client = useApolloClient()

    const { breakpoints } = useLayoutContext()
    const [sending, setSending] = useState(false)
    const [isTitleHidden, setTitleHidden] = useState<boolean>(false)
    const [isInitialUserTicketCommentReadTimeSet, setIsInitialUserTicketCommentReadTimeSet] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [generateCommentAnswer, setGenerateCommentAnswer] = useState('')
    const [rewriteTextAnswer, setRewriteTextAnswer] = useState('')
    const [aiNotificationShow, setAiNotificationShow] = useState(false)

    const [commentType, setCommentType] = useState(ORGANIZATION_COMMENT_TYPE)
    const [editableComment, setEditableComment] = useState<CommentWithFiles | null>(null)

    const commentTextAreaRef = useRef(null)

    const [runGenerateCommentAIFlow, {
        loading: generateCommentLoading,
        data: generateCommentData,
    }] = useAIFlow<{ answer: string }>({
        flowType: FLOW_TYPES.TICKET_REWRITE_COMMENT_FLOW_TYPE,
        defaultContext: {
            ticketId: ticketId,
            ticketDetails: ticket.details ?? '-',
            ticketAddress: ticket.propertyAddress ?? '-',
            ticketStatusName: ticket.status.name,
            ticketUnitName: ticket.unitName ?? '-',
            ticketUnitType: ticket.unitType ? intl.formatMessage({ id: `field.UnitType.${ticket.unitType}` }) : '-',
            ticketFloorName: ticket.floorName ?? '-',
            ticketSectionName: ticket.sectionName ?? '-',
            isExecutorAssigned: ticket.executor ? YesMessage : NoMessage,
            isAssigneeAssigned: ticket.assignee ? YesMessage : NoMessage,
        },
    })

    const handleGenerateCommentClick = async (comments: Array<CommentWithFiles>, commentForm: FormInstance) => {
        const lastComment = comments?.[0]
        // Last 5 comments excluding the lastComment one
        const last5Comments = comments?.slice(0, 5)
        const currentDateTime = dayjs().format()
        const last5Incidents = actualIncidents?.slice(0, 5)
            ?.map(({ details, textForResident }) => ({ details, textForResident }))

        const context = pickBy({
            answer: commentForm.getFieldValue('content') || '',
            comment: lastComment?.content,
            ticketLastComments: last5Comments?.map(comment => `${comment.user.name}: ${comment.content}`).join('\n'),
            currentDateTime,
            actualIncidents: last5Incidents,
        })

        analytics.track('click', {
            value: ticketId,
            location: window.location.href,
            component: 'Button',
            type: 'generate_ticket_comment',
        })

        const result = await runGenerateCommentAIFlow({ context })

        if (result.error) {
            notification.error({ message: result.localizedErrorText || GenericErrorMessage })
            setErrorMessage(result.localizedErrorText || GenericErrorMessage)
        }
    }


    const handleBodyScroll = useCallback((e) => {
        const scrollTop = e?.currentTarget?.scrollTop

        if (scrollTop > SCROLL_TOP_OFFSET_TO_HIDE_TITLE && !isTitleHidden) {
            setTitleHidden(true)
        } else if (scrollTop === 0 && isTitleHidden) {
            setTitleHidden(false)
        }
    }, [isTitleHidden, setTitleHidden])

    const bodyRef = useRef(null)
    const scrollToBottom = () => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = 0
        }
    }

    const [commentForm] = Form.useForm()

    useEffect(() => {
        setEditableComment(null)
    }, [commentType, setEditableComment])

    const commentsWithOrganization = useMemo(() => comments.filter(comment => comment.type === ORGANIZATION_COMMENT_TYPE), [comments])
    const commentsWithResident = useMemo(() => comments.filter(comment => comment.type === RESIDENT_COMMENT_TYPE), [comments])

    const handleCommentAction = useCallback(async (values, syncModifiedFiles) => {
        if (editableComment) {
            await updateAction({
                variables: {
                    id: editableComment.id,
                    data: {
                        ...values,
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                    },
                },
            })
            await syncModifiedFiles(editableComment.id)
        } else {
            const commentData = await createAction({
                variables: {
                    data: {
                        ...values,
                        type: commentType,
                        ticket: { connect: { id: ticketId } },
                        user: { connect: { id: user?.id || null } },
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                    },
                },
            })
            const comment = commentData?.data?.ticketComment
            await syncModifiedFiles(comment.id)
            scrollToBottom()
        }

        await refetchComments()
        const commentTypeCapitalized = commentType.charAt(0).toUpperCase() + commentType.slice(1)
        const now = new Date()

        await createOrUpdateUserTicketCommentReadTime({
            [`read${commentTypeCapitalized}CommentAt`]: now,
            readCommentAt: now,
        })
        setEditableComment(null)
    },
    [commentType, createAction, editableComment, refetchComments, setEditableComment, ticketId, updateAction, user?.id])

    const createOrUpdateUserTicketCommentReadTime = useCallback(async (payload) => {
        if (loadingUserTicketCommentReadTime) return

        if (userTicketCommentReadTime) {
            await updateUserTicketCommentReadTime({
                variables: {
                    id: userTicketCommentReadTime.id,
                    data: {
                        ...payload,
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                    },
                },
            })
        } else {
            await createUserTicketCommentReadTime({
                variables: {
                    data: {
                        ...payload,
                        ticket: { connect: { id: ticketId } },
                        user: { connect: { id: user?.id || null } },
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                    },
                },
            })
        }

        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allUserTicketCommentReadTimes' })
    }, [client, createUserTicketCommentReadTime, loadingUserTicketCommentReadTime, ticketId, updateUserTicketCommentReadTime, user?.id, userTicketCommentReadTime])

    useEffect(() => {
        if (!loadingUserTicketCommentReadTime && !isInitialUserTicketCommentReadTimeSet) {
            const now = new Date()
            createOrUpdateUserTicketCommentReadTime({
                readOrganizationCommentAt: now,
                readCommentAt: now,
            })

            setIsInitialUserTicketCommentReadTimeSet(true)
        }
    }, [createOrUpdateUserTicketCommentReadTime, isInitialUserTicketCommentReadTimeSet, loadingUserTicketCommentReadTime])

    const handleTabChange = useCallback(async (event) => {
        const value = event.target.value

        setCommentType(value)
        const now = new Date()

        if (value === RESIDENT_COMMENT_TYPE) {
            await createOrUpdateUserTicketCommentReadTime({
                readResidentCommentAt: now,
                readCommentAt: now,
            })
        } else if (value === ORGANIZATION_COMMENT_TYPE) {
            await createOrUpdateUserTicketCommentReadTime({
                readOrganizationCommentAt: now,
                readCommentAt: now,
            })
        }

        scrollToBottom()
    }, [createOrUpdateUserTicketCommentReadTime])

    const lastResidentCommentAt = useMemo(() => ticketCommentTimes?.lastResidentCommentAt, [ticketCommentTimes?.lastResidentCommentAt])
    const lastCommentWithResidentTypeAt = useMemo(() => ticketCommentTimes?.lastCommentWithResidentTypeAt, [ticketCommentTimes?.lastCommentWithResidentTypeAt])
    const readResidentCommentByUserAt = useMemo(() => userTicketCommentReadTime?.readResidentCommentAt, [userTicketCommentReadTime?.readResidentCommentAt])
    const showIndicator = useMemo(() => hasUnreadResidentComments(lastResidentCommentAt, readResidentCommentByUserAt, lastCommentWithResidentTypeAt),
        [lastCommentWithResidentTypeAt, lastResidentCommentAt, readResidentCommentByUserAt])

    const { enabled: aiFeaturesEnabled, features: {
        rewriteTicketComment: rewriteTicketCommentEnabled,
        rewriteText: rewriteTextEnabled,
    } } = useAIConfig()

    const generateCommentEnabled = useMemo(() => aiFeaturesEnabled && rewriteTicketCommentEnabled,
        [aiFeaturesEnabled, rewriteTicketCommentEnabled])
    const rewriteCommentEnabled = useMemo(() => aiFeaturesEnabled && rewriteTextEnabled,
        [aiFeaturesEnabled, rewriteTextEnabled])
    const showGenerateCommentWithoutComments = useMemo(() =>
        generateCommentEnabled && commentType === RESIDENT_COMMENT_TYPE && commentsWithResident.length === 0,
    [commentType, commentsWithResident.length, generateCommentEnabled])

    const organizationCommentsTabContentProps = {
        comments: commentsWithOrganization,
        PromptTitleMessage: PromptInternalCommentsTitleMessage,
        PromptDescriptionMessage: PromptInternalCommentsDescriptionMessage,
    }
    const residentCommentsTabContentProps = {
        comments: commentsWithResident,
        PromptTitleMessage: PromptResidentCommentsTitleMessage,
        PromptDescriptionMessage: aiFeaturesEnabled ? PromptResidentAiCommentsDescriptionMessage : PromptResidentCommentsDescriptionMessage,
    }

    const commentTabContentProps = commentType === RESIDENT_COMMENT_TYPE ?
        residentCommentsTabContentProps : organizationCommentsTabContentProps

    const [runRewriteTextAIFlow, {
        loading: rewriteTextLoading,
        data: rewriteTextData,
    }] = useAIFlow<{ answer: string }>({
        flowType: FLOW_TYPES.REWRITE_TEXT_FLOW_TYPE,
    })

    useEffect(() => {
        setGenerateCommentAnswer(generateCommentData?.answer)
    }, [generateCommentData?.answer])

    useEffect(() => {
        setRewriteTextAnswer(rewriteTextData?.answer)
    }, [rewriteTextData?.answer])

    const handleRewriteTextClick = async () => {
        const context = {
            userInput: commentForm.getFieldValue('content') || '',
        }

        analytics.track('click', {
            value: ticketId,
            location: window.location.href,
            component: 'Button',
            type: 'rewrite_text',
        })

        const result = await runRewriteTextAIFlow({ context })

        if (result.error) {
            setErrorMessage(result.localizedErrorText || GenericErrorMessage)
            notification.error({ message: result.localizedErrorText || GenericErrorMessage })
        }
    }

    return (
        <div className={classNames(
            styles.commentContainer,
            breakpoints.TABLET_LARGE ? '' : styles.isSmall,
        )}>
            {!isTitleHidden &&
                <div className={styles.commentHead}>
                    <Typography.Title level={3}>
                        {TitleMessage}
                    </Typography.Title>
                </div>
            }

            <span className={styles.switchCommentsTypeWrapper}>
                <RadioGroup optionType='button' value={commentType} onChange={handleTabChange}>
                    <Radio
                        key={ORGANIZATION_COMMENT_TYPE}
                        value={ORGANIZATION_COMMENT_TYPE}
                        label={
                            <>
                                {InternalCommentsMessage}
                                <sup>
                                    {!!commentsWithOrganization.length && commentsWithOrganization.length}
                                </sup>
                            </>
                        }
                    />
                    <Radio
                        key={RESIDENT_COMMENT_TYPE}
                        value={RESIDENT_COMMENT_TYPE}
                        label={
                            <>
                                {ResidentCommentsMessage}
                                <sup>
                                    {!!commentsWithResident.length && commentsWithResident.length}
                                    {showIndicator && <span className={styles.newCommentIndicator} title=''/>}
                                </sup>
                            </>
                        }
                    />
                </RadioGroup>
            </span>
            <div className={classNames(styles.cardContainer,
                styles.commentsTabsContainer,
                aiNotificationShow ? styles.transparentGradient : ''
            )}>
                <CommentsTabContent
                    {...commentTabContentProps}
                    editableComment={editableComment}
                    setEditableComment={setEditableComment}
                    commentType={commentType}
                    updateAction={updateAction}
                    handleBodyScroll={handleBodyScroll}
                    bodyRef={bodyRef}
                    sending={sending}
                    generateCommentEnabled={generateCommentEnabled}
                    generateCommentOnClickHandler={() => handleGenerateCommentClick(commentTabContentProps.comments, commentForm)}
                    generateCommentLoading={generateCommentLoading}
                    showGenerateCommentWithoutComments={showGenerateCommentWithoutComments}
                />
            </div>
            <div className={classNames(styles.commentFooter, breakpoints.TABLET_LARGE ? '' : styles.isSmall)}>
                {canCreateComments ? (
                    <CommentForm
                        commentTextAreaRef={commentTextAreaRef}
                        rewriteCommentEnabled={rewriteCommentEnabled}
                        fieldName='content'
                        ticketId={ticketId}
                        FileModel={FileModel}
                        relationField={fileModelRelationField}
                        action={handleCommentAction}
                        editableComment={editableComment}
                        setEditableComment={setEditableComment}
                        setSending={setSending}
                        sending={sending}
                        commentForm={commentForm}
                        errorMessage={errorMessage}
                        setErrorMessage={setErrorMessage}
                        generateCommentLoading={generateCommentLoading}
                        generateCommentAnswer={generateCommentAnswer}
                        setGenerateCommentAnswer={setGenerateCommentAnswer}
                        rewriteTextLoading={rewriteTextLoading}
                        rewriteTextAnswer={rewriteTextAnswer}
                        setRewriteTextAnswer={setRewriteTextAnswer}
                        generateCommentClickHandler={() => handleGenerateCommentClick(commentTabContentProps.comments, commentForm)}
                        rewriteTextOnClickHandler={handleRewriteTextClick}
                        setAiNotificationShow={setAiNotificationShow}
                        aiNotificationShow={aiNotificationShow}
                    /> 
                ) : (
                    <Typography.Text disabled>{CannotCreateCommentsMessage}</Typography.Text>
                )}
            </div>
        </div>
    )
}

Comments.defaultProps = {
    comments: [],
}

export { Comments }