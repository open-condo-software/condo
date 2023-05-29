import { BuildingUnitSubType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Row, Col, Form, FormInstance, notification } from 'antd'
import dayjs from 'dayjs'
import difference from 'lodash/difference'
import flattenDeep from 'lodash/flattenDeep'
import get from 'lodash/get'
import includes from 'lodash/includes'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import isNull from 'lodash/isNull'
import uniq from 'lodash/uniq'
import { useRouter } from 'next/router'
import { Rule } from 'rc-field-form/lib/interface'
import React, { ComponentProps, useMemo, useCallback, useState } from 'react'
import { Options as ScrollOptions } from 'scroll-into-view-if-needed'

import { useIntl } from '@open-condo/next/intl'
import { Space, Radio, RadioGroup, Alert, Typography, Tabs } from '@open-condo/ui'

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
import { RecipientCounter } from '@condo/domains/news/components/RecipientCounter'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'
import {
    NewsItemScope,
    NewsItem,
} from '@condo/domains/news/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { searchOrganizationProperty } from '@condo/domains/ticket/utils/clientSchema/search'
import { SectionNameInput } from '@condo/domains/user/components/SectionNameInput'
import { UnitNameInput, UnitNameInputOption } from '@condo/domains/user/components/UnitNameInput'

export const NewsPreview = styled(MemoizedNewsPreview)`
    color: turquoise;   
`
const CounterWrapper = styled.div`
    position: absolute;
    right: 0;
    margin: 12px;
    bottom: 0;
    padding: 2px 10px;
    background-color: black;
    border-radius: 100px;
`
const FORM_FILED_COL_PROPS = { style: { width: '100%', padding: 0 } }
export const SCROLL_TO_FIRST_ERROR_CONFIG: ScrollOptions = { behavior: 'smooth', block: 'center' }
export const SHOW_TIME_CONFIG = { defaultValue: dayjs('00:00:00:000', 'HH:mm:ss:SSS') }
export const FULL_WIDTH_STYLE: React.CSSProperties = { width: '100%' }

const getValidBeforeAfterSendAt = (form) => {
    const { sendAt, validBefore } = form.getFieldsValue(['sendAt', 'validBefore'])
    if (sendAt && validBefore) {
        const diff = dayjs(validBefore).diff(sendAt)
        if (diff < 0) return false
    }
    return true
}

const doesNotContainWordsInBrackets = (str) => {
    const regex = /\[[^\]]*\]/g
    const words = str.match(regex) || []
    return words.length === 0
}

const getBodyTemplateChanged = (form) => {
    const { body } = form.getFieldsValue(['body'])
    // NOTE: this check blocks any sending of [] in the news body
    if (!doesNotContainWordsInBrackets(body)) return false
    return true
}

