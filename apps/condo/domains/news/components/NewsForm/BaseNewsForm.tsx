import {
    BuildingUnit as IBuildingUnit,
    NewsItem as INewsItem,
    NewsItemCreateInput as INewsItemCreateInput,
    NewsItemSharing as INewsItemSharing,
    NewsItemSharingCreateInput as INewsItemSharingCreateInput,
    NewsItemSharingUpdateInput as INewsItemSharingUpdateInput,
    NewsItemScope as INewsItemScope,
    NewsItemScopeCreateInput as INewsItemScopeCreateInput,
    NewsItemScopeUnitTypeType,
    NewsItemUpdateInput as INewsItemUpdateInput,
    Property as IProperty,
    QueryAllNewsItemsArgs as IQueryAllNewsItemsArgs,
    B2BApp as IB2BApp,
    B2BAppContext as IB2BAppContext,
    B2BAppNewsSharingConfig as IB2BAppNewsSharingConfig,
    NewsItemTypeType as INewsItemTypeType,
} from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Form, FormInstance, notification, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { ArgsProps } from 'antd/lib/notification'
import dayjs, { Dayjs } from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import chunk from 'lodash/chunk'
import difference from 'lodash/difference'
import flattenDeep from 'lodash/flattenDeep'
import get from 'lodash/get'
import has from 'lodash/has'
import includes from 'lodash/includes'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import isNull from 'lodash/isNull'
import keyBy from 'lodash/keyBy'
import uniq from 'lodash/uniq'
import { useRouter } from 'next/router'
import React, { ComponentProps, useCallback, useMemo, useState, useEffect } from 'react'
import { Options as ScrollOptions } from 'scroll-into-view-if-needed'

import { IGenerateHooksResult } from '@open-condo/codegen/generate.hooks'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar as UIActionBar, Alert, Button, Radio, RadioGroup, Space, Steps, Typography, Modal } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { NewsCardGrid } from '@condo/domains/news/components/NewsForm/NewsCardGrid'
import SelectSharingAppControl from '@condo/domains/news/components/NewsForm/SelectSharingAppControl'
import { NewsItemCard } from '@condo/domains/news/components/NewsItemCard'
import {
    detectTargetedSections,
} from '@condo/domains/news/components/RecipientCounter'
import {
    PROFANITY_TITLE_DETECTED_MOT_ERF_KER,
    PROFANITY_BODY_DETECTED_MOT_ERF_KER,
} from '@condo/domains/news/constants/errors'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'
import { NewsItem, NewsItemScope } from '@condo/domains/news/utils/clientSchema'
import { PARKING_SECTION_TYPE } from '@condo/domains/property/constants/common'
import { Property } from '@condo/domains/property/utils/clientSchema'

import { InputStep, SharingAppValuesType } from './InputStep'

import type { FormRule as Rule } from 'antd'

dayjs.extend(isSameOrAfter)
type FormWithActionChildrenProps = ComponentProps<ComponentProps<typeof FormWithAction>['children']>

type ActionBarProps = Pick<FormWithActionChildrenProps, 'handleSave' | 'isLoading' | 'form'>

type ActionNameProps = 'create' | 'update'

type NewsItemClientUtilsType = IGenerateHooksResult<INewsItem, INewsItemCreateInput, INewsItemUpdateInput, IQueryAllNewsItemsArgs>

type NewsItemSharingClientUtilsType = IGenerateHooksResult<INewsItemSharing, INewsItemSharingCreateInput, INewsItemSharingUpdateInput, IQueryAllNewsItemsArgs>

type NewsFormStepType = 'selectApps' | 'condoApp' | 'sharingApp' | 'review'

type StepData = {
    type: NewsFormStepType
    title: string

    sharingAppData?: {
        id: string
        app: IB2BApp
        ctx: IB2BAppContext
        newsSharingConfig: IB2BAppNewsSharingConfig
    }
}

export type SendPeriodType = 'now' | 'later'

export type InitialValuesType =  Partial<INewsItem> & Partial<{
    newsItemScopes: Array<INewsItemScope>
    hasAllProperties: boolean
    sendPeriod: SendPeriodType
    properties?: Array<IProperty>
    type?: string
    validBefore?: Dayjs
}>

export type TemplatesType = {
    [key: string]: {
        title: string
        body: string
        type?: string
        id?: string
        label?: string
        category?: string
    }
}

export type BaseNewsFormProps = {
    organizationId: string
    ActionBar: React.FC<ActionBarProps>
    newsItemAction: (values: INewsItemCreateInput | INewsItemUpdateInput) => ReturnType<ReturnType<NewsItemClientUtilsType['useCreate' | 'useUpdate']>>
    newsItemSharingAction: (values: INewsItemSharingCreateInput | INewsItemSharingUpdateInput) => ReturnType<ReturnType<NewsItemSharingClientUtilsType['useCreate']>>
    initialValues?: InitialValuesType
    templates: TemplatesType
    afterAction?: () => void
    newsItem?: INewsItem
    OnCompletedMsg: (INewsItem) => ArgsProps | null
    allNews: INewsItem[]
    actionName: ActionNameProps
    totalProperties: number
    autoFocusBody?: boolean
    sharingAppContexts: IB2BAppContext[]
    createNewsItemSharingAction?: (values: INewsItemSharingCreateInput) => ReturnType<ReturnType<NewsItemSharingClientUtilsType['useCreate']>>
    initialPropertiesFromQuery?: Array<string>
    initialStep?: 0 | 1
}

type CondoFormValues = {
    title: string
    body: string
    properties: any
    property: any
    hasAllProperties: boolean
    unitNames: Array<string>
    sectionIds: Array<string>
}

type SelectAppsFormValues = {
    type: INewsItemTypeType
    validBefore: Dayjs
}

export type ScopeType = {
    selectedUnitNameKeys: Array<string> | null
    selectedPropertiesId: Array<string> | null
    isAllPropertiesChecked: boolean | null
    selectedSectionKeys: Array<string> | null
}

export const HiddenBlock = styled.div<{ hide?: boolean }>`
  ${({ hide }) => hide ? 'display: none;' : ''}
`

