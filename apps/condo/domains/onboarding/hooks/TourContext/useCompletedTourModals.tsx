import { TourStepStatusType, TourStepTypeType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import pickBy from 'lodash/pickBy'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { Building, Guide, IconProps, LayoutList, Meters, Unlock, Wallet } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Modal, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { analytics } from '@condo/domains/common/utils/analytics'
import { TourStep } from '@condo/domains/onboarding/utils/clientSchema'
import { GUIDE_LINK } from '@condo/domains/onboarding/utils/clientSchema/constants'


type ButtonClickType = () => void

type CompletedStepModalDataValueType = {
    type?: TourStepTypeType | 'importProperties'
    availableTourFlow: TourStepTypeType[]
    subtitleLinkHref: string
    subtitleLinkIcon: React.ComponentType<IconProps>
    newFeatures: {
        employee?: string[]
        resident?: string[]
    }
    onButtonClick: { default: ButtonClickType } & { [key in TourStepTypeType]?: ButtonClickType }
}

type CompletedStepModalDataType = {
    [operation: string]: CompletedStepModalDataValueType
}

const UnlockedFeature = ({ label }) => (
    <Typography.Text size='medium' type='secondary'>
        <Space size={4} direction='horizontal'>
            <Unlock size='small' color={colors.green[5]}/>
            {label}
        </Space>
    </Typography.Text>
)

const NewAbilitiesWrapper = styled.div`
  padding: 24px;
  border-radius: 12px;
  background: ${colors.brandGradient[1]};
  width: 100%;
`
const SuccessModal = styled(Modal)`
  &.condo-modal > .condo-modal-content {
    .condo-modal-header {
      padding-right: 60px;
    }
    
    & > .condo-modal-body {
      padding-bottom: 20px;
    }

    & > .condo-modal-footer {
      border-top: none;
    }
  }
`
const StyledFocusContainer = styled(FocusContainer)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 0;
  padding: 32px 24px;
  text-align: center;

  & img {
    height: 240px;
  }
`

type ComputedCompletedStepModalDataType = {
    title: string
    subtitleText: string
    subtitleLink: string
    subtitleLinkLabel: string
    subtitleLinkIcon: React.ComponentType<IconProps>
    newEmployeeFeatures: string[]
    newResidentFeatures: string[]
    buttonLabel: string
    buttonOnClick: () => void
    bodyText: string
}

type ComputedCompletedFlowModalDataType = {
    title: string
}

export const useCompletedTourModals = ({ activeStep, setActiveTourStep, refetchSteps }) => {
    const intl = useIntl()
    const GoToTourMessage = intl.formatMessage({ id: 'tour.completedFlowModal.goToTour' })
    const NowYouCanMessage = intl.formatMessage({ id: 'tour.newFeatures.employee.title' })
    const NowResidentCanMessage = intl.formatMessage({ id: 'tour.newFeatures.resident.title' })

    const CreateTicketsOnPropertyEmployeeFeature = intl.formatMessage({ id: 'tour.newFeatures.employee.createTicketsOnProperty' })
    const CreateNewsOnPropertyEmployeeFeature = intl.formatMessage({ id: 'tour.newFeatures.employee.createNewsOnProperty' })
    const CreateReadingsOnPropertyEmployeeFeature = intl.formatMessage({ id: 'tour.newFeatures.employee.createReadingsOnProperty' })
    const CreateTicketsEmployeeFeature = intl.formatMessage({ id: 'tour.newFeatures.employee.createTicketsOnPropertyAndUnits' })
    const CreateNewsEmployeeFeature = intl.formatMessage({ id: 'tour.newFeatures.employee.createNewsOnPropertyAndUnits' })
    const CreateReadingsEmployeeFeature = intl.formatMessage({ id: 'tour.newFeatures.employee.createReadingsOnPropertyAndUnits' })
    const CreateContactsEmployeeFeature = intl.formatMessage({ id: 'tour.newFeatures.employee.createContacts' })
    const TrackAndChangeTicketStatusEmployeeFeature = intl.formatMessage({ id: 'tour.newFeatures.employee.trackAndChangeTicketStatus' })
    const ChatWithResidentEmployeeFeature = intl.formatMessage({ id: 'tour.newFeatures.employee.chatWithResident' })
    const ChatWithEmployeesEmployeeFeature = intl.formatMessage({ id: 'tour.newFeatures.employee.chatWithEmployees' })
    const UploadReceiptsEmployeeFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.employee.uploadReceipts' })
    const TrackResidentPaymentsEmployeeFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.employee.trackResidentPayments' })
    const NotifyResidentsAboutAppEmployeeFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.employee.notifyResidentsAboutApp' })

    const CreateTicketsResidentFeature = intl.formatMessage({ id: 'tour.newFeatures.resident.createTickets' })
    const ReadNewsResidentFeature = intl.formatMessage({ id: 'tour.newFeatures.resident.readNews' })
    const ReadTicketsResidentFeature = intl.formatMessage({ id: 'tour.newFeatures.resident.readTicketsFromCRM' })
    const ReadNewsByUnitResidentFeature = intl.formatMessage({ id: 'tour.newFeatures.resident.readNewsByUnit' })
    const TrackTicketsResidentFeature = intl.formatMessage({ id: 'tour.newFeatures.resident.trackTicket' })
    const ChatWithOrganizationResidentFeature = intl.formatMessage({ id: 'tour.newFeatures.resident.chatWithOrganization' })
    const PayBillsResidentFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.resident.payBills' })
    const CreateMeterReadingsResidentFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.resident.createMeterReadings' })
    const TakeReadingsFromResidentsFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.resident.takeReadingsFromResidents' })
    const ArchvieMetersResidentFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.resident.archiveMeters' })
    const DownloadAppResidentFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.resident.downloadApp' })

    const router = useRouter()

    const { organization } = useOrganization()
    const organizationId = useMemo(() => get(organization, 'id'), [organization])

    const [completedStepModalData, setCompletedStepModalData] = useState<CompletedStepModalDataValueType | null>()
    const [completedTourFlow, setCompletedTourFlow] = useState<TourStepTypeType | null>()

    const updateTourStep = TourStep.useUpdate({})

    const updateCompletedFlowModalData = useCallback((type: TourStepTypeType) => {
        setCompletedTourFlow(type)
    }, [activeStep])

    const computedCompletedFlowModalData: ComputedCompletedFlowModalDataType = useMemo(() => ({
        title: completedTourFlow && intl.formatMessage({ id: `tour.completedFlowModal.${completedTourFlow}.title` as FormatjsIntl.Message['ids'] }),
    }), [completedTourFlow, intl])

    const handleViewGuideClick = useCallback(async () => {
        window.open(GUIDE_LINK, '_blank')
        if (activeStep !== TourStepTypeType.Resident) {
            updateCompletedFlowModalData(activeStep)
        }

        const fetchResult = await refetchSteps({
            where: {
                organization: { id: organizationId },
                type: TourStepTypeType.ViewResidentsAppGuide,
            },
        })
        const tourStep = get(fetchResult, 'data.objs.0')

        if (!tourStep) return

        if (tourStep.status === TourStepStatusType.Completed) {
            return
        }

        await updateTourStep({ status: TourStepStatusType.Completed }, tourStep)
    }, [activeStep, organizationId, refetchSteps, updateCompletedFlowModalData, updateTourStep])

    const completedStepModalDataDescription: CompletedStepModalDataType = useMemo(() => ({
        createProperty: {
            availableTourFlow: [TourStepTypeType.Ticket, TourStepTypeType.Meter, TourStepTypeType.Resident],
            subtitleLinkHref: '/property',
            subtitleLinkIcon: Building,
            newFeatures: {
                employee: [CreateTicketsOnPropertyEmployeeFeature, CreateNewsOnPropertyEmployeeFeature, CreateReadingsOnPropertyEmployeeFeature],
                resident: [CreateTicketsResidentFeature, ReadNewsResidentFeature],
            },
            onButtonClick: {
                default: () => { router.push('/property') },
            },
        },
        createPropertyMap: {
            availableTourFlow: [TourStepTypeType.Ticket, TourStepTypeType.Meter, TourStepTypeType.Resident],
            subtitleLinkHref: '/property',
            subtitleLinkIcon: Building,
            newFeatures: {
                employee: [CreateTicketsEmployeeFeature, CreateNewsEmployeeFeature, CreateReadingsEmployeeFeature, CreateContactsEmployeeFeature],
                resident: [ReadTicketsResidentFeature, ReadNewsByUnitResidentFeature],
            },
            onButtonClick: {
                default: () => { router.push('/tour') },
                [TourStepTypeType.Ticket]: () => { router.push('/ticket') },
                [TourStepTypeType.Meter]: () => { router.push('/meter?tab=meter') },
                [TourStepTypeType.Resident]: handleViewGuideClick,
            },
        },
        importProperties: {
            availableTourFlow: [TourStepTypeType.Ticket, TourStepTypeType.Meter, TourStepTypeType.Resident],
            subtitleLinkHref: '/property',
            subtitleLinkIcon: Building,
            newFeatures: {
                employee: [CreateTicketsEmployeeFeature, CreateNewsEmployeeFeature, CreateReadingsEmployeeFeature, CreateContactsEmployeeFeature],
                resident: [CreateTicketsResidentFeature, ReadTicketsResidentFeature, ReadNewsByUnitResidentFeature],
            },
            onButtonClick: {
                default: () => { router.push('/tour') },
                [TourStepTypeType.Ticket]: () => { router.push('/ticket') },
                [TourStepTypeType.Meter]: () => { router.push('/meter?tab=meter') },
                [TourStepTypeType.Resident]: handleViewGuideClick,
            },
        },
        createTicket: {
            availableTourFlow: [TourStepTypeType.Ticket],
            subtitleLinkHref: '/ticket',
            subtitleLinkIcon: LayoutList,
            newFeatures: {
                employee: [TrackAndChangeTicketStatusEmployeeFeature, ChatWithResidentEmployeeFeature, ChatWithEmployeesEmployeeFeature],
                resident: [TrackTicketsResidentFeature, ChatWithOrganizationResidentFeature],
            },
            onButtonClick: {
                default: () => { router.push('/tour') },
                [TourStepTypeType.Ticket]: handleViewGuideClick,
            },
        },
        createMeterReadings: {
            availableTourFlow: [TourStepTypeType.Meter],
            subtitleLinkHref: '/meter',
            subtitleLinkIcon: Meters,
            newFeatures: {
                resident: [CreateMeterReadingsResidentFeatureMessage],
            },
            onButtonClick: {
                default: () => { router.push('/tour') },
                [TourStepTypeType.Meter]: handleViewGuideClick,
            },
        },
        createMeter: {
            availableTourFlow: [TourStepTypeType.Meter],
            subtitleLinkHref: '/meter',
            subtitleLinkIcon: Meters,
            newFeatures: {
                employee: [TakeReadingsFromResidentsFeatureMessage, ArchvieMetersResidentFeatureMessage],
                resident: [CreateMeterReadingsResidentFeatureMessage],
            },
            onButtonClick: {
                default: () => { router.push('/tour') },
                [TourStepTypeType.Meter]: () => { router.push('/meter/create?tab=meter-reading') },
            },
        },
        uploadReceipts: {
            availableTourFlow: [TourStepTypeType.Billing],
            subtitleLinkHref: '/billing',
            subtitleLinkIcon: Wallet,
            newFeatures: {
                employee: [UploadReceiptsEmployeeFeatureMessage, TrackResidentPaymentsEmployeeFeatureMessage],
                resident: [PayBillsResidentFeatureMessage],
            },
            onButtonClick: {
                default: () => { router.push('/tour') },
                [TourStepTypeType.Billing]: handleViewGuideClick,
            },
        },
        viewResidentsAppGuide: {
            availableTourFlow: [TourStepTypeType.Resident],
            subtitleLinkHref: '/tour',
            subtitleLinkIcon: Guide,
            newFeatures: {
                employee: [NotifyResidentsAboutAppEmployeeFeatureMessage],
                resident: [DownloadAppResidentFeatureMessage],
            },
            onButtonClick: {
                default: () => { return },
                [TourStepTypeType.Resident]: () => { router.push('/news') },
            },
        },
    }), [handleViewGuideClick, router])

    const updateCompletedStepModalData = useCallback((type: TourStepTypeType | 'importProperties', nextRoute?: string) => {
        if (activeStep !== TourStepTypeType.Resident && type === TourStepTypeType.CreateNews) return

        const { query: { skipTourModal } } = router

        if (skipTourModal) {
            setActiveTourStep(null)
            setCompletedStepModalData(null)
            return
        }

        if (
            activeStep !== TourStepTypeType.Resident && type === TourStepTypeType.ViewResidentsAppGuide ||
            activeStep === TourStepTypeType.Resident && type === TourStepTypeType.CreateNews
        ) {
            return updateCompletedFlowModalData(activeStep)
        }

        if (type !== null) {
            analytics.track('tour_step_complete', { activeStep, type })
        }

        const modalValue = nextRoute ? {
            ...completedStepModalDataDescription[type],
            onButtonClick: { ...completedStepModalDataDescription[type].onButtonClick, [activeStep || 'default']: () => router.push(nextRoute) },
        } : completedStepModalDataDescription[type]

        setCompletedStepModalData({ type, ...modalValue })
    }, [activeStep, completedStepModalDataDescription, router, updateCompletedFlowModalData])

    const computedCompletedStepModalData: ComputedCompletedStepModalDataType = useMemo(() => {
        const completedActionType = get(completedStepModalData, 'type')
        const availableTourFlow = get(completedStepModalData, 'availableTourFlow', [])
        const currentActiveStep = availableTourFlow.includes(activeStep) ? activeStep : 'default'

        if (isEmpty(completedActionType)) return

        return {
            title: intl.formatMessage({ id: `tour.completedStepModal.${completedStepModalData.type}.title` as FormatjsIntl.Message['ids'] }),
            subtitleText: intl.formatMessage({ id: `tour.completedStepModal.${completedStepModalData.type}.subtitle` as FormatjsIntl.Message['ids'] }),
            subtitleLink: get(completedStepModalData, 'subtitleLinkHref'),
            subtitleLinkLabel: intl.formatMessage({ id: `tour.completedStepModal.${completedStepModalData.type}.subtitleLinkLabel` as FormatjsIntl.Message['ids'] }),
            subtitleLinkIcon: get(completedStepModalData, 'subtitleLinkIcon'),
            newEmployeeFeatures: get(completedStepModalData, 'newFeatures.employee'),
            newResidentFeatures: get(completedStepModalData, 'newFeatures.resident'),
            buttonLabel: intl.formatMessage({ id: `tour.completedStepModal.${completedStepModalData.type}.buttonLabel.${currentActiveStep}` as FormatjsIntl.Message['ids'] }),
            buttonOnClick: get(completedStepModalData, ['onButtonClick', activeStep], get(completedStepModalData, ['onButtonClick', 'default'])),
            bodyText: intl.formatMessage({ id: `tour.completedStepModal.${completedStepModalData.type}.bodyText.${currentActiveStep}` as FormatjsIntl.Message['ids'] }),
        }
    }, [activeStep, completedStepModalData, intl])


    return useMemo(() => ({
        updateCompletedStepModalData,
        CompletedStepModal: (
            <Modal
                open={!isEmpty(pickBy(computedCompletedStepModalData, Boolean))}
                onCancel={() => {
                    updateCompletedStepModalData(null)
                    setActiveTourStep(null)
                }}
                width='big'
                title={
                    <Space size={8} direction='vertical'>
                        <Typography.Title level={2}>{get(computedCompletedStepModalData, 'title')}</Typography.Title>
                        <Space size={4} direction='horizontal'>
                            <Typography.Text size='medium' type='secondary'>
                                {get(computedCompletedStepModalData, 'subtitleText')}
                            </Typography.Text>
                            <LinkWithIcon
                                size='medium'
                                title={get(computedCompletedStepModalData, 'subtitleLinkLabel')}
                                href={get(computedCompletedStepModalData, 'subtitleLink', '')}
                                PostfixIcon={get(computedCompletedStepModalData, 'subtitleLinkIcon')}
                                onClick={() => updateCompletedStepModalData(null)}
                            />
                        </Space>
                    </Space>
                }
                footer={[
                    <Button
                        key='create'
                        type='primary'
                        id='tour-step-complete-confirm-button'
                        onClick={() => {
                            const nextModalTypeOnButtonClick = (
                                activeStep === TourStepTypeType.Resident && get(completedStepModalData, 'type') === TourStepTypeType.CreatePropertyMap
                            ) ? TourStepTypeType.ViewResidentsAppGuide : null
                            updateCompletedStepModalData(nextModalTypeOnButtonClick)

                            if (get(computedCompletedStepModalData, 'buttonOnClick')) {
                                computedCompletedStepModalData.buttonOnClick()
                            }
                        }}>
                        {get(computedCompletedStepModalData, 'buttonLabel')}
                    </Button>,
                ]}
            >
                <Row gutter={[0, 40]}>
                    <Col span={24}>
                        <NewAbilitiesWrapper>
                            <Row>
                                {
                                    !isEmpty(get(computedCompletedStepModalData, 'newEmployeeFeatures')) && (
                                        <Col span={12}>
                                            <Space size={20} direction='vertical'>
                                                <Typography.Title level={4}>{NowYouCanMessage}</Typography.Title>
                                                <Space size={16} direction='vertical'>
                                                    {
                                                        computedCompletedStepModalData.newEmployeeFeatures.map(label => (
                                                            <UnlockedFeature key={label} label={label} />
                                                        ))
                                                    }
                                                </Space>
                                            </Space>
                                        </Col>
                                    )
                                }
                                {
                                    !isEmpty(get(computedCompletedStepModalData, 'newResidentFeatures')) && (
                                        <Col span={12}>
                                            <Space size={20} direction='vertical'>
                                                <Typography.Title level={4}>{NowResidentCanMessage}</Typography.Title>
                                                <Space size={16} direction='vertical'>
                                                    {
                                                        computedCompletedStepModalData.newResidentFeatures.map(label => (
                                                            <UnlockedFeature key={label} label={label} />
                                                        ))
                                                    }
                                                </Space>
                                            </Space>
                                        </Col>
                                    )
                                }
                            </Row>
                        </NewAbilitiesWrapper>
                    </Col>
                    <Col span={24}>
                        <Typography.Text>
                            {get(computedCompletedStepModalData, 'bodyText')}
                        </Typography.Text>
                    </Col>
                </Row>
            </Modal>
        ),
        CompletedFlowModal: (
            <SuccessModal
                open={activeStep && !isEmpty(pickBy(computedCompletedFlowModalData, Boolean))}
                title={get(computedCompletedFlowModalData, 'title')}
                onCancel={() => updateCompletedFlowModalData(null)}
                footer={[
                    <Button key='tourButton' type='primary' onClick={async () => {
                        updateCompletedFlowModalData(null)

                        await router.push('/tour')
                    }}>
                        {GoToTourMessage}
                    </Button>,
                ]}
            >
                <StyledFocusContainer>
                    <img src='/successDino.webp' alt='Dino image' width={240} height={240} />
                </StyledFocusContainer>
            </SuccessModal>
        ),
    }), [GoToTourMessage, NowResidentCanMessage, NowYouCanMessage, activeStep, completedStepModalData, computedCompletedFlowModalData, computedCompletedStepModalData, router, setActiveTourStep, updateCompletedFlowModalData, updateCompletedStepModalData])
}