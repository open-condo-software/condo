import { TourStepStatusType, TourStepTypeType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { Building, Guide, LayoutList, Meters, Unlock, Wallet } from '@open-condo/icons'
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
import { useSyncSteps } from '@condo/domains/onboarding/hooks/useSyncSteps'
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

type ModalDataValueType = {
    title: string
    subtitle: { text: string, link: { label: string, href: string, icon: React.ReactElement } }
    newFeatures: {
        employee?: string[]
        resident?: string[]
    }
    bodyText: string
    buttonLabel: string
    onButtonClick: () => void
}

type ModalDataType = {
    [operation: string]: ModalDataValueType
}

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
    const [modalData, setModalData] = useState<ModalDataValueType | null>()
    const [isCompletedModalOpen, setIsCompletedModalOpen] = useState<boolean>()
    
    const currentImport = useRef<{ domain: string, status: string }>()
    const isFirstSuccessImport = useRef<boolean>()

    const completeTasksModalDataDescription = {
        ticket: 'Вы оптимизировали работу с заявками. Поздравляем!',
        billing: 'Вы сделали все, чтобы снизить дебиторскую задолженность. Поздравляем!',
        meter: 'Вы упростили работу с показаниями счетчиков. Поздравляем!',
        resident: 'Вы выстроили отношения с жителями. Поздравляем!',
    }

    const handleViewGuideClick = useCallback(async () => {
        window.open('https://drive.google.com/file/d/1mV4A_d8Wzzl-REe73OdoeHEngmnJi9NE/view', '_blank')
        setIsCompletedModalOpen(true)

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
    }, [organizationId, refetchSteps, updateTourStep])

    const createPropertyModalData = useMemo(() => ({
        'ticket': {
            bodyText: 'Следующий шаг к оптимизации работы с заявками — создание шахматки. Она поможет получать заявки от конкретных квартир. Чтобы добавить шахматку, нужно знать количество помещений, подъездов и этажей в доме.',
        },
        'meter': {
            bodyText: 'Следующий шаг к упрощению работы с ИПУ — создание шахматки. Она поможет получать показания от конкретных квартир. Чтобы добавить шахматку, нужно знать количество помещений, подъездов и этажей в доме.',
        },
        'resident': {
            bodyText: 'Следующий шаг к укреплению отношений с жителями — создание шахматки. Она нужна, чтобы жители конкретных квартир пользовались приложением. Чтобы добавить шахматку, нужно знать количество помещений, подъездов и этажей в доме.',
        },
        default: {
            bodyText: 'Добавление домов на платформу Doma.ai — первый шаг к оптимизации процессов вашего бизнеса. Загляните в путеводитель Домов — он поможет с другими задачами.',
            buttonLabel: 'Создать шахматку',
            onButtonClick: () => {
                router.push('/property')
            },
        },
    }), [router])
    const createPropertyMapBodyText = useMemo(() => ({
        ticket: {
            bodyText: 'Следующий шаг к оптимизации работы с заявками — создание заявки. На ее примере вы увидите, как выглядит диспетчерская и форма заявки. Рекомендуем перенести на платформу реальную заявку, поскольку их нельзя удалять.',
            buttonLabel: 'Создать заявку',
            onButtonClick: () => {
                router.push('/ticket')
            },
        },
        meter: {
            bodyText: 'Следующий шаг в оптимизации работы с показаниями счетчиков — добавление показаний на платформу. Вы можете добавить реальные показания ИПУ или указать любые данные, чтобы разобраться, как это работает.',
            buttonLabel: 'Добавить показания ИПУ',
            onButtonClick: () => {
                router.push('/meter')
            },
        },
        resident: {
            bodyText: 'Следующий шаг к укреплению отношений с жителями — внедрение приложения. Это нужно, чтобы жители самостоятельно оплачивали квитанции, оставляли заявки и передавали показания счетчиков. Чтобы продвигать приложение среди жителей было проще, мы подготовили гайд с готовыми шаблонами.',
            buttonLabel: 'Смотреть гайд',
            onButtonClick: handleViewGuideClick,
        },
        default: {
            bodyText: 'Шахматка нужна, чтобы работать с конкретными помещениями. Загляните в путеводитель Домов — он поможет с другими задачами.',
            buttonLabel: 'В путеводитель',
            onButtonClick: () => {
                router.push('/tour')
            },
        },
    }), [handleViewGuideClick, router])
    const importPropertiesBodyText = useMemo(() => ({
        'ticket': {
            bodyText: 'Следующий шаг к оптимизации работы с заявками — создание заявки. На ее примере вы увидите, как выглядит диспетчерская и форма заявки. Рекомендуем перенести на платформу реальную заявку, поскольку их нельзя удалять.',
            buttonLabel: 'Создать заявку',
            onButtonClick: () => {
                router.push('/ticket')
            },
        },
        'meter': {
            bodyText: 'Следующий шаг в оптимизации работы с показаниями счетчиков — добавление показаний на платформу. Вы можете добавить реальные показания ИПУ или указать любые данные, чтобы разобраться, как это работает.',
            buttonLabel: 'Добавить показания ИПУ',
            onButtonClick: () => {
                router.push('/meter')
            },
        },
        'resident': {
            bodyText: 'Следующий шаг к укреплению отношений с жителями — внедрение приложения. Это нужно, чтобы жители самостоятельно оплачивали квитанции, оставляли заявки и передавали показания счетчиков. Чтобы продвигать приложение среди жителей было проще, мы подготовили гайд с готовыми шаблонами.',
            buttonLabel: 'Смотреть гайд',
            onButtonClick: handleViewGuideClick,
        },
        default: {
            bodyText: 'Шахматка нужна, чтобы работать с конкретными помещениями. Загляните в путеводитель Домов — он поможет с другими задачами.',
            buttonLabel: 'В путеводитель',
            onButtonClick: () => {
                router.push('/tour')
            },
        },
    }), [handleViewGuideClick, router])
    const createTicketBodyText = useMemo(() => ({
        'ticket': {
            bodyText: 'Последний шаг к оптимизации работы с заявками — рассказать жителям о мобильном приложении Doma. С его помощью можно отправлять заявки в адрес управляющей организации. Чтобы продвигать приложение среди жителей было проще, мы подготовили гайд с готовыми шаблонами.',
            buttonLabel: 'Смотреть гайд',
            onButtonClick: handleViewGuideClick,
        },
        'default': {
            bodyText: 'Работа с заявками на платформе Doma.ai помогает навести порядок в процессах управления. Загляните в путеводитель Домов — он поможет с другими задачами.',
            buttonLabel: 'В путеводитель',
            onButtonClick: () => {
                router.push('/tour')
            },
        },
    }), [handleViewGuideClick, router])
    const createMeterReadingsBodyText = useMemo(() => ({
        'meter': {
            bodyText: 'Последний шаг к оптимизации работы с ИПУ — предложить жителям скачать мобильное приложение Doma и отправлять показания с его помощью. Чтобы продвигать приложение среди жителей было проще, мы подготовили гайд с готовыми шаблонами.',
            buttonLabel: 'Смотреть гайд',
            onButtonClick: handleViewGuideClick,
        },
        'default': {
            bodyText: 'Теперь вы можете хранить и работать с данными ИПУ на платформе. Загляните в путеводитель Домов — он поможет с другими задачами.',
            buttonLabel: 'В путеводитель',
            onButtonClick: () => {
                router.push('/tour')
            },
        },
    }), [handleViewGuideClick, router])
    const uploadBillingReceiptsBodyText = useMemo(() => ({
        'billing': {
            bodyText: 'Следующий шаг к снижению дебиторской задолженности — рассказать жителям о мобильном приложении Doma. С его помощью они смогут оплачивать счета и передавать показания для будущих квитанций. Чтобы продвигать приложение среди жителей было проще, мы подготовили гайд с готовыми шаблонами.',
            buttonLabel: 'Смотреть гайд',
            onButtonClick: handleViewGuideClick,
        },
        'default': {
            bodyText: 'Теперь жители могут оплачивать квитанции, а вы — следить за поступлениями. Загляните в путеводитель Домов — он поможет с другими задачами.',
            buttonLabel: 'В путеводитель',
            onButtonClick: () => {
                router.push('/tour')
            },
        },
    }), [handleViewGuideClick, router])

    const modalDataDescription: ModalDataType = useMemo(() => ({
        createProperty: {
            title: 'Все получилось — вы добавили первый дом',
            subtitle: { text: 'Вы сможете добавить больше объектов', link: { label: 'в разделе "Дома"', href: '/property', icon: <Building size='small' /> } },
            newFeatures: {
                employee: ['Публиковать новости дома', 'Рассказывать жителям об отключениях'],
                resident: ['Узнавать новости через приложение Doma', 'Узнавать об отключениях'],
            },
            bodyText: get(createPropertyModalData, [activeStep, 'bodyText'], createPropertyModalData.default.bodyText),
            buttonLabel: get(createPropertyModalData, [activeStep, 'buttonLabel'], createPropertyModalData.default.buttonLabel),
            onButtonClick: get(createPropertyModalData, [activeStep, 'onButtonClick'], createPropertyModalData.default.onButtonClick),
        },
        createPropertyMap: {
            title: 'Шахматка создана',
            subtitle: { text: 'Вы можете добавлять и редактировать шахматки', link: { label: 'на страницах домов', href: '', icon: <Building size='small' /> } },
            newFeatures: {
                employee: ['Публиковать новости дома', 'Получать заявки от конкретных квартир'],
                resident: ['Читать новости дома', 'Создавать заявки в мобильном приложении'],
            },
            bodyText: get(createPropertyMapBodyText, [activeStep, 'bodyText'], createPropertyMapBodyText.default.bodyText),
            buttonLabel: get(createPropertyMapBodyText, [activeStep, 'buttonLabel'], createPropertyMapBodyText.default.buttonLabel),
            onButtonClick: get(createPropertyMapBodyText, [activeStep, 'onButtonClick'], createPropertyMapBodyText.default.onButtonClick),
        },
        importProperties: {
            title: 'Готово — дома и шахматка созданы',
            subtitle: { text: 'Вы можете добавлять и редактировать данные', link: { label: 'на страницах домов', href: '', icon: <Building size='small' /> } },
            newFeatures: {
                employee: ['Публиковать новости дома', 'Получать заявки от конкретных квартир'],
                resident: ['Читать новости дома', 'Создавать заявки в мобильном приложении'],
            },
            bodyText: get(importPropertiesBodyText, [activeStep, 'bodyText'], importPropertiesBodyText.default.bodyText),
            buttonLabel: get(importPropertiesBodyText, [activeStep, 'buttonLabel'], importPropertiesBodyText.default.buttonLabel),
            onButtonClick: get(importPropertiesBodyText, [activeStep, 'onButtonClick'], importPropertiesBodyText.default.onButtonClick),
        },
        createTicket: {
            title: 'Первая заявка создана',
            subtitle: { text: 'Все заявки можно посмотреть', link: { label: 'в разделе «Заявки»', href: '/ticket', icon: <LayoutList size='small' /> } },
            newFeatures: {
                employee: ['Публиковать новости дома', 'Оставлять информацию об отключениях'],
                resident: ['Читать новости дома'],
            },
            bodyText: get(createTicketBodyText, [activeStep, 'bodyText'], createTicketBodyText.default.bodyText),
            buttonLabel: get(createTicketBodyText, [activeStep, 'buttonLabel'], createTicketBodyText.default.buttonLabel),
            onButtonClick: get(createTicketBodyText, [activeStep, 'onButtonClick'], createTicketBodyText.default.onButtonClick),
        },
        createMeterReadings: {
            title: 'Первые показания ИПУ загружены',
            subtitle: { text: 'Вы сможете загрузить больше показаний', link: { label: 'в разделе «Приборы учета»', href: '/meter', icon: <Meters size='small' /> } },
            newFeatures: {
                resident: ['Передавать показания счетчиков в мобильном приложении'],
            },
            bodyText: get(createMeterReadingsBodyText, [activeStep, 'bodyText'], createMeterReadingsBodyText.default.bodyText),
            buttonLabel: get(createMeterReadingsBodyText, [activeStep, 'buttonLabel'], createMeterReadingsBodyText.default.buttonLabel),
            onButtonClick: get(createMeterReadingsBodyText, [activeStep, 'onButtonClick'], createMeterReadingsBodyText.default.onButtonClick),
        },
        uploadReceipts: {
            title: 'Все получилось — вы настроили биллинг',
            subtitle: { text: 'Вы можете следить за начислениями и оплатами', link: { label: 'в разделе «Начисления и оплаты»', href: '/billing', icon: <Wallet size='small' /> } },
            newFeatures: {
                employee: ['Загружать реестры и формировать квитанции', 'Следить за платежами от жителей'],
                resident: ['Оплачивать квитанции в мобильном приложении'],
            },
            bodyText: get(uploadBillingReceiptsBodyText, [activeStep, 'bodyText'], uploadBillingReceiptsBodyText.default.bodyText),
            buttonLabel: get(uploadBillingReceiptsBodyText, [activeStep, 'buttonLabel'], uploadBillingReceiptsBodyText.default.buttonLabel),
            onButtonClick: get(uploadBillingReceiptsBodyText, [activeStep, 'onButtonClick'], uploadBillingReceiptsBodyText.default.onButtonClick),
        },
        viewResidentsAppGuide: {
            title: 'Вы посмотрели гайд о внедрении мобильного приложения',
            subtitle: { text: 'Вы можете вернуться у нему', link: { label: 'на странице Путеводителя', href: '/tour', icon: <Guide size='small' /> } },
            newFeatures: {
                employee: ['Рассказать жителям о мобильном приложении'],
                resident: ['Скачать приложение и зарегистрироваться'],
            },
            bodyText: 'Следующий шаг к укреплению отношений с жителями — создание и публикация первой новости. Жители увидят ее в приложении, а вы разберетесь, как работать с новостями на платформе',
            buttonLabel: 'Добавить новость',
            onButtonClick: () => {
                router.push('/news')
            },
        },
    }), [activeStep, createMeterReadingsBodyText, createPropertyMapBodyText, createPropertyModalData, createTicketBodyText, importPropertiesBodyText, router, uploadBillingReceiptsBodyText])

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
            if (
                activeStep !== TourStepTypeType.Resident && type === TourStepTypeType.ViewResidentsAppGuide ||
                activeStep === TourStepTypeType.Resident && type === TourStepTypeType.CreateNews
            ) {
                return setIsCompletedModalOpen(true)
            }

            const modalValue = nextRoute ? {
                ...modalDataDescription[type], onButtonClick: () => router.push(nextRoute),
            } : modalDataDescription[type]

            setModalData(modalValue)
        }
    }, [organizationId, refetchSteps, updateTourStep])

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
                        setModalData(modalDataDescription['importProperties'])
                        break
                    }
                    case 'meter': {
                        setModalData(modalDataDescription[TourStepTypeType.CreateMeterReadings])
                        break
                    }
                    case 'ticket': {
                        setModalData(modalDataDescription[TourStepTypeType.CreateTicket])
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

    const newEmployeeFeatures = useMemo(() => get(modalData, 'newFeatures.employee'), [modalData])
    const newResidentFeatures = useMemo(() => get(modalData, 'newFeatures.resident'), [modalData])

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
                open={!isEmpty(modalData)}
                onCancel={() => {
                    setModalData(null)
                    setActiveTourStep(null)
                }}
                width='big'
                title={
                    <Space size={8} direction='vertical'>
                        <Typography.Title level={2}>{get(modalData, 'title')}</Typography.Title>
                        <Space size={4} direction='horizontal'>
                            <Typography.Text size='medium' type='secondary'>
                                {get(modalData, 'subtitle.text')}
                            </Typography.Text>
                            <Link href={get(modalData, 'subtitle.link.href')}>
                                <Typography.Link size='medium'>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {get(modalData, 'subtitle.link.label')}
                                        {get(modalData, 'subtitle.link.icon')}
                                    </div>
                                </Typography.Link>
                            </Link>
                        </Space>
                    </Space>
                }
                footer={[
                    <Button key='create' type='primary' onClick={() => {
                        setModalData(null)

                        if (modalData.onButtonClick) {
                            modalData.onButtonClick()
                        }
                    }}>
                        {get(modalData, 'buttonLabel')}
                    </Button>,
                ]}
            >
                <Space size={40} direction='vertical'>
                    <NewAbilitiesWrapper>
                        <Row>
                            {
                                !isEmpty(newEmployeeFeatures) && (
                                    <Col span={12}>
                                        <Space size={20} direction='vertical'>
                                            <Typography.Title level={4}>Теперь вы можете:</Typography.Title>
                                            <Space size={16} direction='vertical'>
                                                {
                                                    newEmployeeFeatures.map(label => (
                                                        <UnlockedFeature key={label} label={label} />
                                                    ))
                                                }
                                            </Space>
                                        </Space>
                                    </Col>
                                )
                            }
                            {
                                !isEmpty(newResidentFeatures) && (
                                    <Col span={12}>
                                        <Space size={20} direction='vertical'>
                                            <Typography.Title level={4}>Жители могут:</Typography.Title>
                                            <Space size={16} direction='vertical'>
                                                {
                                                    newResidentFeatures.map(label => (
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
                        {get(modalData, 'bodyText')}
                    </Typography.Text>
                </Space>
            </Modal>
            <SuccessModal
                open={activeStep && isCompletedModalOpen}
                title={completeTasksModalDataDescription[activeStep]}
                onCancel={() => setIsCompletedModalOpen(false)}
                footer={[
                    <Button key='tourButton' type='primary' onClick={async () => {
                        setIsCompletedModalOpen(false)
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