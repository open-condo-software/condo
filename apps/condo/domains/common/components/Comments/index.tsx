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
import { Ticket, TicketComment, TicketCommentFile, UserTypeType } from '@app/condo/schema'
import { Drawer, Empty, Form, notification } from 'antd'
import classNames from 'classnames'
import dayjs from 'dayjs'
import cookie from 'js-cookie'
import { pickBy } from 'lodash'
import React, { MouseEventHandler, UIEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Input, Radio, RadioGroup, Tooltip, Tour, Typography } from '@open-condo/ui'

import { AIFlowButton } from '@condo/domains/ai/components/AIFlowButton'
import { FLOW_TYPES, REWRITE_TICKET_COMMENT_TYPE, GENERATE_TICKET_COMMENT_TYPE } from '@condo/domains/ai/constants.js'
import { useAIConfig, useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import { Module } from '@condo/domains/common/components/MultipleFileUpload'
import { analytics } from '@condo/domains/common/utils/analytics'
import { ORGANIZATION_COMMENT_TYPE, RESIDENT_COMMENT_TYPE } from '@condo/domains/ticket/constants'
import { GENERATE_COMMENT_TOUR_STEP_CLOSED_COOKIE } from '@condo/domains/ticket/constants/common'
import { hasUnreadResidentComments } from '@condo/domains/ticket/utils/helpers'

import { Comment } from './Comment'
import CommentForm from './CommentForm'
import styles from './Comments.module.css'

const EmptyCommentsContainer = ({ PromptTitleMessage, PromptDescriptionMessage }) => (
    <div className={styles.emptyContainer}>
        <Empty
            image={null}
            description={
                <>
                    <Typography.Paragraph strong>
                        {PromptTitleMessage}
                    </Typography.Paragraph>
                    <Typography.Paragraph size='medium' type='secondary'>
                        {PromptDescriptionMessage}
                    </Typography.Paragraph>
                </>
            }
        />
    </div>
)

type CommentsTabContentProps = {
    comments: CommentWithFiles[]
    updateAction: UpdateTicketCommentMutationHookResult[0]
    PromptTitleMessage: string
    PromptDescriptionMessage: string
    editableComment: CommentWithFiles
    setEditableComment: (value: CommentWithFiles) => void
    handleBodyScroll: UIEventHandler<HTMLDivElement>
    bodyRef: React.RefObject<HTMLDivElement>
    sending: boolean
    generateCommentEnabled: boolean
    generateCommentOnClickHandler: MouseEventHandler<HTMLElement>
    generateCommentLoading: boolean
    showGenerateCommentWithoutComments: boolean
    commentType: string
}

const CommentsTabContent: React.FC<CommentsTabContentProps> = ({
    sending,
    handleBodyScroll,
    bodyRef,
    comments,
    updateAction,
    PromptTitleMessage,
    PromptDescriptionMessage,
    editableComment,
    setEditableComment,
    generateCommentEnabled,
    generateCommentOnClickHandler,
    generateCommentLoading,
    showGenerateCommentWithoutComments,
    commentType,
}) => {
    const intl = useIntl()
    const GenerateResponseMessage = intl.formatMessage({ id: 'ai.generateResponse' })
    const GenerateResponseTooltipMessage = intl.formatMessage({ id: 'ai.generateResponseWithAI' })
    const GenerateCommentMessage = intl.formatMessage({ id: 'ai.generateComment' })
    const GenerateCommentTooltipMessage = intl.formatMessage({ id: 'ai.generateCommentWithAI' })
    const GenerateCommentTourStepTitle = intl.formatMessage({ id: 'ai.generateComment.tourStepTitle' })
    const GenerateCommentTourStepDescription = intl.formatMessage({ id: 'ai.generateComment.tourStepDescription' })

    const lastComment = useMemo(() => comments?.[0], [comments])
    const showGenerateAnswerButton = useMemo(() =>
        generateCommentEnabled && lastComment?.user?.type === UserTypeType.Resident,
    [generateCommentEnabled, lastComment?.user?.type])

    const commentsToRender = useMemo(() =>
        comments
            .filter(comment => editableComment ? comment.id !== editableComment.id : true)
            .map(comment => {
                const deleteAction = async ({ id }) => {
                    await updateAction({
                        variables: {
                            id,
                            data: {
                                deletedAt: new Date().toISOString(),
                                dv: 1,
                                sender: getClientSideSenderInfo(),
                            },
                        },
                    })
                }

                return (
                    <>
                        <Comment
                            comment={comment}
                            deleteAction={deleteAction}
                            setEditableComment={setEditableComment}
                        />
                        {
                            showGenerateAnswerButton && lastComment?.id === comment.id && (
                                <Tooltip placement='left' mouseEnterDelay={1.5} title={GenerateResponseTooltipMessage}>
                                    <div className={styles.generateAnswerButtonWrapper}>
                                        <AIFlowButton
                                            loading={generateCommentLoading}
                                            onClick={generateCommentOnClickHandler}
                                        >
                                            {GenerateResponseMessage}
                                        </AIFlowButton>
                                    </div>
                                </Tooltip>
                            )
                        }
                    </>
                )
            }), [
        GenerateResponseMessage, GenerateResponseTooltipMessage, comments, editableComment,
        generateCommentLoading, generateCommentOnClickHandler, lastComment?.id, setEditableComment,
        showGenerateAnswerButton, updateAction,
    ])

    const { currentStep, setCurrentStep } = Tour.useTourContext()

    useEffect(() => {
        const isTipHidden = cookie.get(GENERATE_COMMENT_TOUR_STEP_CLOSED_COOKIE) || false
        setCurrentStep(isTipHidden ? 0 : 1)
    }, [setCurrentStep, commentType])

    const closeTourStep = useCallback(() => {
        if (currentStep === 1) {
            cookie.set(GENERATE_COMMENT_TOUR_STEP_CLOSED_COOKIE, true)
            setCurrentStep(0)
        }
    }, [currentStep, setCurrentStep])

    const handleClickGenerateCommentButton = useCallback(async (event) => {
        closeTourStep()
        await generateCommentOnClickHandler(event)
    }, [closeTourStep, generateCommentOnClickHandler])

    return (
        <>
            {comments.length === 0 ? (
                <div className={styles.commentBody}>
                    <EmptyCommentsContainer
                        PromptTitleMessage={PromptTitleMessage}
                        PromptDescriptionMessage={PromptDescriptionMessage}
                    />
                    {showGenerateCommentWithoutComments && (
                        <Tour.TourStep
                            step={1}
                            title={GenerateCommentTourStepTitle}
                            message={GenerateCommentTourStepDescription}
                            onClose={closeTourStep}
                        >
                            <Tooltip placement='topRight' mouseEnterDelay={1.5} title={GenerateCommentTooltipMessage}>
                                <div className={styles.generateCommentButtonWrapper}>
                                    <AIFlowButton
                                        loading={generateCommentLoading}
                                        onClick={handleClickGenerateCommentButton}
                                    >
                                        {GenerateCommentMessage}
                                    </AIFlowButton>
                                </div>
                            </Tooltip>
                        </Tour.TourStep>
                    )}
                </div>
            ) : (
                <div className={styles.commentBody} ref={bodyRef} onScroll={handleBodyScroll}>
                    {sending && <Loader className={styles.loader}/>}
                    {commentsToRender}
                </div>
            )}
        </>
    )
}

const SCROLL_TOP_OFFSET_TO_HIDE_TITLE = 50

export type CommentWithFiles = TicketComment & {
    files: Array<TicketCommentFile> | null
}

type CommentsWrapperPropsType = {
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

type CommentsPropsType = CommentsWrapperPropsType & {
    CommentFormOpen: boolean
    isComponentInModal?: boolean
    setCommentFormOpen?: (value: boolean) => void
    editableComment: CommentWithFiles
    setEditableComment: (value: CommentWithFiles) => void
}

export const CommentsWrapper: React.FC<CommentsWrapperPropsType>  = (props) => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'Comments.title' })

    const [CommentFormOpen, setCommentFormOpen] = useState(false)
    const [editableComment, setEditableComment] = useState<CommentWithFiles | null>(null)

    return (
        <>
            <Comments
                {...props}
                CommentFormOpen={CommentFormOpen}
                setCommentFormOpen={setCommentFormOpen}
                editableComment={editableComment}
                setEditableComment={setEditableComment}
            />

            <Drawer
                title={TitleMessage}
                onClose={() => setCommentFormOpen(false)}
                open={CommentFormOpen}
                className={styles.drawerWrapper}
                width={486}
            >
                <Comments
                    {...props}
                    isComponentInModal
                    CommentFormOpen={CommentFormOpen}
                    setCommentFormOpen={setCommentFormOpen}
                    editableComment={editableComment}
                    setEditableComment={setEditableComment}
                />
            </Drawer>
        </>
    )
}

