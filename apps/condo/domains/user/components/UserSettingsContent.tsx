import { useUpdateUserMutation, useChangeTwoFactorAuthenticationMutation } from '@app/condo/gql'
import { UserHelpRequestTypeType } from '@app/condo/schema'
import { Col, Row, Switch } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { SwitchChangeEventHandler } from 'antd/lib/switch'
import debounce from 'lodash/debounce'
import isBoolean from 'lodash/isBoolean'
import getConfig from 'next/config'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Info } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'
import { LocaleContext, useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Modal, Select, Tooltip, Typography } from '@open-condo/ui'

import { SERVICE_PROVIDER_PROFILE, TWO_FACTOR_SETTING } from '@condo/domains/common/constants/featureflags'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { UserHelpRequest } from '@condo/domains/onboarding/utils/clientSchema'

import { useSudoToken } from './SudoTokenProvider'


const ROW_GUTTER_BIG: [Gutter, Gutter] = [0, 60]
const ROW_GUTTER_MID: [Gutter, Gutter] = [0, 40]
const ROW_GUTTER_SMALL: [Gutter, Gutter] = [0, 24]

const {
    publicRuntimeConfig: {
        telegramEmployeeBotName,
        sppConfig,
    },
} = getConfig()


export const UserSettingsContent: React.FC = () => {
    const intl = useIntl()
    const InterfaceLanguageTitle = intl.formatMessage({ id: 'pages.condo.profile.interfaceLanguage' })
    const ChooseInterfaceLanguageTitle = intl.formatMessage({ id: 'pages.condo.profile.chooseInterfaceLanguage' })
    const EmployeeTelegramTitle = intl.formatMessage({ id: 'pages.condo.profile.employeeTelegramBot.title' })
    const EmployeeTelegramTooltipMessage = intl.formatMessage({ id: 'pages.condo.profile.employeeTelegramBot.description' })
    const EmployeeTelegramOpenMessage = intl.formatMessage({ id: 'pages.condo.profile.employeeTelegramBot.open' })
    const GlobalHintsTitle = intl.formatMessage({ id: 'pages.condo.profile.globalHints' })
    const CompanyName = intl.formatMessage({ id: 'CompanyName' })
    const HasMarketingConsentTitle = intl.formatMessage({ id: 'pages.condo.profile.hasMarketingConsent' }, { company: CompanyName })
    const DisabledHasMarketingConsentTooltip = intl.formatMessage({ id: 'pages.condo.profile.hasMarketingConsent.disabled.tooltip' })
    const TwoFATitle = intl.formatMessage({ id: 'pages.condo.profile.2FA.title' })
    const TwoFAEnableModalTitle = intl.formatMessage({ id: 'component.SudoTokenProvider.modal.password.title.enable2FA' })
    const TwoFADisableModalTitle = intl.formatMessage({ id: 'component.SudoTokenProvider.modal.password.title.disable2FA' })
    const DisableSPPTitle = intl.formatMessage({ id: 'pages.condo.profile.disableSPPTitle' })
    const DisableSPPRequestSentTitle = intl.formatMessage({ id: 'pages.condo.profile.disableSPPRequestSentTitle' })
    const SendDisableSPPRequestTitle = intl.formatMessage({ id: 'pages.condo.profile.sendDisableSPPRequestTitle' })
    const SendDisableSPPRequestModalTitle = intl.formatMessage({ id: 'pages.condo.profile.sendDisableSPPRequestModalTitle' })
    const SendDisableSPPRequestModalMessage = intl.formatMessage({ id: 'pages.condo.profile.sendDisableSPPRequestModalMessage' })
    const SendDisableSPPRequestConfirmButtonText = intl.formatMessage({ id: 'pages.condo.profile.sendDisableSPPRequestConfirmButtonText' })
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'Email' })
    const InternationalCompanyName = intl.formatMessage({ id: 'CompanyName.international' })
    const NotVerifiedEmailTooltipMessage = intl.formatMessage({ id: 'pages.condo.profile.2FA.tooltip.notVerifiedEmail' }, { companyName: InternationalCompanyName })
    const NotVerifiedPhoneTooltipMessage = intl.formatMessage({ id: 'pages.condo.profile.2FA.tooltip.notVerifiedPhone' })

    const RuTitle = intl.formatMessage({ id: 'language.russian.withFlag' })
    const EnTitle = intl.formatMessage({ id: 'language.english-us.withFlag' })
    const EsTitle = intl.formatMessage({ id: 'language.spanish-es.withFlag' })

    const { user, refetch } = useAuth()

    const EmptyFactorsTooltipMessage = useMemo(() => {
        if (!user?.email || !user?.phone) {
            const factors = [
                (!user?.email) && EmailMessage.toLowerCase(),
                (!user?.phone) && PhoneMessage.toLowerCase(),
            ].filter(Boolean).join(', ')
            return intl.formatMessage({ id: 'pages.condo.profile.2FA.tooltip.emptyFactors' }, {
                factors,
            })
        }

        if (!user?.isEmailVerified) {
            return NotVerifiedEmailTooltipMessage
        }

        if (!user?.isPhoneVerified) {
            return NotVerifiedPhoneTooltipMessage
        }

        return null
    }, [user?.email, user?.phone, user?.isEmailVerified, user?.isPhoneVerified, EmailMessage, PhoneMessage, intl, NotVerifiedEmailTooltipMessage, NotVerifiedPhoneTooltipMessage])

    const [showGlobalHints, setShowGlobalHints] = useState<boolean>(false)
    const [hasMarketingConsent, setMarketingConsent] = useState<boolean>(false)
    const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(false)
    const [disableSPPConfirmModalShown, setDisableSPPConfirmModalShown] = useState<boolean>(false)
    const [isSendingDisableSPPRequest, setIsSendingDisableSPPRequest] = useState<boolean>(false)
    const sppBillingId = sppConfig?.BillingIntegrationId || null
    const { organization } = useOrganization()

    const { getSudoTokenWithModal, clearSudoToken } = useSudoToken()

    const { useFlag } = useFeatureFlags()
    const isSPPOrg = useFlag(SERVICE_PROVIDER_PROFILE)
    const isFeature2FAEnabled = useFlag(TWO_FACTOR_SETTING)
    const { objs: userHelpRequests, refetch: userHelpRequestRefetch, loading: userHelpRequestsLoading } = UserHelpRequest.useObjects({
        where: {
            organization: { id: organization?.id },
            billingIntegration: { id: sppBillingId },
            type: UserHelpRequestTypeType.IntegrationSetup,
            meta: { disableIntegration: true },
        },
        first: 1,
    }, { skip: !organization || !isSPPOrg || !sppBillingId })

    const createUserHelpRequestAction = UserHelpRequest.useCreate({
        type: UserHelpRequestTypeType.IntegrationSetup,
        meta: { disableIntegration: true },
    }, () => userHelpRequestRefetch())

    const sendDisableSppRequest = useCallback(async () => {
        if (!organization?.id || !user?.phone || !sppBillingId) return
        setIsSendingDisableSPPRequest(true)
        const createInput = {
            organization: { connect: { id: organization?.id } },
            billingIntegration: { connect: { id: sppBillingId } },
            phone: user.phone,
            email: user?.email ?? null,
        }
        try {
            await createUserHelpRequestAction(createInput)
            setDisableSPPConfirmModalShown(false)
        } catch (e) {
            console.error('Failed to send disable SPP request', e)
        } finally {
            setIsSendingDisableSPPRequest(false)
        }
    }, [organization?.id, user?.phone, user?.email, sppBillingId, createUserHelpRequestAction])

    const errorHandler = useMutationErrorHandler()

    const [updateUser] = useUpdateUserMutation()
    const [changeTwoFactorAuthentication] = useChangeTwoFactorAuthenticationMutation({
        onError: (error) => {
            const isExpiredToken = error?.graphQLErrors?.some((gqlError) => gqlError.extensions?.type === 'TOKEN_NOT_FOUND')
            if (isExpiredToken) {
                // NOTE: Case with a getting a new sudo token.
                // This is processed in "action handler"
            } else {
                errorHandler(error)
            }
        },
    })

    const initialShowGlobalHints = user?.showGlobalHints || false
    const initialMarketingConsent = user?.hasMarketingConsent || false
    const initialIs2FAEnabled = user?.isTwoFactorAuthenticationEnabled || false

    const possibleLocalesOptions = useMemo(() => ([
        { label: RuTitle, value: 'ru' },
        { label: EnTitle, value: 'en' },
        { label: EsTitle, value: 'es' },
    ]), [EnTitle, RuTitle, EsTitle])

    const is2FADisabled = !user?.isTwoFactorAuthenticationEnabled
        && (
            !user?.email
            || !user?.isEmailVerified
            || !user?.phone
            || !user?.isPhoneVerified
        )

    const handleLocaleChange = useCallback((setLocale) => async (newLocale) => {
        if (!user?.id) return
        await updateUser({
            variables: {
                id: user.id,
                data: {
                    locale: newLocale,
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                },
            },
        })
        setLocale(newLocale)
    }, [updateUser, user?.id])

    const updateUserInfo = useMemo(() => debounce(async (checked: boolean, fieldName: 'showGlobalHints' | 'hasMarketingConsent') => {
        try {
            if (!user?.id) return
            await updateUser({
                variables: {
                    id: user.id,
                    data: {
                        [fieldName]: checked,
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                    },
                },
            })
            refetch()
        } catch (e) {
            console.error(`Failed to update field "${fieldName}"`)
        }
    }, 400), [refetch, updateUser, user?.id])

    const change2FA = useCallback(async (checked: boolean) => {
        try {
            if (!user?.id) return

            const getSudoTokenAndChange2FA = async () => {
                const sudoToken = await getSudoTokenWithModal({
                    ...((user?.email && user?.isEmailVerified) ? ({ email: user?.email }) : ({ phone: user?.phone })),
                }, {
                    passwordTitle: user?.isTwoFactorAuthenticationEnabled ? TwoFADisableModalTitle : TwoFAEnableModalTitle,
                    passwordDescription: '',
                })

                const res = await changeTwoFactorAuthentication({
                    variables: {
                        data: {
                            dv: 1,
                            sender: getClientSideSenderInfo(),
                            token: sudoToken,
                            isEnabled: checked,
                        },
                    },
                })

                return res
            }

            const res = await getSudoTokenAndChange2FA()

            if (res.errors || res?.data?.result?.status !== 'ok') {
                // @ts-ignore
                const isExpiredSudoToken = res?.errors?.graphQLErrors?.some((gqlError) => gqlError?.extensions?.type === 'TOKEN_NOT_FOUND')
                if (isExpiredSudoToken) {
                    clearSudoToken()
                    const res2 = await getSudoTokenAndChange2FA()
                    if (res2?.errors?.length) {
                        throw new Error('Cannot change 2FA')
                    }
                } else {
                    throw new Error('Cannot change 2FA')
                }
            } else {
                refetch()
            }
        } catch (e) {
            console.error('Failed to change 2FA')
            throw e
        }
    }, [refetch, changeTwoFactorAuthentication, user?.id, user?.phone, user?.email, user?.isEmailVerified, user?.isTwoFactorAuthenticationEnabled, clearSudoToken, getSudoTokenWithModal])

    const handleGlobalHintsChange: SwitchChangeEventHandler = useCallback(async (checked) => {
        setShowGlobalHints(checked)
        await updateUserInfo(checked, 'showGlobalHints')
    }, [updateUserInfo])

    const handleMarketingConsentChange: SwitchChangeEventHandler = useCallback(async (checked) => {
        setMarketingConsent(checked)
        await updateUserInfo(checked, 'hasMarketingConsent')
    }, [updateUserInfo])

    const handle2FAEnabledChange: SwitchChangeEventHandler = useCallback(async (checked) => {
        await change2FA(checked)
        setIs2FAEnabled(checked)
    }, [change2FA])

    useEffect(() => {
        if (isBoolean(initialShowGlobalHints)) {
            setShowGlobalHints(initialShowGlobalHints)
        }
    }, [initialShowGlobalHints])

    useEffect(() => {
        if (isBoolean(initialMarketingConsent)) {
            setMarketingConsent(initialMarketingConsent)
        }
    }, [initialMarketingConsent])

    useEffect(() => {
        if (isBoolean(initialIs2FAEnabled)) {
            setIs2FAEnabled(initialIs2FAEnabled)
        }
    }, [initialIs2FAEnabled])

    return (
        <Row gutter={ROW_GUTTER_BIG}>
            <Col span={24}>
                <Row gutter={ROW_GUTTER_MID} justify='center'>
                    <Col span={24}>
                        <Row gutter={ROW_GUTTER_BIG}>
                            <Col span={24}>
                                <Row gutter={ROW_GUTTER_SMALL}>
                                    <Col span={24}>
                                        <Row gutter={ROW_GUTTER_MID} align='middle'>
                                            <Col lg={5} xs={10}>
                                                <Typography.Text type='secondary'>
                                                    {GlobalHintsTitle}
                                                </Typography.Text>
                                            </Col>
                                            <Col lg={5} offset={1}>
                                                <Switch
                                                    checked={showGlobalHints}
                                                    onChange={handleGlobalHintsChange}
                                                    disabled={!user}
                                                />
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col span={24}>
                                        <Row gutter={ROW_GUTTER_MID} align='middle'>
                                            <Col lg={5} xs={10}>
                                                <Typography.Text type='secondary'>
                                                    {HasMarketingConsentTitle}
                                                </Typography.Text>
                                            </Col>
                                            <Col lg={5} offset={1}>
                                                <Tooltip title={!user?.email ? DisabledHasMarketingConsentTooltip : null}>
                                                    <Switch
                                                        checked={hasMarketingConsent}
                                                        onChange={handleMarketingConsentChange}
                                                        disabled={!user?.email}
                                                    />
                                                </Tooltip>
                                            </Col>
                                        </Row>
                                    </Col>

                                    {
                                        isSPPOrg && !!organization && !!sppBillingId && !userHelpRequestsLoading && (
                                            <>
                                                <Col span={24}>
                                                    <Row gutter={ROW_GUTTER_MID} align='middle'>
                                                        <Col lg={5} xs={10}>
                                                            <Typography.Text type='secondary'>
                                                                {DisableSPPTitle}
                                                            </Typography.Text>
                                                        </Col>
                                                        <Col lg={5} offset={1}>
                                                            {
                                                                (userHelpRequests?.length ?? 0)
                                                                    ? <Typography.Text type='warning'>{DisableSPPRequestSentTitle}</Typography.Text>
                                                                    : <Typography.Link onClick={() => setDisableSPPConfirmModalShown(true)}>
                                                                        {SendDisableSPPRequestTitle}
                                                                    </Typography.Link>
                                                            }
                                                        </Col>
                                                    </Row>
                                                </Col>
                                                <Modal
                                                    open={disableSPPConfirmModalShown}
                                                    onCancel={() => setDisableSPPConfirmModalShown(false)}
                                                    title={SendDisableSPPRequestModalTitle}
                                                    footer={[
                                                        <Button
                                                            key='close'
                                                            type='primary'
                                                            size='large'
                                                            id='spp-disable-user-request'
                                                            onClick={sendDisableSppRequest}
                                                            loading={isSendingDisableSPPRequest}
                                                            disabled={isSendingDisableSPPRequest}
                                                        >
                                                            {SendDisableSPPRequestConfirmButtonText}
                                                        </Button>,
                                                    ]}
                                                >
                                                    <Typography.Paragraph type='secondary'>
                                                        {SendDisableSPPRequestModalMessage}
                                                    </Typography.Paragraph>
                                                </Modal>
                                            </>
                                        )
                                    }

                                    <Col span={24}>
                                        <Row gutter={ROW_GUTTER_SMALL} align='middle'>
                                            <Col lg={5} xs={10}>
                                                <Typography.Text type='secondary'>
                                                    {InterfaceLanguageTitle}
                                                </Typography.Text>
                                            </Col>
                                            <Col lg={7} xl={5} offset={1}>
                                                <LocaleContext.Consumer>
                                                    {({ locale, setLocale }) => {
                                                        return (
                                                            <Select
                                                                options={possibleLocalesOptions}
                                                                value={locale}
                                                                placeholder={ChooseInterfaceLanguageTitle}
                                                                onChange={handleLocaleChange(setLocale)}
                                                            />
                                                        )
                                                    }}
                                                </LocaleContext.Consumer>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </Col>

                            {
                                isFeature2FAEnabled && (
                                    <Col span={24}>
                                        <Row gutter={ROW_GUTTER_MID} align='middle'>
                                            <Col lg={5} xs={10}>
                                                <Typography.Text type='secondary'>
                                                    {TwoFATitle}
                                                </Typography.Text>
                                            </Col>
                                            <Col lg={5} offset={1}>
                                                <Tooltip title={is2FADisabled ? EmptyFactorsTooltipMessage : null}>
                                                    <Switch
                                                        checked={is2FAEnabled}
                                                        onChange={handle2FAEnabledChange}
                                                        disabled={is2FADisabled}
                                                    />
                                                </Tooltip>
                                            </Col>
                                        </Row>
                                    </Col>
                                )
                            }

                            {
                                telegramEmployeeBotName && (
                                    <Col span={24}>
                                        <Row align='middle'>
                                            <Col lg={5} xs={10}>
                                                <Typography.Text type='secondary'>
                                                    <span style={{ marginRight: 8 }}>
                                                        {EmployeeTelegramTitle}
                                                    </span>
                                                    <Tooltip title={EmployeeTelegramTooltipMessage}>
                                                        <span style={{ verticalAlign: 'middle' }}>
                                                            <Info size='small' />
                                                        </span>
                                                    </Tooltip>
                                                </Typography.Text>
                                            </Col>
                                            <Col lg={18} xs={10} offset={1}>
                                                <Typography.Link
                                                    href={`https://t.me/${telegramEmployeeBotName}`}
                                                    target='_blank'
                                                    id='employee-telegram-bot'
                                                >
                                                    {EmployeeTelegramOpenMessage}
                                                </Typography.Link>
                                            </Col>
                                        </Row>
                                    </Col>
                                )
                            }
                        </Row>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}
