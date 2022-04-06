import { Comment as AntComment, Popconfirm, Typography } from 'antd'
import { TComment } from './index'
import { useIntl } from '@core/next/intl'
import { DeleteFilled, EditFilled } from '@ant-design/icons'
import React, { useCallback, useState } from 'react'
import { red, grey } from '@ant-design/colors'
import { colors, shadows } from '@condo/domains/common/constants/style'
const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')
/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { User } from '@app/condo/schema'
import dayjs from 'dayjs'
import { Button } from '../Button'


interface ICommentProps {
    comment: TComment,
    setEditableComment
    deleteAction?: (formValues, obj) => Promise<any>,
}

const DeleteButtonStyle = css`
    border: none;
    color: ${colors.red[5]};
    background-color: ${colors.black};
    box-shadow: ${shadows.small};
  
  &:hover {
    background-color: ${colors.white};
    color: ${colors.red[5]};
  }
`

const UpdateButtonStyle = css`
    border: none;
    color: ${colors.white};
    background-color: ${colors.black};
    box-shadow: ${shadows.small};
    margin-left: 4px;
  
  &:hover {
    background-color: ${colors.white};
    color: ${colors.black};
  }
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
      margin-bottom: 12px;

      .ant-comment-content {
        display: flex;
        flex-flow: column nowrap;
        
        .ant-comment-content-author {
          display: block;
          margin-top: 0.6em;
          font-size: 12px;
          
          .ant-comment-content-author-name {
            display: block;
            color: ${colors.textSecondary};
          }

          .ant-comment-content-author-time > div > span {
            color: ${colors.textSecondary};
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

const COMMENT_DATE_FORMAT = 'DD.MM.YYYY, HH:mm'

export const Comment: React.FC<ICommentProps> = ({ comment, setEditableComment, deleteAction }) => {
    const intl = useIntl()
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'Comments.actions.delete.confirm.title' })
    const ConfirmDeleteOkText = intl.formatMessage({ id: 'Comments.actions.delete.confirm.okText' })
    const ConfirmDeleteCancelText = intl.formatMessage({ id: 'Comments.actions.delete.confirm.cancelText' })
    const CommentDeletedText = intl.formatMessage({ id: 'Comments.deleted' })
    const MetaUpdatedText = intl.formatMessage({ id: 'Comments.meta.updated' })
    const ResidentMessage = intl.formatMessage({ id: 'Contact' }).toLowerCase()
    const EmployeeMessage = intl.formatMessage({ id: 'Employee' }).toLowerCase()

    const getCommentAuthorRoleMessage = useCallback((author: User) => {
        switch (author.type) {
            case RESIDENT: {
                return ResidentMessage
            }
            case STAFF: {
                return EmployeeMessage
            }
        }
    }, [EmployeeMessage, ResidentMessage])

    const [dateShowMode, setDateShowMode] = useState<'created' | 'updated'>('created')

    const handleDelete = () => {
        deleteAction({}, comment)
    }

    const actions = [
        <Popconfirm
            key="delete"
            title={ConfirmDeleteTitle}
            okText={ConfirmDeleteOkText}
            cancelText={ConfirmDeleteCancelText}
            onConfirm={handleDelete}
        >
            <Button
                size="large"
                css={DeleteButtonStyle}
                icon={<DeleteFilled/>}
            />
        </Popconfirm>,
        <Button
            key="update"
            size="large"
            css={UpdateButtonStyle}
            icon={<EditFilled />}
            onClick={() => setEditableComment(comment)}
        />,
    ]

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
                <Typography.Text>
                    {comment.content}
                </Typography.Text>
            }
            author={
                <Typography.Text type={'secondary'}>
                    <Typography.Text type={'secondary'} underline style={{ paddingRight: '2px' }}>
                        {comment.user.name}
                    </Typography.Text>
                    ({getCommentAuthorRoleMessage(comment.user)}),
                </Typography.Text>
            }
            datetime={
                <div
                    onMouseOut={() => setDateShowMode('created')}
                    onMouseOver={() => setDateShowMode('updated')}
                >
                    <Typography.Text title={MetaUpdatedText}>
                        {dateShowMode === 'created' ?  dayjs(comment.createdAt).format(COMMENT_DATE_FORMAT) : dayjs(comment.updatedAt).format(COMMENT_DATE_FORMAT)}
                    </Typography.Text>
                </div>
            }
            actions={actions}
            css={CommentStyle}
        />
    )
}