/** @jsx jsx */
import { grey } from '@ant-design/colors'
import { DeleteFilled, EditFilled } from '@ant-design/icons'
import { Comment as AntComment, Image, Popconfirm, Typography } from 'antd'
import dayjs from 'dayjs'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'
import { css, jsx } from '@emotion/react'
import styled from '@emotion/styled'

import { User, TicketComment } from '@app/condo/schema'
import { useAuth } from '@condo/next/auth'
import { useIntl } from '@condo/next/intl'

import { colors, shadows } from '@condo/domains/common/constants/style'
const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')
import { getIconByMimetype } from '@condo/domains/common/utils/clientSchema/files'

import { Button } from '../Button'
import { CommentWithFiles } from './index'

interface ICommentProps {
    comment: CommentWithFiles,
    setEditableComment: React.Dispatch<React.SetStateAction<CommentWithFiles>>
    deleteAction?: (obj: CommentWithFiles) => Promise<TicketComment>,
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
    margin-bottom: 6px;
    border-radius: 8px;
    padding: 0;
    box-shadow: rgba(0,0,0,0.15) 0 1px 3px;
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

const getFilePreviewByMimetype = (mimetype, url) => {
    if (mimetype.startsWith('image')) return <Image src={url} width={64} height={64} />

    return <CommentFileCard>{getIconByMimetype(mimetype)}</CommentFileCard>
}

const CommentFileListWrapper = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
`

const CommentFileCard = styled.div`
  border-radius: 8px;
  overflow: hidden; 
  background-color: ${colors.backgroundLightGrey};
  width: 64px; 
  height: 64px; 
  display: flex; 
  align-items: center; 
  justify-content: center;
`

const COMMENT_DATE_FORMAT = 'DD.MM.YYYY, HH:mm'
const TEXT_WRAP_COMPONENT_STYLES: CSSProperties = { display: 'flex', flexFlow: 'column', justifyContent: 'center', width: '70px' }
const ELLIPSIS_CONFIG = { rows: 1 }
const FILENAME_TEXT_STYLES: CSSProperties = { margin: 0 }
const AUTHOR_TEXT_STYLES: CSSProperties = { paddingRight: '2px' }

type CommentFileListProps = {
    comment: CommentWithFiles
}

const CommentFileList: React.FC<CommentFileListProps> = ({ comment }) => {
    const files = get(comment, 'files')
    const fileList = useMemo(() => files.map(({ id, file }, index) => {
        const fileNameArr = file.originalFilename.split('.')
        const fileExt = fileNameArr.pop()
        const fileName = fileNameArr.join('.')
        const mimetype = get(file, 'mimetype')
        const url = get(file, 'publicUrl')
        const TextWrapComponent = mimetype.startsWith('image') ? Typography.Paragraph : Typography.Link

        return (
            <TextWrapComponent
                href={url}
                key={index}
                style={TEXT_WRAP_COMPONENT_STYLES}
            >
                {getFilePreviewByMimetype(mimetype, url)}
                <Typography.Paragraph ellipsis={ELLIPSIS_CONFIG} style={FILENAME_TEXT_STYLES}>
                    {fileName}
                    <Typography.Text type={'secondary'}>
                        .{fileExt}
                    </Typography.Text>
                </Typography.Paragraph>
            </TextWrapComponent>
        )
    }), [files])

    if (isEmpty(files)) return null

    return (
        <Image.PreviewGroup>
            <CommentFileListWrapper>
                {fileList}
            </CommentFileListWrapper>
        </Image.PreviewGroup>
    )
}

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

    const { user } = useAuth()

    const [dateShowMode, setDateShowMode] = useState<'created' | 'updated'>('created')

    const handleDeleteComment = useCallback(() => {
        deleteAction(comment)
    }, [comment, deleteAction])
    const handleUpdateComment = useCallback(() => setEditableComment(comment), [comment, setEditableComment])
    const datetimeText = useMemo(() => dayjs(dateShowMode === 'created' ? comment.createdAt : comment.updatedAt).format(COMMENT_DATE_FORMAT),
        [comment.createdAt, comment.updatedAt, dateShowMode])
    const actions = useMemo(() => user.id === comment.user.id && ([
        <Popconfirm
            key="delete"
            title={ConfirmDeleteTitle}
            okText={ConfirmDeleteOkText}
            cancelText={ConfirmDeleteCancelText}
            onConfirm={handleDeleteComment}
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
            onClick={handleUpdateComment}
        />,
    ]), [ConfirmDeleteCancelText, ConfirmDeleteOkText, ConfirmDeleteTitle, comment.user.id, handleDeleteComment, handleUpdateComment, user.id])

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
                    <Typography.Text type={'secondary'} underline style={AUTHOR_TEXT_STYLES}>
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
                        {datetimeText}
                    </Typography.Text>
                </div>
            }
            actions={actions}
            css={CommentStyle}
        />
    )
}