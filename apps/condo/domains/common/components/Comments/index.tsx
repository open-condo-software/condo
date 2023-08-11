import { TicketComment, TicketUpdateInput, TicketCommentFile, Ticket } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Empty, Typography } from 'antd'
import get from 'lodash/get'
import React, { CSSProperties, UIEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Radio, RadioGroup } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

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
const Head = styled.div<{ isTitleHidden: boolean }>`
  padding: 24px 24px 0 24px;
  display: ${({ isTitleHidden }) => isTitleHidden ? 'none' : 'block'};
  font-style: normal;
  font-weight: bold;
  font-size: 20px;
  line-height: 28px;
`
const Body = styled.div`
  padding: 12px 24px 0;
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

type ActionsForComment = {
    updateAction?: (values: Partial<TicketUpdateInput>, obj: TicketComment) => Promise<TicketComment>,
    deleteAction?: (obj: TicketComment) => Promise<TicketComment>,
}

const CommentsTabsContainer = styled.div<{ isTitleHidden: boolean }>`
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
    comments: CommentWithFiles[],
    PromptTitleMessage: string,
    PromptDescriptionMessage: string,
    actionsFor: (comment: CommentWithFiles) => ActionsForComment,
    editableComment: CommentWithFiles
    setEditableComment: React.Dispatch<React.SetStateAction<CommentWithFiles>>
    handleBodyScroll: UIEventHandler<HTMLDivElement>
    bodyRef: React.RefObject<HTMLDivElement>
    sending: boolean
}

const CommentsTabContent: React.FC<CommentsTabContentProps> =
    ({
        sending,
        handleBodyScroll,
        bodyRef,
        comments,
        PromptTitleMessage,
        PromptDescriptionMessage,
        actionsFor,
        editableComment,
        setEditableComment,
    }) => {
        const commentsToRender = useMemo(() =>
            comments
                .filter(comment => editableComment ? comment.id !== editableComment.id : true)
                .map(comment => {
                    const { deleteAction } = actionsFor(comment)

                    return (
                        <Comment
                            key={comment.id}
                            comment={comment}
                            deleteAction={deleteAction}
                            setEditableComment={setEditableComment}
                        />
                    )
                }), [actionsFor, comments, editableComment, setEditableComment])

        return (
            <>
                {comments.length === 0 ? (
                    <EmptyCommentsContainer
                        PromptTitleMessage={PromptTitleMessage}
                        PromptDescriptionMessage={PromptDescriptionMessage}
                    />
                ) : (
                    <Body ref={bodyRef} onScroll={handleBodyScroll}>
                        {sending && <Loader style={LOADER_STYLES}/>}
                        {commentsToRender}
                    </Body>
                )}
            </>
        )
    }

const SCROLL_TOP_OFFSET_TO_HIDE_TITLE = 50
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

const CommentsTabPaneLabel = ({ label, commentsCount, newCommentsIndicator }) => (
    <>
        <Typography.Text>
            {label}
        </Typography.Text>
        <sup>
            {commentsCount}
            {newCommentsIndicator && <NewCommentIndicator title=''/>}
        </sup>
    </>
)

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
    ticket: Ticket,
    comments: CommentWithFiles[],
    createAction?: (formValues) => Promise<TicketComment>,
    updateAction?: (attrs, obj: CommentWithFiles) => Promise<TicketComment>
    // Place for abilities check. If action of given type is not returned, appropriate button will not be displayed
    actionsFor: (comment: CommentWithFiles) => ActionsForComment,
    canCreateComments: boolean,
    refetchComments,
    FileModel: Module,
    ticketCommentsTime
    fileModelRelationField: string,
    userTicketCommentReadTime,
    createUserTicketCommentReadTime,
    updateUserTicketCommentReadTime,
    loadingUserTicketCommentReadTime: boolean
}