const Comments: React.FC<CommentsPropsType> = ({
    ticketId,
    ticket,
    isComponentInModal,
    comments,
    createAction,
    updateAction,
    setEditableComment,
    editableComment,
    refetchComments,
    canCreateComments,
    FileModel,
    setCommentFormOpen,
    CommentFormOpen,
    fileModelRelationField,
    ticketCommentTimes,
    userTicketCommentReadTime,
    createUserTicketCommentReadTime,
    updateUserTicketCommentReadTime,
    loadingUserTicketCommentReadTime,
    actualIncidents,
}) => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'Comments.title' })
    const CannotCreateCommentsMessage = intl.formatMessage({ id: 'Comments.cannotCreateComments' })
    const InternalCommentsMessage = intl.formatMessage({ id: 'Comments.tab.organization' })
    const PromptInternalCommentsTitleMessage = intl.formatMessage({ id: 'Comments.tab.organization.prompt.title' })
    const PromptInternalCommentsDescriptionMessage = intl.formatMessage({ id: 'Comments.tab.organization.prompt.description' })
    const ResidentCommentsMessage = intl.formatMessage({ id: 'Comments.tab.resident' })
    const PromptResidentCommentsTitleMessage = intl.formatMessage({ id: 'Comments.tab.resident.prompt.title' })
    const PromptResidentCommentsDescriptionMessage = intl.formatMessage({ id: 'Comments.tab.resident.prompt.description' })
    const GenericErrorMessage = intl.formatMessage({ id: 'ServerErrorPleaseTryAgainLater' })
    const PlaceholderMessage = intl.formatMessage({ id: 'Comments.form.placeholder' })
    const YesMessage = intl.formatMessage({ id: 'Yes' })
    const NoMessage = intl.formatMessage({ id: 'No' })

    const { user } = useAuth()
    const client = useApolloClient()

    const { breakpoints } = useLayoutContext()
    const [commentType, setCommentType] = useState(ORGANIZATION_COMMENT_TYPE)
    const [sending, setSending] = useState(false)
    const [isTitleHidden, setTitleHidden] = useState<boolean>(false)
    const [isInitialUserTicketCommentReadTimeSet, setIsInitialUserTicketCommentReadTimeSet] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [generateCommentAnswer, setGenerateCommentAnswer] = useState('')

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

    const { enabled: aiFeaturesEnabled, features: { rewriteTicketComment: rewriteTicketCommentEnabled } } = useAIConfig()

    const generateCommentEnabled = useMemo(() => aiFeaturesEnabled && rewriteTicketCommentEnabled,
        [aiFeaturesEnabled, rewriteTicketCommentEnabled])
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
        PromptDescriptionMessage: PromptResidentCommentsDescriptionMessage,
    }

    const commentTabContentProps = commentType === RESIDENT_COMMENT_TYPE ?
        residentCommentsTabContentProps : organizationCommentsTabContentProps

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

    useEffect(() => {
        setGenerateCommentAnswer(generateCommentData?.answer)
    }, [generateCommentData?.answer])

    useEffect(() => {
        if (!CommentFormOpen) {
            setGenerateCommentAnswer('')
            setErrorMessage('')
        }
    }, [CommentFormOpen])

    const handleGenerateCommentClick = async (comments: Array<CommentWithFiles>, promptType: typeof REWRITE_TICKET_COMMENT_TYPE | typeof GENERATE_TICKET_COMMENT_TYPE) => {
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
            promptType,
        })

        analytics.track('generate_ticket_comment', {
            ticketId: ticketId,
            type: promptType,
        })

        setCommentFormOpen(true)
        const result = await runGenerateCommentAIFlow({ context })

        if (result.error) {
            setErrorMessage(result.localizedErrorText || GenericErrorMessage)
            notification.error({ message: result.localizedErrorText || GenericErrorMessage })
        }
    }

    return (
        <div className={classNames(
            styles.commentContainer,
            breakpoints.TABLET_LARGE ? '' : styles.isSmall,
            isComponentInModal ? styles.inModal : styles.inPage
        )}>
            {!isComponentInModal && !isTitleHidden && <div className={styles.commentHead}>{TitleMessage}</div> }
            <span className={styles.switchCommentsTypeWrapper}>
                <RadioGroup optionType='button' value={commentType} onChange={handleTabChange}>
                    <Radio
                        key={ORGANIZATION_COMMENT_TYPE}
                        value={ORGANIZATION_COMMENT_TYPE}
                        label={
                            <>
                                {InternalCommentsMessage}
                                <sup>
                                    {commentsWithOrganization.length}
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
                                    {commentsWithResident.length}
                                    {showIndicator && <span className={styles.newCommentIndicator} title=''/>}
                                </sup>
                            </>
                        }
                    />
                </RadioGroup>
            </span>
            <Tour.Provider>
                <div className={classNames(styles.cardContainer, styles.commentsTabsContainer)}>
                    <CommentsTabContent
                        {...commentTabContentProps}
                        editableComment={editableComment}
                        setEditableComment={ (value)=>{
                            if (!isComponentInModal) setCommentFormOpen(true)
                            return setEditableComment(value)
                        }}
                        commentType={commentType}
                        updateAction={updateAction}
                        handleBodyScroll={handleBodyScroll}
                        bodyRef={bodyRef}
                        sending={sending}
                        generateCommentEnabled={generateCommentEnabled}
                        generateCommentOnClickHandler={() => handleGenerateCommentClick(commentTabContentProps.comments, GENERATE_TICKET_COMMENT_TYPE )}
                        generateCommentLoading={generateCommentLoading}
                        showGenerateCommentWithoutComments={showGenerateCommentWithoutComments}
                    />
                </div>
                <div className={classNames(styles.commentFooter, breakpoints.TABLET_LARGE ? '' : styles.isSmall)}>
                    {canCreateComments ? (
                        <>
                            { isComponentInModal ? (
                                <CommentForm
                                    fieldName='content'
                                    ticketId={ticketId}
                                    FileModel={FileModel}
                                    relationField={fileModelRelationField}
                                    action={handleCommentAction}
                                    editableComment={editableComment}
                                    setEditableComment={setEditableComment}
                                    setSending={setSending}
                                    sending={sending}
                                    onOpen={()=>setCommentFormOpen(true)}
                                    commentForm={commentForm}
                                    errorMessage={errorMessage}
                                    setErrorMessage={setErrorMessage}
                                    generateCommentLoading={generateCommentLoading}
                                    generateCommentAnswer={generateCommentAnswer}
                                    setGenerateCommentAnswer={setGenerateCommentAnswer}
                                    generateCommentOnClickHandler={() => handleGenerateCommentClick(commentTabContentProps.comments, REWRITE_TICKET_COMMENT_TYPE)}
                                /> ) : (
                                <div onClick={()=>setCommentFormOpen(true)}>
                                    <Input placeholder={PlaceholderMessage} value={editableComment?.content}/>
                                </div>
                            )}
                        </>
                    ) : (
                        <Typography.Text disabled>{CannotCreateCommentsMessage}</Typography.Text>
                    )}
                </div>
            </Tour.Provider>
        </div>
    )
}

Comments.defaultProps = {
    comments: [],
}

export { Comments }