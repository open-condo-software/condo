import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Empty, Tabs, Typography } from 'antd'
import styled from '@emotion/styled'
import get from 'lodash/get'

import { useIntl } from '@core/next/intl'
import { File, Organization, UserTypeType } from '@app/condo/schema'
import { useAuth } from '@core/next/auth'

import { colors, shadows, fontSizes } from '@condo/domains/common/constants/style'
import { ITicketCommentFormState, ITicketCommentUIState } from '@condo/domains/ticket/utils/clientSchema/TicketComment'
import { ORGANIZATION_COMMENT_TYPE, RESIDENT_COMMENT_TYPE } from '@condo/domains/ticket/constants'
import { UserTicketCommentRead } from '@condo/domains/ticket/utils/clientSchema'
import { ITicketUIState } from '@condo/domains/ticket/utils/clientSchema/Ticket'
import { hasUnreadResidentComments } from '@condo/domains/ticket/utils/helpers'

import { Module } from '../MultipleFileUpload'
import { useLayoutContext } from '../LayoutContext'
import { Comment } from './Comment'
import { CommentForm } from './CommentForm'

export type TCommentFile = {
    id: string
    file: File
    organization?: Organization
    comment?: TComment
}

export type TComment = {
    id: string,
    type: ORGANIZATION_COMMENT_TYPE | RESIDENT_COMMENT_TYPE,
    content: string,
    user: {
        id: string,
        name: string,
        type: UserTypeType,
    },
    files: TCommentFile[],
    createdAt: string,
    updatedAt: string,
    deletedAt: string,
}

interface IContainerProps {
    isSmall: boolean
}

const Container = styled.aside<IContainerProps>`
  background: ${colors.backgroundLightGrey};
  border-radius: 8px;
  
  ${({ isSmall }) => {
        if (isSmall) {
            return 'margin: 0 -20px -60px;'
        } else {
            return 'height: calc(100vh - 100px);'
        }
    }}

  display: flex;
  flex-flow: column nowrap;
  align-content: space-between;
`
const Head = styled.div<{ isTabsHidden: boolean }>`
  padding: ${({ isTabsHidden }) => isTabsHidden ? '24px' : '24px 24px 0 24px'};
  border-bottom: ${({ isTabsHidden }) => isTabsHidden ? 'solid thin ' + colors.inputBorderGrey : 'none'}; 
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
const Footer = styled.div`
  border-top: 1px solid ${colors.inputBorderGrey};
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
    updateAction?: (formValues: ITicketCommentFormState, obj: ITicketCommentUIState) => Promise<ITicketCommentUIState>,
    deleteAction?: (formValues: ITicketCommentFormState, obj: ITicketCommentUIState) => Promise<ITicketCommentUIState>,
}

const { TabPane } = Tabs

const CommentsTabsContainer = styled.div<{ isTabsHidden: boolean }>`
    padding: 0;
    display: flex;
    flex: 1 1 auto;

    height: calc(100vh - 508px);
    overflow-y: scroll;
  
    .ant-tabs-card.ant-tabs {
      flex: 1 1 auto;

      & > .ant-tabs-nav {
        visibility: ${({ isTabsHidden }) => isTabsHidden ? 'hidden' : 'visible'};
        opacity: ${({ isTabsHidden }) => isTabsHidden ? '0' : '1'};
        max-height: ${({ isTabsHidden }) => isTabsHidden ? '0' : '100px'};
        padding: ${({ isTabsHidden }) => isTabsHidden ? '0' : '28px 0'};
        transition: opacity 0.2s, max-height 0.2s, padding 0.2s ease-in;
        
        border-bottom: 1px solid ${colors.inputBorderGrey};
        margin: 0;
        
        .ant-tabs-tab {
          border: none;
          background-color: transparent;
          padding: 9px 20px;
          border-radius: 4px;
          
          .ant-tabs-tab-btn {
            display: flex;
          }

          &.ant-tabs-tab-active {
            background-color: white;
            box-shadow: ${shadows.main};
          }
        }
      }
      
      & > .ant-tabs-content-holder {
        display: flex;
        
        .ant-tabs-content.ant-tabs-content-top {
          display: flex;
          flex: 1 1;
          
          .ant-tabs-tabpane {
            display: flex;
          }
        }
      }
    }
`

const EMPTY_CONTAINER_TEXT_STYLES: CSSProperties = { fontSize: fontSizes.content }

