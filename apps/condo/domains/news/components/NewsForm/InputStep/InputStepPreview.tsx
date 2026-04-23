import { B2BAppNewsSharingConfig } from '@app/condo/schema'
import { Col } from 'antd'
import React, { useMemo } from 'react'

import { NEWS_SHARING_PUSH_NOTIFICATION_SETTINGS } from '@condo/domains/miniapp/constants'
import { UploadFileType } from '@condo/domains/news/components/FilesUploadList'
import { MemoizedCondoNewsPreview, MemoizedSharingNewsPreview } from '@condo/domains/news/components/NewsPreview'
import { NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'

import { SharingAppValuesType } from './index'


interface InputStepPreviewProps {
    newsSharingConfig: B2BAppNewsSharingConfig
    isSharingStep: boolean
    sharingAppFormValues: SharingAppValuesType
    newsItemData: {
        type: string
        validBefore?: string
    }
    iFramePreviewRef: React.RefObject<HTMLIFrameElement>
    selectedBody: string
    selectedTitle: string
    selectedFiles?: Array<UploadFileType>
    sharingAppId: string
}

export const InputStepPreview: React.FC<InputStepPreviewProps> = ({
    newsSharingConfig,
    isSharingStep,
    sharingAppFormValues,
    newsItemData,
    iFramePreviewRef,
    selectedBody,
    selectedTitle,
    sharingAppId,
    selectedFiles,
}) => {
    const { type: selectedType, validBefore: selectedValidBeforeText } = newsItemData

    const isCustomPreview = !!newsSharingConfig?.previewUrl && isSharingStep

    const previewHasPush = useMemo(() =>
        (newsSharingConfig?.pushNotificationSettings === NEWS_SHARING_PUSH_NOTIFICATION_SETTINGS.ENABLED) ||
            (newsSharingConfig?.pushNotificationSettings === NEWS_SHARING_PUSH_NOTIFICATION_SETTINGS.ONLY_EMERGENCY && newsItemData.type === NEWS_TYPE_EMERGENCY),
    [newsSharingConfig, newsItemData])

    const appName = newsSharingConfig?.name
    const appIcon = newsSharingConfig?.icon?.publicUrl
    const appPreviewUrl = newsSharingConfig?.previewUrl

    return (
        <>
            {isCustomPreview ? (
                <Col span={24}>
                    {(!!sharingAppFormValues?.preview?.renderedTitle || !!sharingAppFormValues?.preview?.renderedBody || !!selectedBody || !!selectedTitle) && (
                        <MemoizedSharingNewsPreview
                            hasPush={previewHasPush}
                            ctxId={sharingAppId}
                            appName={appName}
                            appIcon={appIcon}
                            iFrameUrl={appPreviewUrl}
                            iFrameRef={iFramePreviewRef}
                            title={sharingAppFormValues?.preview?.renderedTitle || selectedTitle}
                            body={sharingAppFormValues?.preview?.renderedBody || selectedBody}
                            newsType={newsItemData.type}
                            validBefore={newsItemData.validBefore}
                        />
                    )}
                </Col>) : (
                <>
                    {(!!selectedBody || !!selectedTitle) && (
                        <Col span={24}>
                            <MemoizedCondoNewsPreview
                                body={selectedBody}
                                title={selectedTitle}
                                validBefore={selectedType === NEWS_TYPE_EMERGENCY ? selectedValidBeforeText : null}
                                files={selectedFiles}
                            />
                        </Col>
                    )}
                </>
            )}
        </>
    )
}