import React, { CSSProperties, useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import { Divider, Empty, Tabs, Typography } from 'antd'
import { useLayoutContext } from '../LayoutContext'
import { Comment } from './Comment'
import { CommentForm } from './CommentForm'
import { colors, shadows, fontSizes } from '@condo/domains/common/constants/style'
import { ITicketCommentFormState, ITicketCommentUIState } from '@condo/domains/ticket/utils/clientSchema/TicketComment'
import { COMMENT_TYPES } from '@condo/domains/ticket/constants'

export type TComment = {
    id: string,
    content: string,
    user: {
        id: string,
        name: string,
    },
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
            return 'height: calc(100vh - 120px);'
        }
    }}

  > * {
    padding: 24px
  }

  display: flex;
  flex-flow: column nowrap;
  align-content: space-between;
`
const Head = styled.div`
  border-bottom: solid thin ${colors.lightGrey};
  font-style: normal;
  font-weight: bold;
  font-size: 20px;
  line-height: 28px;
  margin-bottom: -24px;
`
const Body = styled.div`
  overflow-y: scroll;
  flex: 1 1 auto;
  padding-top: 12px;
`
const Footer = styled.div<{
    hasComments?: boolean
}>`
  ${({ hasComments }) => hasComments ? 'border-top: solid thin #D9D9D9;' : ''}
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

const DescriptionContainer = styled.div`
  font-size: 12px;
  margin-bottom: 24px;
`

const COMMENT_FORM_DIVIDER_STYLES: CSSProperties = { margin: 0, padding: 0 }

type ActionsForComment = {
    updateAction?: (formValues: ITicketCommentFormState, obj: ITicketCommentUIState) => Promise<ITicketCommentUIState>,
    deleteAction?: (formValues: ITicketCommentFormState, obj: ITicketCommentUIState) => Promise<ITicketCommentUIState>,
}

interface ICommentsListProps {
    comments: TComment[],
    createAction?: (formValues) => Promise<void>,
    // Place for abilities check. If action of given type is not returned, appropriate button will not be displayed
    actionsFor: (comment: TComment) => ActionsForComment,
    canCreateComments: boolean,
}

const { TabPane } = Tabs

const CommentsTabsContainer = styled.div`
    padding: 0 0 24px 0;
    display: flex;
    flex: 1 1 auto;
  
    .ant-tabs-nav {
      border-bottom: 1px solid ${colors.inputBorderGrey};
      padding: 28px 0;
    }
  
    .ant-tabs-card.ant-tabs {
      flex: 1 1 auto;

      & > .ant-tabs-nav .ant-tabs-tab {
        border: none;
        background-color: transparent;
        padding: 9px 20px;
        border-radius: 4px;
        
        &.ant-tabs-tab-active {
          background-color: white;
          box-shadow: ${shadows.main};
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

const Comments: React.FC<ICommentsListProps> = ({
    comments,
    createAction,
    canCreateComments,
    actionsFor,
}) => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'Comments.title' })
    const ListDescriptionMessage = intl.formatMessage({ id: 'Comments.list.description' })
    const CannotCreateCommentsMessage = intl.formatMessage({ id: 'Comments.cannotCreateComments' })
    const InternalCommentsMessage = intl.formatMessage({ id: 'Comments.tab.organization' })
    const PromptInternalCommentsTitleMessage = intl.formatMessage({ id: 'Comments.tab.organization.prompt.title' })
    const PromptInternalCommentsDescriptionMessage = intl.formatMessage({ id: 'Comments.tab.organization.prompt.description' })
    const ResidentCommentsMessage = intl.formatMessage({ id: 'Comments.tab.resident' })
    const PromptResidentCommentsTitleMessage = intl.formatMessage({ id: 'Comments.tab.resident.prompt.title' })
    const PromptResidentCommentsDescriptionMessage = intl.formatMessage({ id: 'Comments.tab.resident.prompt.description' })

    const bodyRef = useRef(null)
    const { isSmall } = useLayoutContext()

    const scrollToBottom = () => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = 0
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [comments.length])

    return (
        <Container isSmall={isSmall}>
            <Head>{TitleMessage}</Head>
            <CommentsTabsContainer className="card-container">
                <Tabs defaultActiveKey="1" centered type={'card'} tabBarGutter={4}>
                    <TabPane tab={InternalCommentsMessage} key={COMMENT_TYPES.ORGANIZATION}>
                        {comments.length === 0 ? (
                            <EmptyContainer>
                                <Empty
                                    image={null}
                                    description={
                                        <>
                                            <Typography.Paragraph strong style={{ fontSize: fontSizes.content }}>
                                                {PromptInternalCommentsTitleMessage}
                                            </Typography.Paragraph>
                                            <Typography.Paragraph type={'secondary'} style={{ fontSize: fontSizes.content }}>
                                                {PromptInternalCommentsDescriptionMessage}
                                            </Typography.Paragraph>
                                        </>
                                    }
                                />
                            </EmptyContainer>
                        ) : (
                            <Body ref={bodyRef}>
                                <DescriptionContainer>
                                    {ListDescriptionMessage}
                                </DescriptionContainer>
                                {comments.map(comment => {
                                    const { updateAction, deleteAction } = actionsFor(comment)
                                    return (
                                        <Comment
                                            key={comment.id}
                                            comment={comment}
                                            updateAction={updateAction}
                                            deleteAction={deleteAction}
                                        />
                                    )
                                })}
                            </Body>
                        )}
                    </TabPane>
                    <TabPane tab={ResidentCommentsMessage} key={COMMENT_TYPES.RESIDENT}>
                        {comments.length === 0 ? (
                            <EmptyContainer>
                                <Empty
                                    image={null}
                                    description={
                                        <>
                                            <Typography.Paragraph strong style={{ fontSize: fontSizes.content }}>
                                                {PromptResidentCommentsTitleMessage}
                                            </Typography.Paragraph>
                                            <Typography.Paragraph type={'secondary'} style={{ fontSize: fontSizes.content }}>
                                                {PromptResidentCommentsDescriptionMessage}
                                            </Typography.Paragraph>
                                        </>
                                    }
                                />
                            </EmptyContainer>
                        ) : (
                            <Body ref={bodyRef}>
                                <DescriptionContainer>
                                    {ListDescriptionMessage}
                                </DescriptionContainer>
                                {comments.map(comment => {
                                    const { updateAction, deleteAction } = actionsFor(comment)
                                    return (
                                        <Comment
                                            key={comment.id}
                                            comment={comment}
                                            updateAction={updateAction}
                                            deleteAction={deleteAction}
                                        />
                                    )
                                })}
                            </Body>
                        )}
                    </TabPane>
                </Tabs>
            </CommentsTabsContainer>
            <Divider style={COMMENT_FORM_DIVIDER_STYLES} />
            <Footer hasComments={comments.length > 0}>
                {canCreateComments ? (
                    <CommentForm action={createAction}/>
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
