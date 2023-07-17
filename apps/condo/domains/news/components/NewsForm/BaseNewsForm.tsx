import {
    BuildingUnit as IBuildingUnit,
    NewsItem as INewsItem,
    NewsItemCreateInput as INewsItemCreateInput,
    NewsItemScope as INewsItemScope,
    NewsItemScopeUnitTypeType,
    NewsItemTemplate as INewsItemTemplate,
    NewsItemUpdateInput as INewsItemUpdateInput,
    Property as IProperty,
    QueryAllNewsItemsArgs as IQueryAllNewsItemsArgs,
} from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Form, FormInstance, notification, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { ArgsProps } from 'antd/lib/notification'
import dayjs from 'dayjs'
import difference from 'lodash/difference'
import flattenDeep from 'lodash/flattenDeep'
import get from 'lodash/get'
import has from 'lodash/has'
import includes from 'lodash/includes'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import isNull from 'lodash/isNull'
import transform from 'lodash/transform'
import uniq from 'lodash/uniq'
import { useRouter } from 'next/router'
import { Rule } from 'rc-field-form/lib/interface'
import React, { ComponentProps, useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Options as ScrollOptions } from 'scroll-into-view-if-needed'

import { IGenerateHooksResult } from '@open-condo/codegen/generate.hooks'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Radio, RadioGroup, Space, Tabs, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import {
    GraphQlSearchInputWithCheckAll,
    InputWithCheckAllProps,
} from '@condo/domains/common/components/GraphQlSearchInputWithCheckAll'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'
import { useInputWithCounter } from '@condo/domains/common/hooks/useInputWithCounter'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import MemoizedNewsPreview from '@condo/domains/news/components/NewsPreview'
import { detectTargetedSections, RecipientCounter } from '@condo/domains/news/components/RecipientCounter'
import { TNewsItemScopeNoInstance } from '@condo/domains/news/components/types'
import { PROFANITY_TITLE_DETECTED_MOT_ERF_KER, PROFANITY_BODY_DETECTED_MOT_ERF_KER } from '@condo/domains/news/constants/errors'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'
import { NewsItem, NewsItemScope } from '@condo/domains/news/utils/clientSchema'
import { PARKING_SECTION_TYPE } from '@condo/domains/property/constants/common'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { searchOrganizationProperty } from '@condo/domains/ticket/utils/clientSchema/search'
import { SectionNameInput } from '@condo/domains/user/components/SectionNameInput'
import { UnitNameInput, UnitNameInputOption } from '@condo/domains/user/components/UnitNameInput'

type FormWithActionChildrenProps = ComponentProps<ComponentProps<typeof FormWithAction>['children']>

type ActionBarProps = Pick<FormWithActionChildrenProps, 'handleSave' | 'isLoading' | 'form'>

type ActionNameProps = 'create' | 'update'

type NewsItemClientUtilsType = IGenerateHooksResult<INewsItem, INewsItemCreateInput, INewsItemUpdateInput, IQueryAllNewsItemsArgs>

export type SendPeriodType = 'now' | 'later'

export type BaseNewsFormProps = {
    organizationId: string
    ActionBar: React.FC<ActionBarProps>
    action: (values: INewsItemCreateInput | INewsItemUpdateInput) => ReturnType<ReturnType<NewsItemClientUtilsType['useCreate' | 'useUpdate']>>
    initialValues?: INewsItem
    & {
        newsItemScopes: INewsItemScope[],
        hasAllProperties: boolean,
        sendPeriod: SendPeriodType,
        properties?: IProperty[],
    },
    templates: { [key: string]: Pick<INewsItemTemplate, 'title' | 'body' | 'type'> }
    afterAction?: () => void,
    newsItem?: INewsItem,
    OnCompletedMsg: (INewsItem) => ArgsProps | null,
    allNews: INewsItem[],
    actionName: ActionNameProps,
}

export const StyledTabs = styled(Tabs)`
    > .condo-tabs-nav {
        margin: 0;

        .condo-tabs-ink-bar {
          display: none;
        }

        .condo-tabs-tab {
          padding: 12px;
          border: 1px solid ${colors.gray[3]};
          border-radius: 1000px;
  
          &.condo-tabs-tab-active {
            background-color: ${colors.gray[3]};
            transition: background-color 0.3s ease-out;
          }

          & + .condo-tabs-tab {
            margin-left: 8px;
          }

          & .condo-tabs-tab-label {
            font-size: 14px;
            line-height: 22px;
          }
        }
    }
`
const NO_RESIZE_STYLE: React.CSSProperties = { resize: 'none' }
const FORM_FILED_COL_PROPS = { style: { width: '100%', padding: 0 } }
export const SCROLL_TO_FIRST_ERROR_CONFIG: ScrollOptions = { behavior: 'smooth', block: 'center' }
export const SHOW_TIME_CONFIG = { defaultValue: dayjs('00:00:00:000', 'HH:mm:ss:SSS') }
export const FULL_WIDTH_STYLE: React.CSSProperties = { width: '100%' }
const BIG_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 60]
const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]
const SMALL_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]
const BIG_HORIZONTAL_GUTTER: [Gutter, Gutter] = [50, 0]
const ALL_SQUARE_BRACKETS_OCCURRENCES_REGEX = /\[[^\]]*?\]/g
const ADDITIONAL_DISABLED_MINUTES_COUNT = 5

