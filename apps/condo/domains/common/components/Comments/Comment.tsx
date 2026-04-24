import { User, TicketComment } from '@app/condo/schema'
import { Comment as AntComment, Image } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback, useMemo, useState } from 'react'


import { Edit, Trash } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Button, Tooltip, Typography } from '@open-condo/ui'

import { URL_REGEX } from '@condo/domains/common/constants/regexps'
import { getIconByMimetype } from '@condo/domains/common/utils/clientSchema/files'

import styles from './Comments.module.css'

import { CommentWithFiles } from './index'

const { RESIDENT, STAFF, SERVICE } = require('@condo/domains/user/constants/common')

interface ICommentProps {
    comment: CommentWithFiles
    setEditableComment: (value: CommentWithFiles) => void
    deleteAction?: (obj: CommentWithFiles) => Promise<void>
    hasInteractiveLinks?: boolean
}

const getFilePreviewByMimetype = (mimetype, url) => {
    if (mimetype.startsWith('image')) return <Image src={url} width={64} height={64} />

    return <div className={styles.commentFileCard}>{getIconByMimetype(mimetype)}</div>
}

const COMMENT_DATE_FORMAT = 'DD.MM.YYYY, HH:mm'
const ELLIPSIS_CONFIG = { rows: 1 }

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
                key={index}
                onClick={() => {
                    if (!mimetype.startsWith('image')) {
                        window.open(url, '_blank')
                    }
                }}
            >
                <div className={styles.textWrapComponent}>
                    {getFilePreviewByMimetype(mimetype, url)}
                    <Typography.Paragraph ellipsis={ELLIPSIS_CONFIG} size='medium'>
                        {fileName}
                        <Typography.Text type='secondary' size='medium'>
                        .{fileExt}
                        </Typography.Text>
                    </Typography.Paragraph>
                </div>
            </TextWrapComponent>
        )
    }), [files])

    if (isEmpty(files)) return null

    return (
        <Image.PreviewGroup>
            <div className={styles.commentFileListWrapper}>
                {fileList}
            </div>
        </Image.PreviewGroup>
    )
}

const getCommentAuthorRoleMessage = (author: User, intl) => {
    const ResidentMessage = intl.formatMessage({ id: 'Contact' }).toLowerCase()
    const ServiceMessage = intl.formatMessage({ id: 'Service' }).toLowerCase()
    const EmployeeMessage = intl.formatMessage({ id: 'Employee' }).toLowerCase()

    switch (get(author, 'type')) {
        case RESIDENT: {
            return ResidentMessage
        }
        case STAFF: {
            return EmployeeMessage
        }
        case SERVICE: {
            return ServiceMessage
        }
    }
}

export const linkifyText = (text: string): React.ReactNode => {
    if (!text) return text

    const parts = text.split(URL_REGEX)

    return parts.map((part, index) => {
        if (part.match(URL_REGEX)) {
            let url = part

            if (!url.startsWith('http')) {
                url = `https://${url}`
            }

            // Validate URL protocol for security
            try {
                const urlObj = new URL(url)
                if (!['http:', 'https:'].includes(urlObj.protocol)) {
                    return part
                }
            } catch {
                return part
            }

            return (
                <Typography.Link
                    key={`${index}-${part}`}
                    href={url}
                    target='_blank'
                    rel='noopener noreferrer'
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </Typography.Link>
            )
        }
        return part
    })
}

