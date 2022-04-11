import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import { Divider, Empty, Tabs, Typography } from 'antd'
import { useLayoutContext } from '../LayoutContext'
import { Comment } from './Comment'
import { CommentForm } from './CommentForm'
import { colors, shadows, fontSizes } from '@condo/domains/common/constants/style'
import { ITicketCommentFormState, ITicketCommentUIState } from '@condo/domains/ticket/utils/clientSchema/TicketComment'
import { ORGANIZATION_COMMENT_TYPE, RESIDENT_COMMENT_TYPE } from '@condo/domains/ticket/constants'
import { File, Organization, UserTypeType } from '@app/condo/schema'

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
const Head = styled.div`
  padding: 24px;
  border-bottom: solid thin ${colors.lightGrey};
  font-style: normal;
  font-weight: bold;
  font-size: 20px;
  line-height: 28px;
  margin-bottom: -24px;
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

interface ICommentsListProps {
    comments: TComment[],
    createAction?: (formValues) => Promise<TComment>,
    updateAction?: (attrs, obj: TComment) => Promise<TComment>
    // Place for abilities check. If action of given type is not returned, appropriate button will not be displayed
    actionsFor: (comment: TComment) => ActionsForComment,
    canCreateComments: boolean,
    refetchComments
}

const { TabPane } = Tabs

const CommentsTabsContainer = styled.div`
    padding: 0;
    display: flex;
    flex: 1 1 auto;

    height: calc(100vh - 508px);
    overflow-y: scroll;
  
    .ant-tabs-card.ant-tabs {
      flex: 1 1 auto;

      & > .ant-tabs-nav {
        border-bottom: 1px solid ${colors.inputBorderGrey};
        padding: 28px 0;
        margin: 0;
        
        .ant-tabs-tab {
          border: none;
          background-color: transparent;
          padding: 9px 20px;
          border-radius: 4px;

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

type CommentsTabContentProps = {
    comments: TComment[],
    PromptTitleMessage: string,
    PromptDescriptionMessage: string,
    actionsFor: (comment: TComment) => ActionsForComment,
    editableComment: TComment
    setEditableComment: React.Dispatch<React.SetStateAction<TComment>>
}

const CommentsTabContent: React.FC<CommentsTabContentProps> =
    ({ comments, PromptTitleMessage, PromptDescriptionMessage, actionsFor, editableComment, setEditableComment }) => {
        const bodyRef = useRef(null)

        const scrollToBottom = () => {
            if (bodyRef.current) {
                bodyRef.current.scrollTop = 0
            }
        }

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
                    <EmptyContainer>
                        <Empty
                            image={null}
                            description={
                                <>
                                    <Typography.Paragraph strong style={{ fontSize: fontSizes.content }}>
                                        {PromptTitleMessage}
                                    </Typography.Paragraph>
                                    <Typography.Paragraph type={'secondary'} style={{ fontSize: fontSizes.content }}>
                                        {PromptDescriptionMessage}
                                    </Typography.Paragraph>
                                </>
                            }
                        />
                    </EmptyContainer>
                ) : (
                    <Body ref={bodyRef}>
                        {commentsToRender}
                    </Body>
                )}
            </>
        )
    }

const COMMENTS_COUNT_STYLES: CSSProperties = { padding: '2px', fontSize: '8px' }

const CommentsTabPaneLabel = ({ label, commentsCount }) => (
    <>
        <Typography.Text>
            {label}
        </Typography.Text>
        <sup>
            <Typography.Text style={COMMENTS_COUNT_STYLES}>
                {commentsCount}
            </Typography.Text>
        </sup>
    </>
)

const Comments: React.FC<ICommentsListProps> = ({
    comments,
    createAction,
    updateAction,
    refetchComments,
    canCreateComments,
    actionsFor,
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

    const { isSmall } = useLayoutContext()
    const [commentType, setCommentType] = useState(ORGANIZATION_COMMENT_TYPE)
    const [editableComment, setEditableComment] = useState<TComment>()
    const [sending, setSending] = useState(false)

    const action = useCallback(async (values, syncModifiedFiles) => {
        setSending(true)

        if (editableComment) {
            updateAction(values, editableComment)
            await syncModifiedFiles(editableComment.id)
            setEditableComment(null)
        } else {
            const comment = await createAction({ ...values, type: commentType })
            await syncModifiedFiles(comment.id)
        }

        setSending(false)
        await refetchComments()
    },
    [commentType, createAction, editableComment, refetchComments, updateAction])

    useEffect(() => {
        setEditableComment(null)
    }, [commentType])

    const commentsWithOrganization = comments.filter(comment => comment.type === ORGANIZATION_COMMENT_TYPE)
    const commentsWithResident = comments.filter(comment => comment.type === RESIDENT_COMMENT_TYPE)

    return (
        <Container isSmall={isSmall}>
            <Head>{TitleMessage}</Head>
            <CommentsTabsContainer className="card-container">
                <Tabs
                    defaultActiveKey={ORGANIZATION_COMMENT_TYPE}
                    centered
                    type={'card'}
                    tabBarGutter={4}
                    onChange={tab => setCommentType(tab)}
                >
                    <TabPane
                        tab={<CommentsTabPaneLabel label={InternalCommentsMessage} commentsCount={commentsWithOrganization.length} />}
                        key={ORGANIZATION_COMMENT_TYPE}
                    >
                        <CommentsTabContent
                            comments={commentsWithOrganization}
                            PromptTitleMessage={PromptInternalCommentsTitleMessage}
                            PromptDescriptionMessage={PromptInternalCommentsDescriptionMessage}
                            actionsFor={actionsFor}
                            editableComment={editableComment}
                            setEditableComment={setEditableComment}
                        />
                    </TabPane>
                    <TabPane
                        tab={<CommentsTabPaneLabel label={ResidentCommentsMessage} commentsCount={commentsWithResident.length} />}
                        key={RESIDENT_COMMENT_TYPE}
                    >
                        <CommentsTabContent
                            comments={commentsWithResident}
                            PromptTitleMessage={PromptResidentCommentsTitleMessage}
                            PromptDescriptionMessage={PromptResidentCommentsDescriptionMessage}
                            actionsFor={actionsFor}
                            editableComment={editableComment}
                            setEditableComment={setEditableComment}
                        />
                    </TabPane>
                </Tabs>
            </CommentsTabsContainer>
            <Footer>
                {canCreateComments ? (
                    <CommentForm
                        action={action}
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
