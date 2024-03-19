import React, { CSSProperties, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Modal, Radio, RadioGroup, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { EMOJI } from '@condo/domains/common/constants/emoji'
import { RESIDENT_APP_LANDING_EXTERNAL_LINK } from '@condo/domains/onboarding/utils/clientSchema/constants'


type ActiveModalType = 'info' | 'download' | null
type RadioOptionType = 'admin' | 'technic' | 'security'

const APP_CARD_IMAGE_STYLES: CSSProperties = { width: 'inherit', maxWidth: '120px', paddingTop: '6px' }
const TAB_IMAGE_WRAPPER_STYLES: CSSProperties = { margin: 'auto', width: 'fit-content' }
const BASE_IMAGE_CONTAINER_STYLES: CSSProperties =  { height: '240px', width: '100%', backgroundColor: '', overflow: 'hidden', padding: '24px' }
const TAB_IMAGE_STYLES_BY_TYPE: Record<RadioOptionType, CSSProperties> = {
    admin: { width: '277px' },
    technic: { width: '350px' },
    security: { width: '427px' },
}
const MODAL_IMAGE_SRC_BY_TYPE = {
    admin: '/onboarding/technic-app-card/admin.webp',
    technic: '/onboarding/technic-app-card/technic.webp',
    security: '/onboarding/technic-app-card/security.webp',
}
const IMAGE_WRAPPER_BG_COLOR_BY_TYPE = {
    admin: colors.blue[1],
    technic: colors.purple[1],
    security: colors.teal[1],
}

const QR_CODE_IMAGE_STYLES: CSSProperties = { width: '150px', height: '150px' }

export const TechnicAppCard = () => {
    const intl = useIntl()
    const TechnicAppCardTitle = intl.formatMessage({ id: 'tour.technicAppCard.title' })
    const DownloadLabel = intl.formatMessage({ id: 'tour.technicAppCard.download.buttonLabel' })
    const DownloadDescription = intl.formatMessage({ id: 'tour.technicAppCard.download.description' })
    const BackMessage = intl.formatMessage({ id: 'Back' })
    const ThanksMessage = intl.formatMessage({ id: 'Thanks' })
    const GooglePlayMessage = intl.formatMessage({ id: 'tour.technicAppCard.download.googlePlay' })
    const AppStoreMessage = intl.formatMessage({ id: 'tour.technicAppCard.download.appStore' })
    const AppGalleryMessage = intl.formatMessage({ id: 'tour.technicAppCard.download.appGallery' })
    const TechnicAppCardAdminLabel = intl.formatMessage({ id: 'tour.technicAppCard.radio.label.admin' })
    const TechnicAppCardTechnicLabel = intl.formatMessage({ id: 'tour.technicAppCard.radio.label.technic' })
    const TechnicAppCardSecurityLabel = intl.formatMessage({ id: 'tour.technicAppCard.radio.label.security' })

    const [activeModal, setActiveModal] = useState<ActiveModalType>()
    const [radioValue, setRadioValue] = useState<RadioOptionType>('admin')

    const TechnicAppCardText = intl.formatMessage({ id: `tour.technicAppCard.radio.text.${radioValue}` })

    const imageContainerStyles: CSSProperties = useMemo(() =>
        ({ ...BASE_IMAGE_CONTAINER_STYLES, backgroundColor: IMAGE_WRAPPER_BG_COLOR_BY_TYPE[radioValue] })
    , [radioValue])

    return (
        <>
            <Card.CardButton
                header={{
                    emoji: [{ symbol: EMOJI.MECHANIC }, { symbol: EMOJI.WRENCH }],
                    headingTitle: TechnicAppCardTitle,
                }}
                body={{ image: { src: '/onboarding/tourTechnicCard.webp', style: APP_CARD_IMAGE_STYLES } }}
                onClick={() => setActiveModal('info')}
                id='tour-technic-app-card'
            />
            <Modal
                open={activeModal === 'info'}
                title={TechnicAppCardTitle}
                onCancel={() => setActiveModal(null)}
                footer={[
                    <Button
                        type='primary'
                        key='download'
                        onClick={() => setActiveModal('download')}
                        id='tour-technic-app-card-downloadButton'
                    >
                        {DownloadLabel}
                    </Button>,
                ]}
            >
                <Space direction='vertical' size={24}>
                    <RadioGroup
                        optionType='button'
                        onChange={(e) => setRadioValue(e.target.value)}
                        value={radioValue}
                    >
                        <Radio key='admin' value='admin' label={TechnicAppCardAdminLabel}/>
                        <Radio key='technic' value='technic' label={TechnicAppCardTechnicLabel}/>
                        <Radio key='security' value='security' label={TechnicAppCardSecurityLabel}/>
                    </RadioGroup>
                    <div style={imageContainerStyles}>
                        <div style={TAB_IMAGE_WRAPPER_STYLES}>
                            <img src={MODAL_IMAGE_SRC_BY_TYPE[radioValue]} alt='Technic app preview' style={TAB_IMAGE_STYLES_BY_TYPE[radioValue]} />
                        </div>
                    </div>
                    <Typography.Text>
                        {TechnicAppCardText}
                    </Typography.Text>
                </Space>
            </Modal>
            <Modal
                open={activeModal === 'download'}
                title={(
                    <Space size={8} direction='vertical'>
                        <Typography.Title level={3}>{DownloadLabel}</Typography.Title>
                        <Typography.Text type='secondary' size='medium'>{DownloadDescription}</Typography.Text>
                    </Space>
                )}
                onCancel={() => setActiveModal(null)}
                footer={[
                    <Button
                        type='secondary'
                        key='back'
                        onClick={() => setActiveModal('info')}
                    >
                        {BackMessage}
                    </Button>,
                    <Button
                        type='primary'
                        key='close'
                        onClick={() => setActiveModal(null)}
                    >
                        {ThanksMessage}
                    </Button>,
                ]}
            >
                <Space size={16} direction='horizontal'>
                    <Space size={8} direction='vertical' align='center'>
                        <img style={QR_CODE_IMAGE_STYLES} src='/onboarding/technic-app-card/qr-technic-app/GooglePlay.svg' alt='Google Play QR code'/>
                        <Typography.Title level={4}>
                            {GooglePlayMessage}
                        </Typography.Title>
                    </Space>
                    <Space size={8} direction='vertical' align='center'>
                        <img style={QR_CODE_IMAGE_STYLES} src='/onboarding/technic-app-card/qr-technic-app/AppStore.svg' alt='App Store QR code'/>
                        <Typography.Title level={4}>
                            {AppStoreMessage}
                        </Typography.Title>
                    </Space>
                    <Space size={8} direction='vertical' align='center'>
                        <img style={QR_CODE_IMAGE_STYLES} src='/onboarding/technic-app-card/qr-technic-app/AppGalery.svg' alt='App Galery QR code'/>
                        <Typography.Title level={4}>
                            {AppGalleryMessage}
                        </Typography.Title>
                    </Space>
                </Space>
            </Modal>
        </>
    )
}

export const ResidentAppCard = () => {
    const intl = useIntl()
    const ResidentAppCardTitle = intl.formatMessage({ id: 'tour.residentAppCard.title' })

    return (
        <Card.CardButton
            header={{
                emoji: [{ symbol: EMOJI.WOMAN }, { symbol: EMOJI.MAN }],
                headingTitle: ResidentAppCardTitle,
            }}
            body={{ image: { src: '/onboarding/tourResidentCard.webp', style: APP_CARD_IMAGE_STYLES } }}
            onClick={() => {
                window.open(RESIDENT_APP_LANDING_EXTERNAL_LINK, '_blank')
            }}
        />
    )
}