import { TourStepStatusType, TourStepTypeType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import pickBy from 'lodash/pickBy'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { Building, Guide, LayoutList, Meters, Unlock, Wallet } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Modal, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { TourStep } from '@condo/domains/onboarding/utils/clientSchema'
import { EXTERNAL_GUIDE_LINK } from '@condo/domains/onboarding/utils/clientSchema/constants'

type ButtonClickType = () => void

type CompletedStepModalDataValueType = {
    type?: TourStepTypeType | 'importProperties'
    availableTourFlow: TourStepTypeType[]
    subtitleLinkHref: string
    subtitleLinkIcon: React.ReactElement
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
    subtitleLinkIcon: React.ReactElement
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
    const PublishNewsEmployeeFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.employee.publishNews' })
    const NotifyAboutIncidentsEmployeeFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.employee.notifyAboutIncidents' })
    const CreateIncidentsEmployeeFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.employee.createIncidents' })
    const UploadReceiptsEmployeeFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.employee.uploadReceipts' })
    const TrackResidentPaymentsEmployeeFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.employee.trackResidentPayments' })
    const NotifyResidentsAboutAppEmployeeFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.employee.notifyResidentsAboutApp' })

    const ReadNewsResidentFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.resident.readNews' })
    const ReadIncidentsResidentFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.resident.readIncidents' })
    const CreateMeterReadingsResidentFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.resident.createMeterReadings' })
    const PayBillsResidentFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.resident.payBills' })
    const DownloadAppResidentFeatureMessage = intl.formatMessage({ id: 'tour.newFeatures.resident.downloadApp' })

    const router = useRouter()
    const { organization } = useOrganization()
    const organizationId = useMemo(() => get(organization, 'id'), [organization])

    const [completedStepModalData, setCompletedStepModalData] = useState<CompletedStepModalDataValueType | null>()
    const [completedTourFlow, setCompletedTourFlow] = useState<TourStepTypeType | null>()

    const updateTourStep = TourStep.useUpdate({})

    const updateCompletedFlowModalData = useCallback((type: TourStepTypeType) => {
        setCompletedTourFlow(type)
    }, [])

    const computedCompletedFlowModalData: ComputedCompletedFlowModalDataType = useMemo(() => ({
        title: completedTourFlow && intl.formatMessage({ id: `tour.completedFlowModal.${completedTourFlow}.title` }),
    }), [completedTourFlow, intl])

    const handleViewGuideClick = useCallback(async () => {
        if (typeof window === 'undefined') return

        window.open(EXTERNAL_GUIDE_LINK, '_blank')
        updateCompletedFlowModalData(activeStep)

        const fetchResult = await refetchSteps({
            where: {
                organization: { id: organizationId },
                type: TourStepTypeType.ViewResidentsAppGuide,
            },
        })
        const tourStep = fetchResult.data.objs[0]
        if (tourStep.status === TourStepStatusType.Completed) {
            return
        }

        await updateTourStep({ status: TourStepStatusType.Completed }, tourStep)
    }, [activeStep, organizationId, refetchSteps, updateCompletedFlowModalData, updateTourStep])

    const completedStepModalDataDescription: CompletedStepModalDataType = useMemo(() => ({
        createProperty: {
            availableTourFlow: [],
            subtitleLinkHref: '/property',
            subtitleLinkIcon: <Building size='small' />,
            newFeatures: {
                employee: [PublishNewsEmployeeFeatureMessage, NotifyAboutIncidentsEmployeeFeatureMessage],
                resident: [ReadNewsResidentFeatureMessage, ReadIncidentsResidentFeatureMessage],
            },
            onButtonClick: {
                default: () => { router.push('/property') },
            },
        },
        createPropertyMap: {
            availableTourFlow: [TourStepTypeType.Ticket, TourStepTypeType.Meter, TourStepTypeType.Resident],
            subtitleLinkHref: '/property',
            subtitleLinkIcon: <Building size='small' />,
            newFeatures: {
                employee: [PublishNewsEmployeeFeatureMessage, NotifyAboutIncidentsEmployeeFeatureMessage],
                resident: [ReadNewsResidentFeatureMessage, ReadIncidentsResidentFeatureMessage],
            },
            onButtonClick: {
                default: () => { router.push('/tour') },
                [TourStepTypeType.Ticket]: () => { router.push('/ticket') },
                [TourStepTypeType.Meter]: () => { router.push('/meter') },
                [TourStepTypeType.Resident]: handleViewGuideClick,
            },
        },
        importProperties: {
            availableTourFlow: [TourStepTypeType.Ticket, TourStepTypeType.Meter, TourStepTypeType.Resident],
            subtitleLinkHref: '/property',
            subtitleLinkIcon: <Building size='small' />,
            newFeatures: {
                employee: [PublishNewsEmployeeFeatureMessage, NotifyAboutIncidentsEmployeeFeatureMessage],
                resident: [ReadNewsResidentFeatureMessage, ReadIncidentsResidentFeatureMessage],
            },
            onButtonClick: {
                default: () => { router.push('/tour') },
                [TourStepTypeType.Ticket]: () => { router.push('/ticket') },
                [TourStepTypeType.Meter]: () => { router.push('/meter') },
                [TourStepTypeType.Resident]: handleViewGuideClick,
            },
        },
        createTicket: {
            availableTourFlow: [TourStepTypeType.Ticket],
            subtitleLinkHref: '/ticket',
            subtitleLinkIcon: <LayoutList size='small' />,
            newFeatures: {
                employee: [PublishNewsEmployeeFeatureMessage, CreateIncidentsEmployeeFeatureMessage],
                resident: [ReadNewsResidentFeatureMessage],
            },
            onButtonClick: {
                default: () => { router.push('/tour') },
                [TourStepTypeType.Ticket]: handleViewGuideClick,
            },
        },
        createMeterReadings: {
            availableTourFlow: [TourStepTypeType.Meter],
            subtitleLinkHref: '/meter',
            subtitleLinkIcon: <Meters size='small' />,
            newFeatures: {
                resident: [CreateMeterReadingsResidentFeatureMessage],
            },
            onButtonClick: {
                default: () => { router.push('/tour') },
                [TourStepTypeType.Meter]: handleViewGuideClick,
            },
        },
        uploadReceipts: {
            availableTourFlow: [TourStepTypeType.Billing],
            subtitleLinkHref: '/billing',
            subtitleLinkIcon: <Wallet size='small' />,
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
            subtitleLinkIcon: <Guide size='small' />,
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
        if (
            activeStep !== TourStepTypeType.Resident && type === TourStepTypeType.ViewResidentsAppGuide ||
            activeStep === TourStepTypeType.Resident && type === TourStepTypeType.CreateNews
        ) {
            return updateCompletedFlowModalData(activeStep)
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
            title: intl.formatMessage({ id: `tour.completedStepModal.${completedStepModalData.type}.title` }),
            subtitleText: intl.formatMessage({ id: `tour.completedStepModal.${completedStepModalData.type}.subtitle` }),
            subtitleLink: get(completedStepModalData, 'subtitleLinkHref'),
            subtitleLinkLabel: intl.formatMessage({ id: `tour.completedStepModal.${completedStepModalData.type}.subtitleLinkLabel` }),
            subtitleLinkIcon: get(completedStepModalData, 'subtitleLinkIcon'),
            newEmployeeFeatures: get(completedStepModalData, 'newFeatures.employee'),
            newResidentFeatures: get(completedStepModalData, 'newFeatures.resident'),
            buttonLabel: intl.formatMessage({ id: `tour.completedStepModal.${completedStepModalData.type}.buttonLabel.${currentActiveStep}` }),
            buttonOnClick: get(completedStepModalData, ['onButtonClick', activeStep], get(completedStepModalData, ['onButtonClick', 'default'])),
            bodyText: intl.formatMessage({ id: `tour.completedStepModal.${completedStepModalData.type}.bodyText.${currentActiveStep}` }),
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
                            <Link href={get(computedCompletedStepModalData, 'subtitleLink', '')}>
                                <Typography.Link size='medium'>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {get(computedCompletedStepModalData, 'subtitleLinkLabel')}
                                        {get(computedCompletedStepModalData, 'subtitleLinkIcon')}
                                    </div>
                                </Typography.Link>
                            </Link>
                        </Space>
                    </Space>
                }
                footer={[
                    <Button key='create' type='primary' onClick={() => {
                        updateCompletedStepModalData(null)

                        if (get(computedCompletedStepModalData, 'buttonOnClick')) {
                            computedCompletedStepModalData.buttonOnClick()
                        }
                    }}>
                        {get(computedCompletedStepModalData, 'buttonLabel')}
                    </Button>,
                ]}
            >
                <Space size={40} direction='vertical'>
                    <NewAbilitiesWrapper>
                        <Row>
                            {
                                !isEmpty(get(computedCompletedStepModalData, 'newEmployeeFeatures')) && (
                                    <Col span={12}>
                                        <Space size={20} direction='vertical'>
                                            <Typography.Title level={4}>Теперь вы можете:</Typography.Title>
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
                                            <Typography.Title level={4}>Жители могут:</Typography.Title>
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
                    <Typography.Text>
                        {get(computedCompletedStepModalData, 'bodyText')}
                    </Typography.Text>
                </Space>
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
                        setActiveTourStep(null)

                        await router.push('/tour')
                    }}>
                        Вернуться в путеводитель
                    </Button>,
                ]}
            >
                <StyledFocusContainer>
                    <img src='/successDino.webp' width={240} height={240} />
                </StyledFocusContainer>
            </SuccessModal>
        ),
    }), [
        activeStep, computedCompletedFlowModalData, computedCompletedStepModalData,
        router, setActiveTourStep, updateCompletedFlowModalData, updateCompletedStepModalData,
    ])
}