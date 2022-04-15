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

    .ant-comment-inner {
      padding: 12px;
      margin-bottom: 12px;

      .ant-comment-content {
        display: flex;
        flex-flow: column nowrap;
        
        .ant-image {
          border-radius: 8px;
          overflow: hidden;
          
          .ant-image-mask-info {
            display: none;
          }
        }
        
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
          margin-top: 20px;
          
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

    if (!Array.isArray(files)) {
        return <></>
    }

    return (
        <Image.PreviewGroup>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {
                    files.map(({ id, file }) => {
                        const fileNameArr = file.originalFilename.split('.')
                        const fileExt = fileNameArr.pop()
                        const fileName = fileNameArr.join('.')
                        const mimetype = get(file, 'mimetype')
                        const url = get(file, 'publicUrl')

                        const TextWrapComponent = mimetype.startsWith('image') ? Typography.Paragraph : Typography.Link

                        return (
                            <TextWrapComponent
                                href={url}
                                key={id}
                                style={{ display: 'flex', flexFlow: 'column', justifyContent: 'center', width: '70px' }}
                            >
                                {
                                    mimetype.startsWith('image') ? (
                                        <Image src={url} width={64} height={64} />
                                    ) : (
                                        <div style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: '#F2F3F7', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {getIconByMimetype(mimetype)}
                                        </div>
                                    )
                                }
                                <Typography.Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0 }}>
                                    {fileName}
                                    <Typography.Text type={'secondary'}>
                                            .{fileExt}
                                    </Typography.Text>
                                </Typography.Paragraph>
                            </TextWrapComponent>
                        )
                    })
                }
            </div>
        </Image.PreviewGroup>
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