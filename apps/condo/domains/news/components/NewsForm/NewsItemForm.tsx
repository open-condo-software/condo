import styled from '@emotion/styled'
import { Col, Form, FormInstance, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import dayjs from 'dayjs'
import get from 'lodash/get'
import has from 'lodash/has'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isNull from 'lodash/isNull'
import transform from 'lodash/transform'
import uniq from 'lodash/uniq'
import Error from 'next/error'
import { Rule } from 'rc-field-form/lib/interface'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Options as ScrollOptions } from 'scroll-into-view-if-needed'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { getBodyTemplateChangedRule, getDateRule, getFinishWorkRule } from './BaseNewsForm'

import { NewsItemScope as INewsItemScope, NewsItemTemplate as INewsItemTemplate } from '../../../../schema'
import Input from '../../../common/components/antd/Input'
import { GraphQlSearchInput } from '../../../common/components/GraphQlSearchInput'
import {
    GraphQlSearchInputWithCheckAll,
    InputWithCheckAllProps,
} from '../../../common/components/GraphQlSearchInputWithCheckAll'
import { LabelWithInfo } from '../../../common/components/LabelWithInfo'
import { useLayoutContext } from '../../../common/components/LayoutContext'
import { TrackingEventType, useTracking } from '../../../common/components/TrackingContext'
import { useInputWithCounter } from '../../../common/hooks/useInputWithCounter'
import { useValidations } from '../../../common/hooks/useValidations'
import { PARKING_SECTION_TYPE } from '../../../property/constants/common'
import { searchOrganizationProperty } from '../../../ticket/utils/clientSchema/search'
import { SectionNameInput } from '../../../user/components/SectionNameInput'
import { UnitNameInput, UnitNameInputOption } from '../../../user/components/UnitNameInput'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '../../constants/newsTypes'
import MemoizedNewsPreview from '../NewsPreview'
import { detectTargetedSections, RecipientCounter } from '../RecipientCounter'
import { TemplatesTabs } from '../TemplatesTabs'




const NO_RESIZE_STYLE: React.CSSProperties = { resize: 'none' }
const FLEX_START_STYLE: React.CSSProperties = { alignItems: 'flex-start' }
const BIG_MARGIN_BOTTOM_STYLE: React.CSSProperties = { marginBottom: '60px' }
const MARGIN_BOTTOM_32_STYLE: React.CSSProperties = { marginBottom: '32px' }
const MARGIN_BOTTOM_38_STYLE: React.CSSProperties = { marginBottom: '38px' }
const MARGIN_BOTTOM_10_STYLE: React.CSSProperties = { marginBottom: '10px' }
const MARGIN_BOTTOM_16_STYLE: React.CSSProperties = { marginBottom: '16px' }
const MARGIN_BOTTOM_24_STYLE: React.CSSProperties = { marginBottom: '24px' }
const MARGIN_TOP_8_STYLE: React.CSSProperties = { marginTop: '8px' }
const MARGIN_RIGHT_8_STYLE: React.CSSProperties = { marginRight: '8px' }
const MARGIN_TOP_44_STYLE: React.CSSProperties = { marginTop: '44px' }
const FORM_FILED_COL_PROPS = { style: { width: '100%', padding: 0, height: '44px' } }
export const SCROLL_TO_FIRST_ERROR_CONFIG: ScrollOptions = { behavior: 'smooth', block: 'center' }
export const SHOW_TIME_CONFIG = { defaultValue: dayjs('00:00:00:000', 'HH:mm:ss:SSS') }
export const FULL_WIDTH_STYLE: React.CSSProperties = { width: '100%' }
const SMALL_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]
const EXTRA_SMALL_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 10]
const BIG_HORIZONTAL_GUTTER: [Gutter, Gutter] = [50, 0]
const ALL_SQUARE_BRACKETS_OCCURRENCES_REGEX = /\[[^\]]*?\]/g
const ADDITIONAL_DISABLED_MINUTES_COUNT = 5
const ALIGN_ITEMS_BASELINE_STYLE: React.CSSProperties = { alignItems: 'baseline' }
const CARD_CHECKBOX_CONTAINER_STYLE = { display: 'flex', width: '246px', height: '400px', marginRight: '40px' }

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

