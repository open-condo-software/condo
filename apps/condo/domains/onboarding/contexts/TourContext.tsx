import { TourStepStatusType, TourStepTypeType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { Unlock } from '@open-condo/icons'
import { MUTATION_RESULT_EVENT, MutationEmitter } from '@open-condo/next/_useEmitterMutation'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Modal, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import {
    ACTIVE_STEPS_STORAGE_KEY,
    FIRST_LEVEL_STEPS,
    SECOND_LEVEL_STEPS,
    STEP_TYPES,
} from '@condo/domains/onboarding/constants/steps'
import { TourStep } from '@condo/domains/onboarding/utils/clientSchema'


type ActiveTourStepType = {
    firstLevel?: typeof FIRST_LEVEL_STEPS[number]
    secondLevel?: typeof SECOND_LEVEL_STEPS[number]
}

type TourContextType = {
    activeTourStep: ActiveTourStepType
    setActiveTourStep: (stepType: typeof STEP_TYPES) => void
}

const initialActiveTourStepValue: ActiveTourStepType = {
    firstLevel: null,
    secondLevel: null,
}

const TourContext = createContext<TourContextType>({
    activeTourStep: initialActiveTourStepValue,
    setActiveTourStep: () => { return },
})

const getActiveTourStepFromStorage = (): ActiveTourStepType => {
    try {
        return JSON.parse(localStorage.getItem(ACTIVE_STEPS_STORAGE_KEY))
    } catch (e) {
        console.error('Failed to parse initial activeTourStep from LocalStorage')
    }
}

const NewAbilitiesWrapper = styled.div`
    padding: 24px;
  border-radius: 12px;
  background: ${colors.brandGradient[1]};
`

const UnlockedFeature = ({ label }) => (
    <Typography.Text size='medium' type='secondary'>
        <Space size={4} direction='horizontal'>
            <Unlock size='small' color={colors.green[5]}/>
            {label}
        </Space>
    </Typography.Text>
)

type ModalDataValueType = {
    title: string
    newFeatures: {
        employee: string[]
        resident: string[]
    }
    description: { [firstLevel: string]: string }
    buttonLabel: string
    nextRoute: string
}

type ModalDataType = {
    [operation: string]: ModalDataValueType
}

const ModalData: ModalDataType = {
    'createProperty': {
        title: 'Все получилось — вы добавили первый дом',
        newFeatures: {
            employee: ['Публиковать новости дома', 'Рассказывать жителям об отключениях'],
            resident: ['Узнавать новости через приложение Doma', 'Узнавать об отключениях'],
        },
        description: {
            ticket: 'Следующий шаг к оптимизации работы с заявками — создание шахматки. Она поможет получать заявки от конкретных квартир. Чтобы добавить шахматку, нужно знать количество помещений, подъездов и этажей в доме.',
        },
        buttonLabel: 'Создать шахматку',
        nextRoute: '/property',
    },
    'createPropertyMap': {
        title: 'Шахматка создана',
        newFeatures: {
            employee: ['Публиковать новости дома', 'Получать заявки от конкретных квартир'],
            resident: ['Читать новости дома', 'Создавать заявки в мобильном приложении'],
        },
        description: {
            ticket: 'Следующий шаг к оптимизации работы с заявками — создание заявки. На ее примере вы увидите, как выглядит диспетчерская и форма заявки. Рекомендуем перенести на платформу реальную заявку, поскольку их нельзя удалять.',
        },
        buttonLabel: 'Создать заявку',
        nextRoute: '/ticket/create',
    },
    'createTicket': {
        title: 'Первая заявка создана',
        newFeatures: {
            employee: ['Публиковать новости дома', 'Оставлять информацию об отключениях'],
            resident: ['Читать новости дома'],
        },
        description: {
            ticket: 'Последний шаг к оптимизации работы с заявками — рассказать жителям о мобильном приложении Doma. С его помощью можно отправлять заявки в адрес управляющей организации. Чтобы продвигать приложение среди жителей было проще, мы подготовили гайд с готовыми шаблонами.',
        },
        buttonLabel: 'Смотреть гайд',
        nextRoute: '/tour',
    },
}

export const TourProvider = ({ children }) => {
    const router = useRouter()

    const [activeStep, setActiveStep] = useState<ActiveTourStepType>(getActiveTourStepFromStorage())
    const [modalData, setModalData] = useState<ModalDataValueType | null>()

    const { organization } = useOrganization()
    const { refetch } = TourStep.useObjects({
        where: { organization: { id: get(organization, 'id', null) } },
    }, { skip: true })
    const updateTourStep = TourStep.useUpdate({})

    const updateStepIfNotCompleted = useCallback(async (type: TourStepTypeType, nextRoute?: string) => {
        const fetchResult = await refetch({
            where: {
                organization: { id: get(organization, 'id', null) },
                type,
            },
        })
        const tourStep = fetchResult.data.objs[0]
        if (tourStep.status === TourStepStatusType.Completed) return

        await updateTourStep({ status: TourStepStatusType.Completed }, tourStep)

        const modalValue = nextRoute ? { ...ModalData[type], nextRoute } : ModalData[type]
        setModalData(modalValue)
    }, [organization, refetch, updateTourStep])

    useEffect(() => {
        const mutationHandler = async ({ data, name }) => {
            switch (name) {
                case 'createProperty': {
                    await updateStepIfNotCompleted(TourStepTypeType.CreateProperty, `/property/${data.obj.id}/map/update`)
                    break
                }

                case 'updateProperty': {
                    if (!get(data, 'obj.map')) return

                    await updateStepIfNotCompleted(TourStepTypeType.CreatePropertyMap)
                    break
                }

                case 'createTicket': {
                    await updateStepIfNotCompleted(TourStepTypeType.CreateTicket)
                    break
                }
            }
        }
        const importHandler = ({ domain, status }) => {
            console.log('import', domain, status)
        }

        MutationEmitter.addListener(MUTATION_RESULT_EVENT, mutationHandler)
        // ImportEmitter.on(IMPORT_EVENT, importHandler)

        return () => {
            MutationEmitter.removeListener(MUTATION_RESULT_EVENT, mutationHandler)
            // ImportEmitter.off(IMPORT_EVENT, importHandler)
        }
    }, [activeStep, organization, refetch, updateTourStep])

    const setActiveTourStep = useCallback((type) => {
        try {
            if (!type) {
                localStorage.removeItem(ACTIVE_STEPS_STORAGE_KEY)
                setActiveStep(null)
            }

            const previousValue: ActiveTourStepType = JSON.parse(localStorage.getItem(ACTIVE_STEPS_STORAGE_KEY)) || initialActiveTourStepValue
            const isFirstLevelStep = FIRST_LEVEL_STEPS.includes(type)

            const valueToSet: ActiveTourStepType = isFirstLevelStep ?
                { firstLevel: type, secondLevel: null } :
                { ...previousValue, secondLevel: type }

            localStorage.setItem(ACTIVE_STEPS_STORAGE_KEY, JSON.stringify(valueToSet))
            setActiveStep(valueToSet)
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
                }}
            >
                {children}
            </TourContext.Provider>
            <Modal
                open={!isEmpty(modalData)}
                onCancel={() => {
                    setModalData(null)
                    setActiveTourStep(null)
                }}
                width='big'
                title={
                    <Space size={8} direction='vertical'>
                        <Typography.Title level={2}>{get(modalData, 'title')}</Typography.Title>
                        <Typography.Text size='medium' type='secondary'>Вы можете добавлять и редактировать шахматки</Typography.Text>
                    </Space>
                }
                footer={[
                    <Button key='create' type='primary' onClick={() => {
                        setModalData(null)
                        router.push(get(modalData, 'nextRoute'))
                    }}>
                        {get(modalData, 'buttonLabel')}
                    </Button>,
                ]}
            >
                <NewAbilitiesWrapper>
                    <Row>
                        <Col span={12}>
                            <Space size={20} direction='vertical'>
                                <Typography.Title level={4}>Теперь вы можете:</Typography.Title>
                                <Space size={16} direction='vertical'>
                                    {
                                        get(modalData, 'newFeatures.employee', []).map(label => (
                                            <UnlockedFeature key={label} label={label} />
                                        ))
                                    }
                                </Space>
                            </Space>
                        </Col>
                        <Col span={12}>
                            <Space size={20} direction='vertical'>
                                <Typography.Title level={4}>Жители могут:</Typography.Title>
                                <Space size={16} direction='vertical'>
                                    {
                                        get(modalData, 'newFeatures.resident', []).map(label => (
                                            <UnlockedFeature key={label} label={label} />
                                        ))
                                    }
                                </Space>
                            </Space>
                        </Col>
                    </Row>
                </NewAbilitiesWrapper>
            </Modal>
        </>
    )
}

export const useTourContext = (): TourContextType => useContext(TourContext)