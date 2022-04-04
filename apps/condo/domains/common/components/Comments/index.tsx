import React, { CSSProperties, useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import { Divider, Empty, Typography } from 'antd'
import { useLayoutContext } from '../LayoutContext'
import { Comment } from './Comment'
import { CommentForm } from './CommentForm'
import { colors } from '@condo/domains/common/constants/style'
import { ITicketCommentFormState, ITicketCommentUIState } from '../../../ticket/utils/clientSchema/TicketComment'

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

const Comments: React.FC<ICommentsListProps> = ({
    comments,
    createAction,
    canCreateComments,
    actionsFor,
}) => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'Comments.title' })
    const PromptTitleMessage = intl.formatMessage({ id: 'Comments.prompt.title' })
    const PromptDescriptionMessage = intl.formatMessage({ id: 'Comments.prompt.description' })
    const ListDescriptionMessage = intl.formatMessage({ id: 'Comments.list.description' })
    const CannotCreateCommentsMessage = intl.formatMessage({ id: 'Comments.cannotCreateComments' })

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
            {comments.length === 0 ? (
                <EmptyContainer>
                    <Empty
                        image={null}
                        description={
                            <>
                                <Typography.Text strong>{PromptTitleMessage}</Typography.Text><br/>
                                <Typography.Text>{PromptDescriptionMessage}</Typography.Text>
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
