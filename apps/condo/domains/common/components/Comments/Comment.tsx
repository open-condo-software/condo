import { Comment as AntComment, Image, Popconfirm, Typography } from 'antd'
import { TComment } from './index'
import { useIntl } from '@core/next/intl'
import { DeleteFilled, EditFilled } from '@ant-design/icons'
import React, { useState } from 'react'
import { grey } from '@ant-design/colors'
import { colors, shadows } from '@condo/domains/common/constants/style'
const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')
/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { User } from '@app/condo/schema'
import dayjs from 'dayjs'
import { Button } from '../Button'
import get from 'lodash/get'
import { ImageIcon } from '@condo/domains/common/components/icons/ImageIcon'
import { VideoIcon } from '@condo/domains/common/components/icons/VideoIcon'
import { DocIcon } from '@condo/domains/common/components/icons/DocIcon'

interface ICommentProps {
    comment: TComment,
    setEditableComment: React.Dispatch<React.SetStateAction<TComment>>
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
  
  .ant-image {
    display: none;
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
          margin-bottom: 8px;
          font-size: 12px;
          
          .ant-comment-content-author-name {
            display: block;
            color: ${colors.textSecondary};
          }

          .ant-comment-content-author-time {
            padding: 0;
            
            & > div > span {
              color: ${colors.textSecondary};
            }
          }
        }
        
        .ant-comment-content-detail > div {
          margin-top: 10px;
          
          & > .ant-typography {
            margin-bottom: 4px;
            cursor: pointer;

            & > .ant-typography {
              margin-left: 8px;
            }
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

const getIconByMimetype = (mimetype) => {
    if (mimetype.startsWith('image')) {
        return <ImageIcon />
    } else if (mimetype.startsWith('video')) {
        return <VideoIcon />
    } else {
        return <DocIcon />
    }
}

const CommentFileList = ({ comment }) => {
    const files = get(comment, 'files')
    const [openedImageSrc, setOpenedImageSrc] = useState()

    if (!Array.isArray(files)) {
        return <></>
    }

    return (
        <div>
            {
                files.map(({ id, file }) => {
                    const fileNameArr = file.originalFilename.split('.')
                    const fileExt = fileNameArr.pop()
                    const fileName = fileNameArr.join('.')

                    return (
                        <>
                            <Typography.Paragraph
                                key={id}
                                onClick={() => setOpenedImageSrc(file.publicUrl)}
                                style={{ display: 'flex' }}
                            >
                                {getIconByMimetype(get(file, 'mimetype'))}
                                <Typography.Text>
                                    {fileName}
                                    <Typography.Text type={'secondary'}>
                                        .{fileExt}
                                    </Typography.Text>
                                </Typography.Text>
                            </Typography.Paragraph>
                        </>
                    )
                })
            }
            {
                openedImageSrc && (
                    <Image
                        preview={{
                            visible: true,
                            src: openedImageSrc,
                            onVisibleChange: (visible, prevVisible) => setOpenedImageSrc(null),
                        }}
                    />
                )
            }
        </div>
    )
}

const COMMENT_DATE_FORMAT = 'DD.MM.YYYY, HH:mm'

const getCommentAuthorRoleMessage = (author: User, intl) => {
    const ResidentMessage = intl.formatMessage({ id: 'Contact' }).toLowerCase()
    const EmployeeMessage = intl.formatMessage({ id: 'Employee' }).toLowerCase()

    switch (author.type) {
        case RESIDENT: {
            return ResidentMessage
        }
        case STAFF: {
            return EmployeeMessage
        }
    }
}

export const Comment: React.FC<ICommentProps> = ({ comment, setEditableComment, deleteAction }) => {
    const intl = useIntl()
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'Comments.actions.delete.confirm.title' })
    const ConfirmDeleteOkText = intl.formatMessage({ id: 'Comments.actions.delete.confirm.okText' })
    const ConfirmDeleteCancelText = intl.formatMessage({ id: 'Comments.actions.delete.confirm.cancelText' })
    const CommentDeletedText = intl.formatMessage({ id: 'Comments.deleted' })
    const MetaUpdatedText = intl.formatMessage({ id: 'Comments.meta.updated' })

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
                <>
                    <Typography.Text>
                        {comment.content}
                    </Typography.Text>
                    <CommentFileList comment={comment} />
                </>
            }
            author={
                <Typography.Text type={'secondary'}>
                    <Typography.Text type={'secondary'} underline style={{ paddingRight: '2px' }}>
                        {comment.user.name}
                    </Typography.Text>
                    ({getCommentAuthorRoleMessage(comment.user, intl)}),
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