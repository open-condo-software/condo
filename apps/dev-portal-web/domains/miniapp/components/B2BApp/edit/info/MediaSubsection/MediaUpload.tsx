import { notification, Form, Upload } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { Download } from '@open-condo/icons'
import { Typography, Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { useFileValidator } from '@/domains/miniapp/hooks/useFileValidator'

import styles from './MediaUpload.module.css'

import type  { UploadFile, UploadProps } from 'antd'

const DESCRIPTION_ELLIPSIS_CONFIG = { rows: 3 } as const

const ALLOWED_MIMETYPES = ['image/webp', 'image/png']

type SizeRestriction = { min: number, max: number }
type ColorDescription = { value: string, textColor: 'black' | 'white' }

export type MediaRestrictions = {
    mimetypes?: Array<typeof ALLOWED_MIMETYPES[number]>
    size?: { width: SizeRestriction, height: SizeRestriction }
    maxFileSize?: number
    colors?: Array<ColorDescription>
}
export type MediaUploadProps = {
    formName: string
    title: string
    description: string
    maxFiles?: number
    restrictions?: MediaRestrictions
}

const ColorSpan: React.FC<{ value: string, textColor: 'black' | 'white', bgColor: string }> = ({ value, textColor, bgColor })=> {
    const intl = useIntl()
    const ColorCopiedMessage = intl.formatMessage({ id: 'pages.apps.any.id.notifications.colorCopied.title' })

    const handleClick = useCallback(() => {
        if (typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(value)
            notification.success({ message: ColorCopiedMessage })
        }
    }, [ColorCopiedMessage, value])

    return <span style={{ color: textColor === 'black' ? colors.black : colors.white, backgroundColor: bgColor }} className={styles.colorSpan} onClick={handleClick}>{value}</span>
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
    title,
    formName,
    description,
    maxFiles = 1,
    restrictions,
}) => {
    const intl = useIntl()
    const UploadAction = intl.formatMessage({ id: 'components.miniapp.mediaUpload.actions.upload' })
    const ReplaceAction = intl.formatMessage({ id: 'components.miniapp.mediaUpload.actions.replace' })
    const SaveAction = intl.formatMessage({ id: 'components.miniapp.mediaUpload.actions.save' })
    const AnyPlaceholder = intl.formatMessage({ id: 'components.miniapp.mediaUpload.restrictions.any.placeholder' })
    const MimetypeLabel = intl.formatMessage({ id: 'components.miniapp.mediaUpload.restrictions.mimetype.label' })
    const SizeLabel = intl.formatMessage({ id: 'components.miniapp.mediaUpload.restrictions.size.label' })
    const ColorsLabel = intl.formatMessage({ id: 'components.miniapp.mediaUpload.restrictions.colors.label' })

    const [currentFiles, setCurrentFiles] = useState <Array<UploadFile>>([])

    const beforeUpload = useFileValidator({
        restrictMimeTypes: restrictions?.mimetypes,
        sizeLimit: restrictions?.maxFileSize,
        dimensionsLimit: restrictions?.size ? {
            min: { width: restrictions.size.width.min, height: restrictions.size.height.min },
            max: { width: restrictions.size.width.max, height: restrictions.size.height.max },
        } : undefined,
    })

    const UploadButtonText = useMemo(() => maxFiles > 1 || currentFiles.length === 0 ? UploadAction : ReplaceAction,
        [ReplaceAction, UploadAction, currentFiles.length, maxFiles]
    )

    const MimetypesValue = useMemo(() => {
        if (!restrictions?.mimetypes) return AnyPlaceholder
        return restrictions.mimetypes.map(mimetype => mimetype.split('/')[1]).join(', ')
    }, [AnyPlaceholder, restrictions?.mimetypes])

    const SizeValue = useMemo(() => {
        if (!restrictions?.size) return AnyPlaceholder
        const minDimensions = `${restrictions.size.width.min}×${restrictions.size.height.min}`
        const maxDimensions = `${restrictions.size.width.max}×${restrictions.size.height.max}`

        if (minDimensions === maxDimensions) return maxDimensions
        return `${minDimensions} - ${maxDimensions}`
    }, [AnyPlaceholder, restrictions?.size])

    const ColorsValue = useMemo(() => {
        if (!restrictions?.colors) return AnyPlaceholder
        return restrictions.colors.flatMap((color, idx) => {
            const component = <ColorSpan key={color.value} value={color.value} textColor={color.textColor} bgColor={color.value} />
            return idx !== 0 ? component : [component, <span key={color.value + 'colon'} className={styles.colon}>,</span>]
        })
    }, [AnyPlaceholder, restrictions?.colors])

    const handleFileChange: Required<UploadProps>['onChange'] = useCallback((info) => {
        setCurrentFiles(info.fileList)
    }, [])

    return (
        <Form name={formName}>
            <Form.Item name='values'>
                <div className={styles.uploadContainer}>
                    <div className={styles.infoContainer}>
                        <Typography.Title level={4} ellipsis type='secondary'>
                            {title}
                        </Typography.Title>
                        <Typography.Paragraph
                            size='medium'
                            ellipsis={DESCRIPTION_ELLIPSIS_CONFIG}
                        >
                            {description}
                        </Typography.Paragraph>
                    </div>
                    <div className={styles.previewContainer}>
                        <span>1</span>
                    </div>
                    <div className={styles.uploadActionsContainer}>
                        <Upload
                            showUploadList={false}
                            maxCount={maxFiles}
                            beforeUpload={beforeUpload}
                            onChange={handleFileChange}
                        >
                            <Button type='secondary' size='medium' icon={<Download size='small'/>}>
                                {UploadButtonText}
                            </Button>
                        </Upload>
                        <div className={styles.restrictionsContainer}>
                            <span>
                                <Typography.Text type='secondary' size='small'>{MimetypeLabel}<span className={styles.colon}>:</span></Typography.Text>
                                <Typography.Text size='small'>{MimetypesValue}</Typography.Text>
                            </span>
                            <span>
                                <Typography.Text type='secondary' size='small'>{SizeLabel}<span className={styles.colon}>:</span></Typography.Text>
                                <Typography.Text size='small'>{SizeValue}</Typography.Text>
                            </span>
                            <span>
                                <Typography.Text type='secondary' size='small'>{ColorsLabel}<span className={styles.colon}>:</span></Typography.Text>
                                <Typography.Text size='small'>{ColorsValue}</Typography.Text>
                            </span>
                        </div>
                    </div>
                    <hr className={styles.divider}/>
                    <Button type='primary' disabled={!currentFiles.length}>{SaveAction}</Button>
                </div>
            </Form.Item>
        </Form>
    )
}