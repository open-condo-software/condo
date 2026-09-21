import { Document } from '@app/condo/schema'
import React, { useMemo } from 'react'

import { Paperclip, Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Typography } from '@open-condo/ui'

import { useUpdateDocumentModal } from '@condo/domains/document/hooks/useUpdateDocumentModal'

import styles from './AIChatDocumentWithDocumentEdition.module.css'


const FILE_NAME_ELLIPSIS = { rows: 1 }


export type AIChatDocumentWithDocumentEditionProps = {
    document: Document & { name: string }
    onRemove: (file: Document & { name: string }) => void
    onUpdate: (file: Document & { name: string }) => void
}

export const AIChatDocumentWithDocumentEdition: React.FC<AIChatDocumentWithDocumentEditionProps> = ({
    document,
    onRemove,
    onUpdate,
}) => {
    const intl = useIntl()
    const organizationMessage = intl.formatMessage({ id: 'documents.SelectDocumentsModal.organization' })
    const propertyMessage = intl.formatMessage({ id: 'documents.SelectDocumentsModal.property' })

    const { baseName, ext } = useMemo(() => {
        const fileNameArr = document.name.split('.')
        const fileExt = fileNameArr.length > 1 ? fileNameArr.pop() : undefined

        return {
            baseName: fileNameArr.join('.'),
            ext: fileExt,
        }
    }, [document])

    const fileName = useMemo(() => {
        const displayedFileName = (
            <Typography.Paragraph
                ellipsis={FILE_NAME_ELLIPSIS}
                size='medium'
                title={document.name}
            >
                {baseName}
                {ext && (
                    <span className={styles.extension}>
                        <Typography.Text type='secondary' size='medium'>
                            .{ext}
                        </Typography.Text>
                    </span>
                )}
            </Typography.Paragraph>
        )

        if (document.id) {
            return (
                <Typography.Link ellipsis={true}>
                    {displayedFileName}
                </Typography.Link>
            )
        }

        return displayedFileName
    }, [document, baseName, ext])

    const { UpdateDocumentModal, setSelectedDocument } = useUpdateDocumentModal()

    return (
        <div className={styles.rootWrapper}>
            {
                document.__typename === 'Document' && (
                    <UpdateDocumentModal
                        refetchDocuments={() => ({})}
                        withCategory={!!document.property}
                        withProperty={!!document.property}
                        onDeleteComplete={() => {
                            onRemove(document)
                        }}
                        onUpdateComplete={onUpdate}
                    />
                )
            }
            <div className={styles.root}>
                <div className={styles.icon}>
                    <Paperclip size='medium' />
                </div>
                <div className={styles.fileContent}>
                    <div className={styles.fileName}>
                        <span className={styles.baseName}>
                            {fileName}
                        </span>
                    </div>
                </div>

                <div className={styles.endBlock}>
                    <div className={styles.fileType}>
                        <div className={styles.fileTypeName}>
                            {
                                document.__typename === 'Document' ? (
                                    <Typography.Link onClick={() => setSelectedDocument(document)}>
                                        {
                                            document.property ? (
                                                <Typography.Paragraph ellipsis={FILE_NAME_ELLIPSIS}>
                                                    {propertyMessage}
                                                </Typography.Paragraph>
                                            ) : (
                                                <Typography.Paragraph ellipsis={FILE_NAME_ELLIPSIS}>
                                                    {organizationMessage}
                                                </Typography.Paragraph>
                                            )
                                        }
                                    </Typography.Link>
                                ) : (
                                    <Typography.Paragraph>
                                            -
                                    </Typography.Paragraph>
                                )
                            }
                        </div>
                        <div className={styles.fileTypeIcon}>
                            {
                                document.__typename === 'Document'
                                    ? '✅'
                                    : '🚫'
                            }
                        </div>
                    </div>

                    <div className={styles.removeButton}>
                        <Button
                            type='secondary'
                            minimal
                            compact
                            size='medium'
                            icon={<Trash size='small' />}
                            onClick={() => onRemove(document)}
                            aria-label='Remove attachment'
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