//TODO(DOMA-6846) wrap form label with 0 margin and use default spacing (details in 6613 pr)
const FLEX_START_STYLE: React.CSSProperties = { alignItems: 'flex-start' }
const BIG_MARGIN_BOTTOM_STYLE: React.CSSProperties = { marginBottom: '60px' }
const MARGIN_BOTTOM_38_STYLE: React.CSSProperties = { marginBottom: '38px' }
const MARGIN_BOTTOM_10_STYLE: React.CSSProperties = { marginBottom: '10px' }
const MARGIN_BOTTOM_24_STYLE: React.CSSProperties = { marginBottom: '24px' }
const MARGIN_TOP_8_STYLE: React.CSSProperties = { marginTop: '8px' }
const MARGIN_TOP_44_STYLE: React.CSSProperties = { marginTop: '44px' }
const FORM_FILED_COL_PROPS = { style: { width: '100%', padding: 0, height: '44px' } }
const SCROLL_TO_FIRST_ERROR_CONFIG: ScrollOptions = { behavior: 'smooth', block: 'center' }
const SHOW_TIME_CONFIG = { defaultValue: dayjs('00:00:00:000', 'HH:mm:ss:SSS') }
const FULL_WIDTH_STYLE: React.CSSProperties = { width: '100%' }
const SMALL_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]
const EXTRA_SMALL_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 10]
const BIG_HORIZONTAL_GUTTER: [Gutter, Gutter] = [50, 0]
const ALL_SQUARE_BRACKETS_OCCURRENCES_REGEX = /\[[^\]]*?\]/g
const ADDITIONAL_DISABLED_MINUTES_COUNT = 5
const DATE_FORMAT = 'DD MMMM YYYY HH:mm'

const DOMA_APP_ICON_URL = '/homeWithSun.svg'
const SHARING_APP_FALLBACK_ICON = '/news/sharingAppIconPlaceholder.svg'

export const getTypeAndNameByKey = (unitKey) => {
    const indexOfFirst = unitKey.indexOf('-')

    const type = unitKey.substring(0, indexOfFirst)
    const name = unitKey.substring(indexOfFirst + 1)

    return { type, name }
}

export const getUnitNamesAndUnitTypes = (property, sectionKeys) => {
    const selectedSections = (get(property, ['map', 'sections'], []) || []).filter((section) => includes(sectionKeys, `${section.type}-${section.name}`))
    const selectedParking = (get(property, ['map', 'parking'], []) || []).filter((section) => includes(sectionKeys, `${PARKING_SECTION_TYPE}-${section.name}`))
    const allSectionsUnits = getAllSectionsUnits([...selectedSections, ...selectedParking])
    const unitNames = allSectionsUnits.map(unit => unit.label)
    const unitTypes = allSectionsUnits.map(unit => get(unit, 'unitType', NewsItemScopeUnitTypeType.Flat) as NewsItemScopeUnitTypeType)
    return { unitNames, unitTypes }
}

const getValidBeforeAfterSendAt = (form) => {
    const { sendAt, validBefore } = form.getFieldsValue(['sendAt', 'validBefore'])
    if (sendAt && validBefore) {
        const diff = dayjs(validBefore).diff(sendAt)
        if (diff < 0) return false
    }
    return true
}

const containWordsInSquareBrackets = (str) => {
    const words = str.match(ALL_SQUARE_BRACKETS_OCCURRENCES_REGEX) || []
    return words.length !== 0
}

const getTitleTemplateChanged = (form) => {
    const { title } = form.getFieldsValue(['title'])
    return !containWordsInSquareBrackets(title)
}

const getBodyTemplateChanged = (form) => {
    const { body } = form.getFieldsValue(['body'])
    return !containWordsInSquareBrackets(body)
}

const isDateDisabled = date => {
    const isDateInPast = date.startOf('day').isBefore(dayjs().startOf('day'))
    const isDateInFutureAfterOneYear = date.startOf('day').isAfter(dayjs().add(1, 'year').startOf('day'))
    return isDateInPast || isDateInFutureAfterOneYear
}
const isTimeDisabled = date => {
    // NOTE: doesnt guarantee that user can not select time that has already come, he can select the current time and wait until the ADDITIONAL_DISABLED_MINUTES_COUNT has passed
    if (date && !date.isSame(dayjs(), 'day')) {
        return {
            disabledHours: () => [],
            disabledMinutes: () => [],
        }
    }
    let hour = dayjs().hour()
    if (date && dayjs(date).hour() > dayjs().hour()) {
        return {
            disabledHours: () => Array.from({ length: hour }, (_, i) => i),
            disabledMinutes: () => [],
        }
    }
    const minute = dayjs().minute() + ADDITIONAL_DISABLED_MINUTES_COUNT
    if (minute > 59) hour += 1
    return {
        disabledHours: () => Array.from({ length: hour }, (_, i) => i),
        disabledMinutes: () => Array.from({ length: minute }, (_, i) => i),
    }
}

export const getIsDateInFutureRule: (error: string) => Rule = (error) => (form) => {
    return {
        message: error,
        validator: (rule) => {
            const fieldName = get(rule, 'fullField', null)
            const date = form.getFieldsValue([fieldName])[fieldName]
            if (fieldName && date) {
                return date.isSameOrAfter(dayjs(), 'minute') ? Promise.resolve() : Promise.reject()
            }
            return Promise.resolve()
        },
    }
}
export const getFinishWorkRule: (error: string) => Rule = (error) => (form) => {
    return {
        message: error,
        validator: () => {
            return getValidBeforeAfterSendAt(form) ? Promise.resolve() : Promise.reject()
        },
    }
}
export const getTitleTemplateChangedRule: (error: string) => Rule = (error) => (form) => {
    return {
        message: error,
        validator: () => {
            return getTitleTemplateChanged(form) ? Promise.resolve() : Promise.reject()
        },
    }
}
export const getBodyTemplateChangedRule: (error: string) => Rule = (error) => (form) => {
    return {
        message: error,
        validator: () => {
            return getBodyTemplateChanged(form) ? Promise.resolve() : Promise.reject()
        },
    }
}

type handleChangeDateType = (form: FormInstance, fieldName: string, action: any) => ComponentProps<typeof DatePicker>['onChange']
export const handleChangeDate: handleChangeDateType = (form, fieldName, action) => (value) => {
    if (!value) return
    action(getValidBeforeAfterSendAt(form))
    // NOTE: We do forced zeroing of seconds and milliseconds so that there are no problems with validation
    form.setFieldValue(fieldName, value.set('seconds', 0).set('milliseconds', 0))
}

const getAllSectionsUnits: (IBuildingSection) => IBuildingUnit[] = (sections) => {
    if (!sections) return null

    const unflattenUnits = sections.map((section) => {
        const floors = get(section, ['floors'], [])

        return floors.map((floor) => floor.units).reverse()
    })

    return flattenDeep(unflattenUnits)
}

