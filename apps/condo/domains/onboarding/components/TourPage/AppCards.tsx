import React, { CSSProperties, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Modal, Radio, RadioGroup, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { EMOJI } from '@condo/domains/common/constants/emoji'


const APP_CARD_IMAGE_STYLES: CSSProperties = { width: 'inherit', maxWidth: '120px', paddingTop: '6px' }
const TAB_IMAGE_BACKGROUND_STYLES: CSSProperties = { height: '240px', width: '100%', backgroundColor: colors.blue[1], overflow: 'hidden', padding: '24px' }
const TAB_IMAGE_WRAPPER_STYLES: CSSProperties = { margin: 'auto', width: 'fit-content' }
const TAB_IMAGE_STYLES: CSSProperties = { width: '200px' }
const QR_CODE_IMAGE_STYLES: CSSProperties = { width: '150px', height: '150px' }

type ActiveModalType = 'info' | 'download' | null
type RadioOptionType = 'admin' | 'technic' | 'security'

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

    return (
        <>
            <Card.CardButton
                header={{
                    emoji: [{ symbol: EMOJI.MECHANIC }, { symbol: EMOJI.WRENCH }],
                    headingTitle: TechnicAppCardTitle,
                }}
                body={{ image: { src: '/onboarding/tourTechnicCard.webp', style: APP_CARD_IMAGE_STYLES } }}
                onClick={() => setActiveModal('info')}
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
                    <div style={TAB_IMAGE_BACKGROUND_STYLES}>
                        <div style={TAB_IMAGE_WRAPPER_STYLES}>
                            <img src='/onboarding/tourTechnicCard.webp' style={TAB_IMAGE_STYLES} />
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
                        <img style={QR_CODE_IMAGE_STYLES} src='/onboarding/qr-technic-app/GooglePlay.svg'/>
                        <Typography.Title level={4}>
                            {GooglePlayMessage}
                        </Typography.Title>
                    </Space>
                    <Space size={8} direction='vertical' align='center'>
                        <img style={QR_CODE_IMAGE_STYLES} src='/onboarding/qr-technic-app/AppStore.svg'/>
                        <Typography.Title level={4}>
                            {AppStoreMessage}
                        </Typography.Title>
                    </Space>
                    <Space size={8} direction='vertical' align='center'>
                        <img style={QR_CODE_IMAGE_STYLES} src='/onboarding/qr-technic-app/AppGalery.svg'/>
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
                if (typeof window !== 'undefined') {
                    window.open('https://doma.ai/app_landing', '_blank')
                }
            }}
        />
    )
}