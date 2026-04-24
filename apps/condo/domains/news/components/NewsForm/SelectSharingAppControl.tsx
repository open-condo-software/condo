import {
    useGetCountB2BAppsWithNewsSharingConfigQuery,
    useGetNewsSharingRecipientsLazyQuery,
} from '@app/condo/gql'
import {
    B2BAppContext as IB2BAppContext,
} from '@app/condo/schema'
import { Row } from 'antd'
import { useRouter } from 'next/router'
import React, { CSSProperties, useEffect, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { NewsCardGrid } from '@condo/domains/news/components/NewsForm/NewsCardGrid'

const CARD_CHECKBOX_CONTAINER_STYLE = { maxWidth: '246px', height: '100%' }
const CARD_RESPONSIVE_CHECKBOX_CONTAINER_STYLE = { width: '100%', height: '100%' }
const CARD_ICON_STYLE: CSSProperties = {
    height: '150px',
    marginTop: '25px',
    width: '130px',
    objectFit: 'cover',
    objectPosition: 'top',
}
const CARD_ICON_CONTAINER_STYLE: CSSProperties = {
    alignItems: 'center',
    alignSelf: 'stretch',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: colors.gray[1],
    borderRadius: '12px',
}

const CONDO_APP_ICON_URL = '/homeWithSun.svg'
const CONDO_APP_PREVIEW_ICON_URL = '/news/condoAppPreviewIcon.png'
const SHARING_APP_FALLBACK_ICON = '/news/sharingAppIconPlaceholder.svg'
const SHARING_APP_FALLBACK_PREVIEW_ICON = '/news/sharingAppPreviewIconPlaceholder.svg'
const PROMO_APP_PREVIEW_ICON = '/news/promoAppPreviewIcon.png'
const CardCheckbox = Card.CardCheckbox

interface ISelectSharingAppControl {
    sharingAppContexts: IB2BAppContext[]
    selectedSharingApps: Set<string>
    handleSelectSharingApp: ({ value, checked }: { value: string, checked: boolean }) => void
}

const AppDescriptionLabelId = 'pages.news.create.selectSharingApp.appDescription'
const FinishSettingDescriptionLabelId = 'pages.news.create.selectSharingApp.finishSetting.description'

const SelectSharingAppControl: React.FC<ISelectSharingAppControl> = ({ sharingAppContexts, selectedSharingApps, handleSelectSharingApp }) => {
    const intl = useIntl()
    const CondoMobileAppDescriptionLabel = intl.formatMessage({ id: AppDescriptionLabelId }, { appName: 'Doma' })
    const OtherAppsDescriptionLabel = intl.formatMessage({ id: 'pages.news.create.selectSharingApp.otherApps.description' })
    const OtherAppsActionLabel = intl.formatMessage({ id: 'InMoreDetail' })
    const FinishSettingActionLabel = intl.formatMessage({ id: 'pages.news.create.selectSharingApp.finishSetting.actionButtonText' })
    const CondoMobileAppLabel = intl.formatMessage({ id: 'pages.condo.news.preview.condoAppName' })
    const [appsSettingCompleted, setAppsSettingCompleted] = useState({})

    const { breakpoints } = useLayoutContext()
    const router = useRouter()
    const isMobile = !breakpoints.DESKTOP_SMALL

    const cardStyle = isMobile ? CARD_RESPONSIVE_CHECKBOX_CONTAINER_STYLE : CARD_CHECKBOX_CONTAINER_STYLE

    const onError = useMutationErrorHandler()
    const [getNewsSharingRecipients] = useGetNewsSharingRecipientsLazyQuery()

    useEffect(() => {
        sharingAppContexts.map(async ctx => {
            if (ctx.app?.newsSharingConfig?.getRecipientsUrl) {
                try {
                    const data = await getNewsSharingRecipients({
                        variables: {
                            data: {
                                b2bAppContext: { id: ctx?.id },
                                dv: 1,
                                sender: getClientSideSenderInfo(),
                            },
                        },
                    })

                    setAppsSettingCompleted(prev => ({ ...prev, [ctx.id]: !!data?.data?.recipients?.length }))
                } catch (error) {
                    const message = error?.graphQLErrors?.[0]?.extensions?.messageForUser
                    onError(message)
                    setAppsSettingCompleted(prev => ({ ...prev, [ctx.id]: false }))
                }
            } else {
                setAppsSettingCompleted(prev => ({ ...prev, [ctx.id]: true }))
            }
        })
    }, [sharingAppContexts, getNewsSharingRecipients, onError])

    const { data: countB2BAppsWithNewsSharingConfigResult } =  useGetCountB2BAppsWithNewsSharingConfigQuery()
    const b2BAppWithNewsSharingConfigsCount = countB2BAppsWithNewsSharingConfigResult?._allB2BAppsMeta?.count

    return (
        <NewsCardGrid minColWidth={246}>
            <div style={cardStyle}>
                <CardCheckbox
                    disabled
                    checked
                    header={{
                        headingTitle: CondoMobileAppLabel,
                        image: {
                            size: 'small',
                            src: CONDO_APP_ICON_URL,
                        },
                    }}
                    body={{
                        description: CondoMobileAppDescriptionLabel,
                        image: {
                            src: CONDO_APP_PREVIEW_ICON_URL,
                            style: CARD_ICON_STYLE,
                        },
                    }}
                />
            </div>

            {sharingAppContexts.map(ctx => {
                // Replace all ' ' with non-breaking space (\u00A0)
                const sharingAppName = ctx.app?.newsSharingConfig?.name?.replaceAll(' ', '\u00A0') || ''
                const sharingAppid = ctx.app.id

                const sharingAppIcon = ctx.app?.newsSharingConfig?.icon?.publicUrl || SHARING_APP_FALLBACK_ICON
                const sharingAppPreviewIcon = ctx.app?.newsSharingConfig?.previewPicture?.publicUrl || SHARING_APP_FALLBACK_PREVIEW_ICON
                const completeSettings = appsSettingCompleted[ctx.id]

                return (
                    <React.Fragment key={ctx.id}>
                        {completeSettings ? (
                            <div style={cardStyle}>
                                <CardCheckbox
                                    header={{
                                        headingTitle: sharingAppName,
                                        image: {
                                            size: 'small',
                                            src: sharingAppIcon,
                                        },
                                    }}
                                    body={{
                                        description: intl.formatMessage({ id: AppDescriptionLabelId }, { appName: sharingAppName }),
                                        image: {
                                            src: sharingAppPreviewIcon,
                                            style: CARD_ICON_STYLE,
                                        },
                                    }}
                                    checked={selectedSharingApps.has(ctx.id)}
                                    onChange={(checked) => handleSelectSharingApp({ value: ctx.id, checked })}
                                />
                            </div>
                        ) : (
                            <div style={cardStyle}>
                                <Card title={<Card.CardHeader image={{ src: sharingAppIcon, size: 'small' }} headingTitle={sharingAppName}/>}>
                                    <Card.CardBody
                                        description={intl.formatMessage({ id: FinishSettingDescriptionLabelId }, { appName: sharingAppName })}
                                        image={{
                                            src: sharingAppPreviewIcon,
                                            style: CARD_ICON_STYLE,
                                        }}
                                        button={{
                                            type: 'secondary',
                                            children: FinishSettingActionLabel,
                                            disabled: false,
                                            onClick: () => router.push(`/miniapps/${sharingAppid}`),
                                        }}
                                    />
                                </Card>
                            </div>
                        )}
                    </React.Fragment>
                )
            })}
            {sharingAppContexts.length < b2BAppWithNewsSharingConfigsCount && (
                <div style={cardStyle}>
                    <Card>
                        <Row gutter={[0, 10]}>
                            <Typography.Paragraph>{OtherAppsDescriptionLabel}</Typography.Paragraph>
                            <div style={CARD_ICON_CONTAINER_STYLE}>
                                <img
                                    src={PROMO_APP_PREVIEW_ICON}
                                    style={CARD_ICON_STYLE}
                                    alt='Sharing app preview picture'
                                />
                            </div>
                            <Button block children={OtherAppsActionLabel} href='/news/settings' type='secondary'/>
                        </Row>
                    </Card>
                </div>
            )}
        </NewsCardGrid>
    )
}

export default SelectSharingAppControl