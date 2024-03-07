import { TourStepStatusType, TourStepTypeType } from '@app/condo/schema'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { Building, Guide, LayoutList, Meters, Wallet } from '@open-condo/icons'
import { useOrganization } from '@open-condo/next/organization'

import { TourStep } from '@condo/domains/onboarding/utils/clientSchema'
import { EXTERNAL_GUIDE_LINK } from '@condo/domains/onboarding/utils/clientSchema/constants'


type ButtonClickType = () => void

type CompletedStepModalDataValueType = {
    title: string
    subtitle: { text: string, link: { label: string, href: string, icon: React.ReactElement } }
    newFeatures: {
        employee?: string[]
        resident?: string[]
    }
    bodyText: { default: string } & { [key in TourStepTypeType]?: string }
    buttonLabel: { default: string } & { [key in TourStepTypeType]?: string }
    onButtonClick: { default: ButtonClickType } & { [key in TourStepTypeType]?: ButtonClickType }
}

type CompletedStepModalDataType = {
    [operation: string]: CompletedStepModalDataValueType
}

type CompletedFlowModalDataValueType = {
    title: string
}

type CompletedFlowModalDataType = {
    [key in TourStepTypeType]?: CompletedFlowModalDataValueType
}

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

export const useCompletedTourStepData = ({ activeStep, refetchSteps }) => {
    const router = useRouter()
    const { organization } = useOrganization()
    const organizationId = useMemo(() => get(organization, 'id'), [organization])

    const [completedStepModalData, setCompletedStepModalData] = useState<CompletedStepModalDataValueType | null>()
    const [completedFlowModalData, setCompletedFlowModalData] = useState<CompletedFlowModalDataValueType | null>()

    const updateTourStep = TourStep.useUpdate({})

    const completedFlowModalDataDescription: CompletedFlowModalDataType = useMemo(() => ({
        [TourStepTypeType.Ticket]: {
            title: 'Вы оптимизировали работу с заявками. Поздравляем!',
        },
        [TourStepTypeType.Billing]: {
            title: 'Вы сделали все, чтобы снизить дебиторскую задолженность. Поздравляем!',
        },
        [TourStepTypeType.Meter]: {
            title: 'Вы упростили работу с показаниями счетчиков. Поздравляем!',
        },
        [TourStepTypeType.Resident]: {
            title: 'Вы выстроили отношения с жителями. Поздравляем!',
        },
    }), [])

    const updateCompletedFlowModalData = useCallback((type: TourStepTypeType) => {
        setCompletedFlowModalData(completedFlowModalDataDescription[type])
    }, [completedFlowModalDataDescription])

    const computedCompletedFlowModalData: ComputedCompletedFlowModalDataType = useMemo(() => ({
        title: get(completedFlowModalData, 'title'),
    }), [completedFlowModalData])

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
    }, [activeStep, organizationId, refetchSteps, updateTourStep])


    const completedStepModalDataDescription: CompletedStepModalDataType = useMemo(() => ({
        createProperty: {
            title: 'Все получилось — вы добавили первый дом',
            subtitle: { text: 'Вы сможете добавить больше объектов', link: { label: 'в разделе "Дома"', href: '/property', icon: <Building size='small' /> } },
            newFeatures: {
                employee: ['Публиковать новости дома', 'Рассказывать жителям об отключениях'],
                resident: ['Узнавать новости через приложение Doma', 'Узнавать об отключениях'],
            },
            bodyText: {
                default: 'Добавление домов на платформу Doma.ai — первый шаг к оптимизации процессов вашего бизнеса. Загляните в путеводитель Домов — он поможет с другими задачами.',
                [TourStepTypeType.Ticket]: 'Следующий шаг к оптимизации работы с заявками — создание шахматки. Она поможет получать заявки от конкретных квартир. Чтобы добавить шахматку, нужно знать количество помещений, подъездов и этажей в доме.',
                [TourStepTypeType.Meter]: 'Следующий шаг к упрощению работы с ИПУ — создание шахматки. Она поможет получать показания от конкретных квартир. Чтобы добавить шахматку, нужно знать количество помещений, подъездов и этажей в доме.',
                [TourStepTypeType.Resident]: 'Следующий шаг к укреплению отношений с жителями — создание шахматки. Она нужна, чтобы жители конкретных квартир пользовались приложением. Чтобы добавить шахматку, нужно знать количество помещений, подъездов и этажей в доме.',
            },
            buttonLabel: {
                default: 'Создать шахматку',
            },
            onButtonClick: {
                default: () => {
                    router.push('/property')
                },
            },
        },
        createPropertyMap: {
            title: 'Шахматка создана',
            subtitle: { text: 'Вы можете добавлять и редактировать шахматки', link: { label: 'на страницах домов', href: '', icon: <Building size='small' /> } },
            newFeatures: {
                employee: ['Публиковать новости дома', 'Получать заявки от конкретных квартир'],
                resident: ['Читать новости дома', 'Создавать заявки в мобильном приложении'],
            },
            bodyText: {
                default: 'Шахматка нужна, чтобы работать с конкретными помещениями. Загляните в путеводитель Домов — он поможет с другими задачами.',
                [TourStepTypeType.Ticket]: 'Следующий шаг к оптимизации работы с заявками — создание заявки. На ее примере вы увидите, как выглядит диспетчерская и форма заявки. Рекомендуем перенести на платформу реальную заявку, поскольку их нельзя удалять.',
                [TourStepTypeType.Meter]: 'Следующий шаг в оптимизации работы с показаниями счетчиков — добавление показаний на платформу. Вы можете добавить реальные показания ИПУ или указать любые данные, чтобы разобраться, как это работает.',
                [TourStepTypeType.Resident]: 'Следующий шаг к укреплению отношений с жителями — внедрение приложения. Это нужно, чтобы жители самостоятельно оплачивали квитанции, оставляли заявки и передавали показания счетчиков. Чтобы продвигать приложение среди жителей было проще, мы подготовили гайд с готовыми шаблонами.',
            },
            buttonLabel: {
                default: 'В путеводитель',
                [TourStepTypeType.Ticket]: 'Создать заявку',
                [TourStepTypeType.Meter]: 'Добавить показания ИПУ',
                [TourStepTypeType.Resident]: 'Смотреть гайд',
            },
            onButtonClick: {
                default: () => { router.push('/tour') },
                [TourStepTypeType.Ticket]: () => { router.push('/ticket') },
                [TourStepTypeType.Meter]: () => { router.push('/meter') },
                [TourStepTypeType.Resident]: handleViewGuideClick,
            },
        },
        importProperties: {
            title: 'Готово — дома и шахматка созданы',
            subtitle: { text: 'Вы можете добавлять и редактировать данные', link: { label: 'на страницах домов', href: '', icon: <Building size='small' /> } },
            newFeatures: {
                employee: ['Публиковать новости дома', 'Получать заявки от конкретных квартир'],
                resident: ['Читать новости дома', 'Создавать заявки в мобильном приложении'],
            },
            bodyText: {
                default: 'Шахматка нужна, чтобы работать с конкретными помещениями. Загляните в путеводитель Домов — он поможет с другими задачами.',
                [TourStepTypeType.Ticket]: 'Следующий шаг к оптимизации работы с заявками — создание заявки. На ее примере вы увидите, как выглядит диспетчерская и форма заявки. Рекомендуем перенести на платформу реальную заявку, поскольку их нельзя удалять.',
                [TourStepTypeType.Meter]: 'Следующий шаг в оптимизации работы с показаниями счетчиков — добавление показаний на платформу. Вы можете добавить реальные показания ИПУ или указать любые данные, чтобы разобраться, как это работает.',
                [TourStepTypeType.Resident]: 'Следующий шаг к укреплению отношений с жителями — внедрение приложения. Это нужно, чтобы жители самостоятельно оплачивали квитанции, оставляли заявки и передавали показания счетчиков. Чтобы продвигать приложение среди жителей было проще, мы подготовили гайд с готовыми шаблонами.',
            },
            buttonLabel: {
                default: 'В путеводитель',
                [TourStepTypeType.Ticket]: 'Создать заявку',
                [TourStepTypeType.Meter]: 'Добавить показания ИПУ',
                [TourStepTypeType.Resident]: 'Смотреть гайд',
            },
            onButtonClick: {
                default: () => { router.push('/tour') },
                [TourStepTypeType.Ticket]: () => { router.push('/ticket') },
                [TourStepTypeType.Meter]: () => { router.push('/meter') },
                [TourStepTypeType.Resident]: handleViewGuideClick,
            },
        },
        createTicket: {
            title: 'Первая заявка создана',
            subtitle: { text: 'Все заявки можно посмотреть', link: { label: 'в разделе «Заявки»', href: '/ticket', icon: <LayoutList size='small' /> } },
            newFeatures: {
                employee: ['Публиковать новости дома', 'Оставлять информацию об отключениях'],
                resident: ['Читать новости дома'],
            },
            bodyText: {
                default: 'Работа с заявками на платформе Doma.ai помогает навести порядок в процессах управления. Загляните в путеводитель Домов — он поможет с другими задачами.',
                [TourStepTypeType.Ticket]: 'Последний шаг к оптимизации работы с заявками — рассказать жителям о мобильном приложении Doma. С его помощью можно отправлять заявки в адрес управляющей организации. Чтобы продвигать приложение среди жителей было проще, мы подготовили гайд с готовыми шаблонами.',
            },
            buttonLabel: {
                default: 'В путеводитель',
                [TourStepTypeType.Ticket]: 'Смотреть гайд',
            },
            onButtonClick: {
                default: () => { router.push('/tour') },
                [TourStepTypeType.Ticket]: handleViewGuideClick,
            },
        },
        createMeterReadings: {
            title: 'Первые показания ИПУ загружены',
            subtitle: { text: 'Вы сможете загрузить больше показаний', link: { label: 'в разделе «Приборы учета»', href: '/meter', icon: <Meters size='small' /> } },
            newFeatures: {
                resident: ['Передавать показания счетчиков в мобильном приложении'],
            },
            bodyText: {
                default: 'Теперь вы можете хранить и работать с данными ИПУ на платформе. Загляните в путеводитель Домов — он поможет с другими задачами.',
                [TourStepTypeType.Meter]: 'Последний шаг к оптимизации работы с ИПУ — предложить жителям скачать мобильное приложение Doma и отправлять показания с его помощью. Чтобы продвигать приложение среди жителей было проще, мы подготовили гайд с готовыми шаблонами.',
            },
            buttonLabel: {
                default: 'В путеводитель',
                [TourStepTypeType.Meter]: 'Смотреть гайд',
            },
            onButtonClick: {
                default: () => { router.push('/tour') },
                [TourStepTypeType.Meter]: handleViewGuideClick,
            },
        },
        uploadReceipts: {
            title: 'Все получилось — вы настроили биллинг',
            subtitle: { text: 'Вы можете следить за начислениями и оплатами', link: { label: 'в разделе «Начисления и оплаты»', href: '/billing', icon: <Wallet size='small' /> } },
            newFeatures: {
                employee: ['Загружать реестры и формировать квитанции', 'Следить за платежами от жителей'],
                resident: ['Оплачивать квитанции в мобильном приложении'],
            },
            bodyText: {
                default: 'Теперь жители могут оплачивать квитанции, а вы — следить за поступлениями. Загляните в путеводитель Домов — он поможет с другими задачами.',
                [TourStepTypeType.Billing]: 'Следующий шаг к снижению дебиторской задолженности — рассказать жителям о мобильном приложении Doma. С его помощью они смогут оплачивать счета и передавать показания для будущих квитанций. Чтобы продвигать приложение среди жителей было проще, мы подготовили гайд с готовыми шаблонами.',
            },
            buttonLabel: {
                default: 'В путеводитель',
                [TourStepTypeType.Billing]: 'Смотреть гайд',
            },
            onButtonClick: {
                default: () => { router.push('/tour') },
                [TourStepTypeType.Billing]: handleViewGuideClick,
            },
        },
        viewResidentsAppGuide: {
            title: 'Вы посмотрели гайд о внедрении мобильного приложения',
            subtitle: { text: 'Вы можете вернуться у нему', link: { label: 'на странице Путеводителя', href: '/tour', icon: <Guide size='small' /> } },
            newFeatures: {
                employee: ['Рассказать жителям о мобильном приложении'],
                resident: ['Скачать приложение и зарегистрироваться'],
            },
            bodyText: {
                default: '',
                [TourStepTypeType.Resident]: 'Следующий шаг к укреплению отношений с жителями — создание и публикация первой новости. Жители увидят ее в приложении, а вы разберетесь, как работать с новостями на платформе',
            },
            buttonLabel: {
                default: '',
                [TourStepTypeType.Resident]: 'Добавить новость',
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

        setCompletedStepModalData(modalValue)
    }, [activeStep, completedStepModalDataDescription, router, updateCompletedFlowModalData])

    const computedCompletedStepModalData: ComputedCompletedStepModalDataType = useMemo(() => ({
        title: get(completedStepModalData, 'title'),
        subtitleText: get(completedStepModalData, 'subtitle.text'),
        subtitleLink: get(completedStepModalData, 'subtitle.link.href'),
        subtitleLinkLabel: get(completedStepModalData, 'subtitle.link.label'),
        subtitleLinkIcon: get(completedStepModalData, 'subtitle.link.icon'),
        newEmployeeFeatures: get(completedStepModalData, 'newFeatures.employee'),
        newResidentFeatures: get(completedStepModalData, 'newFeatures.resident'),
        buttonLabel: get(completedStepModalData, ['buttonLabel', activeStep], get(completedStepModalData, ['buttonLabel', 'default'])),
        buttonOnClick: get(completedStepModalData, ['onButtonClick', activeStep], get(completedStepModalData, ['onButtonClick', 'default'])),
        bodyText: get(completedStepModalData, ['bodyText', activeStep], get(completedStepModalData, ['bodyText', 'default'])),
    }), [activeStep, completedStepModalData])


    return {
        completedStepModalData: computedCompletedStepModalData,
        updateCompletedStepModalData,
        completedFlowModalData: computedCompletedFlowModalData,
        updateCompletedFlowModalData,
    }
}