const EmptyCommentsContainer = ({ PromptTitleMessage, PromptDescriptionMessage }) => (
    <EmptyContainer>
        <Empty
            image={null}
            description={
                <>
                    <Typography.Paragraph strong style={EMPTY_CONTAINER_TEXT_STYLES}>
                        {PromptTitleMessage}
                    </Typography.Paragraph>
                    <Typography.Paragraph type={'secondary'} style={EMPTY_CONTAINER_TEXT_STYLES}>
                        {PromptDescriptionMessage}
                    </Typography.Paragraph>
                </>
            }
        />
    </EmptyContainer>
)

type CommentsTabContentProps = {
    comments: TComment[],
    PromptTitleMessage: string,
    PromptDescriptionMessage: string,
    actionsFor: (comment: TComment) => ActionsForComment,
    editableComment: TComment
    setEditableComment: React.Dispatch<React.SetStateAction<TComment>>
    isTabsHidden: boolean
    setTabsHidden: React.Dispatch<React.SetStateAction<boolean>>
}

const CommentsTabContent: React.FC<CommentsTabContentProps> =
    ({ isTabsHidden, setTabsHidden, comments, PromptTitleMessage, PromptDescriptionMessage, actionsFor, editableComment, setEditableComment }) => {
        const bodyRef = useRef(null)

        const scrollToBottom = () => {
            if (bodyRef.current) {
                bodyRef.current.scrollTop = 0
            }
        }

        const handleBodyScroll = useCallback((e) => {
            if (e.currentTarget.scrollTop > 30 && !isTabsHidden) {
                setTabsHidden(true)
            } else if (e.currentTarget.scrollTop < 30 && isTabsHidden) {
                setTabsHidden(false)
            }
        }, [isTabsHidden, setTabsHidden])

        useEffect(() => {
            scrollToBottom()
        }, [comments.length])

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
                        {commentsToRender}
                    </Body>
                )}
            </>
        )
    }

const COMMENTS_COUNT_STYLES: CSSProperties = { padding: '2px', fontSize: '8px' }
const NewCommentIndicator = styled.div`
    position: relative;
    top: 5px;
    width: 4px; 
    height: 4px; 
    border-radius: 100px; 
    background-color: ${colors.red[5]};
`

const CommentsTabPaneLabel = ({ label, commentsCount, newCommentsIndicator }) => (
    <>
        <Typography.Text>
            {label}
        </Typography.Text>
        <Typography.Text style={COMMENTS_COUNT_STYLES}>
            {commentsCount}
        </Typography.Text>
        {
            newCommentsIndicator && (
                <NewCommentIndicator title={''} />
            )
        }
    </>
)

