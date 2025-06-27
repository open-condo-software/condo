import get from 'lodash/get'
import getConfig from 'next/config'
import React, { CSSProperties, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Modal, Radio, RadioGroup, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { EMOJI } from '@condo/domains/common/constants/emoji'
import { GUIDE_LINK } from '@condo/domains/onboarding/utils/clientSchema/constants'


const {
    publicRuntimeConfig,
} = getConfig()

const { telegramEmployeeBotName } = publicRuntimeConfig

type ActiveModalType = 'info' | 'download' | null
type RadioOptionType = 'admin' | 'technic' | 'security'

const APP_CARD_IMAGE_STYLES: CSSProperties = { width: 'inherit', maxWidth: '120px', paddingTop: '6px' }
const TAB_IMAGE_WRAPPER_STYLES: CSSProperties = { margin: 'auto', width: 'fit-content' }
const BASE_IMAGE_CONTAINER_STYLES: CSSProperties =  { borderRadius: '12px', height: '240px', width: '100%', backgroundColor: '', overflow: 'hidden', padding: '24px' }
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
    const ChantBotMessage = intl.formatMessage({ id: 'ChatBot' }).toLowerCase()
    const OpenChatBotMessage = intl.formatMessage({ id: 'tour.technicAppCard.download.linkToEmployeeBot' })

    const [activeModal, setActiveModal] = useState<ActiveModalType>()
    const [radioValue, setRadioValue] = useState<RadioOptionType>('admin')

    const TechnicAppCardText = intl.formatMessage({ id: `tour.technicAppCard.radio.text.${radioValue}` })

    const showLinkToEmployeeBot = !!telegramEmployeeBotName && (radioValue === 'admin' || radioValue === 'technic')
    const linkToEmployeeBot = useMemo(() => telegramEmployeeBotName ? (
        <Typography.Link
            href={`https://t.me/${telegramEmployeeBotName}`}
            target='_blank'
            id={`employee-telegram-bot-from-onboarding-by-technic-app-card-as-${radioValue}`}
        >
            {ChantBotMessage}
        </Typography.Link>
    ) : null, [ChantBotMessage, radioValue])
    const LinkToEmployeeBotMessage = intl.formatMessage({ id: `tour.technicAppCard.radio.text.${radioValue}.linkToEmployeeBot` as FormatjsIntl.Message['ids'] }, { linkToEmployeeBot })

    const imageContainerStyles: CSSProperties = useMemo(() =>
        ({ ...BASE_IMAGE_CONTAINER_STYLES, backgroundColor: IMAGE_WRAPPER_BG_COLOR_BY_TYPE[radioValue] })
    , [radioValue])

    const locale = useMemo(() => get(intl, 'locale'), [intl])

    return (
        <>
            <Card.CardButton
                header={{
                    emoji: [{ symbol: EMOJI.MECHANIC }, { symbol: EMOJI.WRENCH }],
                    headingTitle: TechnicAppCardTitle,
                }}
                body={{ image: { src: `/onboarding/technic-app-card/${locale}/card-image/tourTechnicCard.webp`, style: APP_CARD_IMAGE_STYLES } }}
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
                    {
                        radioValue === 'admin' && (
                            <>
                                <div style={imageContainerStyles}>
                                    <div style={TAB_IMAGE_WRAPPER_STYLES}>
                                        <img
                                            src={`/onboarding/technic-app-card/${locale}/tabs/admin.webp`}
                                            alt='Technic app preview for admins'
                                            style={{ width: '310px' }}
                                        />
                                    </div>
                                </div>
                                <Typography.Text>
                                    {TechnicAppCardText}
                                    {showLinkToEmployeeBot && (<>. {LinkToEmployeeBotMessage}</>)}
                                </Typography.Text>
                            </>
                        )
                    }
                    {
                        radioValue === 'technic' && (
                            <>
                                <div style={imageContainerStyles}>
                                    <div style={TAB_IMAGE_WRAPPER_STYLES}>
                                        <img
                                            src={`/onboarding/technic-app-card/${locale}/tabs/technic.webp`}
                                            alt='Technic app preview for technics'
                                            style={{ width: '350px' }}
                                        />
                                    </div>
                                </div>
                                <Typography.Text>
                                    {TechnicAppCardText}
                                    {showLinkToEmployeeBot && (<>. {LinkToEmployeeBotMessage}</>)}
                                </Typography.Text>
                            </>
                        )
                    }
                    {
                        radioValue === 'security' && (
                            <>
                                <div style={imageContainerStyles}>
                                    <div style={TAB_IMAGE_WRAPPER_STYLES}>
                                        <img
                                            src={`/onboarding/technic-app-card/${locale}/tabs/security.webp`}
                                            alt='Technic app preview for security'
                                            style={{ width: '427px' }}
                                        />
                                    </div>
                                </div>
                                <Typography.Text>
                                    {TechnicAppCardText}
                                </Typography.Text>
                            </>
                        )
                    }
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
                <Space size={24} direction='vertical'>
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
                    {
                        telegramEmployeeBotName && (
                            <Typography.Link
                                href={`https://t.me/${telegramEmployeeBotName}`}
                                target='_blank'
                                id='employee-telegram-bot-from-onboarding-by-download-modal'
                            >
                                {OpenChatBotMessage}
                            </Typography.Link>
                        )
                    }
                </Space>
            </Modal>
        </>
    )
}

export const ResidentAppCard = () => {
    const intl = useIntl()
    const ResidentAppCardTitle = intl.formatMessage({ id: 'tour.residentAppCard.title' })

    const locale = useMemo(() => get(intl, 'locale'), [intl])

    return (
        <Card.CardButton
            header={{
                emoji: [{ symbol: EMOJI.WOMAN }, { symbol: EMOJI.MAN }],
                headingTitle: ResidentAppCardTitle,
            }}
            body={{ image: { src: `/onboarding/tour-resident-card/${locale}/card-image/tourResidentCard.webp`, style: APP_CARD_IMAGE_STYLES } }}
            onClick={() => {
                window.open(GUIDE_LINK, '_blank')
            }}
        />
    )
}