import React from 'react'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import { Empty, Typography } from 'antd'
import { Comment as TComment } from './index'
import { CommentForm } from './CommentForm'
import { Comment } from './Comment'

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
    border-bottom: solid thin #D9D9D9;
    font-style: normal;
    font-weight: bold;
    font-size: 20px;
    line-height: 28px;
`

const Body = styled.div`
    overflow-y: scroll;
    flex: 0 1 auto;
`

const Footer = styled.div`
    border-top: solid thin #D9D9D9;
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

interface ICommentsListProps {
    comments: TComment[],
    createAction?: (formValues) => Promise<any>,
    canCreateComments: boolean,
}

const CommentsList: React.FC<ICommentsListProps> = ({ comments, createAction, canCreateComments }) => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'Comments.title' })
    const PromptTitleMessage = intl.formatMessage({ id: 'Comments.prompt.title' })
    const PromptDescriptionMessage = intl.formatMessage({ id: 'Comments.prompt.description' })
    const ListDescriptionMessage = intl.formatMessage({ id: 'Comments.list.description' })
    const CannotCreateCommentsMessage = intl.formatMessage({ id: 'Comments.cannotCreateComments' })
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
                <Body>
                    <Typography.Text style={{ fontSize: '12px' }}>{ListDescriptionMessage}</Typography.Text>
                    {comments.map(comment => (
                        <Comment
                            key={comment.id}
                            comment={comment}
                        />
                    ))}
                </Body>
            )}
            <Footer>
                {canCreateComments ? (
                    <CommentForm
                        action={createAction}
                        comment={{ content: '' }}
                    />
                ) : (
                    <Typography.Text disabled>{CannotCreateCommentsMessage}</Typography.Text>
                )}
            </Footer>
        </Container>
    )
}

CommentsList.defaultProps = {
    comments: [],
}

export {
    CommentsList,
}