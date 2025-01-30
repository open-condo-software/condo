import { B2BAppNewsSharingConfig } from '@app/condo/schema'
import { Col } from 'antd'
import get from 'lodash/get'
import React, { useMemo } from 'react'

import { useLayoutContext } from '@app/condo/domains/common/components/LayoutContext'
import { NEWS_SHARING_PUSH_NOTIFICATION_SETTINGS } from '@condo/domains/miniapp/constants'
import { NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'

import { MemoizedCondoNewsPreview, MemoizedSharingNewsPreview } from '../../NewsPreview'

import { SharingAppValuesType } from './index'


interface InputStepPreviewProps {
    newsSharingConfig: B2BAppNewsSharingConfig
    isSharing: boolean
    sharingAppFormValues: SharingAppValuesType
    newsItemData: {
        type: string
        validBefore?: string
    }
    iFramePreviewRef: React.RefObject<HTMLIFrameElement>
    selectedBody: string
    selectedTitle: string
}

export const InputStepPreview: React.FC<InputStepPreviewProps> = ({
    newsSharingConfig,
    isSharing,
    sharingAppFormValues,
    newsItemData,
    iFramePreviewRef,
    selectedBody,
    selectedTitle,
}) => {
    const { type: selectedType, validBefore: selectedValidBeforeText } = newsItemData

    const isCustomPreview = !!newsSharingConfig?.previewUrl && isSharing

    const { breakpoints } = useLayoutContext()

    const isMediumWindow = !breakpoints.DESKTOP_SMALL
    const formFieldsColSpan = isMediumWindow ? 24 : 14
    const formInfoColSpan = 24 - formFieldsColSpan

    const previewHasPush = useMemo(() =>
        (newsSharingConfig?.pushNotificationSettings === NEWS_SHARING_PUSH_NOTIFICATION_SETTINGS.ENABLED) ||
            (newsSharingConfig?.pushNotificationSettings === NEWS_SHARING_PUSH_NOTIFICATION_SETTINGS.ONLY_EMERGENCY && newsItemData.type === NEWS_TYPE_EMERGENCY),
    [newsSharingConfig, newsItemData, NEWS_SHARING_PUSH_NOTIFICATION_SETTINGS])

    const appName = newsSharingConfig?.name
    const appIcon = get(newsSharingConfig, ['icon', 'publicUrl'])
    const appPreviewUrl = newsSharingConfig?.previewUrl

    return (
        <>
            {isCustomPreview ? (
                <Col span={formInfoColSpan}>
                    {(!!get(sharingAppFormValues, ['preview', 'renderedTitle']) || !!get(sharingAppFormValues, ['preview', 'renderedBody'])) && (
                        <MemoizedSharingNewsPreview
                            hasPush={previewHasPush}

                            appName={appName}
                            appIcon={appIcon}
                            iFrameUrl={appPreviewUrl}
                            iFrameRef={iFramePreviewRef}
                            title = {get(sharingAppFormValues, ['preview', 'renderedTitle'])}
                            body = {get(sharingAppFormValues, ['preview', 'renderedBody'])}

                            validBefore={newsItemData.type === NEWS_TYPE_EMERGENCY ? newsItemData.validBefore : null}
                        />
                    )}
                </Col>) : (
                <>
                    { !!formInfoColSpan && (!!selectedBody || !!selectedTitle) && (
                        <Col span={formInfoColSpan}>
                            <MemoizedCondoNewsPreview
                                body={selectedBody}
                                title={selectedTitle}
                                validBefore={selectedType === NEWS_TYPE_EMERGENCY ? selectedValidBeforeText : null}
                            />
                        </Col>
                    )}
                </>
            )}
        </>
    )
}