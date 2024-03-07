import { TourStepStatusType, TourStepTypeType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import pickBy from 'lodash/pickBy'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { Unlock } from '@open-condo/icons'
import { MUTATION_RESULT_EVENT, MutationEmitter } from '@open-condo/next/_useEmitterMutation'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Modal, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { IMPORT_EVENT, ImportEmitter } from '@condo/domains/common/components/Import/Index'
import {
    ACTIVE_STEPS_STORAGE_KEY,
    FIRST_LEVEL_STEPS,
    STEP_TYPES,
} from '@condo/domains/onboarding/constants/steps'
import { useCompletedTourStepData } from '@condo/domains/onboarding/hooks/TourContext/useCompletedTourStepData'
import { useSyncSteps } from '@condo/domains/onboarding/hooks/TourContext/useSyncSteps'
import { TourStep } from '@condo/domains/onboarding/utils/clientSchema'


type ActiveTourStepType = typeof FIRST_LEVEL_STEPS[number] | null

type TourContextType = {
    activeTourStep: ActiveTourStepType
    setActiveTourStep: (stepType: typeof STEP_TYPES) => void
    updateStepIfNotCompleted: (stepType: string) => Promise<void>
    syncLoading: boolean
}

const initialActiveTourStepValue: ActiveTourStepType = null

const TourContext = createContext<TourContextType>({
    activeTourStep: initialActiveTourStepValue,
    setActiveTourStep: () => { return },
    updateStepIfNotCompleted: () => { return Promise.resolve() },
    syncLoading: true,
})

const getActiveTourStepFromStorage = (): ActiveTourStepType => {
    try {
        return localStorage.getItem(ACTIVE_STEPS_STORAGE_KEY)
    } catch (e) {
        console.error('Failed to parse initial activeTourStep from LocalStorage')
    }
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

export const TourProvider = ({ children }) => {
    const router = useRouter()
    const { organization } = useOrganization()
    const { refetch: refetchSteps } = TourStep.useObjects({
        where: { organization: { id: get(organization, 'id', null) } },
    }, { skip: true })
    const updateTourStep = TourStep.useUpdate({})

    const organizationId = useMemo(() => get(organization, 'id'), [organization])
    const syncLoading = useSyncSteps({ refetchSteps, organizationId })

    const [activeStep, setActiveStep] = useState<ActiveTourStepType>(getActiveTourStepFromStorage())

    const currentImport = useRef<{ domain: string, status: string }>()
    const isFirstSuccessImport = useRef<boolean>()

    const {
        completedStepModalData,
        updateCompletedStepModalData,
        completedFlowModalData,
        updateCompletedFlowModalData,
    } = useCompletedTourStepData({ activeStep, refetchSteps })

    const updateStepIfNotCompleted = useCallback(async (type: TourStepTypeType, nextRoute?: string) => {
        const fetchResult = await refetchSteps({
            where: {
                organization: { id: organizationId },
                type,
            },
        })
        const tourStep = fetchResult.data.objs[0]

        if (tourStep.status === TourStepStatusType.Completed) {
            if (currentImport.current) {
                isFirstSuccessImport.current = true
            }

            return
        }

        await updateTourStep({ status: TourStepStatusType.Completed }, tourStep)

        if (currentImport.current) {
            isFirstSuccessImport.current = true
        } else {
            updateCompletedStepModalData(type, nextRoute)
        }
    }, [organizationId, refetchSteps, updateCompletedStepModalData, updateTourStep])

    useEffect(() => {
        const mutationHandler = async ({ data, name }) => {
            switch (name) {
                case 'createProperty': {
                    if (currentImport.current && isFirstSuccessImport.current) return

                    if (get(data, 'obj.map')) {
                        await updateStepIfNotCompleted(TourStepTypeType.CreateProperty)
                        await updateStepIfNotCompleted(TourStepTypeType.CreatePropertyMap)
                    } else {
                        await updateStepIfNotCompleted(TourStepTypeType.CreateProperty, `/property/${data.obj.id}/map/update`)
                    }

                    break
                }

                case 'updateProperty': {
                    if (!get(data, 'obj.map')) return

                    await updateStepIfNotCompleted(TourStepTypeType.CreatePropertyMap)
                    break
                }

                case 'createTicket': {
                    if (currentImport.current && isFirstSuccessImport.current) return

                    await updateStepIfNotCompleted(TourStepTypeType.CreateTicket)
                    break
                }

                case 'createMeterReading': {
                    if (currentImport.current && isFirstSuccessImport.current) return

                    await updateStepIfNotCompleted(TourStepTypeType.CreateMeterReadings)
                    break
                }

                case 'createNewsItem': {
                    await updateStepIfNotCompleted(TourStepTypeType.CreateNews)
                    break
                }
            }
        }

        const importHandler = ({ domain, status }) => {
            currentImport.current = { domain, status }

            if (status === null && isFirstSuccessImport.current) {
                switch (domain) {
                    case 'property': {
                        updateCompletedStepModalData('importProperties')
                        break
                    }
                    case 'meter': {
                        updateCompletedStepModalData(TourStepTypeType.CreateMeterReadings)
                        break
                    }
                    case 'ticket': {
                        updateCompletedStepModalData(TourStepTypeType.CreateTicket)
                        break
                    }
                }

                currentImport.current = null
                isFirstSuccessImport.current = false
            }
        }

        MutationEmitter.addListener(MUTATION_RESULT_EVENT, mutationHandler)
        ImportEmitter.addListener(IMPORT_EVENT, importHandler)

        return () => {
            MutationEmitter.removeListener(MUTATION_RESULT_EVENT, mutationHandler)
            ImportEmitter.removeListener(IMPORT_EVENT, importHandler)
        }
    }, [activeStep, updateStepIfNotCompleted])

    const setActiveTourStep = useCallback((type) => {
        try {
            if (!type) {
                localStorage.removeItem(ACTIVE_STEPS_STORAGE_KEY)
                setActiveStep(null)
            } else {
                localStorage.setItem(ACTIVE_STEPS_STORAGE_KEY, type)
                setActiveStep(type)
            }
        } catch (e) {
            console.error('Failed to parse activeTourStep from LocalStorage')
            localStorage && localStorage.removeItem(ACTIVE_STEPS_STORAGE_KEY)
            setActiveStep(null)
        }
    }, [])

    return (
        <>
            <TourContext.Provider
                value={{
                    activeTourStep: activeStep,
                    setActiveTourStep,
                    updateStepIfNotCompleted,
                    syncLoading,
                }}
            >
                {children}
            </TourContext.Provider>
            <Modal
                open={!isEmpty(pickBy(completedStepModalData, Boolean))}
                onCancel={() => {
                    updateCompletedStepModalData(null)
                    setActiveTourStep(null)
                }}
                width='big'
                title={
                    <Space size={8} direction='vertical'>
                        <Typography.Title level={2}>{get(completedStepModalData, 'title')}</Typography.Title>
                        <Space size={4} direction='horizontal'>
                            <Typography.Text size='medium' type='secondary'>
                                {get(completedStepModalData, 'subtitleText')}
                            </Typography.Text>
                            <Link href={get(completedStepModalData, 'subtitleLink', '')}>
                                <Typography.Link size='medium'>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {get(completedStepModalData, 'subtitleLinkLabel')}
                                        {get(completedStepModalData, 'subtitleLinkIcon')}
                                    </div>
                                </Typography.Link>
                            </Link>
                        </Space>
                    </Space>
                }
                footer={[
                    <Button key='create' type='primary' onClick={() => {
                        updateCompletedStepModalData(null)

                        if (completedStepModalData.buttonOnClick) {
                            completedStepModalData.buttonOnClick()
                        }
                    }}>
                        {get(completedStepModalData, 'buttonLabel')}
                    </Button>,
                ]}
            >
                <Space size={40} direction='vertical'>
                    <NewAbilitiesWrapper>
                        <Row>
                            {
                                !isEmpty(completedStepModalData.newEmployeeFeatures) && (
                                    <Col span={12}>
                                        <Space size={20} direction='vertical'>
                                            <Typography.Title level={4}>Теперь вы можете:</Typography.Title>
                                            <Space size={16} direction='vertical'>
                                                {
                                                    completedStepModalData.newEmployeeFeatures.map(label => (
                                                        <UnlockedFeature key={label} label={label} />
                                                    ))
                                                }
                                            </Space>
                                        </Space>
                                    </Col>
                                )
                            }
                            {
                                !isEmpty(completedStepModalData.newResidentFeatures) && (
                                    <Col span={12}>
                                        <Space size={20} direction='vertical'>
                                            <Typography.Title level={4}>Жители могут:</Typography.Title>
                                            <Space size={16} direction='vertical'>
                                                {
                                                    completedStepModalData.newResidentFeatures.map(label => (
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
                        {completedStepModalData.bodyText}
                    </Typography.Text>
                </Space>
            </Modal>
            <SuccessModal
                open={activeStep && !isEmpty(pickBy(completedFlowModalData, Boolean))}
                title={get(completedFlowModalData, 'title')}
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
        </>
    )
}

export const useTourContext = (): TourContextType => useContext(TourContext)