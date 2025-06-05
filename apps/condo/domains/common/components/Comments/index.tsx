import { useApolloClient } from '@apollo/client'
import {
    CreateTicketCommentMutationHookResult,
    CreateUserTicketCommentReadTimeMutationHookResult,
    GetTicketLastCommentsTimeQueryHookResult,
    GetUserTicketCommentsReadTimeQueryHookResult,
    UpdateTicketCommentMutationHookResult,
    UpdateUserTicketCommentReadTimeMutationHookResult,
} from '@app/condo/gql'
import {
    Ticket,
    TicketComment,
    TicketCommentFile,
} from '@app/condo/schema'
import styled from '@emotion/styled'
import { Empty, Form, notification, Typography } from 'antd'
import get from 'lodash/get'
import React, { CSSProperties, UIEventHandler, MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Radio, RadioGroup, Tooltip } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { AIFlowButton } from '@condo/domains/ai/components/AIFlowButton'
import { FLOW_TYPES } from '@condo/domains/ai/constants.js'
import { useAIConfig, useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import { Module } from '@condo/domains/common/components/MultipleFileUpload'
import { fontSizes } from '@condo/domains/common/constants/style'
import { ORGANIZATION_COMMENT_TYPE, RESIDENT_COMMENT_TYPE } from '@condo/domains/ticket/constants'
import { hasUnreadResidentComments } from '@condo/domains/ticket/utils/helpers'

import { Comment } from './Comment'
import { CommentForm } from './CommentForm'


interface IContainerProps {
    isSmall: boolean
}

const Container = styled.aside<IContainerProps>`
  background: ${colors.gray[1]};
  border-radius: 8px;

  ${({ isSmall }) => {
        if (!isSmall) {
            return 'height: calc(100vh - 100px);'
        }
    }}

  display: flex;
  flex-flow: column nowrap;
  align-content: space-between;
  overflow: hidden;
  
  max-height: 756px;
`
const Head = styled.div`
  padding: 24px 24px 0 24px;
  font-style: normal;
  font-weight: bold;
  font-size: 20px;
  line-height: 28px;
`
const Body = styled.div`
  padding: 12px 24px 24px;
  overflow-y: scroll;
  flex: 1 1 auto;
`
const Footer = styled.div<{ isSmall: boolean }>`
  .ant-form {
    padding-right: ${({ isSmall }) => isSmall ? '100px' : '0'};
  }

  border-top: 1px solid ${colors.gray[5]};
  padding: 8px;
`
const EmptyContainer = styled.div`
  text-align: center;
  flex: 1 1;
  display: flex;
  align-items: center;
  justify-content: center;

  .ant-empty-image {
    display: none;
  }
`

const CommentsTabsContainer = styled.div`
  padding: 0;
  display: flex;
  flex: 1 1 auto;

  height: calc(100vh - 508px);
  overflow-y: scroll;
`

const EMPTY_CONTAINER_TEXT_STYLES: CSSProperties = { fontSize: fontSizes.content }
const LOADER_STYLES: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '8px 0 18px 0',
}

const EmptyCommentsContainer = ({ PromptTitleMessage, PromptDescriptionMessage }) => (
    <EmptyContainer>
        <Empty
            image={null}
            description={
                <>
                    <Typography.Paragraph strong style={EMPTY_CONTAINER_TEXT_STYLES}>
                        {PromptTitleMessage}
                    </Typography.Paragraph>
                    <Typography.Paragraph type='secondary' style={EMPTY_CONTAINER_TEXT_STYLES}>
                        {PromptDescriptionMessage}
                    </Typography.Paragraph>
                </>
            }
        />
    </EmptyContainer>
)

type CommentsTabContentProps = {
    comments: CommentWithFiles[]
    updateAction: UpdateTicketCommentMutationHookResult[0]
    PromptTitleMessage: string
    PromptDescriptionMessage: string
    editableComment: CommentWithFiles
    setEditableComment: React.Dispatch<React.SetStateAction<CommentWithFiles>>
    bodyRef: React.RefObject<HTMLDivElement>
    sending: boolean
    generateCommentEnabled: boolean
    generateCommentOnClickHandler: MouseEventHandler<HTMLElement>
    generateCommentLoading: boolean
}

