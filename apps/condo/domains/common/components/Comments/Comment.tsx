import { Comment as AntComment, Popconfirm, Typography, Button } from 'antd'
import { TComment } from './index'
import { useIntl } from '@core/next/intl'
import { formatDate } from '@condo/domains/ticket/utils/helpers'
import { CheckOutlined, CloseOutlined, DeleteFilled, EditFilled } from '@ant-design/icons'
import React, { useState } from 'react'
import { green, red, grey } from '@ant-design/colors'
import { MAX_COMMENT_LENGTH } from './CommentForm'
/** @jsx jsx */
import { css, jsx } from '@emotion/core'


interface ICommentProps {
    comment: TComment,
    updateAction?: (formValues, obj) => Promise<any>,
    deleteAction?: (formValues, obj) => Promise<any>,
}

type CommentMode = 'display' | 'edit' | 'deleted'

const WhiteStyle = css`
    border: none;
    box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05), 0px 6px 16px rgba(0, 0, 0, 0.08), 0px 3px 6px -4px rgba(0, 0, 0, 0.12);
    margin-left: 4px;
`

const DeletedTextStyle = css`
  margin-top: 1em;
  padding-left: 12px;
  color: ${grey[2]};
`

const CommentStyle = css`
    background: white;
    margin-top: 1em;
    border-radius: 8px;
    padding: 0;
    box-shadow: rgba(0,0,0,0.15) 0px 1px 3px;
    font-size: 14px;
    line-height: 22px;

    &:hover {
      .ant-comment-inner {
        .ant-comment-content {
          .ant-comment-actions {
            opacity: 1;
            pointer-events: all;
          }
        }
      }
    }

    .ant-comment-inner {
      padding: 12px;

      .ant-comment-content {
        display: flex;
        flex-flow: column nowrap;

        .ant-comment-content-detail {
          order: 1;
        }
        .ant-comment-content-author {
          order: 2;
          margin-top: 0.6em;
          font-size: 12px;
          
          .ant-comment-content-author-name {
            color: ${green[6]};
          }

          .ant-comment-content-author-time > div > span {
            color: ${grey[2]};
          }
        }
        .ant-comment-actions {
          position: absolute;
          right: -5px;
          bottom: -5px;
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s ease-in-out;
        }
      }
    }
`

export const Comment: React.FC<ICommentProps> = ({ comment, updateAction, deleteAction }) => {
    const intl = useIntl()
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'Comments.actions.delete.confirm.title' })
    const ConfirmDeleteOkText = intl.formatMessage({ id: 'Comments.actions.delete.confirm.okText' })
    const ConfirmDeleteCancelText = intl.formatMessage({ id: 'Comments.actions.delete.confirm.cancelText' })
    const CommentDeletedText = intl.formatMessage({ id: 'Comments.deleted' })
    const MetaUpdatedText = intl.formatMessage({ id: 'Comments.meta.updated' })

    const [mode, setMode] = useState<CommentMode>('display')
    const [content, setContent] = useState(comment.content)
    const [editCanceled, setEditCanceled] = useState(false)

    const [dateShowMode, setDateShowMode] = useState<'created' | 'updated'>('created')
    const handleSave = (newContent) => {
        if (!editCanceled) {
            updateAction({ content: newContent }, comment)
                .then(() => {
                    setMode('display')
                    setContent(newContent)
                })
        }
    }

    const handleCancelSave = () => {
        setEditCanceled(true)
        setMode('display')
    }

    const handleDelete = () => {
        deleteAction({}, comment)
    }

    const actions = []
    if (mode === 'display') {
        if (updateAction) {
            actions.push(
                <Button
                    key="update"
                    size="middle"
                    css={WhiteStyle}
                    icon={<EditFilled />}
                    onClick={() => { setMode('edit') }}
                    style={{ color: green[7] }}
                />
            )
        }
        if (deleteAction) {
            actions.push(
                <Popconfirm
                    title={ConfirmDeleteTitle}
                    okText={ConfirmDeleteOkText}
                    cancelText={ConfirmDeleteCancelText}
                    onConfirm={handleDelete}
                >
                    <Button
                        key="delete"
                        size="middle"
                        css={WhiteStyle}
                        icon={<DeleteFilled />}
                        style={{ color: red[5] }}
                    />
                </Popconfirm>
            )
        }
    } else if (mode === 'edit') {
        actions.push(
            <Button
                key="save"
                size="middle"
                css={WhiteStyle}
                icon={<CloseOutlined />}
                onClick={handleCancelSave}
                style={{ color: grey[3] }}
            />
        )
        actions.push(
            <Button
                key="save"
                size="middle"
                css={WhiteStyle}
                icon={<CheckOutlined />}
                onClick={handleSave}
                style={{ color: green[7] }}
            />
        )
    }

    if (comment.deletedAt) {
        return (
            <Typography.Paragraph
                italic
                css={DeletedTextStyle}
            >
                {CommentDeletedText}
            </Typography.Paragraph>
        )
    }

    return (
        <AntComment
            content={
                <Typography.Text
                    editable={{
                        editing: mode === 'edit',
                        icon: <></>, // `null` does't removes icon
                        autoSize: {
                            minRows: 1,
                            maxRows: 6,
                        },
                        maxLength: MAX_COMMENT_LENGTH,
                        onChange: handleSave,
                    }}
                >
                    {content}
                </Typography.Text>
            }
            author={comment.user.name}
            datetime={
                <div
                    onMouseOut={() => setDateShowMode('created')}
                    onMouseOver={() => setDateShowMode('updated')}
                >
                    <Typography.Text title={MetaUpdatedText}>
                        {dateShowMode === 'created' ?  formatDate(intl, comment.createdAt) : formatDate(intl, comment.updatedAt)}
                    </Typography.Text>
                </div>
            }
            actions={actions}
            css={CommentStyle}
        />
    )
}