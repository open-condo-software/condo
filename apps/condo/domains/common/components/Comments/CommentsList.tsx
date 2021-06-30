import React from 'react'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import { Empty } from 'antd'
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
`

const Head = styled.div`
    border-bottom: solid thin #D9D9D9;
    font-style: normal;
    font-weight: bold;
    font-size: 20px;
    line-height: 28px;
`

const Footer = styled.div`
    border-top: solid thin #D9D9D9;
`

const Body = styled.div`
    overflow-y: scroll;
`

const EmptyMessagesDescription = styled.div`
    color: black;
    text-align: center;
    font-style: normal;
    strong {
        font-weight: bold;
        font-size: 16px;
        line-height: 24px;
    }
    p {
        margin-top: 1em;
        font-size: 14px;
        line-height: 22px;
    }
`

interface ICommentsListProps {
    comments: TComment[],
    createAction?: (formValues) => Promise<any>,
}

export const CommentsList: React.FC<ICommentsListProps> = ({ comments, createAction }) => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'Comments.title' })
    const PromptTitleMessage = intl.formatMessage({ id: 'Comments.prompt.title' })
    const PromptDescriptionMessage = intl.formatMessage({ id: 'Comments.prompt.description' })
    const ListDescriptionMessage = intl.formatMessage({ id: 'Comments.list.description' })
    return (
        <Container>
            <Head>{TitleMessage}</Head>
            <Body>
                {comments.length === 0 ? (
                    <Empty
                        image={null}
                        description={
                            <EmptyMessagesDescription>
                                <strong>{PromptTitleMessage}</strong><br/>
                                <p>{PromptDescriptionMessage}</p>
                            </EmptyMessagesDescription>
                        }
                    />
                ) : (
                    <>
                        <p>{ListDescriptionMessage}</p>
                        {comments.map(comment => (
                            <Comment
                                key={comment.id}
                                comment={comment}
                            />
                        ))}
                    </>
                )}
            </Body>
            <Footer>
                <CommentForm
                    action={createAction}
                    comment={{ content: 'Lorem ipsum' }}
                />
            </Footer>
        </Container>
    )
}