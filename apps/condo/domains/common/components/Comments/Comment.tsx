import { Comment as AntComment, Popconfirm, Typography, Button } from 'antd'
import { Comment as TComment } from './index'
import { useIntl } from '@core/next/intl'
import { formatDate } from '../../../ticket/utils/helpers'
import { CheckOutlined, CloseOutlined, DeleteFilled, EditFilled } from '@ant-design/icons'
import React, { useState } from 'react'
import { green, red, grey } from '@ant-design/colors'
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

export const Comment: React.FC<ICommentProps> = ({ comment, updateAction, deleteAction }) => {
    const intl = useIntl()
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'Comments.actions.delete.confirm.title' })
    const ConfirmDeleteOkText = intl.formatMessage({ id: 'Comments.actions.delete.confirm.okText' })
    const ConfirmDeleteCancelText = intl.formatMessage({ id: 'Comments.actions.delete.confirm.cancelText' })
    const CommentDeletedText = intl.formatMessage({ id: 'Comments.deleted' })

    const [mode, setMode] = useState<CommentMode>('display')
    const [content, setContent] = useState(comment.content)

    const handleSave = (newContent) => {
        updateAction({ content: newContent }, comment)
            .then(() => {
                setMode('display')
                setContent(newContent)
            })
    }

    const handleCancelSave = () => {
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
                    onClick={() => {setMode('edit')}}
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
                        autoSize: true,
                        onChange: handleSave,
                    }}
                >
                    {content}
                </Typography.Text>
            }
            author={comment.user.name}
            datetime={formatDate(intl, comment.createdAt)}
            actions={actions}
        />
    )
}