const Comments: React.FC<ICommentsListProps> = ({
    ticket,
    comments,
    createAction,
    updateAction,
    refetchComments,
    canCreateComments,
    actionsFor,
    FileModel,
    fileModelRelationField,
    ticketCommentsTime,
    userTicketCommentReadTime,
    createUserTicketCommentReadTime,
    updateUserTicketCommentReadTime,
    loadingUserTicketCommentReadTime,
}) => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'comments.title' })
    const CannotCreateCommentsMessage = intl.formatMessage({ id: 'comments.cannotCreateComments' })
    const InternalCommentsMessage = intl.formatMessage({ id: 'comments.tab.organization' })
    const PromptInternalCommentsTitleMessage = intl.formatMessage({ id: 'comments.tab.organization.prompt.title' })
    const PromptInternalCommentsDescriptionMessage = intl.formatMessage({ id: 'comments.tab.organization.prompt.description' })
    const ResidentCommentsMessage = intl.formatMessage({ id: 'comments.tab.resident' })
    const PromptResidentCommentsTitleMessage = intl.formatMessage({ id: 'comments.tab.resident.prompt.title' })
    const PromptResidentCommentsDescriptionMessage = intl.formatMessage({ id: 'comments.tab.resident.prompt.description' })

    const { breakpoints } = useLayoutContext()
    const [commentType, setCommentType] = useState(ORGANIZATION_COMMENT_TYPE)
    const [editableComment, setEditableComment] = useState<CommentWithFiles>()
    const [sending, setSending] = useState(false)
    const [isTitleHidden, setTitleHidden] = useState<boolean>(false)
    const [isInitialUserTicketCommentReadTimeSet, setIsInitialUserTicketCommentReadTimeSet] = useState<boolean>(false)

    const handleBodyScroll = useCallback((e) => {
        const scrollTop = get(e, ['currentTarget', 'scrollTop'])

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

    useEffect(() => {
        setEditableComment(null)
    }, [commentType])

    const commentsWithOrganization = useMemo(() => comments.filter(comment => comment.type === ORGANIZATION_COMMENT_TYPE), [comments])
    const commentsWithResident = useMemo(() => comments.filter(comment => comment.type === RESIDENT_COMMENT_TYPE), [comments])

    const handleCommentAction = useCallback(async (values, syncModifiedFiles) => {
        if (editableComment) {
            await updateAction(values, editableComment)
            await syncModifiedFiles(editableComment.id)
        } else {
            const comment = await createAction({ ...values, type: commentType })
            await syncModifiedFiles(comment.id)
            scrollToBottom()
        }

        await refetchComments()
        setEditableComment(null)
    },
    [commentType, createAction, editableComment, refetchComments, updateAction])

    const createOrUpdateUserTicketCommentReadTime = useCallback((payload) => {
        if (loadingUserTicketCommentReadTime) return

        if (userTicketCommentReadTime) {
            updateUserTicketCommentReadTime({
                ...payload,
            }, userTicketCommentReadTime)
        } else {
            createUserTicketCommentReadTime({
                ...payload,
            })
        }
    }, [createUserTicketCommentReadTime, loadingUserTicketCommentReadTime, updateUserTicketCommentReadTime, userTicketCommentReadTime])

    useEffect(() => {
        if (!loadingUserTicketCommentReadTime && !isInitialUserTicketCommentReadTimeSet) {
            const now = new Date()
            createOrUpdateUserTicketCommentReadTime({
                readCommentAt: now,
            })

            setIsInitialUserTicketCommentReadTimeSet(true)
        }
    }, [createOrUpdateUserTicketCommentReadTime, isInitialUserTicketCommentReadTimeSet, loadingUserTicketCommentReadTime])

    const handleTabChange = useCallback((event) => {
        const value = event.target.value

        setCommentType(value)
        const now = new Date()

        if (value === RESIDENT_COMMENT_TYPE) {
            createOrUpdateUserTicketCommentReadTime({
                readResidentCommentAt: now,
                readCommentAt: now,
            })
        } else if (value === ORGANIZATION_COMMENT_TYPE) {
            createOrUpdateUserTicketCommentReadTime({
                readCommentAt: now,
            })
        }

        scrollToBottom()
    }, [createOrUpdateUserTicketCommentReadTime])

    const lastResidentCommentAt = get(ticketCommentsTime, 'lastResidentCommentAt')
    const lastCommentAt = get(ticketCommentsTime, 'lastCommentAt')
    const readResidentCommentByUserAt = get(userTicketCommentReadTime, 'readResidentCommentAt')
    const showIndicator = useMemo(() => hasUnreadResidentComments(lastResidentCommentAt, readResidentCommentByUserAt, lastCommentAt),
        [lastCommentAt, lastResidentCommentAt, readResidentCommentByUserAt])

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

    return (
        <Container isSmall={!breakpoints.TABLET_LARGE}>
            <Head isTitleHidden={isTitleHidden}>{TitleMessage}</Head>
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
            <CommentsTabsContainer isTitleHidden={isTitleHidden} className='card-container'>
                <CommentsTabContent
                    {...commentTabContentProps}
                    actionsFor={actionsFor}
                    editableComment={editableComment}
                    setEditableComment={setEditableComment}
                    handleBodyScroll={handleBodyScroll}
                    bodyRef={bodyRef}
                    sending={sending}
                />
            </CommentsTabsContainer>
            <Footer isSmall={!breakpoints.TABLET_LARGE}>
                {canCreateComments ? (
                    <CommentForm
                        ticket={ticket}
                        FileModel={FileModel}
                        relationField={fileModelRelationField}
                        action={handleCommentAction}
                        editableComment={editableComment}
                        setEditableComment={setEditableComment}
                        setSending={setSending}
                        sending={sending}
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
