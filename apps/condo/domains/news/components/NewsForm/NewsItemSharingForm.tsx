import { B2BApp, NewsItemTemplateTypeType } from '@app/condo/schema'
import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Options as ScrollOptions } from 'scroll-into-view-if-needed'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar as UIActionBar, Alert, Button, Typography } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'
import { NEWS_SHARING_PUSH_NOTIFICATION_SETTINGS } from '@condo/domains/miniapp/constants'
import { MemoizedSharingNewsPreview } from '@condo/domains/news/components/NewsPreview'
import { NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'

import { MemoizedNewsSharingRecipientCounter } from '../RecipientCounter'
import { NewsItemScopeNoInstanceType } from '../types'


const BIG_MARGIN_BOTTOM_STYLE: React.CSSProperties = { marginBottom: '60px' }
export const SCROLL_TO_FIRST_ERROR_CONFIG: ScrollOptions = { behavior: 'smooth', block: 'center' }
const BIG_HORIZONTAL_GUTTER: [Gutter, Gutter] = [50, 0]

export type SharingAppValues = {
    formValues: Record<string, unknown>,
    preview: {
        renderedTitle: string
        renderedBody: string
    }
    isValid: boolean
}

interface INewsItemSharingForm {
    template: {
        title: string
        body: string
        type: string | null
        id?: string
        label?: string
        category?: string
    }

    sharingApp: B2BApp

    ctxId: string

    onSubmit: (SharingAppValues) => void
    onSkip: (SharingAppValues) => void

    initialValues: SharingAppValues | undefined

    newsItemData: {
        type: string
        validBefore?: string
        title: string
        body: string
        scopes: NewsItemScopeNoInstanceType[]
    }
}

export const NewsItemSharingForm: React.FC<INewsItemSharingForm> = ({ newsItemData, initialValues, onSkip, ctxId, onSubmit, sharingApp: { id, newsSharingConfig }, template }) => {

    const intl = useIntl()
    const NextStepShortMessage = intl.formatMessage({ id: 'pages.condo.news.steps.skipLabelShort' })
    const RecipientsLabelMessage = intl.formatMessage({ id: 'pages.condo.news.steps.sharingApp.recipientsLabel' })
    const RecipientsAlertTextMessage = intl.formatMessage({ id: 'pages.condo.news.steps.sharingApp.recipientsAlert' })
    const NotSupportedMessage = intl.formatMessage({ id: 'pages.condo.news.steps.sharingApp.notSupported' })
    const NextStepMessage = intl.formatMessage({ id: 'pages.condo.news.steps.nextStep' })

    const previewHasPush = useMemo(() =>
        (newsSharingConfig.pushNotificationSettings === NEWS_SHARING_PUSH_NOTIFICATION_SETTINGS.ENABLED) ||
            (newsSharingConfig.pushNotificationSettings === NEWS_SHARING_PUSH_NOTIFICATION_SETTINGS.ONLY_EMERGENCY && newsItemData.type === NEWS_TYPE_EMERGENCY),
    [newsSharingConfig, newsItemData, NEWS_SHARING_PUSH_NOTIFICATION_SETTINGS])

    const { breakpoints } = useLayoutContext()
    const isMediumWindow = !breakpoints.DESKTOP_SMALL
    const formFieldsColSpan = isMediumWindow ? 24 : 14
    const formInfoColSpan = 24 - formFieldsColSpan

    const appName = newsSharingConfig.name
    const appIcon = get(newsSharingConfig, ['icon', 'publicUrl'])
    const appPreviewUrl = newsSharingConfig.previewUrl

    const iFramePreviewRef = useRef(null)

    const processedInitialValues = (initialValues && initialValues.formValues && initialValues.preview) ? initialValues : { formValues: {}, preview: { renderedTitle: '', renderedBody: '' }, isValid: false }

    const isCustomForm = !!newsSharingConfig.customFormUrl
    const [ sharingAppFormValues, setSharingAppFormValues ] = useState<SharingAppValues>(processedInitialValues)

    const handleSharingAppIFrameFormMessage = useCallback((event) => {
        const { handler, ctxId: eventCtxId, formValues, preview, isValid } = event.data
        if (handler === 'handleSharingAppIFrameFormMessage' && id === eventCtxId) {
            setSharingAppFormValues({ formValues, preview, isValid })
        }
    }, [id])
    
    const newsSharingRecipientCounter = useMemo(() => <>{ newsSharingConfig.getRecipientsCountersUrl && (
        <Col span={formInfoColSpan}>
            <MemoizedNewsSharingRecipientCounter
                contextId={ctxId}
                newsItemScopes={newsItemData.scopes}
            />
        </Col>
    ) }</>, [newsSharingConfig, newsItemData])

    useEffect(() => {
        const title = get(sharingAppFormValues, ['preview', 'renderedTitle'])
        const body = get(sharingAppFormValues, ['preview', 'renderedBody'])

        if (iFramePreviewRef.current) {
            iFramePreviewRef.current.contentWindow.postMessage({ handler: 'handleUpdateFromCondo', title, body }, appPreviewUrl)
        }
    }, [sharingAppFormValues, iFramePreviewRef, appPreviewUrl])

    useEffect(() => {
        if (typeof window !== 'undefined' && isCustomForm) {
            window.addEventListener('message', handleSharingAppIFrameFormMessage)
            return () => window.removeEventListener('message', handleSharingAppIFrameFormMessage)
        }
    }, [handleSharingAppIFrameFormMessage, isCustomForm])

    return (
        <>
            {
                isCustomForm && (
                    <Col span={24} style={BIG_MARGIN_BOTTOM_STYLE}>
                        <Row gutter={BIG_HORIZONTAL_GUTTER} style={BIG_MARGIN_BOTTOM_STYLE}>
                            {/* marginLeft -10 is to allow component shadows from iFrame to render normally */}
                            <Col style={{ marginLeft: '-10px', minHeight: '500px' }} span={formFieldsColSpan}>
                                <IFrame
                                    src={
                                        `${newsSharingConfig.customFormUrl}?ctxId=${id}&title=${newsItemData.title}&body=${newsItemData.body}&type=${newsItemData.type}&initialValues=${JSON.stringify(processedInitialValues)}&template=${JSON.stringify(template)}`
                                    }
                                    reloadScope='organization'
                                    withLoader
                                    withPrefetch
                                    withResize
                                />
                            </Col>
                            {/* marginLeft 10 is to compensate for marginLeft -10 */}
                            <Col style={{ marginLeft: '10px' }} span={formInfoColSpan}>
                                {(!!get(sharingAppFormValues, ['preview', 'renderedTitle']) || !!get(sharingAppFormValues, ['preview', 'renderedBody'])) && (
                                    <MemoizedSharingNewsPreview
                                        hasPush={previewHasPush}

                                        appName={appName}
                                        appIcon={appIcon}
                                        iFrameUrl={appPreviewUrl}
                                        iFrameRef={iFramePreviewRef}

                                        body={get(sharingAppFormValues, ['preview', 'renderedBody'])}
                                        title={get(sharingAppFormValues, ['preview', 'renderedTitle'])}
                                        validBefore={newsItemData.type === NEWS_TYPE_EMERGENCY ? newsItemData.validBefore : null}
                                    />
                                )}
                            </Col>
        
                            {/* Condo does not support editing news item scopes for custom news sharing integrations */}
                            <Col span={24}>
                                <Row gutter={BIG_HORIZONTAL_GUTTER}>
                                    <Col span={formFieldsColSpan}>
                                        <Row gutter={[24, 10]}>
                                            <Col span={24}>
                                                <Typography.Title level={2}>{RecipientsLabelMessage}</Typography.Title>
                                            </Col>

                                            <Col span={24}>
                                                <Alert
                                                    type='info'
                                                    showIcon
                                                    description={RecipientsAlertTextMessage}
                                                />
                                            </Col>
                                        </Row>
                                    </Col>
                                    { newsSharingRecipientCounter }
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                )
            }

            {
                !isCustomForm && (
                    <>{NotSupportedMessage}</>
                )
            }

            <Row style={{ width: '100%' }}>
                <Col span={24}>
                    <UIActionBar
                        actions={[
                            <Button
                                key='submit'
                                type='primary'
                                children={NextStepMessage}
                                onClick={() => onSubmit(sharingAppFormValues)}
                                disabled={!sharingAppFormValues.isValid}
                            />,
                            <Button
                                key='submit'
                                type='secondary'
                                children={ isMediumWindow ? NextStepShortMessage : intl.formatMessage({ id: 'pages.condo.news.steps.skipLabelLong' }, { appName }) }
                                onClick={() => onSkip(sharingAppFormValues)}
                            />,
                        ]}
                    />
                </Col>
            </Row>
        </>
    )
}
