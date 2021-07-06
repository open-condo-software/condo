import React, { useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import { Empty, Typography } from 'antd'
import { Comment } from './Comment'
import { CommentForm } from './CommentForm'
import { colors } from '@condo/domains/common/constants/style'

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

const Container = styled.aside`
  background: #F5F5F5;
  border-radius: 8px;
  height: calc(100vh - 120px);

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
`
const Body = styled.div`
  overflow-y: scroll;
  flex: 1 1 auto;
`
const Footer = styled.div<{
    hasComments?: boolean
}>`
  ${({ hasComments }) => hasComments ? 'border-top: solid thin #D9D9D9;' : ''}
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

type ActionsForComment = {
    updateAction?: (formValues, obj) => Promise<void>,
    deleteAction?: (formValues, obj) => Promise<void>,
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

    const scrollToBottom = () => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [comments.length])

    return (
        <Container>
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
                    <Typography.Text style={{ fontSize: '12px' }}>{ListDescriptionMessage}</Typography.Text>
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