const CommentsTabContent: React.FC<CommentsTabContentProps> =
    ({
        sending,
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
    }) => {
        const intl = useIntl()
        const authedContext = useAuth()

        const GenerateResponseMessage = intl.formatMessage({ id: 'ai.generateResponse' })
        const GenerateResponseTooltipMessage = intl.formatMessage({ id: 'ai.generateResponseWithAI' })

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
                        <Comment
                            key={comment.id}
                            comment={comment}
                            deleteAction={deleteAction}
                            setEditableComment={setEditableComment}
                        />
                    )
                }), [comments, editableComment, setEditableComment, updateAction])

        const lastCommentIsFromAuthedUser = useMemo(() => {
            if (comments.length === 0 || !authedContext.isAuthenticated) {
                return false
            }
            const lastComment = comments[comments.length - 1]
            return lastComment?.user?.id === authedContext.user.id
        }, [comments])

        return (
            <>
                {comments.length === 0 ? (
                    <EmptyCommentsContainer
                        PromptTitleMessage={PromptTitleMessage}
                        PromptDescriptionMessage={PromptDescriptionMessage}
                    />
                ) : (
                    <Body ref={bodyRef}>
                        {commentsToRender}
                        {sending && <Loader style={LOADER_STYLES}/>}
                        {( generateCommentEnabled && !lastCommentIsFromAuthedUser ) && (
                            <Tooltip placement='left' mouseEnterDelay={1.5} title={GenerateResponseTooltipMessage}>
                                <div style={{ width: 'fit-content', paddingTop: '4px', paddingBottom: '24px' }}>
                                    <AIFlowButton
                                        loading={generateCommentLoading}
                                        onClick={generateCommentOnClickHandler}
                                    >
                                        {GenerateResponseMessage}
                                    </AIFlowButton>
                                </div>
                            </Tooltip>
                        )}
                    </Body>
                )}
            </>
        )
    }

const NewCommentIndicator = styled.span`
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 100px;
  background-color: ${colors.red[5]};
  position: relative;
  top: -3px;
  left: 2px;
`

const SwitchCommentsTypeWrapper = styled.div`
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid ${colors.gray[5]};
`

export type CommentWithFiles = TicketComment & {
    files: Array<TicketCommentFile> | null
}

interface ICommentsListProps {
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
}

const Comments: React.FC<ICommentsListProps> = ({
    ticketId,
    ticket,
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

    const { user } = useAuth()
    const client = useApolloClient()

    const { breakpoints } = useLayoutContext()
    const [commentType, setCommentType] = useState(ORGANIZATION_COMMENT_TYPE)
    const [editableComment, setEditableComment] = useState<CommentWithFiles>()
    const [sending, setSending] = useState(false)
    const [isInitialUserTicketCommentReadTimeSet, setIsInitialUserTicketCommentReadTimeSet] = useState<boolean>(false)

    const bodyRef = useRef(null)
    const scrollToBottom = () => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight
        }
    }

    const [commentForm] = Form.useForm()

    useEffect(() => {
        setEditableComment(null)
    }, [commentType])

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
    [commentType, createAction, editableComment, refetchComments, ticketId, updateAction, user?.id])

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

    useEffect(() => {
        scrollToBottom()
    }, [comments, commentType])

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
            ticketDetails: ticket.details || '-',
            ticketAddress: ticket.propertyAddress || '-',
            ticketStatusName: ticket.status.name,
        },
    })

    useEffect(() => {
        const rewrittenComment = generateCommentData?.answer

        if (rewrittenComment) {
            commentForm.setFieldValue('content', rewrittenComment)
        }
    }, [generateCommentData])

    const handleGenerateCommentClick = async (comments) => {
        if (!comments || comments.length === 0) {
            return
        }

        const lastComment = comments[comments.length - 1]
        // Last 5 comments excluding the lastComment one
        const last5Comments = comments.slice(Math.max(comments.length - 6, 0), comments.length - 1)

        const context = {
            comment: lastComment.content,
            answer: commentForm.getFieldValue('content') || '',
            ticketLastComments: last5Comments.map(comment => `${comment.user.name}: ${comment.content}`).join('\n'),
        }

        const result = await runGenerateCommentAIFlow({ context })

        if (result.error) {
            notification.error({ message: result.localizedErrorText || GenericErrorMessage })
        }
    }

    return (
        <Container isSmall={!breakpoints.TABLET_LARGE}>
            <Head>{TitleMessage}</Head>
            <SwitchCommentsTypeWrapper>
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
                                    {showIndicator && <NewCommentIndicator title=''/>}
                                </sup>
                            </>
                        }
                    />
                </RadioGroup>
            </SwitchCommentsTypeWrapper>
            <CommentsTabsContainer className='card-container'>
                <>
                    <CommentsTabContent
                        {...commentTabContentProps}
                        editableComment={editableComment}
                        setEditableComment={setEditableComment}
                        updateAction={updateAction}
                        bodyRef={bodyRef}
                        sending={sending}
                        generateCommentEnabled={aiFeaturesEnabled && rewriteTicketCommentEnabled}
                        generateCommentOnClickHandler={() => handleGenerateCommentClick(commentTabContentProps.comments)}
                        generateCommentLoading={generateCommentLoading}
                    />
                </>
            </CommentsTabsContainer>
            <Footer isSmall={!breakpoints.TABLET_LARGE}>
                {canCreateComments ? (
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
                        commentForm={commentForm}
                        generateCommentLoading={generateCommentLoading}
                    />
                ) : (
                    <Typography.Text disabled>{CannotCreateCommentsMessage}</Typography.Text>
                )}
            </Footer>
        </Container>
    )
}

Comments.defaultProps = {
    comments: [],
}

export { Comments }