const isDateDisabled = date => {
    return date.startOf('day').isBefore(dayjs().startOf('day'))
}
const isTimeDisabled = date => {
    // NOTE: doesnt guarantee that user can not select time that has already come, he can select the current time and wait until the minute has passed
    if (date && !date.isSame(dayjs(), 'day')) {
        return {
            disabledHours: () => [],
            disabledMinutes: () => [],
        }
    }
    const hour = dayjs().hour()
    const minute = dayjs().minute()
    return {
        disabledHours: () => Array.from({ length: hour }, (_, i) => i),
        disabledMinutes: () => Array.from({ length: minute }, (_, i) => i),
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
export const getBodyTemplateChangedRule: (error: string) => Rule  = (error) => (form) => {
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

const getAllSectionsUnits = (sections) => {
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
    const newsItemCountAtSameDay = allNews.filter(newsItem => sendDate.isSame(newsItem.sentAt, 'day') || sendDate.isSame(newsItem.sendAt, 'day')).length
    return newsItemCountAtSameDay
} 

const INITIAL_VALUES = {}

export const BaseNewsForm = ({
    organizationId,
    ActionBar,
    action: createOrUpdateNewsItem,
    initialValues = INITIAL_VALUES,
    templates,
    afterAction,
    newsItem: currentNewsItem,
    OnCompletedMsg,
    allNews,
}) => {
    const intl = useIntl()
    const TypeLabel = intl.formatMessage({ id: 'news.fields.type.label' })
    const CommonTypeLabel = intl.formatMessage({ id: 'news.type.common' })
    const EmergencyTypeLabel = intl.formatMessage({ id: 'news.type.emergency' })
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

    const router = useRouter()

    const { breakpoints } = useLayoutContext()
    const isMediumWindow = !breakpoints.DESKTOP_SMALL
    const propertyInfoColSpan = isMediumWindow ? 24 : 14

    const initialNewsItemScopes = useMemo(() => get(initialValues, 'newsItemScopes', []), [initialValues])
    const initialHasAllProperties = useMemo(() => get(initialValues, 'hasAllProperties', false), [initialValues])
    const initialSentAt = useMemo(() => get(initialValues, 'sentAt', null), [initialValues])
    const initialPropertyIds = useMemo(() => {
        if (initialHasAllProperties) return []

        return uniq(initialNewsItemScopes.map(item => item.property.id))
    }, [initialHasAllProperties, initialNewsItemScopes])
    const initialUnitKeys = useMemo(() => {
        if (initialHasAllProperties) return []

        return initialNewsItemScopes.map(item => {
            const unitType = item.unitType
            const unitName = item.unitName
            if (unitType && unitName) return `${unitType}-${unitName}`
        }).filter(a => a)
    }, [initialHasAllProperties, initialNewsItemScopes])
    const initialUnitNames = useMemo(() => {
        if (initialHasAllProperties) return []

        return initialNewsItemScopes.map(item => {
            const unitName = item.unitName
            if (unitName) return unitName
        }).filter(a => a)
    }, [initialHasAllProperties, initialNewsItemScopes])
    const initialUnitTypes = useMemo(() => {
        if (initialHasAllProperties) return []

        return initialNewsItemScopes.map(item => {
            const unitType = item.unitType
            if (unitType) return unitType
        }).filter(a => a)
    }, [initialHasAllProperties, initialNewsItemScopes])

    const [sendPeriod, setSendPeriod] = useState<string>(get(initialValues, 'sendPeriod', 'now'))

    const [selectedType, setSelectedType] = useState<string>(get(initialValues, 'type', NEWS_TYPE_COMMON))
    const [selectedTitle, setSelectedTitle] = useState<string>(get(initialValues, 'title', ''))
    const [selectedBody, setSelectedBody] = useState<string>(get(initialValues, 'body', ''))
    const [selectedValidBeforeText, setSelectedValidBeforeText] = useState<string>(get(initialValues, 'validBefore', null))
    const [isValidBeforeAfterSendAt, setIsValidBeforeAfterSendAt] = useState<boolean>(true)
    const [newsItemCountAtSameDay, setNewsItemCountAtSameDay] = useState(getNewsItemCountAtSameDay(null, allNews))
    const [selectedUnitNames, setSelectedUnitNames] = useState(initialUnitNames)
    const [selectedUnitTypes, setSelectedUnitTypes] = useState(initialUnitTypes)
    const [selectedPropertiesId, setSelectedPropertiesId] = useState(initialPropertyIds)
    const [selectedSectionIds, setSelectedSectionIds] = useState([])

    const softDeleteNewsItemScope = NewsItemScope.useSoftDelete()
    const createNewsItemScope = NewsItemScope.useCreate({})
    const updateNewsItem = NewsItem.useUpdate({})

    const handleSetSendDate =  useCallback((value) => {
        const newsItemCountAtSameDay = getNewsItemCountAtSameDay(value, allNews)
        setNewsItemCountAtSameDay(newsItemCountAtSameDay)
    }, [allNews])

    const handleSendPeriodChange = useCallback((form) => (e) => {
        if (e.target.value === 'now') handleSetSendDate(null)
        setSendPeriod(e.target.value)
    }, [handleSetSendDate])

    const handleTypeChange = useCallback((form) => (e) => {
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
                const sectionIds = options.map(option => get(option, 'data-sectionId'))
                setSelectedSectionIds(sectionIds)
            } else {
                setSelectedSectionIds([])
            }
        }
    }, [])

    const Title = useInputWithCounter(Input.TextArea, 150)
    const Body = useInputWithCounter(Input.TextArea, 800)

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
    
    //TODO(Kekmus) if checkbox is checked, then all id's should be there, not an empty array
    const propertyCheckboxChange = (form) => {
        return (value) => {
            if (value) setSelectedPropertiesId([])
            form.setFieldsValue({ 'unitNames': [] })
            form.setFieldsValue({ 'sectionIds': [] })
            setSelectedUnitNames([])
            setSelectedUnitTypes([])
            setSelectedSectionIds([])
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
            onChange: (propIds: any[]) => {
                form.setFieldsValue({ 'unitNames': [] })
                form.setFieldsValue({ 'sectionIds': [] })
                setSelectedPropertiesId(propIds)
                setSelectedUnitNames([])
                setSelectedUnitTypes([])
                setSelectedSectionIds([])
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
            unitNames: initialUnitKeys, 
            type: selectedType,
            title: selectedTitle,
            body: selectedBody,
            properties: selectedPropertiesId,
        }
    }, [initialValues])

    const handleFormSubmit = useCallback(async (values) => {
        if (currentNewsItem && !initialSentAt) {
            await updateNewsItem({ isPublished: false }, currentNewsItem)
        }

        console.debug('values', values)
        const { properties, hasAllProperties, sendPeriod, template, type, sendAt, validBefore, unitNames, unitTypes, sectionIds, property, ...newsItemValues } = values

        const updatedNewsItemValues = {
            validBefore: type === NEWS_TYPE_EMERGENCY ? validBefore : null,
            sendAt: sendPeriod === 'later' ? sendAt : null,
            type: type,
            ...newsItemValues,
        }

        const newsItem = await createOrUpdateNewsItem(updatedNewsItemValues)
        const newsItemId = get(newsItem, 'id')

        if (!initialHasAllProperties && !initialSentAt) {
            const deletedPropertyIds = difference(initialPropertyIds, properties)
            const newsItemScopesToDelete = initialNewsItemScopes
                .filter(newsItemScope => deletedPropertyIds.includes(newsItemScope.property.id))
            for (const newsItemScope of newsItemScopesToDelete) {
                await softDeleteNewsItemScope(newsItemScope)
            }

            if (isEmpty(deletedPropertyIds)) {
                const deletedNames = difference(initialUnitNames, unitNames)
                const newsItemScopesToDelete = initialNewsItemScopes
                    .filter(newsItemScope => deletedNames.includes(newsItemScope.unitName))
                for (const newsItemScope of newsItemScopesToDelete) {
                    await softDeleteNewsItemScope(newsItemScope)
                }

                if (deletedNames.length === initialUnitNames.length) {
                    await createNewsItemScope({ 
                        newsItem: { connect: { id: newsItemId } },
                        property: { connect: { id: initialPropertyIds[0] } },
                    })
                }
            }
        }

        const addedPropertyIds = initialSentAt ? properties : difference(properties, initialPropertyIds)
        
        if (addedPropertyIds.length === 1 && unitNames.length === unitTypes.length && unitNames.length > 0) {
            const propertyId = addedPropertyIds[0]
            
            unitNames.forEach(async (unitName, i) => {
                await createNewsItemScope({ 
                    newsItem: { connect: { id: newsItemId } },
                    property: { connect: { id: propertyId } },
                    unitName: unitName,
                    unitType: unitTypes[i],
                })
            })
        }

        if (addedPropertyIds.length === 1 && sectionIds.length > 0) {
            const propertyId = addedPropertyIds[0]
            const selectedSections = get(property, ['map', 'sections']).filter(section => includes(sectionIds, section.id))
            const allSectionsUnits = getAllSectionsUnits(selectedSections)
            const unitNames = allSectionsUnits.map(unit => unit.label)
            const unitTypes = allSectionsUnits.map(unit => unit.unitType)

            unitNames.forEach(async (unitName, i) => {
                await createNewsItemScope({ 
                    newsItem: { connect: { id: newsItemId } },
                    property: { connect: { id: propertyId } },
                    unitName: unitName,
                    unitType: unitTypes[i],
                })
            })
        }

        if (!hasAllProperties && addedPropertyIds.length === 0 && sectionIds.length > 0) {
            const propertyId = initialPropertyIds[0]
            const selectedSections = get(property, ['map', 'sections']).filter(section => includes(sectionIds, section.id))
            const allSectionsUnits = getAllSectionsUnits(selectedSections)
            const unitNames = allSectionsUnits.map(unit => unit.label)
            const unitTypes = allSectionsUnits.map(unit => unit.unitType)

            unitNames.forEach(async (unitName, i) => {
                await createNewsItemScope({ 
                    newsItem: { connect: { id: newsItemId } },
                    property: { connect: { id: propertyId } },
                    unitName: unitName,
                    unitType: unitTypes[i],
                })
            })
        }

        if (sectionIds.length === 0 && unitNames.length === 0 && unitTypes.length === 0 && !isEmpty(addedPropertyIds)) {
            for (const propertyId of addedPropertyIds) {
                await createNewsItemScope({ 
                    newsItem: { connect: { id: newsItemId } },
                    property: { connect: { id: propertyId } },
                })
            }
        }

        if (isEmpty(addedPropertyIds) && !hasAllProperties) {
            const propertyId = initialPropertyIds[0]
            const addedNames = difference(unitNames, initialUnitNames)

            addedNames.forEach(async (unitName, i) => {
                await createNewsItemScope({ 
                    newsItem: { connect: { id: newsItemId } },
                    property: { connect: { id: propertyId } },
                    unitName: unitName,
                    unitType: BuildingUnitSubType.Flat,
                })
            })
        }

        await updateNewsItem({ isPublished: true }, newsItem)

        if (!isNull(OnCompletedMsg)) {
            notification.info(OnCompletedMsg(newsItem))
        }

        if (isFunction(afterAction) && !initialSentAt) {
            await afterAction()
        } else {
            await router.push('/news')
        }
    }, [initialSentAt, currentNewsItem, createOrUpdateNewsItem, initialHasAllProperties, initialPropertyIds, updateNewsItem, OnCompletedMsg, afterAction, initialNewsItemScopes, softDeleteNewsItemScope, initialUnitNames, createNewsItemScope, router])

    const { loading: loadingProperty, obj: property } = Property.useObject({ where:{ id: selectedPropertiesId.length === 1 ? selectedPropertiesId[0] : null } })

    return (
        <Row gutter={[50, 0]}>
            <Col span={24} flex='auto'>
                <FormWithAction
                    initialValues={initialFormValues} 
                    colon={false}
                    action={handleFormSubmit}
                    OnCompletedMsg={isNull(OnCompletedMsg) ? undefined : null}
                    scrollToFirstError={SCROLL_TO_FIRST_ERROR_CONFIG}
                    formValuesToMutationDataPreprocessor={(values) => {
                        values.unitNames = selectedUnitNames
                        values.unitTypes = selectedUnitTypes
                        values.sectionIds = selectedSectionIds
                        values.property = property

                        return values
                    }}
                    children={({ handleSave, isLoading, form }) => (
                        <>
                            <Row gutter={[0, 60]}>
                                <Col span={24}>
                                    <Row gutter={[50, 0]}>
                                        <Col span={propertyInfoColSpan}>
                                            <Row gutter={[0, 40]}>
                                                <Col span={24}>
                                                    <Row>
                                                        <Col span={24}>
                                                            <Typography.Title level={2}>{MakeTextLabel}</Typography.Title>
                                                        </Col>
                                                        <Col span={12}>
                                                            <Form.Item
                                                                label={TypeLabel}
                                                                name='type'
                                                                required
                                                            >
                                                                <RadioGroup onChange={handleTypeChange(form)}>
                                                                    <Space size={24} wrap>
                                                                        <Radio value={NEWS_TYPE_COMMON}>{CommonTypeLabel}</Radio>
                                                                        <Radio value={NEWS_TYPE_EMERGENCY}>{EmergencyTypeLabel}</Radio>
                                                                    </Space>
                                                                </RadioGroup>
                                                            </Form.Item>
                                                        </Col>
                                                        {selectedType === NEWS_TYPE_EMERGENCY &&
                                                            <Col span={12}>
                                                                <Form.Item
                                                                    label={<LabelWithInfo title={ValidBeforeTitle} message={ValidBeforeLabel}/>}
                                                                    labelCol={FORM_FILED_COL_PROPS}
                                                                    name='validBefore'
                                                                    required
                                                                    rules={[finishWorkRule, commonRule]}
                                                                >
                                                                    <DatePicker
                                                                        style={FULL_WIDTH_STYLE}
                                                                        format='DD MMMM YYYY HH:mm'
                                                                        showTime={SHOW_TIME_CONFIG}
                                                                        onChange={handleValidBeforeChange(form, 'validBefore')}
                                                                        placeholder={SelectPlaceholder}
                                                                        disabledDate={isDateDisabled}
                                                                        disabledTime={isTimeDisabled}
                                                                    />
                                                                </Form.Item>
                                                            </Col>
                                                        }
                                                    </Row>
                                                </Col>
                                                {templates &&
                                                    <Row gutter={[0, 24]}>
                                                        <Col span={24}>
                                                            <Typography.Title level={4}>{SelectTextLabel}</Typography.Title>
                                                        </Col>
                                                        <Col span={24}>
                                                            <Form.Item
                                                                name='template'
                                                            >
                                                                <Tabs 
                                                                    onChange={handleTemplateChange(form, 'template')}
                                                                    items={
                                                                        Object.keys(templates).map(id => ({
                                                                            key: id,
                                                                            label: templates[id].title,
                                                                        }))
                                                                    }
                                                                />
                                                            </Form.Item>
                                                        </Col>
                                                    </Row>
                                                }
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
                                                                rows={4}
                                                                placeholder={TitlePlaceholderMessage}
                                                                onChange={handleTitleChange}
                                                            />
                                                        </Form.Item>
                                                        <CounterWrapper>
                                                            <Title.Counter type='inverted'/>
                                                        </CounterWrapper>
                                                    </Col>
                                                    <Col span={24}>
                                                        <Form.Item
                                                            label={BodyLabel}
                                                            labelCol={FORM_FILED_COL_PROPS}
                                                            name='body'
                                                            required
                                                            rules={[bodyRule, bodyTemplateChanged]}
                                                        >
                                                            <Body.InputWithCounter 
                                                                rows={7} 
                                                                placeholder={BodyPlaceholderMessage}
                                                                onChange={handleBodyChange}
                                                            />
                                                        </Form.Item>
                                                        {/* {TODO(Kekmus) fix layout of counters when field inst valid} */}
                                                        <CounterWrapper>
                                                            <Body.Counter type='inverted'/>
                                                        </CounterWrapper>
                                                    </Col>
                                                </Col>
                                            </Row>
                                        </Col>
                                        <Col span={24 - propertyInfoColSpan}>
                                            <MemoizedNewsPreview
                                                body={selectedBody}
                                                title={selectedTitle}
                                                validBefore={selectedValidBeforeText}
                                            />
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={24}>
                                    <Row gutter={[50, 0]}>
                                        <Col span={propertyInfoColSpan}>
                                            <Row gutter={[0, 24]}>
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
                                                        form={form}
                                                    />
                                                </Col>
                                                <Col span={11}>
                                                    <Form.Item
                                                        name='unitNames'
                                                        label={isNull(property) || loadingProperty || !isEmpty(selectedSectionIds) ? <LabelWithInfo title={UnitsMessage} message={UnitsLabel}/> : UnitsLabel}
                                                    >
                                                        <UnitNameInput
                                                            multiple={true}
                                                            property={property}
                                                            allowClear={false}
                                                            loading={loadingProperty || !isEmpty(selectedSectionIds)}
                                                            onChange={(_, options: UnitNameInputOption[]) => {
                                                                if (!options) {
                                                                    setSelectedUnitNames(null)
                                                                    setSelectedUnitTypes(null)
                                                                } else {
                                                                    const unitNames = options.map(option => get(option, 'data-unitName'))
                                                                    setSelectedUnitNames(unitNames)
                                                                    const unitTypes = options.map(option => get(option, 'data-unitType', BuildingUnitSubType.Flat))
                                                                    setSelectedUnitTypes(unitTypes)
                                                                }
                                                            }}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={11} offset={2}>
                                                    <Form.Item
                                                        name='sectionIds'
                                                        label={isNull(property) || loadingProperty || !isEmpty(selectedUnitNames) ? <LabelWithInfo title={SectionsMessage} message={SectionsLabel}/> : SectionsLabel}
                                                    >
                                                        <SectionNameInput
                                                            disabled={isNull(property) || loadingProperty || !isEmpty(selectedUnitNames)}
                                                            property={property}
                                                            onChange={handleChangeSectionNameInput(property)}
                                                            mode='multiple'
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </Col>
                                        <Col span={24 - propertyInfoColSpan}>
                                            <RecipientCounter
                                                newsItemScopes={initialNewsItemScopes}
                                            />
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={24}>
                                    <Row gutter={[50, 0]}>
                                        <Col span={propertyInfoColSpan}>
                                            <Row gutter={[0, 24]}>
                                                <Col span={24}>
                                                    <Typography.Title level={2}>{SelectSendPeriodLabel}</Typography.Title>
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
                                                { sendPeriod === 'later' &&
                                                    <Col span={24}>
                                                        <Form.Item
                                                            label={SendAtLabel}
                                                            labelCol={FORM_FILED_COL_PROPS}
                                                            name='sendAt'
                                                            required
                                                            rules={[commonRule]}
                                                        >
                                                            <DatePicker
                                                                style={FULL_WIDTH_STYLE}
                                                                format='DD MMMM YYYY HH:mm'
                                                                showTime={SHOW_TIME_CONFIG}
                                                                onChange={handleSendAtChange(form, 'sendAt')}
                                                                placeholder={SelectPlaceholder}
                                                                disabledDate={isDateDisabled}
                                                                disabledTime={isTimeDisabled}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                }
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
                                                            message='Мы рекомендуем отправлять не более 5 новостей в день, чтобы не докучать жителям. Лучше отложить отправку на завтра.'
                                                            description=' '
                                                        />
                                                    )
                                                }
                                            </Row>
                                        </Col>
                                    </Row>
                                </Col>
                                {
                                    isFunction(ActionBar) && (
                                        <Col span={24}>
                                            <ActionBar
                                                handleSave={handleSave}
                                                isLoading={isLoading}
                                                form={form}
                                            />
                                        </Col>
                                    )
                                }
                            </Row>
                        </>
                    )}
                />
            </Col>
        </Row>
    )
}