interface ICommentsListProps {
    ticket: ITicketUIState,
    comments: TComment[],
    createAction?: (formValues) => Promise<TComment>,
    updateAction?: (attrs, obj: TComment) => Promise<TComment>
    // Place for abilities check. If action of given type is not returned, appropriate button will not be displayed
    actionsFor: (comment: TComment) => ActionsForComment,
    canCreateComments: boolean,
    refetchComments,
    FileModel: Module,
    fileModelRelationField: string,
    userTicketCommentRead,
    createUserTicketCommentRead,
    updateUserTicketCommentRead,
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
    userTicketCommentRead,
    createUserTicketCommentRead,
    updateUserTicketCommentRead,
}) => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'Comments.title' })
    const ResidentCommentsTitleMessage = intl.formatMessage({ id: 'Comments.resident.title' })
    const OrganizationCommentsTitleMessage = intl.formatMessage({ id: 'Comments.organization.title' })
    const CannotCreateCommentsMessage = intl.formatMessage({ id: 'Comments.cannotCreateComments' })
    const InternalCommentsMessage = intl.formatMessage({ id: 'Comments.tab.organization' })
    const PromptInternalCommentsTitleMessage = intl.formatMessage({ id: 'Comments.tab.organization.prompt.title' })
    const PromptInternalCommentsDescriptionMessage = intl.formatMessage({ id: 'Comments.tab.organization.prompt.description' })
    const ResidentCommentsMessage = intl.formatMessage({ id: 'Comments.tab.resident' })
    const PromptResidentCommentsTitleMessage = intl.formatMessage({ id: 'Comments.tab.resident.prompt.title' })
    const PromptResidentCommentsDescriptionMessage = intl.formatMessage({ id: 'Comments.tab.resident.prompt.description' })

    const { isSmall } = useLayoutContext()
    const [commentType, setCommentType] = useState(ORGANIZATION_COMMENT_TYPE)
    const [editableComment, setEditableComment] = useState<TComment>()
    const [sending, setSending] = useState(false)
    const [isTabsHidden, setTabsHidden] = useState<boolean>(false)

    const TabsTitle = useMemo(() => {
        if (isTabsHidden) {
            if (commentType === ORGANIZATION_COMMENT_TYPE) {
                return OrganizationCommentsTitleMessage
            } else if (commentType === RESIDENT_COMMENT_TYPE) {
                return ResidentCommentsTitleMessage
            }
        } else {
            return TitleMessage
        }
    }, [OrganizationCommentsTitleMessage, ResidentCommentsTitleMessage, TitleMessage, commentType, isTabsHidden])

    useEffect(() => {
        setEditableComment(null)
    }, [commentType])

    const commentsWithOrganization = useMemo(() => comments.filter(comment => comment.type === ORGANIZATION_COMMENT_TYPE), [comments])
    const commentsWithResident = useMemo(() => comments.filter(comment => comment.type === RESIDENT_COMMENT_TYPE), [comments])

    const handleCommentAction = useCallback(async (values, syncModifiedFiles) => {
        setSending(true)

        if (editableComment) {
            await updateAction(values, editableComment)
            await syncModifiedFiles(editableComment.id)
            setEditableComment(null)
        } else {
            const comment = await createAction({ ...values, type: commentType })
            await syncModifiedFiles(comment.id)
        }

        await refetchComments()
        setSending(false)
    },
    [commentType, createAction, editableComment, refetchComments, updateAction])

    const handleTabChange = useCallback((tab) => {
        setCommentType(tab)

        if (tab === RESIDENT_COMMENT_TYPE) {
            if (userTicketCommentRead) {
                updateUserTicketCommentRead({}, userTicketCommentRead)
            } else {
                createUserTicketCommentRead({})
            }
        }
    }, [createUserTicketCommentRead, updateUserTicketCommentRead, userTicketCommentRead])

    const showIndicator = useMemo(() => hasUnreadResidentComments(userTicketCommentRead, ticket), [ticket, userTicketCommentRead])

    return (
        <Container isSmall={isSmall}>
            <Head isTabsHidden={isTabsHidden}>{TabsTitle}</Head>
            <CommentsTabsContainer className="card-container" isTabsHidden={isTabsHidden}>
                <Tabs
                    defaultActiveKey={ORGANIZATION_COMMENT_TYPE}
                    centered
                    type={'card'}
                    tabBarGutter={4}
                    onChange={handleTabChange}
                >
                    <TabPane
                        tab={
                            <CommentsTabPaneLabel
                                newCommentsIndicator={false}
                                label={InternalCommentsMessage}
                                commentsCount={commentsWithOrganization.length}
                            />
                        }
                        key={ORGANIZATION_COMMENT_TYPE}
                    >
                        <CommentsTabContent
                            comments={commentsWithOrganization}
                            PromptTitleMessage={PromptInternalCommentsTitleMessage}
                            PromptDescriptionMessage={PromptInternalCommentsDescriptionMessage}
                            actionsFor={actionsFor}
                            editableComment={editableComment}
                            setEditableComment={setEditableComment}
                            isTabsHidden={isTabsHidden}
                            setTabsHidden={setTabsHidden}
                        />
                    </TabPane>
                    <TabPane
                        tab={
                            <CommentsTabPaneLabel
                                label={ResidentCommentsMessage}
                                commentsCount={commentsWithResident.length}
                                newCommentsIndicator={showIndicator}
                            />
                        }
                        key={RESIDENT_COMMENT_TYPE}
                    >
                        <CommentsTabContent
                            comments={commentsWithResident}
                            PromptTitleMessage={PromptResidentCommentsTitleMessage}
                            PromptDescriptionMessage={PromptResidentCommentsDescriptionMessage}
                            actionsFor={actionsFor}
                            editableComment={editableComment}
                            setEditableComment={setEditableComment}
                            isTabsHidden={isTabsHidden}
                            setTabsHidden={setTabsHidden}
                        />
                    </TabPane>
                </Tabs>
            </CommentsTabsContainer>
            <Footer>
                {canCreateComments ? (
                    <CommentForm
                        ticket={ticket}
                        FileModel={FileModel}
                        relationField={fileModelRelationField}
                        action={handleCommentAction}
                        editableComment={editableComment}
                        setEditableComment={setEditableComment}
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