export const Comment: React.FC<ICommentProps> = ({ comment, setEditableComment, deleteAction, hasInteractiveLinks = false }) => {
    const intl = useIntl()
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'Comments.actions.delete.confirm.title' })
    const ConfirmDeleteOkText = intl.formatMessage({ id: 'Comments.actions.delete.confirm.okText' })
    const ConfirmDeleteCancelText = intl.formatMessage({ id: 'Comments.actions.delete.confirm.cancelText' })
    const MetaUpdatedText = intl.formatMessage({ id: 'Comments.meta.updated' })
    const DeletedUserText = intl.formatMessage({ id: 'Comments.user.deleted' })
    const DeletedTooltipText = intl.formatMessage({ id: 'Delete' })
    const EditTooltipText = intl.formatMessage({ id: 'Edit' })

    const { user } = useAuth()

    const [isDeleteTooltipOpen, setIsDeleteTooltipOpen] = useState(false)
    const [dateShowMode, setDateShowMode] = useState<'created' | 'updated'>('created')

    const handleDeleteComment = useCallback(() => {
        deleteAction(comment)
        setEditableComment(null)
        setIsDeleteTooltipOpen(false)
    }, [comment, deleteAction, setEditableComment])
    const handleUpdateComment = useCallback(() => setEditableComment(comment), [comment, setEditableComment])
    const datetimeText = useMemo(() => dayjs(dateShowMode === 'created' ? comment.createdAt : comment.updatedAt).format(COMMENT_DATE_FORMAT),
        [comment.createdAt, comment.updatedAt, dateShowMode])
    const datetimeTitle = useMemo(() => comment.createdAt !== comment.updatedAt ? MetaUpdatedText : null,
        [MetaUpdatedText, comment.createdAt, comment.updatedAt])

    const authorRole = getCommentAuthorRoleMessage(get(comment, 'user'), intl)

    const actions = useMemo(() => user.id === comment.user.id && ([
        <Tooltip
            key='delete'
            open={isDeleteTooltipOpen}
            zIndex={1001}
            title={
                <div>
                    <Typography.Paragraph size='medium' strong>{ConfirmDeleteTitle}</Typography.Paragraph>
                    <div className={styles.deleteTooltipButtonContainer}>
                        <Button
                            onClick={()=>setIsDeleteTooltipOpen(false)}
                            type='secondary'
                            size='medium'
                        >
                            {ConfirmDeleteCancelText}
                        </Button>
                        <Button
                            type='primary'
                            size='medium'
                            onClick={handleDeleteComment}
                        >
                            {ConfirmDeleteOkText}
                        </Button>
                    </div>
                </div>
            }
        >
            <Tooltip title={DeletedTooltipText} zIndex={1000}>
                <Button
                    onClick={() => setIsDeleteTooltipOpen(true)}
                    type='secondary'
                    size='large'
                    icon={<Trash size='small'/>}
                    minimal
                    compact
                />
            </Tooltip>
        </Tooltip>,
        <Tooltip title={EditTooltipText} placement='top' key='copyButton'>
            <Button
                type='secondary'
                key='update'
                compact
                size='large'
                minimal
                icon={<Edit size='small' />}
                onClick={handleUpdateComment}
            />
        </Tooltip>,
    ]), [isDeleteTooltipOpen, ConfirmDeleteCancelText, ConfirmDeleteOkText, ConfirmDeleteTitle, comment.user.id, handleDeleteComment, handleUpdateComment, user.id])

    const commentContent = hasInteractiveLinks
        ? linkifyText(comment.content)
        : comment.content

    return (
        <AntComment
            className={styles.comment}
            content={
                <>
                    <Typography.Text size='medium'>
                        {commentContent}
                    </Typography.Text>
                    <CommentFileList comment={comment} />
                </>
            }
            author={
                <Typography.Text type='secondary' size='small'>
                    <Typography.Text type='secondary' underline size='small'>
                        <span className={styles.authorText}>
                            {get(comment, 'user.name', DeletedUserText)}
                        </span>
                    </Typography.Text>
                    {authorRole && `(${authorRole})`},
                </Typography.Text>
            }
            datetime={
                <div
                    onMouseOut={() => setDateShowMode('created')}
                    onMouseOver={() => setDateShowMode('updated')}
                >
                    <Typography.Text title={datetimeTitle} size='small' type='secondary'>
                        {datetimeText}
                    </Typography.Text>
                </div>
            }
            actions={actions}
        />
    )
}

export const CommentPreview: React.FC<{ comment: TicketComment }> = ({ comment }) => {
    const intl = useIntl()
    const DeletedUserText = intl.formatMessage({ id: 'Comments.user.deleted' })

    const authorRole = getCommentAuthorRoleMessage(get(comment, 'user'), intl)

    return (
        <AntComment
            className={styles.commentPreview}
            content={
                <Typography.Text size='medium'>
                    {comment.content}
                </Typography.Text>
            }
            author={
                <Typography.Text type='secondary' size='small'>
                    <Typography.Text type='secondary' size='small'>
                        <span className={styles.authorText}>
                            {get(comment, 'user.name', DeletedUserText)}
                        </span>
                    </Typography.Text>
                    {authorRole && `(${authorRole})`},
                </Typography.Text>
            }
            datetime={
                <Typography.Text type='secondary' size='small'>
                    {dayjs(comment.createdAt).format('DD.MM.YYYY, HH:mm')}
                </Typography.Text>
            }
        />
    )
}