const buildCounterStyle = (textLength: number, type: 'Body' | 'Title'): React.CSSProperties => {
    const style: React.CSSProperties = {
        position: 'absolute',
        right: 0,
        margin: '12px',
        padding: '2px 10px',
        borderRadius: '100px',
        backgroundColor: `${colors.gray[7]}`,
    }

    if (textLength > 0) {
        style.backgroundColor = `${colors.black}`
    }

    if (type === 'Body') {
        style.top = '198px'
    }
    if (type === 'Title') {
        style.top = '123px'
    }

    return style
}

const getTypeAndNameByKey = (unitKey) => {
    const indexOfFirst = unitKey.indexOf('-')

    const type = unitKey.substring(0, indexOfFirst)
    const name = unitKey.substring(indexOfFirst + 1)

    return { type, name }
}

const getUnitNamesAndUnitTypes = (property, sectionKeys) => {
    const selectedSections = get(property, ['map', 'sections'], []).filter((section) => includes(sectionKeys, `${section.type}-${section.name}`))
    const selectedParking = get(property, ['map', 'parking'], []).filter((section) => includes(sectionKeys, `${PARKING_SECTION_TYPE}-${section.name}`))
    const allSectionsUnits = getAllSectionsUnits([...selectedSections, ...selectedParking])
    const unitNames = allSectionsUnits.map(unit => unit.label)
    const unitTypes = allSectionsUnits.map(unit => get(unit, 'unitType', NewsItemScopeUnitTypeType.Flat) as NewsItemScopeUnitTypeType)
    return { unitNames, unitTypes }
}