const HiddenBlock = styled.div<{ hide?: boolean }>`
  ${({ hide }) => hide ? 'display: none;' : ''}
`

interface INewsItemProps {
    onSubmit: (values) => void

    initialValues?: unknown
    
    type: string,
    validBefore: string
    
    templates: { [key: string]: Pick<INewsItemTemplate, 'title' | 'body' | 'type'> },
    totalProperties: number
    organizationId: string
}

export const NewsItemForm: React.FC<INewsItemProps> = ({ organizationId, totalProperties, type, validBefore, templates, onSubmit, initialValues, children }) => {

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
    const TemplatesLabel = intl.formatMessage({ id: 'news.fields.templates' })
    const PastTimeErrorMessage = intl.formatMessage({ id: 'global.input.error.pastTime' })
    const TimezoneMskTitle = intl.formatMessage({ id: 'timezone.msk' })
    const ProfanityInTitle = intl.formatMessage({ id: 'news.fields.profanityInTitle.error' })
    const ProfanityInBody = intl.formatMessage({ id: 'news.fields.profanityInBody.error' })
    const SelectSharingAppLabel = intl.formatMessage({ id: 'news.fields.selectSharingApp' })

    const initialNewsItemScopes: INewsItemScope[] = useMemo(() => get(initialValues, 'newsItemScopes', []), [initialValues])
    const initialHasAllProperties = useMemo(() => get(initialValues, 'hasAllProperties', false), [initialValues])
    const initialProperties = useMemo(() => get(initialValues, 'properties', []), [initialValues])
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

    const { breakpoints } = useLayoutContext()
    const isMediumWindow = !breakpoints.DESKTOP_SMALL
    const formFieldsColSpan = isMediumWindow ? 24 : 14
    const formInfoColSpan = 24 - formFieldsColSpan

    const { logEvent, getEventName } = useTracking()

    const [selectedTitle, setSelectedTitle] = useState<string>(get(initialValues, 'title', ''))
    const [selectedBody, setSelectedBody] = useState<string>(get(initialValues, 'body', ''))
    const [isValidBeforeAfterSendAt, setIsValidBeforeAfterSendAt] = useState<boolean>(true)

    const [selectedUnitNameKeys, setSelectedUnitNameKeys] = useState(initialUnitKeys)
    const [selectedPropertiesId, setSelectedPropertiesId] = useState(initialPropertyIds)
    const [isAllPropertiesChecked, setIsAllPropertiesChecked] = useState(initialHasAllProperties)
    const [selectedSectionKeys, setSelectedSectionKeys] = useState(initialSectionIds)

    //
    // const [newsItemCountAtSameDay, setNewsItemCountAtSameDay] = useState(getNewsItemCountAtSameDay(null, allNews))
    //

    const Title = useInputWithCounter(Input.TextArea, 150)
    const Body = useInputWithCounter(Input.TextArea, 800)

    const handleTitleChange = useCallback((e) => {
        setSelectedTitle(e.target.value)
    }, [])

    const handleBodyChange = useCallback((e) => {
        setSelectedBody(e.target.value)
    }, [])

    const handleTemplateChange = useCallback((form, fieldName) => (value) => {
        const templateId = value
        const title = templateId !== 'emptyTemplate' ? templates[templateId].title : ''
        const body = templateId !== 'emptyTemplate' ? templates[templateId].body : ''

        const eventName = getEventName(TrackingEventType.Click)
        const eventProperties = {
            components: { value: { title, body } },
        }
        logEvent({ eventName, eventProperties })

        form.setFieldValue('title', title)
        setSelectedTitle(title)
        Title.setTextLength(title.length)

        form.setFieldValue('body', body)
        setSelectedBody(body)
        Body.setTextLength(body.length)
    }, [Body, Title, templates])

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

    const countPropertiesAvaliableToSelect = useRef(null)
    const onlyPropertyThatCanBeSelected = useRef(null)

    const { loading: selectedPropertiesLoading, objs: selectedProperties } = Property.useAllObjects({
        where: { id_in: selectedPropertiesId },
    })

    const isOnlyOnePropertySelected: boolean = useMemo(() => (selectedPropertiesId.length === 1), [selectedPropertiesId.length])

    const newsItemForOneProperty = totalProperties === 1 && initialPropertyIds.length < 2
    const propertyIsAutoFilled = useRef(false)
    const handleAllPropertiesLoading = useCallback((form: FormInstance) => (data) => {
        if (!isEmpty(initialValues)) return
        if (!newsItemForOneProperty) return
        if (data.length !== 1) return
        if (propertyIsAutoFilled.current) return

        propertyIsAutoFilled.current = true
        const propertyId = get(data, '0.value')
        if (propertyId) {
            setSelectedPropertiesId([propertyId])
            form.setFieldsValue({
                property: propertyId,
                'properties': [propertyId],
                hasAllProperties: true,
            })
        }
    }, [initialValues, newsItemForOneProperty])

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
                setSelectedPropertiesId(!isArray(propIds) ? [propIds].filter(Boolean) : propIds)
                form.setFieldsValue({ 'unitNames': [] })
                form.setFieldsValue({ 'sectionIds': [] })
                setSelectedUnitNameKeys([])
                setSelectedSectionKeys([])
            },
        }
    }

    const propertySelectFormItemProps: InputWithCheckAllProps['selectFormItemProps'] = useMemo(() => ({
        label: PropertiesLabel,
        labelCol: FORM_FILED_COL_PROPS,
        required: true,
        name: 'properties',
        validateFirst: true,
    }), [PropertiesLabel])
    
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

    const isOnlyOnePropertySelected: boolean = useMemo(() => (selectedPropertiesId.length === 1), [selectedPropertiesId.length])

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

    const [form] = Form.useForm()

    return (
        <>
            <Form
                form={form}
                layout={'vertical'}
                onFinish={(values) => onSubmit(values)}
                initialValues={initialValues}
                //onValuesChange={handleChange}
                colon={false}
                scrollToFirstError
                // style={style}
                {/*{...formProps}*/}
            >
                <Col span={24} style={BIG_MARGIN_BOTTOM_STYLE}>
                    <Row gutter={BIG_HORIZONTAL_GUTTER}>
                        <Col span={formFieldsColSpan}>
                            <Row>
                                <Col span={24} style={MARGIN_BOTTOM_32_STYLE}>
                                    <Row gutter={EXTRA_SMALL_VERTICAL_GUTTER}>
                                        <Col span={24}>
                                            <Typography.Title level={2}>
                                                {MakeTextLabel}
                                            </Typography.Title>
                                        </Col>
                                    </Row>
                                </Col>

                                {/*Templates */}
                                {templates && (
                                    <Row gutter={SMALL_VERTICAL_GUTTER} style={MARGIN_BOTTOM_38_STYLE}>
                                        <Col span={24}>
                                            <Typography.Title level={4}>
                                                {TemplatesLabel}
                                            </Typography.Title>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                name='template'
                                            >
                                                {type === NEWS_TYPE_COMMON && (
                                                    <TemplatesTabs
                                                        onChange={handleTemplateChange(form, 'template')}
                                                        items={Object.keys(commonTemplates).map(id => ({
                                                            key: id,
                                                            label: commonTemplates[id].title,
                                                        }))}/>
                                                )}
                                                {type === NEWS_TYPE_EMERGENCY && (
                                                    <TemplatesTabs
                                                        onChange={handleTemplateChange(form, 'template')}
                                                        items={Object.keys(emergencyTemplates).map(id => ({
                                                            key: id,
                                                            label: emergencyTemplates[id].title,
                                                        }))}/>
                                                )}
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                )}

                                {/*Make text*/}
                                <Col span={24}>
                                    <Col span={24} style={MARGIN_BOTTOM_10_STYLE}>
                                        <Typography.Title level={4}>{SelectTextLabel}</Typography.Title>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            label={TitleLabel}
                                            labelCol={FORM_FILED_COL_PROPS}
                                            name='title'
                                            required
                                            rules={titleRules}
                                            data-cy='news__create-title-input'
                                        >
                                            <Title.InputWithCounter
                                                style={NO_RESIZE_STYLE}
                                                rows={4}
                                                placeholder={TitlePlaceholderMessage}
                                                onChange={handleTitleChange}/>
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
                                            data-cy='news__create-body-input'
                                        >
                                            <Body.InputWithCounter
                                                style={NO_RESIZE_STYLE}
                                                rows={7}
                                                placeholder={BodyPlaceholderMessage}
                                                onChange={handleBodyChange}/>
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
                                    appType='Doma'
                                    newsItemData={{
                                        body: selectedBody,
                                        title: selectedTitle,
                                        validBefore: type === NEWS_TYPE_EMERGENCY ? validBefore : null,
                                    }}
                                />
                            )}
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Row gutter={BIG_HORIZONTAL_GUTTER}>
                        <Col span={formFieldsColSpan}>
                            <Row gutter={EXTRA_SMALL_VERTICAL_GUTTER}>
                                <Col span={24}>
                                    <Typography.Title level={2}>{SelectAddressLabel}</Typography.Title>
                                </Col>
                                <Col span={24} data-cy='news__create-property-search'>
                                    {newsItemForOneProperty && (
                                        <Form.Item
                                            {...propertySelectFormItemProps}
                                            name='property'
                                            rules={[requiredValidator]}
                                        >
                                            <GraphQlSearchInput
                                                {...propertySelectProps(form)}
                                                onAllDataLoading={handleAllPropertiesLoading(form)}/>
                                        </Form.Item>
                                    )}
                                    <HiddenBlock hide={newsItemForOneProperty}>
                                        <GraphQlSearchInputWithCheckAll
                                            checkAllFieldName='hasAllProperties'
                                            checkAllInitialValue={get(initialValues, 'hasAllProperties', false)}
                                            selectFormItemProps={propertySelectFormItemProps}
                                            selectProps={propertySelectProps(form)}
                                            onCheckBoxChange={propertyCheckboxChange(form)}
                                            CheckAllMessage={CheckAllLabel}
                                            onDataLoaded={handleAllPropertiesDataLoading}
                                            form={form}/>
                                    </HiddenBlock>
                                </Col>
                                {isOnlyOnePropertySelected && (
                                    <>
                                        <Col span={11}>
                                            <Form.Item
                                                name='unitNames'
                                                label={selectedPropertiesLoading || !isEmpty(selectedSectionKeys)
                                                    ? (<LabelWithInfo
                                                        title={UnitsMessage}
                                                        message={UnitsLabel}/>)
                                                    : UnitsLabel}
                                            >
                                                <UnitNameInput
                                                    multiple={true}
                                                    property={selectedProperties[0]}
                                                    loading={selectedPropertiesLoading}
                                                    disabled={selectedPropertiesLoading || !isEmpty(selectedSectionKeys)}
                                                    onChange={handleChangeUnitNameInput}/>
                                            </Form.Item>
                                        </Col>
                                        <Col span={11} offset={2}>
                                            <Form.Item
                                                name='sectionIds'
                                                label={selectedPropertiesLoading || !isEmpty(selectedUnitNameKeys)
                                                    ? (<LabelWithInfo
                                                        title={SectionsMessage}
                                                        message={SectionsLabel}/>)
                                                    : SectionsLabel}
                                            >
                                                <SectionNameInput
                                                    disabled={selectedPropertiesLoading || !isEmpty(selectedUnitNameKeys)}
                                                    property={selectedProperties[0]}
                                                    onChange={handleChangeSectionNameInput(selectedProperties[0])}
                                                    mode='multiple'
                                                    data-cy='news__create-property-section-search'/>
                                            </Form.Item>
                                        </Col>
                                    </>
                                )}
                            </Row>
                        </Col>
                        <Col span={formInfoColSpan}>
                            {(newsItemScopesNoInstance.length > 0) && (
                                <RecipientCounter newsItemScopes={newsItemScopesNoInstance}/>
                            )}
                        </Col>
                    </Row>
                </Col>
            </Form>
        </>
    )
}