const getNewsItemCountAtSameDay = (value, allNews) => {
    const isSendNow = isNull(value)

    const sendDate = isSendNow ? dayjs() : value
    return allNews.filter(newsItem => sendDate.isSame(newsItem.sentAt, 'day') || sendDate.isSame(newsItem.sendAt, 'day')).length
}

const getAllUnits = (property: IProperty): IBuildingUnit[] => {
    const map = get(property, 'map')
    const sections = (get(map, 'sections') || [])
    const parking = (get(map, 'parking') || [])

    if (!map || (!sections && !parking)) return []

    return [
        ...sections.flatMap((section) => section.floors.flatMap(floor => floor.units)),
        ...parking.flatMap((section) => section.floors.flatMap(floor => floor.units)),
    ]
}


const INITIAL_VALUES = {}
const CHUNK_SIZE = 50

export const BaseNewsForm: React.FC<BaseNewsFormProps> = ({
    organizationId,
    ActionBar,
    newsItemAction: createOrUpdateNewsItem,
    sharingAppContexts,
    newsItemSharingAction: createOrUpdateNewsSharingItem,
    initialValues = INITIAL_VALUES,
    templates,
    afterAction,
    newsItem: currentNewsItem,
    OnCompletedMsg,
    allNews,
    actionName,
    totalProperties,
    autoFocusBody,
    initialPropertiesFromQuery,
    initialStep = 0,
}) => {
    const intl = useIntl()
    const MobileAppLabel = intl.formatMessage({ id: 'MobileAppName' })
    const StepSkippedPrefixLabel = intl.formatMessage({ id: 'pages.condo.news.steps.skipPrefix' })
    const SelectAppsStepLabel = intl.formatMessage({ id: 'pages.condo.news.steps.selectApps' })
    const CondoAppStepLabel = intl.formatMessage({ id: 'pages.condo.news.preview.condoAppName' })
    const ReviewStepLabel = intl.formatMessage({ id: 'pages.condo.news.steps.review' })
    const ReviewStepTitleLabel = intl.formatMessage({ id: 'pages.condo.news.steps.review.title' })
    const TypeLabel = intl.formatMessage({ id: 'news.fields.type.label' })
    const CommonTypeLabel = intl.formatMessage({ id: 'news.fields.type.common' })
    const EmergencyTypeLabel = intl.formatMessage({ id: 'news.fields.type.emergency' })
    const SelectPlaceholder = intl.formatMessage({ id: 'Select' })
    const SendPeriodNowLabel = intl.formatMessage({ id: 'global.now' })
    const SendPeriodLaterLabel = intl.formatMessage({ id: 'global.later' })
    const ValidBeforeLabel = intl.formatMessage({ id: 'global.actualUntil' })
    const ValidBeforeTitle = intl.formatMessage({ id: 'news.fields.validBefore.title' })
    const SelectSendPeriodLabel = intl.formatMessage({ id: 'news.fields.period.label' })
    const ValidBeforeErrorMessage = intl.formatMessage({ id: 'news.fields.validBefore.error' })
    const ToManyMessagesMessage = intl.formatMessage({ id: 'news.fields.toManyMessages.error' })
    const PastTimeErrorMessage = intl.formatMessage({ id: 'global.input.error.pastTime' })
    const NextStepMessage = intl.formatMessage({ id: 'pages.condo.news.steps.nextStep' })
    const TimeZoneLabel = intl.formatMessage({ id: 'timezone' })
    const ProfanityInTitle = intl.formatMessage({ id: 'news.fields.profanityInTitle.error' })
    const ProfanityInBody = intl.formatMessage({ id: 'news.fields.profanityInBody.error' })
    const SelectSharingAppLabel = intl.formatMessage({ id: 'pages.news.create.selectSharingApp' })
    const DateAndTimePlaceholderLabel = intl.formatMessage({ id: 'pages.condo.news.dateAndTimePlaceholder' })
    const ConfirmSendLabel = intl.formatMessage({ id: 'news.ConfirmSendTitle' })
    const ConfirmSendMessage = intl.formatMessage({ id: 'news.ConfirmSendMessage' })
    const CancelSendMessage = intl.formatMessage({ id: 'news.CancelSendMessage' })
    const SendNewsLabel = intl.formatMessage({ id: 'news.filed.shareNews.button' })
    const ShareButtonMessage = intl.formatMessage({ id: 'global.share' })
    const parts = intl.formatDateToParts(new Date(), {
        timeZoneName: 'long',
    })

    const timeZone = useMemo(() => parts.find((part) => part.type === 'timeZoneName')?.value, [parts])

    const router = useRouter()

    const [newsItemsForm] = Form.useForm()

    const { breakpoints } = useLayoutContext()
    const isMediumWindow = !breakpoints.DESKTOP_SMALL
    const formFieldsColSpan = isMediumWindow ? 24 : 14

    const initialValidBefore = useMemo(() => get(initialValues, 'validBefore', null), [initialValues])
    const initialSendAt = useMemo(() => get(initialValues, 'sendAt', null), [initialValues])
    const initialNewsItemScopes: INewsItemScope[] = useMemo(() => get(initialValues, 'newsItemScopes', []), [initialValues])
    const initialHasAllProperties = useMemo(() => get(initialValues, 'hasAllProperties', false), [initialValues])
    const initialProperties = useMemo(() => get(initialValues, 'properties', []), [initialValues])
    const initialSentAt = useMemo(() => get(initialValues, 'sentAt', null), [initialValues])
    const initialPropertyIds: string[] = useMemo(() => {
        if (initialHasAllProperties) return []

        if (initialPropertiesFromQuery) {
            return initialPropertiesFromQuery
        }
        return uniq(initialNewsItemScopes.map(item => item.property.id))
    }, [initialHasAllProperties, initialNewsItemScopes, initialPropertiesFromQuery])
    const initialSectionKeys = useMemo(() => {
        if (initialHasAllProperties) return []
        if (initialProperties.length !== 1) return []

        const { sections, parking } = detectTargetedSections(initialNewsItemScopes, initialProperties[0])
        return [
            ...sections.map(section => {
                const sectionName = section.name
                if (sectionName) return `section-${sectionName}`
            }).filter(Boolean),
            ...parking.map(section => {
                const sectionName = section.name
                if (sectionName) return `${PARKING_SECTION_TYPE}-${sectionName}`
            }).filter(Boolean),
        ]
    }, [initialHasAllProperties, initialNewsItemScopes, initialProperties])
    const initialSectionIds = useMemo(() => {
        if (initialHasAllProperties) return []
        if (initialProperties.length !== 1) return []

        const { sections, parking } = detectTargetedSections(initialNewsItemScopes, initialProperties[0])
        const targetedSections = [...sections, ...parking]
        return targetedSections.map(section => {
            const sectionName = section.name
            if (sectionName) return sectionName
        }).filter(Boolean)
    }, [initialHasAllProperties, initialNewsItemScopes, initialProperties])
    const initialUnitKeys = useMemo(() => {
        if (initialHasAllProperties) return []
        if (initialProperties.length !== 1) return []

        return initialNewsItemScopes.map(item => {
            const unitType = item.unitType
            const unitName = item.unitName
            if (unitType && unitName) return `${unitType}-${unitName}`
        }).filter(Boolean)
    }, [initialHasAllProperties, initialNewsItemScopes, initialProperties.length])

    const sharingAppContextsIndex = useMemo(() => keyBy(sharingAppContexts, 'id'), [sharingAppContexts])
    const [selectedSharingAppsContexts, setSelectedSharingAppsContexts] = useState<Set<string>>(new Set())

    const [sendPeriod, setSendPeriod] = useState<string>(get(initialValues, 'sendPeriod', 'now'))

    const [selectedType, setSelectedType] = useState<string>(get(initialValues, 'type', NEWS_TYPE_COMMON))
    const [selectedValidBeforeText, setSelectedValidBeforeText] = useState<string>(initialValidBefore)
    const [selectedValidBefore, setSelectedValidBefore] = useState<Dayjs>(dayjs(initialValidBefore))

    const [selectedTitle, setSelectedTitle] = useState<string>(get(initialValues, 'title', ''))
    const [selectedBody, setSelectedBody] = useState<string>(get(initialValues, 'body', ''))
    const [isValidBeforeAfterSendAt, setIsValidBeforeAfterSendAt] = useState<boolean>(true)
    const [newsItemCountAtSameDay, setNewsItemCountAtSameDay] = useState(getNewsItemCountAtSameDay(null, allNews))

    const [scope, setScope] = useState<ScopeType>({
        selectedUnitNameKeys: initialUnitKeys,
        selectedPropertiesId: initialPropertyIds,
        isAllPropertiesChecked: initialHasAllProperties,
        selectedSectionKeys: initialSectionIds,
    })

    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false)

    // Select apps form values
    const [selectAppsFormValues, setSelectAppsFormValues] = useState<SelectAppsFormValues | null>(null)

    // Condo form values
    const [condoFormValues, setCondoFormValues] = useState<CondoFormValues | null>(null)

    // SharingApp form values:
    const [sharingAppsFormValues, setSharingAppsFormValues] = useState<Record<string, SharingAppValuesType>>({})

    const { loading: selectedPropertiesLoading, objs: selectedProperties } = Property.useAllObjects({
        where: { id_in: scope.selectedPropertiesId },
    }, { fetchPolicy: 'cache-first' })

    const softDeleteNewsItemScope = NewsItemScope.useSoftDeleteMany()
    const createNewsItemScope = NewsItemScope.useCreateMany({})
    const updateNewsItem = NewsItem.useUpdate({})

    const handleSetSendDate = useCallback((value) => {
        const newsItemCountAtSameDay = getNewsItemCountAtSameDay(value, allNews)
        setNewsItemCountAtSameDay(newsItemCountAtSameDay)
    }, [allNews])

    const handleSendPeriodChange = useCallback((form) => (e) => {
        if (e.target.value === 'now') {
            handleSetSendDate(null)
            setIsValidBeforeAfterSendAt(true)
            form.setFieldValue('sendAt', null)
        }
        setSendPeriod(e.target.value)
    }, [handleSetSendDate])

    const handleTypeChange = useCallback((form) => (e) => {
        setSelectedType(e.target.value)
    }, [])

    const handleValidBeforeChange = useCallback((form, fieldName) => (value, dateString) => {
        const handleChangeDateEvent = handleChangeDate(form, fieldName, setIsValidBeforeAfterSendAt)
        handleChangeDateEvent(value, dateString)

        console.log('Handle valid before change', dateString, value)

        setSelectedValidBefore(value)
        setSelectedValidBeforeText(dayjs(value).format('HH:mm DD MMMM'))
    }, [])

    const handleSendAtChange = useCallback((form, fieldName) => (value, dateString) => {
        const handleChangeDateEvent = handleChangeDate(form, fieldName, setIsValidBeforeAfterSendAt)
        handleChangeDateEvent(value, dateString)

        handleSetSendDate(value)
    }, [handleSetSendDate])

    const handleSelectSharingApp = useCallback(({ value, checked }: { value: string, checked: boolean }) => {
        setSkippedSteps(new Set())
        setSelectedSharingAppsContexts(prevSelected => {
            const newSelected = new Set(prevSelected)
            if (checked) {
                newSelected.add(value)
            } else {
                newSelected.delete(value)
            }
            return newSelected
        })
    }, [])

    const { requiredValidator } = useValidations()
    const dateRule: Rule = useMemo(() => getIsDateInFutureRule(PastTimeErrorMessage), [PastTimeErrorMessage])
    const finishWorkRule: Rule = useMemo(() => getFinishWorkRule(ValidBeforeErrorMessage), [ValidBeforeErrorMessage])
    const commonRule: Rule = useMemo(() => requiredValidator, [requiredValidator])

    const initialFormValues = useMemo(() => {
        return {
            ...initialValues,
            sendPeriod: sendPeriod,
            template: 1,
            unitNames: isEmpty(initialSectionKeys) ? initialUnitKeys : [],
            sectionIds: initialSectionKeys,
            type: selectedType,
            title: selectedTitle,
            body: selectedBody,
            properties: scope.selectedPropertiesId,
            ...(totalProperties === 1 && scope.selectedPropertiesId.length === 1 ? { property: scope.selectedPropertiesId[0] } : undefined),
            validBefore: initialValidBefore ? dayjs(initialValidBefore) : null,
            sendAt: initialSendAt ? dayjs(initialSendAt) : null,
        }
    }, [initialValues])

    const handleFormSubmit = useCallback(async (values) => {
        if (!values || !selectAppsFormValues || !condoFormValues) {
            console.error('Cannot submit form: not all fields are filled')
            return
        }

        if (actionName === 'update') {
            await updateNewsItem({ isPublished: false }, currentNewsItem)
        }

        const {
            sendPeriod,
            sendAt,
        } = values

        const {
            type,
            validBefore,
        } = selectAppsFormValues

        const {
            title,
            body,
            unitNames,
            sectionIds,
            hasAllProperties,
            property,
            properties,
        } = condoFormValues

        const updatedNewsItemValues = {
            sendAt: sendPeriod === 'later' ? sendAt : null,
            validBefore: validBefore?.toString(),
            type,
            body,
            title,
        }

        const newsItem = await createOrUpdateNewsItem(updatedNewsItemValues)
        const newsItemId = get(newsItem, 'id')

        if (actionName === 'create') {
            for (const ctxId of getSelectedAndNotSkippedSharingApps()) {
                const newsItemSharing = {
                    b2bAppContext: { connect: { id: ctxId } },
                    newsItem: { connect: { id: newsItemId } },
                    sharingParams: {
                        ...sharingAppsFormValues[ctxId],
                        validBeforeWithTimeZone: validBefore?.format('YYYY-MM-DD HH:mm:ss Z'),
                    },
                }

                await createOrUpdateNewsSharingItem(newsItemSharing)
            }
        }

        // Handle news item scopes updates:
        if (actionName === 'update' && properties.length !== 0 && initialHasAllProperties) {
            await softDeleteNewsItemScope([initialNewsItemScopes[0]])
        }
        if (actionName === 'update' && properties.length === 0 && !initialHasAllProperties && hasAllProperties) {
            await createNewsItemScope([{
                newsItem: { connect: { id: newsItemId } },
            }])
        }
        if (actionName === 'update' && !initialHasAllProperties) {
            const deletedPropertyIds = difference(initialPropertyIds, properties)
            const newsItemScopesToDelete = initialNewsItemScopes
                .filter(newsItemScope => deletedPropertyIds.includes(newsItemScope.property.id))
            const newsItemScopesToDeleteByChunks = chunk(newsItemScopesToDelete, CHUNK_SIZE)

            for (const scopesToDelete of newsItemScopesToDeleteByChunks) {
                await softDeleteNewsItemScope(scopesToDelete)
            }

            if (isEmpty(deletedPropertyIds)) {
                const deletedKeys = difference(initialUnitKeys, unitNames)
                const newsItemScopesToDelete = initialNewsItemScopes
                    .filter(newsItemScope => {
                        const key = `${newsItemScope.unitType}-${newsItemScope.unitName}`
                        return deletedKeys.includes(key)
                    })
                const newsItemScopesToDeleteByChunks = chunk(newsItemScopesToDelete, CHUNK_SIZE)

                for (const scopesToDelete of newsItemScopesToDeleteByChunks) {
                    await softDeleteNewsItemScope(scopesToDelete)
                }

                if (!isEmpty(initialUnitKeys) && isEmpty(unitNames) && isEmpty(sectionIds) && deletedKeys.length === initialUnitKeys.length) {
                    await createNewsItemScope([{
                        newsItem: { connect: { id: newsItemId } },
                        property: { connect: { id: initialPropertyIds[0] } },
                    }])
                }
            }
        }

        const addedPropertyIds: string[] = actionName === 'create' ? properties : difference(properties, initialPropertyIds)
        if (actionName === 'create' && addedPropertyIds.length === 0 && hasAllProperties) {
            await createNewsItemScope([{
                newsItem: { connect: { id: newsItemId } },
            }])
        }

        if (addedPropertyIds.length === 1 && properties.length === 1) {
            if (unitNames.length > 0 || sectionIds.length > 0) {
                let scopesToAdd: INewsItemScopeCreateInput[] = []
                const propertyId = addedPropertyIds[0]
                const property = selectedProperties.find(property => get(property, 'id') === propertyId)

                if (unitNames.length > 0) {
                    scopesToAdd = uniq(unitNames as string[]).map((unitKey) => {
                        const { name: unitName, type: unitType } = getTypeAndNameByKey(unitKey)
                        return {
                            newsItem: { connect: { id: newsItemId } },
                            property: { connect: { id: propertyId } },
                            unitName: unitName,
                            unitType: unitType,
                        }
                    })
                } else if (sectionIds.length > 0) {
                    const { unitNames, unitTypes } = getUnitNamesAndUnitTypes(property, sectionIds)
                    scopesToAdd = unitNames.map((unitName, i) => ({
                        newsItem: { connect: { id: newsItemId } },
                        property: { connect: { id: propertyId } },
                        unitName: unitName,
                        unitType: unitTypes[i],
                    }))
                }

                const allUnits = getAllUnits(property)
                const selectedUnits = allUnits.filter(({ label, unitType: type }) => scopesToAdd.some(({ unitName, unitType }) => label === unitName && (type as string) === unitType))
                const selectedAllUnits = selectedUnits.length === allUnits.length

                if (selectedAllUnits) {
                    await createNewsItemScope([{
                        newsItem: { connect: { id: newsItemId } },
                        property: { connect: { id: propertyId } },
                    }])
                } else {
                    const scopesToAddByChunks = chunk(scopesToAdd, CHUNK_SIZE)
                    for (const scopes of scopesToAddByChunks) {
                        await createNewsItemScope(scopes)
                    }
                }
            }
        }

        if (isEmpty(sectionIds) && isEmpty(unitNames) && !isEmpty(addedPropertyIds)) {
            const scopesToAdd: INewsItemScopeCreateInput[] = addedPropertyIds.map(propertyId => ({
                newsItem: { connect: { id: newsItemId } },
                property: { connect: { id: propertyId } },
            }))
            const scopesToAddByChunks = chunk(scopesToAdd, CHUNK_SIZE)

            for (const scopes of scopesToAddByChunks) {
                await createNewsItemScope(scopes)
            }
        }

        if (actionName === 'update' && !hasAllProperties && isEmpty(addedPropertyIds) && sectionIds.length > 0) {
            const propertyId = initialPropertyIds[0]
            if (isEmpty(initialUnitKeys) && initialNewsItemScopes.length === 1) {
                await softDeleteNewsItemScope([initialNewsItemScopes[0]])
            }
            const { unitNames, unitTypes } = getUnitNamesAndUnitTypes(property, sectionIds)
            const scopesToAdd: INewsItemScopeCreateInput[] = unitNames.map((unitName, i) => ({
                newsItem: { connect: { id: newsItemId } },
                property: { connect: { id: propertyId } },
                unitName: unitName,
                unitType: unitTypes[i],
            }))
            const scopesToAddByChunks = chunk(scopesToAdd, CHUNK_SIZE)

            for (const scopes of scopesToAddByChunks) {
                await createNewsItemScope(scopes)
            }
        }
        if (actionName === 'update' && !hasAllProperties && isEmpty(addedPropertyIds) && unitNames.length > 0) {
            const propertyId = initialPropertyIds[0]
            if (isEmpty(initialUnitKeys) && initialNewsItemScopes.length === 1) {
                await softDeleteNewsItemScope([initialNewsItemScopes[0]])
            }
            const addedKeys = difference(unitNames, initialUnitKeys)

            const scopesToAdd: INewsItemScopeCreateInput[] = addedKeys.map((unitKey) => {
                const { name: unitName, type: unitType } = getTypeAndNameByKey(unitKey)
                return {
                    newsItem: { connect: { id: newsItemId } },
                    property: { connect: { id: propertyId } },
                    unitName: unitName,
                    unitType: unitType,
                }
            })
            const scopesToAddByChunks = chunk(scopesToAdd, CHUNK_SIZE)

            for (const scopes of scopesToAddByChunks) {
                await createNewsItemScope(scopes)
            }
        }

        await updateNewsItem({ isPublished: true }, newsItem)
        if (isFunction(OnCompletedMsg)) {
            const completedMsgData = OnCompletedMsg(newsItem)
            !!completedMsgData && notification.info(completedMsgData)
        }
        if (isFunction(afterAction) && !initialSentAt) {
            await afterAction()
        } else {
            await router.push('/news')
        }
    }, [actionName, createOrUpdateNewsItem, initialHasAllProperties, initialPropertyIds, updateNewsItem, OnCompletedMsg, afterAction, initialSentAt, currentNewsItem, initialNewsItemScopes, softDeleteNewsItemScope, initialUnitKeys, createNewsItemScope, router])

    const ErrorToFormFieldMsgMapping = useMemo(() => ({
        [PROFANITY_TITLE_DETECTED_MOT_ERF_KER]: {
            name: 'title',
            errors: [ProfanityInTitle],
        },
        [PROFANITY_BODY_DETECTED_MOT_ERF_KER]: {
            name: 'body',
            errors: [ProfanityInBody],
        },
    }), [ProfanityInBody, ProfanityInTitle])

    const [currentStep, setCurrentStep] = useState<number>(0)
    const [skippedSteps, setSkippedSteps] = useState(new Set<number>)

    const handleNextStep = ({ form }) => {

        // 1. Trigger validations based on step
        let fieldsToValidate = []

        if (currentStep === 0) {
            fieldsToValidate = ['type', 'validBefore']
            setSelectAppsFormValues({ ...form.getFieldsValue(true) })
        }

        if (currentStep === 1) {
            fieldsToValidate = ['templates', 'title', 'body', 'property', 'properties', 'hasAllProperties', 'unitNames', 'sectionIds']
            const res = form.getFieldsValue(true)

            setSelectedTitle(res.title)
            setSelectedBody(res.body)
            setCondoFormValues(res)
        }

        if (currentStep === getLastStep()) {
            fieldsToValidate = ['sendAt']
        }

        form.validateFields(fieldsToValidate).then((values) => {
            if (skippedSteps.has(currentStep + 1)) {
                handleStepSkip({ step: currentStep + 1, skip: false })
            }
            setCurrentStep((currentStep) => currentStep + 1)
        }).catch((err) => {
            console.error('failed to validate the form', err)
        })
    }

    const handleStepSkip = ({ step, skip }: { step: number, skip: boolean }) => {

        const stepType = getStepTypeByStep(step)
        if (stepType !== 'sharingApp') {
            console.warn('Can not skip non sharing app type steps')
            return
        }

        setSkippedSteps(prevSelected => {
            const newSkippedSteps = new Set(prevSelected)
            if (skip) {
                newSkippedSteps.add(step)
                setCurrentStep((currentStep) => currentStep + 1)
            } else {
                newSkippedSteps.delete(step)
            }
            return newSkippedSteps
        })
    }

    const handleSharingAppFormSubmit = async ({ values, ctx, form }) => {
        try {
            if (!ctx.newsSharingConfig.customFormUrl) {
                const fieldsToValidate = ['templates', 'title', 'body', 'customSelect', 'hasAllCustom']

                await form.validateFields(fieldsToValidate)
            }

            const newFormValues = { ...sharingAppsFormValues, [ctx?.id]: values }

            setSharingAppsFormValues(newFormValues)
            setCurrentStep((currentStep) => currentStep + 1)
        }
        catch (error) {
            console.error('failed to validate the form', error)
        }
    }

    const handleStepClick = (value: number) => {
        if (skippedSteps.has(value)) {
            handleStepSkip({ step: value, skip: false })
        }
        setCurrentStep(value)
    }

    const getSelectedAndNotSkippedSharingApps = useCallback(() => {
        const skippedSharingAppIds = new Set()
        skippedSteps.forEach(step => {
            const id = get(getStepDataByStep(step), ['sharingAppData', 'id'], null)
            if (id) { skippedSharingAppIds.add(id) }
        })
        return Array.from(selectedSharingAppsContexts).filter(ctxId => !skippedSharingAppIds.has(ctxId))
    }, [skippedSteps, selectedSharingAppsContexts])

    const getStepsData = useCallback((): StepData[] => {
        const sharingApps: StepData[] = Array.from(selectedSharingAppsContexts).map(appCtx => ({
            type: 'sharingApp',
            title: get(sharingAppContextsIndex, [appCtx, 'app', 'newsSharingConfig', 'name']),

            sharingAppData: {
                id: sharingAppContextsIndex[appCtx].id,
                ctx: sharingAppContextsIndex[appCtx],
                app: sharingAppContextsIndex[appCtx].app,
                newsSharingConfig: sharingAppContextsIndex[appCtx].app.newsSharingConfig,
            },
        }))

        return [
            {
                type: 'selectApps',
                title: SelectAppsStepLabel,
            },
            {
                type: 'condoApp',
                title: CondoAppStepLabel,
            },
            ...sharingApps,
            {
                type: 'review',
                title: ReviewStepLabel,
            },
        ]
    }, [CondoAppStepLabel, ReviewStepLabel, SelectAppsStepLabel, selectedSharingAppsContexts, sharingAppContextsIndex])

    const getSteps = useCallback(() => {
        return getStepsData().map((step, i) => {
            if (skippedSteps.has(i)) {
                return { title: `(${StepSkippedPrefixLabel}) ${step.title}` }
            }

            return { title: step.title }
        })
    }, [StepSkippedPrefixLabel, getStepsData, skippedSteps])

    const getStepTypeByStep = useCallback((step: number): NewsFormStepType => {
        return getStepsData()[step].type
    }, [getStepsData])

    const getStepDataByStep = useCallback((step: number) => {
        return getStepsData()[step]
    }, [getStepsData])

    const getLastStep = useCallback(() => {
        return getSteps().length - 1
    }, [getSteps])

    const validateBeforeSave = () => {
        if (!selectAppsFormValues.validBefore) return false

        const validBeforeValue: dayjs.Dayjs = dayjs(selectAppsFormValues.validBefore)

        if (validBeforeValue.isBefore(dayjs())) {
            setCurrentStep(0)
            notification.error({ message: PastTimeErrorMessage })

            return true
        }

        return false
    }

    const isSharingAppStep = getStepTypeByStep(currentStep) === 'sharingApp'
    const isFormStep = getStepTypeByStep(currentStep) === 'condoApp' || isSharingAppStep

    useEffect(() => {
        // NOTE:    We skip steps using "useEffect"
        //          because each step (even a skipped one) may contain some important logic
        //          that is only triggered when moving to the next step.

        if (!initialStep) return
        if (initialStep >= 2) return

        const stepsForSkip = initialStep - currentStep
        for (let i = 0; i < stepsForSkip; i++) {
            handleNextStep({ form: newsItemsForm })
        }
    }, [])

    return (
        <Row gutter={BIG_HORIZONTAL_GUTTER}>
            <Col span={24} flex='auto'>

                <Row style={BIG_MARGIN_BOTTOM_STYLE}>
                    <Col span={24}>
                        <Steps
                            current={currentStep}
                            items={getSteps()}
                            onChange={handleStepClick}
                        />
                    </Col>
                </Row>

                <FormWithAction
                    formInstance={newsItemsForm}
                    initialValues={initialFormValues}
                    colon={false}
                    action={handleFormSubmit}
                    OnCompletedMsg={isNull(OnCompletedMsg) ? undefined : null}
                    scrollToFirstError={SCROLL_TO_FIRST_ERROR_CONFIG}
                    ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
                    formValuesToMutationDataPreprocessor={(values) => {
                        values.property = selectedProperties[0]

                        if (get(values, 'hasAllProperties', null) && get(values, 'property', null)) {
                            values.properties = has(values.property, 'id') ? [values.property.id] : []
                        }

                        return values
                    }}

                    children={({ handleSave, isLoading, form }) => (
                        <>
                            <Row style={BIG_MARGIN_BOTTOM_STYLE}>

                                {getStepTypeByStep(currentStep) === 'selectApps' && (
                                    <>
                                        <Col span={24}>
                                            <Row style={BIG_MARGIN_BOTTOM_STYLE}>
                                                <Col span={formFieldsColSpan}>
                                                    <Row>
                                                        <Col span={isMediumWindow ? 24 : 12}>
                                                            <Form.Item
                                                                label={TypeLabel}
                                                                name='type'
                                                                required
                                                                style={FLEX_START_STYLE}
                                                            >
                                                                <RadioGroup onChange={handleTypeChange(form)}>
                                                                    <Space size={8} wrap>
                                                                        <Radio value={NEWS_TYPE_COMMON}>
                                                                            {CommonTypeLabel}
                                                                        </Radio>
                                                                        <Radio value={NEWS_TYPE_EMERGENCY}>
                                                                            {EmergencyTypeLabel}
                                                                        </Radio>
                                                                    </Space>
                                                                </RadioGroup>
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={isMediumWindow ? 24 : 12}>
                                                            <Form.Item
                                                                label={(
                                                                    <LabelWithInfo
                                                                        title={ValidBeforeTitle}
                                                                        message={ValidBeforeLabel}
                                                                    />
                                                                )}
                                                                labelCol={FORM_FILED_COL_PROPS}
                                                                name='validBefore'
                                                                required={selectedType === NEWS_TYPE_EMERGENCY}
                                                                rules={selectedType === NEWS_TYPE_EMERGENCY ? [finishWorkRule, commonRule, dateRule] : [finishWorkRule, dateRule]}
                                                                validateFirst={true}
                                                            >
                                                                <DatePicker
                                                                    value={selectedValidBefore}
                                                                    style={FULL_WIDTH_STYLE}
                                                                    format={DATE_FORMAT}
                                                                    showTime={SHOW_TIME_CONFIG}
                                                                    minuteStep={15}
                                                                    onChange={handleValidBeforeChange(form, 'validBefore')}
                                                                    placeholder={SelectPlaceholder}
                                                                    disabledDate={isDateDisabled}
                                                                    disabledTime={isTimeDisabled}
                                                                    showNow={false}
                                                                    allowClear={true}
                                                                />
                                                            </Form.Item>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                            </Row>

                                            <Row style={MARGIN_BOTTOM_24_STYLE}>
                                                <Typography.Title level={2}>{SelectSharingAppLabel}</Typography.Title>
                                            </Row>
                                        </Col>

                                        <SelectSharingAppControl
                                            selectedSharingApps={selectedSharingAppsContexts}
                                            handleSelectSharingApp={handleSelectSharingApp}
                                            sharingAppContexts={sharingAppContexts}
                                        />
                                    </>
                                )}

                                {isFormStep && (
                                    <InputStep
                                        form={form}
                                        scope={scope}
                                        setScope={setScope}
                                        templates={templates}
                                        isSharingStep={isSharingAppStep}
                                        autoFocusBody={autoFocusBody}
                                        organizationId={organizationId}
                                        totalProperties={totalProperties}
                                        initialFormValues={initialFormValues}
                                        initialPropertyIds={initialPropertyIds}
                                        onSkip={() => handleStepSkip({ skip: true, step: currentStep })}
                                        sharingAppData={getStepDataByStep(currentStep).sharingAppData}
                                        initialValues={sharingAppsFormValues?.[getStepDataByStep(currentStep).sharingAppData?.id]}
                                        selectedProperty={{
                                            loading: selectedPropertiesLoading,
                                            objs: selectedProperties,
                                        }}
                                        onSubmit={(values) => handleSharingAppFormSubmit({
                                            values: values,
                                            ctx: getStepDataByStep(currentStep).sharingAppData,
                                            form: form,
                                        })}
                                        newsItemData={{
                                            type: selectedType,
                                            validBefore: selectedValidBeforeText,
                                            title: selectedTitle,
                                            body: selectedBody,
                                        }}
                                    />
                                )}

                                {getStepTypeByStep(currentStep) === 'review' && (
                                    <Col span={24}>
                                        <Row gutter={BIG_HORIZONTAL_GUTTER}>

                                            <Col span={24} style={MARGIN_BOTTOM_24_STYLE}>
                                                <Typography.Title level={2}>
                                                    {ReviewStepTitleLabel}
                                                </Typography.Title>
                                            </Col>

                                            <Col span={24} style={MARGIN_BOTTOM_38_STYLE}>
                                                <NewsCardGrid>
                                                    <NewsItemCard
                                                        title={selectedTitle}
                                                        body={selectedBody}
                                                        appName={MobileAppLabel}
                                                        icon={DOMA_APP_ICON_URL}
                                                        validBefore={selectedValidBefore}
                                                        type={selectedType}
                                                    />
                                                    {getSelectedAndNotSkippedSharingApps().map(ctxId => {

                                                        const ctx = sharingAppContextsIndex[ctxId]

                                                        const sharingAppName = get(ctx, ['app', 'newsSharingConfig', 'name'], '').replaceAll(' ', ' ')
                                                        const sharingAppIcon = get(ctx, ['app', 'newsSharingConfig', 'icon', 'publicUrl'], SHARING_APP_FALLBACK_ICON)
                                                        const title = get(sharingAppsFormValues, [ctxId, 'preview', 'renderedTitle'])
                                                        const body = get(sharingAppsFormValues, [ctxId, 'preview', 'renderedBody'])

                                                        return (
                                                            <NewsItemCard
                                                                key={ctx.id}
                                                                title={title}
                                                                body={body}
                                                                appName={sharingAppName}
                                                                icon={sharingAppIcon}
                                                                validBefore={selectedValidBefore}
                                                                type={selectedType}
                                                            />
                                                        )
                                                    })}
                                                </NewsCardGrid>
                                            </Col>

                                            <Col span={formFieldsColSpan} style={MARGIN_TOP_8_STYLE}>
                                                <Row gutter={EXTRA_SMALL_VERTICAL_GUTTER}>
                                                    <Col span={24} style={MARGIN_BOTTOM_10_STYLE}>
                                                        <Row gutter={EXTRA_SMALL_VERTICAL_GUTTER}>
                                                            <Col span={24}>
                                                                <Typography.Title level={3}>
                                                                    {SelectSendPeriodLabel}
                                                                </Typography.Title>
                                                            </Col>
                                                            <Col span={24}>
                                                                <Typography.Paragraph type='secondary'>
                                                                    {TimeZoneLabel} ({timeZone})
                                                                </Typography.Paragraph>
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                                    <Col span={24}>
                                                        <Row gutter={SMALL_VERTICAL_GUTTER} style={MARGIN_BOTTOM_10_STYLE}>
                                                            {
                                                                !isValidBeforeAfterSendAt && (
                                                                    <Alert
                                                                        type='error'
                                                                        showIcon
                                                                        description={ValidBeforeErrorMessage}
                                                                    />
                                                                )
                                                            }
                                                            {
                                                                newsItemCountAtSameDay >= 5 && (
                                                                    <Alert
                                                                        type='warning'
                                                                        showIcon
                                                                        description={ToManyMessagesMessage}
                                                                    />
                                                                )
                                                            }
                                                            <Col span={isMediumWindow ? 24 : 12} style={MARGIN_BOTTOM_10_STYLE}>
                                                                <Form.Item
                                                                    name='sendPeriod'
                                                                    required
                                                                >
                                                                    <RadioGroup onChange={handleSendPeriodChange(form)}>
                                                                        <Space size={20} wrap direction='horizontal'>
                                                                            <Radio value='now'>{SendPeriodNowLabel}</Radio>
                                                                            <Radio value='later'>{SendPeriodLaterLabel}</Radio>
                                                                        </Space>
                                                                    </RadioGroup>
                                                                </Form.Item>
                                                            </Col>
                                                            {sendPeriod === 'later' && (
                                                                <Col span={isMediumWindow ? 24 : 12}>
                                                                    <Form.Item
                                                                        name='sendAt'
                                                                        required
                                                                        rules={[commonRule, dateRule]}
                                                                    >
                                                                        <DatePicker
                                                                            style={FULL_WIDTH_STYLE}
                                                                            format={DATE_FORMAT}
                                                                            showTime={SHOW_TIME_CONFIG}
                                                                            minuteStep={15}
                                                                            onChange={handleSendAtChange(form, 'sendAt')}
                                                                            placeholder={DateAndTimePlaceholderLabel}
                                                                            disabledDate={isDateDisabled}
                                                                            disabledTime={isTimeDisabled}
                                                                            showNow={false}
                                                                        />
                                                                    </Form.Item>
                                                                </Col>
                                                            )}
                                                        </Row>
                                                    </Col>
                                                </Row>
                                            </Col>
                                        </Row>
                                    </Col>
                                )}
                            </Row>

                            <Row>
                                <Col span={24} style={MARGIN_TOP_44_STYLE}>
                                    {currentStep === getLastStep() && isFunction(ActionBar) && (
                                        <UIActionBar
                                            actions={[
                                                <Button
                                                    key='submit'
                                                    type='primary'
                                                    children={SendNewsLabel}
                                                    onClick={() => setIsConfirmModalVisible(true)}
                                                />,
                                                <Modal
                                                    key='modalWindow'
                                                    title={ConfirmSendLabel}
                                                    open={isConfirmModalVisible}
                                                    onCancel={() => setIsConfirmModalVisible(false)}
                                                    footer={[
                                                        <Button
                                                            key='cancel'
                                                            type='secondary'
                                                            onClick={() => setIsConfirmModalVisible(false)}>
                                                            {CancelSendMessage}
                                                        </Button>,
                                                        <Button
                                                            key='submit'
                                                            type='primary'
                                                            children={ShareButtonMessage}
                                                            onClick={() => {
                                                                if (validateBeforeSave()) return

                                                                handleSave()
                                                            }}
                                                            disabled={isLoading}
                                                        />,
                                                    ]}
                                                >
                                                    <Typography.Text type='primary'>
                                                        {ConfirmSendMessage}
                                                    </Typography.Text>
                                                </Modal>,
                                            ]}
                                        />
                                    )}
                                    {currentStep <= 1 && (
                                        <UIActionBar
                                            actions={[
                                                <Button
                                                    key='submit'
                                                    type='primary'
                                                    children={NextStepMessage}
                                                    onClick={() => handleNextStep({ form })}
                                                />,
                                            ]}
                                        />
                                    )}
                                </Col>
                            </Row>
                        </>
                    )}
                />
            </Col>
        </Row>
    )
}