const getIsDateInFuture = (form, fieldName) => {
    const date = form.getFieldsValue([fieldName])[fieldName]
    return date.isSameOrAfter(dayjs(), 'minute')
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

const getBodyTemplateChanged = (form) => {
    const { body } = form.getFieldsValue(['body'])
    // NOTE: this check blocks any sending of [] in the news body
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
    const hour = dayjs().hour()
    if (date && dayjs(date).hour() > dayjs().hour()) {
        return {
            disabledHours: () => Array.from({ length: hour }, (_, i) => i),
            disabledMinutes: () => [],
        }
    }
    const minute = dayjs().minute() + ADDITIONAL_DISABLED_MINUTES_COUNT
    if (minute > 59) hour + 1
    return {
        disabledHours: () => Array.from({ length: hour }, (_, i) => i),
        disabledMinutes: () => Array.from({ length: minute }, (_, i) => i),
    }
}

export const getDateRule: (error: string) => Rule = (error) => (form) => {
    return {
        message: error,
        validator: (rule) => {
            const fieldName = get(rule, 'fullField', null)
            if (fieldName) return getIsDateInFuture(form, fieldName) ? Promise.resolve() : Promise.reject()
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

const INITIAL_VALUES = {}

export const BaseNewsForm: React.FC<BaseNewsFormProps> = ({
    organizationId,
    ActionBar,
    action: createOrUpdateNewsItem,
    initialValues = INITIAL_VALUES,
    templates,
    afterAction,
    newsItem: currentNewsItem,
    OnCompletedMsg,
    allNews,
    actionName,
}) => {
    const intl = useIntl()
    const TypeLabel = intl.formatMessage({ id: 'news.fields.type.label' })
    const CommonTypeLabel = intl.formatMessage({ id: 'news.fields.type.common' })
    const EmergencyTypeLabel = intl.formatMessage({ id: 'news.fields.type.emergency' })
    const TitleLabel = intl.formatMessage({ id: 'news.fields.title.label' })
    const TitlePlaceholderMessage = intl.formatMessage({ id: 'news.fields.title.placeholder' })
    const BodyLabel = intl.formatMessage({ id: 'news.fields.body.label' })
    const BodyPlaceholderMessage = intl.formatMessage({ id: 'news.fields.body.placeholder' })
    const CheckAllLabel = intl.formatMessage({ id: 'global.checkAll' })
    const UnitsLabel = intl.formatMessage({ id: 'news.fields.units.label' })
    const UnitsMessage = intl.formatMessage({ id: 'news.fields.units.message' })
    const SectionsLabel = intl.formatMessage({ id: 'news.fields.sections.label' })
    const SectionsMessage = intl.formatMessage({ id: 'news.fields.sections.message' })
    const PropertiesLabel = intl.formatMessage({ id: 'field.Address' })
    const SelectPlaceholder = intl.formatMessage({ id: 'Select' })
    const SelectAddressPlaceholder = intl.formatMessage({ id: 'global.select.address' })
    const SendAtLabel = intl.formatMessage({ id: 'news.fields.sendAt.label' })
    const SendPeriodNowLabel = intl.formatMessage({ id: 'global.now' })
    const SendPeriodLaterLabel = intl.formatMessage({ id: 'global.later' })
    const ValidBeforeLabel = intl.formatMessage({ id: 'global.actualUntil' })
    const ValidBeforeTitle = intl.formatMessage({ id: 'news.fields.validBefore.title' })
    const TitleErrorMessage = intl.formatMessage({ id: 'news.fields.title.error.length' })
    const BodyErrorMessage = intl.formatMessage({ id: 'news.fields.body.error.length' })
    const MakeTextLabel = intl.formatMessage({ id: 'news.fields.makeText.label' })
    const SelectTextLabel = intl.formatMessage({ id: 'news.fields.text.label' })
    const SelectAddressLabel = intl.formatMessage({ id: 'news.fields.address.label' })
    const SelectSendPeriodLabel = intl.formatMessage({ id: 'news.fields.period.label' })
    const TemplateBodyErrorMessage = intl.formatMessage({ id: 'news.fields.templateBody.error' })
    const ValidBeforeErrorMessage = intl.formatMessage({ id: 'news.fields.validBefore.error' })
    const ToManyMessagesMessage = intl.formatMessage({ id: 'news.fields.toManyMessages.error' })
    const TemlatesLabel = intl.formatMessage({ id: 'news.fields.templates' })
    const PastTimeErrorMessage = intl.formatMessage({ id: 'global.input.error.pastTime' })
    const TimezoneMskTitle = intl.formatMessage({ id: 'timezone.msk' })
    const ProfanityInTitle = intl.formatMessage({ id: 'news.fields.profanityInTitle.error' })
    const ProfanityInBody = intl.formatMessage({ id: 'news.fields.profanityInBody.error' })

    const router = useRouter()

    const { breakpoints } = useLayoutContext()
    const isMediumWindow = !breakpoints.DESKTOP_SMALL
    const formFieldsColSpan = isMediumWindow ? 24 : 14
    const formInfoColSpan = 24 - formFieldsColSpan

    const initialValidBefore = useMemo(() => get(initialValues, 'validBefore', null), [initialValues])
    const initialSendAt = useMemo(() => get(initialValues, 'sendAt', null), [initialValues])
    const initialNewsItemScopes = useMemo(() => get(initialValues, 'newsItemScopes', []), [initialValues])
    const initialHasAllProperties = useMemo(() => get(initialValues, 'hasAllProperties', false), [initialValues])
    const initialProperties = useMemo(() => get(initialValues, 'properties', []), [initialValues])
    const initialSentAt = useMemo(() => get(initialValues, 'sentAt', null), [initialValues])
    const initialPropertyIds: string[] = useMemo(() => {
        if (initialHasAllProperties) return []

        return uniq(initialNewsItemScopes.map(item => item.property.id))
    }, [initialHasAllProperties, initialNewsItemScopes])
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
    const initialUnitNames: string[] = useMemo(() => {
        if (initialHasAllProperties) return []
        if (initialProperties.length !== 1) return []

        return initialNewsItemScopes.map(item => {
            const unitName = item.unitName
            if (unitName) return unitName
        }).filter(Boolean)
    }, [initialHasAllProperties, initialNewsItemScopes, initialProperties.length])
    const initialUnitTypes = useMemo(() => {
        if (initialHasAllProperties) return []
        if (initialProperties.length !== 1) return []
        if (!isEmpty(initialSectionKeys)) return []

        return initialNewsItemScopes.map(item => {
            const unitType = item.unitType
            if (unitType) return unitType
        }).filter(Boolean)
    }, [initialHasAllProperties, initialNewsItemScopes, initialProperties.length, initialSectionKeys])
    const commonTemplates = useMemo(() => {
        return transform(templates, (result, value, key) => {
            if (value.type === NEWS_TYPE_COMMON || isNull(value.type)) {
                result[key] = value
            }
        }, {})
    }, [templates])

    const emergencyTemplates = useMemo(() => {
        return transform(templates, (result, value, key) => {
            if (value.type === NEWS_TYPE_EMERGENCY || isNull(value.type)) {
                result[key] = value
            }
        }, {})
    }, [templates])

    const [sendPeriod, setSendPeriod] = useState<string>(get(initialValues, 'sendPeriod', 'now'))

    const [selectedType, setSelectedType] = useState<string>(get(initialValues, 'type', NEWS_TYPE_COMMON))
    const [selectedTitle, setSelectedTitle] = useState<string>(get(initialValues, 'title', ''))
    const [selectedBody, setSelectedBody] = useState<string>(get(initialValues, 'body', ''))
    const [selectedValidBeforeText, setSelectedValidBeforeText] = useState<string>(initialValidBefore)
    const [isValidBeforeAfterSendAt, setIsValidBeforeAfterSendAt] = useState<boolean>(true)
    const [newsItemCountAtSameDay, setNewsItemCountAtSameDay] = useState(getNewsItemCountAtSameDay(null, allNews))
    const [selectedUnitNameKeys, setSelectedUnitNameKeys] = useState(initialUnitKeys)
    const [selectedPropertiesId, setSelectedPropertiesId] = useState(initialPropertyIds)
    const [isAllPropertiesChecked, setIsAllPropertiesChecked] = useState(initialHasAllProperties)
    const [selectedSectionKeys, setSelectedSectionKeys] = useState(initialSectionIds)

    const countPropertiesAvaliableToSelect = useRef(null)
    const onlyPropertyThatCanBeSelected = useRef(null)

    const { loading: selectedPropertiesLoading, objs: selectedProperties } = Property.useAllObjects({
        where: { id_in: selectedPropertiesId },
    })

    const isOnlyOnePropertySelected: boolean = useMemo(() => (selectedPropertiesId.length === 1), [selectedPropertiesId.length])

    const softDeleteNewsItemScope = NewsItemScope.useSoftDelete()
    const createNewsItemScope = NewsItemScope.useCreate({})
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
        if (e.target.value === NEWS_TYPE_COMMON) {
            setIsValidBeforeAfterSendAt(true)
            form.setFieldValue('validBefore', null)
        }
        setSelectedType(e.target.value)
    }, [])

    const handleTitleChange = useCallback((e) => {
        setSelectedTitle(e.target.value)
    }, [])

    const handleBodyChange = useCallback((e) => {
        setSelectedBody(e.target.value)
    }, [])

    const handleValidBeforeChange = useCallback((form, fieldName) => (value, dateString) => {
        const handleChangeDateEvent = handleChangeDate(form, fieldName, setIsValidBeforeAfterSendAt)
        handleChangeDateEvent(value, dateString)

        setSelectedValidBeforeText(dateString)
    }, [])

    const handleSendAtChange = useCallback((form, fieldName) => (value, dateString) => {
        const handleChangeDateEvent = handleChangeDate(form, fieldName, setIsValidBeforeAfterSendAt)
        handleChangeDateEvent(value, dateString)

        handleSetSendDate(value)
    }, [handleSetSendDate])

    const handleChangeSectionNameInput = useCallback((property) => {
        return (sections, options) => {
            if (!isEmpty(sections)) {
                const sectionKeys = options.map(option => get(option, 'key'))
                setSelectedSectionKeys(sectionKeys)
            } else {
                setSelectedSectionKeys([])
            }
        }
    }, [])

    const handleChangeUnitNameInput = useCallback((_, options: UnitNameInputOption[]) => {
        if (!options) {
            setSelectedUnitNameKeys(null)
        } else {
            const unitNamesKeys = options.map(option => get(option, 'key'))
            setSelectedUnitNameKeys(unitNamesKeys)

        }
    }, [])

    const handleAllPropertiesDataLoading = useCallback((data) => {
        countPropertiesAvaliableToSelect.current = data.length
        if (data.length === 1) {
            onlyPropertyThatCanBeSelected.current = data[0]
        }
    }, [])

    const Title = useInputWithCounter(Input.TextArea, 150)
    const Body = useInputWithCounter(Input.TextArea, 800)

    useEffect(() => {
        const initialTitle = get(initialValues, 'title', '')
        const initialBody = get(initialValues, 'body', '')
        Title.setTextLength(initialTitle.length)
        Body.setTextLength(initialBody.length)
    }, [])

    const handleTemplateChange = useCallback((form, fieldName) => (value) => {
        const templateId = value
        const title = templateId !== 'emptyTemplate' ? templates[templateId].title : ''
        const body = templateId !== 'emptyTemplate' ? templates[templateId].body : ''

        form.setFieldValue('title', title)
        setSelectedTitle(title)
        Title.setTextLength(title.length)

        form.setFieldValue('body', body)
        setSelectedBody(body)
        Body.setTextLength(body.length)
    }, [Body, Title, templates])
    const propertyCheckboxChange = (form) => {
        return (value) => {
            if (value) setSelectedPropertiesId(selectedPropertiesId => {
                if (countPropertiesAvaliableToSelect.current === 1 && selectedPropertiesId.length === 1) 
                    return selectedPropertiesId
                if (countPropertiesAvaliableToSelect.current === 1 && selectedPropertiesId.length === 0 && has(onlyPropertyThatCanBeSelected, 'current.value')) {
                    return [onlyPropertyThatCanBeSelected.current.value]
                }
                return []
            })
            if (countPropertiesAvaliableToSelect.current === 1 && !value) {
                setSelectedPropertiesId([])
            }
            setIsAllPropertiesChecked(value)
            form.setFieldsValue({ 'unitNames': [] })
            form.setFieldsValue({ 'sectionIds': [] })
            setSelectedUnitNameKeys([])
            setSelectedSectionKeys([])
        }
    }
    const propertySelectProps = (form) => {
        return {
            showArrow: false,
            infinityScroll: true,
            initialValue: initialPropertyIds,
            search: searchOrganizationProperty(organizationId),
            disabled: !organizationId,
            required: true,
            placeholder: SelectAddressPlaceholder,
            onChange: (propIds: string[]) => {
                setSelectedPropertiesId(propIds)
                form.setFieldsValue({ 'unitNames': [] })
                form.setFieldsValue({ 'sectionIds': [] })
                setSelectedUnitNameKeys([])
                setSelectedSectionKeys([])
            },
        }
    }
    const propertySelectFormItemProps: InputWithCheckAllProps['selectFormItemProps'] = useMemo(() => ({
        label: PropertiesLabel,
        required: true,
        name: 'properties',
        validateFirst: true,
    }), [PropertiesLabel])

    const { requiredValidator } = useValidations()
    const dateRule: Rule = useMemo(() => getDateRule(PastTimeErrorMessage), [PastTimeErrorMessage])
    const finishWorkRule: Rule = useMemo(() => getFinishWorkRule(ValidBeforeErrorMessage), [ValidBeforeErrorMessage])
    const commonRule: Rule = useMemo(() => requiredValidator, [requiredValidator])
    const titleRules = useMemo(() => [{
        whitespace: true,
        required: true,
        message: TitleErrorMessage,
    }], [TitleErrorMessage])
    const bodyRule = useMemo(() => ({
        whitespace: true,
        required: true,
        message: BodyErrorMessage,
    }), [BodyErrorMessage])
    const bodyTemplateChanged = useMemo(() => getBodyTemplateChangedRule(TemplateBodyErrorMessage), [TemplateBodyErrorMessage])

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
            properties: selectedPropertiesId,
            validBefore: initialValidBefore ? dayjs(initialValidBefore) : null,
            sendAt: initialSendAt ? dayjs(initialSendAt) : null,
        }
    }, [initialValues])

    const handleFormSubmit = useCallback(async (values) => {
        if (actionName === 'update') {
            await updateNewsItem({ isPublished: false }, currentNewsItem)
        }

        const {
            properties,
            hasAllProperties,
            sendPeriod,
            template,
            type,
            sendAt,
            validBefore,
            unitNames,
            sectionIds,
            property,
            ...newsItemValues
        } = values

        const updatedNewsItemValues = {
            validBefore: type === NEWS_TYPE_EMERGENCY ? validBefore : null,
            sendAt: sendPeriod === 'later' ? sendAt : null,
            type: type,
            ...newsItemValues,
        }

        const newsItem = await createOrUpdateNewsItem(updatedNewsItemValues)
        const newsItemId = get(newsItem, 'id')

        if (actionName === 'update' && properties.length !== 0 && initialHasAllProperties) {
            await softDeleteNewsItemScope(initialNewsItemScopes[0])
        }
        if (actionName === 'update' && properties.length === 0 && !initialHasAllProperties && hasAllProperties) {
            await createNewsItemScope({
                newsItem: { connect: { id: newsItemId } },
            })
        }
        if (actionName === 'update' && !initialHasAllProperties) {
            const deletedPropertyIds = difference(initialPropertyIds, properties)
            const newsItemScopesToDelete = initialNewsItemScopes
                .filter(newsItemScope => deletedPropertyIds.includes(newsItemScope.property.id))

            await Promise.all(newsItemScopesToDelete.map(newsItemScope => {
                return softDeleteNewsItemScope(newsItemScope)
            }))

            if (isEmpty(deletedPropertyIds)) {
                const deletedKeys = difference(initialUnitKeys, unitNames)
                const newsItemScopesToDelete = initialNewsItemScopes
                    .filter(newsItemScope => {
                        const key = `${newsItemScope.unitType}-${newsItemScope.unitName}`
                        return deletedKeys.includes(key)
                    })

                await Promise.all(newsItemScopesToDelete.map(newsItemScope => {
                    return softDeleteNewsItemScope(newsItemScope)
                }))

                if (!isEmpty(initialUnitKeys) && isEmpty(unitNames) && isEmpty(sectionIds) && deletedKeys.length === initialUnitKeys.length) {
                    await createNewsItemScope({
                        newsItem: { connect: { id: newsItemId } },
                        property: { connect: { id: initialPropertyIds[0] } },
                    })
                }
            }
        }

        const addedPropertyIds = actionName === 'create' ? properties : difference(properties, initialPropertyIds)
        if (actionName === 'create' && addedPropertyIds.length === 0 && hasAllProperties) {
            await createNewsItemScope({
                newsItem: { connect: { id: newsItemId } },
            })
        }
        if (addedPropertyIds.length === 1 && properties.length === 1 && unitNames.length > 0) {
            const propertyId = addedPropertyIds[0]

            await Promise.all(unitNames.map((unitKey) => {
                const { name: unitName, type: unitType } = getTypeAndNameByKey(unitKey)
                return createNewsItemScope({
                    newsItem: { connect: { id: newsItemId } },
                    property: { connect: { id: propertyId } },
                    unitName: unitName,
                    unitType: unitType,
                })
            }))
        }
        if (addedPropertyIds.length === 1 && properties.length === 1 && sectionIds.length > 0) {
            const propertyId = addedPropertyIds[0]
            const { unitNames, unitTypes } = getUnitNamesAndUnitTypes(property, sectionIds)

            await Promise.all(unitNames.map((unitName, i) => {
                return createNewsItemScope({
                    newsItem: { connect: { id: newsItemId } },
                    property: { connect: { id: propertyId } },
                    unitName: unitName,
                    unitType: unitTypes[i],
                })
            }))
        }
        if (isEmpty(sectionIds) && isEmpty(unitNames) && !isEmpty(addedPropertyIds)) {
            await Promise.all(addedPropertyIds.map(propertyId => {
                return createNewsItemScope({
                    newsItem: { connect: { id: newsItemId } },
                    property: { connect: { id: propertyId } },
                })
            }))
        }

        if (actionName === 'update' && !hasAllProperties && isEmpty(addedPropertyIds) && sectionIds.length > 0) {
            const propertyId = initialPropertyIds[0]
            if (isEmpty(initialUnitKeys) && initialNewsItemScopes.length === 1) {
                softDeleteNewsItemScope(initialNewsItemScopes[0])
            }
            const { unitNames, unitTypes } = getUnitNamesAndUnitTypes(property, sectionIds)

            await Promise.all(unitNames.map((unitName, i) => {
                return createNewsItemScope({
                    newsItem: { connect: { id: newsItemId } },
                    property: { connect: { id: propertyId } },
                    unitName: unitName,
                    unitType: unitTypes[i],
                })
            }))
        }
        if (actionName === 'update' && !hasAllProperties && isEmpty(addedPropertyIds) && unitNames.length > 0) {
            const propertyId = initialPropertyIds[0]
            if (isEmpty(initialUnitKeys) && initialNewsItemScopes.length === 1) {
                await softDeleteNewsItemScope(initialNewsItemScopes[0])
            }
            const addedKeys = difference(unitNames, initialUnitKeys)

            await Promise.all(addedKeys.map((unitKey) => {
                const { name: unitName, type: unitType } = getTypeAndNameByKey(unitKey)
                return createNewsItemScope({
                    newsItem: { connect: { id: newsItemId } },
                    property: { connect: { id: propertyId } },
                    unitName: unitName,
                    unitType: unitType,
                })
            }))
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

    const newsItemScopesNoInstance = useMemo<TNewsItemScopeNoInstance[]>(() => {
        if (isAllPropertiesChecked && countPropertiesAvaliableToSelect.current !== 1) {
            return [{ property: null, unitType: null, unitName: null }]
        }

        if (selectedPropertiesLoading || selectedPropertiesId.length === 0) {
            return []
        }

        if (isOnlyOnePropertySelected) {
            if (!isEmpty(selectedUnitNameKeys)) {
                return selectedUnitNameKeys.map((unitKey) => {
                    const { name: unitName, type: unitType } = getTypeAndNameByKey(unitKey)
                    return { property: selectedProperties[0], unitType: unitType, unitName: unitName }
                })
            }
            if (!isEmpty(selectedSectionKeys)) {
                const { unitNames, unitTypes } = getUnitNamesAndUnitTypes(selectedProperties[0], selectedSectionKeys)
                return unitNames.map((unitName, i) => {
                    return { property: selectedProperties[0], unitType: unitTypes[i], unitName: unitName }
                })
            }
            if (isEmpty(selectedUnitNameKeys) && isEmpty(selectedSectionKeys)) {
                return [{ property: selectedProperties[0], unitType: null, unitName: null }]
            }

            return []
        } else if (!isEmpty(selectedProperties)) {
            return selectedProperties.map(property => {
                return { property: property, unitType: null, unitName: null }
            })
        }

        return []
    }, [isAllPropertiesChecked, isOnlyOnePropertySelected, selectedProperties, selectedPropertiesId.length, selectedPropertiesLoading, selectedSectionKeys, selectedUnitNameKeys])

    const dayjsTz = dayjs().format('Z')
    const tzInfo = useMemo<string>(() => {
        const matches = /([+-])(\d{1,2}):(\d{1,2})/.exec(dayjsTz)
        const sign = matches[1]
        const hours = Number(matches[2]) - 3 // We show tz related to Moscow tz
        const minutes = Number(matches[3])
        let result = `${TimezoneMskTitle}`
        if (hours !== 0) {
            result = `${result}${sign}${hours}`
        }
        if (minutes !== 0) {
            result = `${result}${hours === 0 ? `${sign}0` : ''}:${matches[3]}`
        }

        return result
    }, [TimezoneMskTitle, dayjsTz])

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

    return (
        <Row gutter={BIG_HORIZONTAL_GUTTER}>
            <Col span={24} flex='auto'>
                <FormWithAction
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
                            <Row gutter={BIG_VERTICAL_GUTTER}>
                                <Col span={24}>
                                    <Row gutter={BIG_HORIZONTAL_GUTTER}>
                                        <Col span={formFieldsColSpan}>
                                            <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                                                <Col span={24}>
                                                    <Row>
                                                        <Col span={24}>
                                                            <Typography.Title level={2}>
                                                                {MakeTextLabel}
                                                            </Typography.Title>
                                                        </Col>
                                                        <Col span={12}>
                                                            <Form.Item
                                                                label={TypeLabel}
                                                                name='type'
                                                                required
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
                                                        {selectedType === NEWS_TYPE_EMERGENCY && (
                                                            <Col span={12}>
                                                                <Form.Item
                                                                    label={(
                                                                        <LabelWithInfo
                                                                            title={ValidBeforeTitle}
                                                                            message={ValidBeforeLabel}
                                                                        />
                                                                    )}
                                                                    labelCol={FORM_FILED_COL_PROPS}
                                                                    name='validBefore'
                                                                    required
                                                                    rules={[finishWorkRule, commonRule, dateRule]}
                                                                    validateFirst={true}
                                                                >
                                                                    <DatePicker
                                                                        style={FULL_WIDTH_STYLE}
                                                                        format='DD MMMM YYYY HH:mm'
                                                                        showTime={SHOW_TIME_CONFIG}
                                                                        onChange={handleValidBeforeChange(form, 'validBefore')}
                                                                        placeholder={SelectPlaceholder}
                                                                        disabledDate={isDateDisabled}
                                                                        disabledTime={isTimeDisabled}
                                                                        showNow={false}
                                                                    />
                                                                </Form.Item>
                                                            </Col>
                                                        )}
                                                    </Row>
                                                </Col>
                                                {templates && (
                                                    <Row gutter={SMALL_VERTICAL_GUTTER}>
                                                        <Col span={24}>
                                                            <Typography.Title level={4}>
                                                                {TemlatesLabel}
                                                            </Typography.Title>
                                                        </Col>
                                                        <Col span={24}>
                                                            <Form.Item
                                                                name='template'
                                                            >
                                                                {selectedType === NEWS_TYPE_COMMON && (
                                                                    <StyledTabs
                                                                        onChange={handleTemplateChange(form, 'template')}
                                                                        items={
                                                                            Object.keys(commonTemplates).map(id => ({
                                                                                key: id,
                                                                                label: commonTemplates[id].title,
                                                                            }))
                                                                        }
                                                                    />
                                                                )}
                                                                {selectedType === NEWS_TYPE_EMERGENCY && (
                                                                    <StyledTabs
                                                                        onChange={handleTemplateChange(form, 'template')}
                                                                        items={
                                                                            Object.keys(emergencyTemplates).map(id => ({
                                                                                key: id,
                                                                                label: emergencyTemplates[id].title,
                                                                            }))
                                                                        }
                                                                    />
                                                                )}
                                                            </Form.Item>
                                                        </Col>
                                                    </Row>
                                                )}
                                                <Col span={24}>
                                                    <Col span={24}>
                                                        <Typography.Title level={4}>{SelectTextLabel}</Typography.Title>
                                                    </Col>
                                                    <Col span={24}>
                                                        <Form.Item
                                                            label={TitleLabel}
                                                            labelCol={FORM_FILED_COL_PROPS}
                                                            name='title'
                                                            required
                                                            rules={titleRules}
                                                        >
                                                            <Title.InputWithCounter
                                                                style={NO_RESIZE_STYLE}
                                                                rows={4}
                                                                placeholder={TitlePlaceholderMessage}
                                                                onChange={handleTitleChange}
                                                            />
                                                        </Form.Item>
                                                        <Col style={buildCounterStyle(Title.textLength, 'Title')}>
                                                            <Title.Counter type='inverted'/>
                                                        </Col>
                                                    </Col>
                                                    <Col span={24}>
                                                        <Form.Item
                                                            label={BodyLabel}
                                                            labelCol={FORM_FILED_COL_PROPS}
                                                            name='body'
                                                            required
                                                            rules={[bodyRule, bodyTemplateChanged]}
                                                            validateFirst={true}
                                                        >
                                                            <Body.InputWithCounter
                                                                style={NO_RESIZE_STYLE}
                                                                rows={7}
                                                                placeholder={BodyPlaceholderMessage}
                                                                onChange={handleBodyChange}
                                                            />
                                                        </Form.Item>
                                                        <Col style={buildCounterStyle(Body.textLength, 'Body')}>
                                                            <Body.Counter type='inverted'/>
                                                        </Col>
                                                    </Col>
                                                </Col>
                                            </Row>
                                        </Col>
                                        <Col span={formInfoColSpan}>
                                            {(!!selectedBody || !!selectedTitle) && (
                                                <MemoizedNewsPreview
                                                    body={selectedBody}
                                                    title={selectedTitle}
                                                    validBefore={selectedType === NEWS_TYPE_EMERGENCY ? selectedValidBeforeText : null}
                                                />
                                            )}
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={24}>
                                    <Row gutter={BIG_HORIZONTAL_GUTTER}>
                                        <Col span={formFieldsColSpan}>
                                            <Row gutter={SMALL_VERTICAL_GUTTER}>
                                                <Col span={24}>
                                                    <Typography.Title level={2}>{SelectAddressLabel}</Typography.Title>
                                                </Col>
                                                <Col span={24}>
                                                    <GraphQlSearchInputWithCheckAll
                                                        checkAllFieldName='hasAllProperties'
                                                        checkAllInitialValue={get(initialValues, 'hasAllProperties', false)}
                                                        selectFormItemProps={propertySelectFormItemProps}
                                                        selectProps={propertySelectProps(form)}
                                                        onCheckBoxChange={propertyCheckboxChange(form)}
                                                        CheckAllMessage={CheckAllLabel}
                                                        onDataLoaded={handleAllPropertiesDataLoading}
                                                        form={form}
                                                    />
                                                </Col>
                                                {
                                                    isOnlyOnePropertySelected && (
                                                        <>
                                                            <Col span={11}>
                                                                <Form.Item
                                                                    name='unitNames'
                                                                    label={
                                                                        selectedPropertiesLoading || !isEmpty(selectedSectionKeys)
                                                                            ? (<LabelWithInfo
                                                                                title={UnitsMessage}
                                                                                message={UnitsLabel}
                                                                            />)
                                                                            : UnitsLabel
                                                                    }
                                                                >
                                                                    <UnitNameInput
                                                                        multiple={true}
                                                                        property={selectedProperties[0]}
                                                                        loading={selectedPropertiesLoading}
                                                                        disabled={selectedPropertiesLoading || !isEmpty(selectedSectionKeys)}
                                                                        onChange={handleChangeUnitNameInput}
                                                                    />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={11} offset={2}>
                                                                <Form.Item
                                                                    name='sectionIds'
                                                                    label={selectedPropertiesLoading || !isEmpty(selectedUnitNameKeys)
                                                                        ? (<LabelWithInfo
                                                                            title={SectionsMessage}
                                                                            message={SectionsLabel}
                                                                        />)
                                                                        : SectionsLabel}
                                                                >
                                                                    <SectionNameInput
                                                                        disabled={selectedPropertiesLoading || !isEmpty(selectedUnitNameKeys)}
                                                                        property={selectedProperties[0]}
                                                                        onChange={handleChangeSectionNameInput(selectedProperties[0])}
                                                                        mode='multiple'
                                                                    />
                                                                </Form.Item>
                                                            </Col>
                                                        </>
                                                    )
                                                }
                                            </Row>
                                        </Col>
                                        <Col span={formInfoColSpan}>
                                            {(newsItemScopesNoInstance.length > 0) && (
                                                <RecipientCounter newsItemScopes={newsItemScopesNoInstance}/>
                                            )}
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={24}>
                                    <Row gutter={BIG_HORIZONTAL_GUTTER}>
                                        <Col span={formFieldsColSpan}>
                                            <Row gutter={SMALL_VERTICAL_GUTTER}>
                                                <Col span={24}>
                                                    <Typography.Title level={2}>
                                                        {SelectSendPeriodLabel} ({tzInfo})
                                                    </Typography.Title>
                                                </Col>
                                                <Col span={24}>
                                                    <Form.Item
                                                        name='sendPeriod'
                                                        required
                                                    >
                                                        <RadioGroup onChange={handleSendPeriodChange(form)}>
                                                            <Space size={20} wrap direction='vertical'>
                                                                <Radio value='now'>{SendPeriodNowLabel}</Radio>
                                                                <Radio value='later'>{SendPeriodLaterLabel}</Radio>
                                                            </Space>
                                                        </RadioGroup>
                                                    </Form.Item>
                                                </Col>
                                                {sendPeriod === 'later' && (
                                                    <Col span={24}>
                                                        <Form.Item
                                                            label={SendAtLabel}
                                                            labelCol={FORM_FILED_COL_PROPS}
                                                            name='sendAt'
                                                            required
                                                            rules={[commonRule, dateRule]}
                                                        >
                                                            <DatePicker
                                                                style={FULL_WIDTH_STYLE}
                                                                format='DD MMMM YYYY HH:mm'
                                                                showTime={SHOW_TIME_CONFIG}
                                                                onChange={handleSendAtChange(form, 'sendAt')}
                                                                placeholder={SelectPlaceholder}
                                                                disabledDate={isDateDisabled}
                                                                disabledTime={isTimeDisabled}
                                                                showNow={false}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                )}
                                                {
                                                    !isValidBeforeAfterSendAt && (
                                                        <Alert
                                                            type='error'
                                                            showIcon
                                                            message={ValidBeforeErrorMessage}
                                                            description=' '
                                                        />
                                                    )
                                                }
                                                {
                                                    newsItemCountAtSameDay >= 5 && (
                                                        <Alert
                                                            type='warning'
                                                            showIcon
                                                            message={ToManyMessagesMessage}
                                                            description=' '
                                                        />
                                                    )
                                                }
                                            </Row>
                                        </Col>
                                    </Row>
                                </Col>
                                {isFunction(ActionBar) && (
                                    <Col span={24}>
                                        <ActionBar
                                            handleSave={handleSave}
                                            isLoading={isLoading}
                                            form={form}
                                        />
                                    </Col>
                                )}
                            </Row>
                        </>
                    )}
                />
            </Col>
        </Row>
    )
}
