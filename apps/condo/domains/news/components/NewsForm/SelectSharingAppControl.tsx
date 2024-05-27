import {
    B2BAppContext as IB2BAppContext,
} from '@app/condo/schema'
import get from 'lodash/get'
import React, {CSSProperties} from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

const MARGIN_BOTTOM_10_STYLE: React.CSSProperties = { marginBottom: '10px' }
const CARD_CONTAINER_STYLE = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(246px, 1fr))',
    columnGap: '40px',
    rowGap: '20px',
    width: '100%',
    justifyContent: 'start',
}
//const CARD_CHECKBOX_CONTAINER_STYLE = { width: '246px', height: '400px', marginRight: '40px' }
const CARD_CHECKBOX_CONTAINER_STYLE = { width: '246px', height: '400px' }
const CARD_RESPONSIVE_CHECKBOX_CONTAINER_STYLE = { width: '100%', height: '100%' }
const CARD_ICON_STYLE: CSSProperties = {
    height: '150px',
    marginTop: '25px',
    width: '130px',
    objectFit: 'cover',
    objectPosition: 'top',
}

const DOMA_APP_ICON_URL = '/homeWithSun.svg'
const DOMA_APP_PREVIEW_ICON_URL = '/news/domaAppPreviewIcon.png'
const SHARING_APP_FALLBACK_ICON = '/news/sharingAppIconPlaceholder.svg'
const SHARING_APP_FALLBACK_PREVIEW_ICON = '/news/sharingAppPreviewIconPlaceholder.svg'
const PROMO_APP_PREVIEW_ICON = '/news/promoAppPreviewIcon.png'

const CardCheckbox = Card.CardCheckbox

interface ISelectSharingAppControl {
    sharingAppContexts: IB2BAppContext[],
    selectedSharingApps: Set<string>,
    handleSelectSharingApp: ({ value: string, checked: boolean }) => void
}

const AppDescriptionLabelId = 'pages.news.create.selectSharingApp.appDescription'

const SelectSharingAppControl: React.FC<ISelectSharingAppControl> = ({ sharingAppContexts, selectedSharingApps, handleSelectSharingApp }) => {

    const intl = useIntl()
    const DomaAppDescriptionLabel = intl.formatMessage({ id: AppDescriptionLabelId }, { appName: 'Doma' })
    const OtherAppsLabel = intl.formatMessage({ id: 'pages.news.create.selectSharingApp.otherApps' })
    const OtherAppsDescriptionLabel = intl.formatMessage({ id: 'pages.news.create.selectSharingApp.otherApps.description' })
    const OtherAppsActionLabel = intl.formatMessage({ id: 'pages.news.create.selectSharingApp.otherApps.actionButtonText' })

    const { breakpoints } = useLayoutContext()
    const isMobile = !breakpoints.DESKTOP_SMALL

    const cardStyle = isMobile ? CARD_RESPONSIVE_CHECKBOX_CONTAINER_STYLE : CARD_CHECKBOX_CONTAINER_STYLE

    return (
        <div style={CARD_CONTAINER_STYLE}>
            <div style={cardStyle}>
                <CardCheckbox
                    disabled
                    checked
                    header={{
                        headingTitle: 'Doma',
                        image: {
                            size: 'small',
                            src: DOMA_APP_ICON_URL,
                        },
                    }}
                    body={{
                        description: DomaAppDescriptionLabel,
                        image: {
                            src: DOMA_APP_PREVIEW_ICON_URL,
                            style: CARD_ICON_STYLE,
                        },
                    }}
                    // @ts-ignore
                    bodyDescription
                    bodyImage
                    headerImage
                    headerTitle
                />
            </div>
            { sharingAppContexts.map( ctx => {
                // Replace all ' ' with non breaking space (\u00A0)
                const sharingAppName = get(ctx, ['app', 'newsSharingConfig', 'name'], '').replaceAll(' ', '\u00A0')
        
                const sharingAppIcon = get(ctx, ['app', 'newsSharingConfig', 'icon', 'publicUrl'], SHARING_APP_FALLBACK_ICON)
                const sharingAppPreviewIcon = get(ctx, ['app', 'newsSharingConfig', 'previewPicture', 'publicUrl'], SHARING_APP_FALLBACK_PREVIEW_ICON)

                return (
                    <div key={ctx.id} style={cardStyle}>
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
                            // @ts-ignore
                            bodyDescription
                            bodyImage
                            headerImage
                            headerTitle
                            checked={selectedSharingApps.has(ctx.id)}
                            onChange={(checked) => handleSelectSharingApp({ value: ctx.id, checked })}
                        />
                    </div>
                )
            })}
        
            { sharingAppContexts.length === 0 && (
                <div style={CARD_CHECKBOX_CONTAINER_STYLE}>
                    <Card style={{ flex: 1 }}>
                        <div style={MARGIN_BOTTOM_10_STYLE}>
                            <Typography.Title level={3}>{OtherAppsLabel}</Typography.Title>
                        </div>
                        <div style={MARGIN_BOTTOM_10_STYLE}>
                            <Typography.Paragraph>{OtherAppsDescriptionLabel}</Typography.Paragraph>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                alignSelf: 'stretch',
                                justifyContent: 'center',
                                width: '100%',
                                backgroundColor: colors.gray[1],
                                borderRadius: '12px',
                                marginBottom: '16px',
                            }}
                        >
                            <img
                                src={PROMO_APP_PREVIEW_ICON}
                                style={{
                                    height: '150px',
                                    marginTop: '25px',
                                    width: '130px',
                                    padding: '30px',
                                    objectFit: 'cover',
                                    objectPosition: 'top',
                                }}
                            />
                        </div>
                        {/*// @ts-ignore*/}
                        <Button style={{ width: '100%' }} children={OtherAppsActionLabel} href='/news/settings' type='secondary'/>
                    </Card>
                </div>
            ) }
        </div>
    )
}

export default SelectSharingAppControl