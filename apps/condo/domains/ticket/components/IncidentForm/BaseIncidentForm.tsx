import React, { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react'
import { Col, Form, Row, Typography } from 'antd'
import { FormWithAction } from '../../../common/components/containers/FormList'
import { useRouter } from 'next/router'
import {
    GraphQlSearchInputWithCheckAll,
    InputWithCheckAllProps,
} from '../../../common/components/GraphQlSearchInputWithCheckAll'
import isFunction from 'lodash/isFunction'
import {
    Incident as IIncident,
    IncidentProperty as IIncidentProperty,
    IncidentTicketClassifier as IIncidentTicketClassifier,
    IncidentCreateInput as IIncidentCreateInput,
    IncidentUpdateInput as IIncidentUpdateInput,
    QueryAllIncidentsArgs as IQueryAllIncidentsArgs,
    TicketClassifier as ITicketClassifier,
} from '@app/condo/schema'
import { searchOrganizationProperty } from '../../utils/clientSchema/search'
import get from 'lodash/get'
import { useLayoutContext } from '../../../common/components/LayoutContext'
import DatePicker from '../../../common/components/Pickers/DatePicker'
import Select from '../../../common/components/antd/Select'
import { FormProps } from 'antd/lib/form/Form'
import Input from '../../../common/components/antd/Input'
import styled from '@emotion/styled'
import Checkbox from '../../../common/components/antd/Checkbox'
import { colors } from '@condo/domains/common/constants/style'
import { ClassifiersQueryLocal, Options } from '../../utils/clientSchema/classifierSearch'
import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { DefaultOptionType } from 'rc-select/lib/Select'
import { difference } from 'lodash'
import { IGenerateHooksResult } from '@open-condo/codegen/generate.hooks'
import { IncidentProperty, IncidentTicketClassifier } from '@condo/domains/ticket/utils/clientSchema'
import { Options as ScrollOptions } from 'scroll-into-view-if-needed'
import { useValidations } from '../../../common/hooks/useValidations'
import { Rule } from 'rc-field-form/lib/interface'
import dayjs from 'dayjs'
import { Loader } from '../../../common/components/Loader'
import { MIN_DESCRIPTION_LENGTH } from '../../constants/restrictions'
import { Alert } from '@open-condo/ui'
import isEmpty from 'lodash/isEmpty'


type FormWithActionChildrenProps = ComponentProps<ComponentProps<typeof FormWithAction>['children']>

type ActionBarProps = Pick<FormWithActionChildrenProps, 'handleSave' | 'isLoading' | 'form'>

type IncidentClientUtilsType = IGenerateHooksResult<IIncident, IIncidentCreateInput, IIncidentUpdateInput, IQueryAllIncidentsArgs>

export type BaseIncidentFormProps = {
    loading?: boolean
    ActionBar?: React.FC<ActionBarProps>
    initialValues?: Pick<IIncident, 'id'
    | 'workStart'
    | 'workFinish'
    | 'isEmergency'
    | 'isScheduled'
    | 'status'
    | 'details'
    | 'textForResident'
    | 'hasAllProperties'
    > & {
        incidentProperties: IIncidentProperty[],
        incidentClassifiers: IIncidentTicketClassifier[],
    }
    organizationId: string
    action: (values: IIncidentCreateInput | IIncidentUpdateInput) => ReturnType<ReturnType<IncidentClientUtilsType['useCreate' | 'useUpdate']>>
    afterAction?: (values: IIncidentCreateInput | IIncidentUpdateInput) => void
}

type FormLayoutProps = Pick<FormProps, 'labelCol' | 'wrapperCol' | 'layout' | 'labelAlign'>

type ClassifiersProps = {
    initialClassifierIds: string[]
    rules: Rule[]
} & Pick<FormWithActionChildrenProps, 'form'>

const FORM_LAYOUT_PROPS: FormLayoutProps = {
    labelCol: {
        md: 6,
        span: 24,
    },
    wrapperCol: {
        md: 18,
        span: 24,
    },
    layout: 'horizontal',
    labelAlign: 'left',
}

const TextArea = styled(Input.TextArea)`
  &.ant-input {
    min-height: 120px;
  }
`

const CheckboxFormItem = styled(Form.Item)`  
  & .ant-form-item-label {
    display: flex;
    align-items: center;
    
    & > label {
      height: initial;
    }
  }
`

const Label = styled(Typography.Text)`
  color: ${colors.textSecondary};
`

type OptionType = Required<Pick<DefaultOptionType, 'label' | 'value'>>
type FilterAvailableItemsType = (props: {
    availableClassifiers: ITicketClassifier[],
    type: 'category' | 'problem' | 'place',
    selectedItems: string[],
}) => string[]

const convertToSelectOptions: (items: Options[]) => OptionType[] = (items) => items.map(item => ({ label: item.name, value: item.id }))
const withoutEmpty: (items: OptionType[]) => OptionType[] = (items) => items.filter(item => item.value)

const Classifiers: React.FC<ClassifiersProps> = (props) => {
    const intl = useIntl()
    const SelectMessage = intl.formatMessage({ id: 'Select' })
    const PlaceClassifierLabel = intl.formatMessage({ id: 'incident.fields.placeClassifier.label' })
    const CategoryClassifierLabel = intl.formatMessage({ id: 'incident.fields.categoryClassifier.label' })
    const ProblemClassifierLabel = intl.formatMessage({ id: 'incident.fields.problemClassifier.label' })
    const LoadingLabel = intl.formatMessage({ id: 'Loading' })
    const SelectPlaceMessage = intl.formatMessage({ id: 'incident.fields.placeClassifier.placeholder' })
    const SelectCategoryMessage = intl.formatMessage({ id: 'incident.fields.categoryClassifier.placeholder' })

    const { form, initialClassifierIds, rules } = props

    const client = useApolloClient()
    const ClassifierLoader = useMemo(() => new ClassifiersQueryLocal(client), [client])

    const [classifiers, setClassifiers] = useState<ITicketClassifier[]>([])
    const [places, setPlaces] = useState<OptionType[]>([])
    const [selectedPlace, setSelectedPlace] = useState<string>(null)
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [selectedProblems, setSelectedProblems] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    const intersectionClassifiers: FilterAvailableItemsType = useCallback((props) => {
        const { availableClassifiers, type, selectedItems } = props
        const availableItems = withoutEmpty(convertToSelectOptions(ClassifierLoader.rulesToOptions(availableClassifiers, type)))
        return selectedItems.filter(id => availableItems.some(item => item.value === id))
    }, [ClassifierLoader])

    const renderCategories = useMemo(() => {
        const filteredClassifiers = classifiers.filter(classifier => (
            selectedPlace ? classifier.place.id === selectedPlace : true
        ))
        return convertToSelectOptions(ClassifierLoader.rulesToOptions(filteredClassifiers, 'category'))
    }, [ClassifierLoader, classifiers, selectedPlace])

    const renderProblems = useMemo(() => {
        const filteredClassifiers = classifiers.filter(classifier => (
            selectedPlace ? classifier.place.id === selectedPlace : true
        ) && (
            selectedCategories.length > 0
                ? selectedCategories.includes(get(classifier, 'category.id'))
                : true
        ))
        return withoutEmpty(convertToSelectOptions(ClassifierLoader.rulesToOptions(filteredClassifiers, 'problem')))
    }, [ClassifierLoader, classifiers, selectedCategories, selectedPlace])

    const handleChangePlace = useCallback((id) => {
        setSelectedPlace(id)
        if (selectedCategories.length > 0 || selectedProblems.length > 0) {
            const availableClassifiers = classifiers.filter(classifier => id ? id.includes(get(classifier, 'place.id')) : true)
            if (selectedCategories.length > 0) {
                const intersection = intersectionClassifiers({ availableClassifiers: availableClassifiers, selectedItems: selectedCategories, type: 'category' })
                setSelectedCategories(intersection)
                form.setFieldValue('categoryClassifiers', intersection)
            }
            if (selectedProblems.length > 0) {
                const intersection = intersectionClassifiers({ availableClassifiers: availableClassifiers, selectedItems: selectedProblems, type: 'problem' })
                setSelectedProblems(intersection)
                form.setFieldValue('problemClassifiers', intersection)
            }
        }
    }, [form, intersectionClassifiers, classifiers, selectedCategories, selectedProblems])

    const handleChangeCategories = useCallback((ids) => {
        setSelectedCategories(ids)
        if (selectedProblems.length > 0) {
            const availableClassifiers = classifiers.filter(classifier => (
                ids.includes(get(classifier, 'category.id'))
            ) && (
                selectedPlace === get(classifier, 'place.id')
            ))
            const intersection = intersectionClassifiers({ availableClassifiers: availableClassifiers, selectedItems: selectedProblems, type: 'problem' })
            setSelectedProblems(intersection)
            form.setFieldValue('problemClassifiers', intersection)
        }
    }, [form, intersectionClassifiers, classifiers, selectedPlace, selectedProblems])

    const handleChangeProblems = useCallback((ids) => {
        setSelectedProblems(ids)
    }, [])

    useEffect(() => {
        setLoading(true)
        ClassifierLoader.init().then(async () => {
            const classifiers = await ClassifierLoader.search('', 'rules', null, 500) as ITicketClassifier[]
            const places = ClassifierLoader.rulesToOptions(classifiers, 'place')
            const initialClassifiers = classifiers.filter(classifier => initialClassifierIds.includes(classifier.id))
            const initialPlaceId = get(initialClassifiers, [0, 'place', 'id'], null)
            const initialCategoryIds = initialClassifiers.map(classifier => get(classifier, 'category.id'))
            const initialProblemIds = initialClassifiers.map(classifier => get(classifier, 'problem.id', null)).filter(Boolean)
            setClassifiers(classifiers)
            setPlaces(convertToSelectOptions(places))
            setSelectedPlace(initialPlaceId)
            setSelectedCategories(initialCategoryIds)
            setSelectedProblems(initialProblemIds)
            form.setFieldsValue({
                allClassifiers: classifiers,
                placeClassifier: initialPlaceId,
                categoryClassifiers: initialCategoryIds,
                problemClassifiers: initialProblemIds,
            })
            setLoading(false)
        })
    }, [ClassifierLoader, form, initialClassifierIds])

    return (
        <>
            <Col span={24}>
                <Form.Item name='allClassifiers' style={{ display: 'none' }} />
                <Form.Item
                    label={PlaceClassifierLabel}
                    required
                    wrapperCol={{
                        lg: 8,
                        xl: 7,
                    }}
                    name='placeClassifier'
                    rules={rules}
                >
                    <Select<OptionType>
                        options={places}
                        disabled={loading}
                        placeholder={loading ? LoadingLabel : SelectMessage}
                        filterOption
                        optionFilterProp='label'
                        value={selectedPlace as any} // todo(DOMA-2567) fix types for select
                        onChange={handleChangePlace}
                    />
                </Form.Item>
            </Col>
            <Col span={24}>
                <Form.Item
                    label={CategoryClassifierLabel}
                    required
                    wrapperCol={{
                        lg: 8,
                        xl: 7,
                    }}
                    name='categoryClassifiers'
                    rules={rules}
                >
                    <Select<OptionType>
                        options={renderCategories}
                        mode='multiple'
                        disabled={loading || !selectedPlace}
                        placeholder={
                            loading
                                ? LoadingLabel
                                : !selectedPlace
                                    ? SelectPlaceMessage
                                    : SelectMessage
                        }
                        filterOption
                        optionFilterProp='label'
                        value={selectedCategories as any}
                        onChange={handleChangeCategories}
                        allowClear
                    />
                </Form.Item>
            </Col>
            <Col span={24}>
                <Form.Item
                    label={ProblemClassifierLabel}
                    wrapperCol={{
                        lg: 8,
                        xl: 7,
                    }}
                    name='problemClassifiers'
                >
                    <Select<OptionType>
                        options={renderProblems}
                        mode='multiple'
                        disabled={loading || !selectedPlace || selectedCategories.length < 1}
                        placeholder={
                            loading
                                ? LoadingLabel
                                : selectedCategories.length < 1
                                    ? SelectCategoryMessage
                                    : SelectMessage
                        }
                        filterOption
                        optionFilterProp='label'
                        value={selectedProblems as any}
                        onChange={handleChangeProblems}
                        allowClear
                    />
                </Form.Item>
            </Col>
        </>
    )
}

const SCROLL_TO_FIRST_ERROR_CONFIG: ScrollOptions = { behavior: 'smooth', block: 'center' }

export const BaseIncidentForm: React.FC<BaseIncidentFormProps> = (props) => {
    const intl = useIntl()
    const CheckAllLabel = intl.formatMessage({ id: 'incident.fields.properties.checkAll.label' })
    const PropertiesLabel = intl.formatMessage({ id: 'incident.fields.properties.label' })
    const WorkStartLabel = intl.formatMessage({ id: 'incident.fields.workStart.label' })
    const WorkFinishLabel = intl.formatMessage({ id: 'incident.fields.workFinish.label' })
    const WorkTypeLabel = intl.formatMessage({ id: 'incident.fields.workType.label' })
    const EmergencyTypeLabel = intl.formatMessage({ id: 'incident.workType.emergency' })
    const ScheduledTypeLabel = intl.formatMessage({ id: 'incident.workType.scheduled' })
    const DetailsLabel = intl.formatMessage({ id: 'incident.fields.details.label' })
    const DetailsPlaceholderMessage = intl.formatMessage({ id: 'incident.fields.details.placeholder' })
    const DetailsErrorMessage = intl.formatMessage({ id: 'incident.fields.details.error.length' })
    const TextForResidentLabel = intl.formatMessage({ id: 'incident.fields.textForResident.label' })
    const TextForResidentPlaceholderMessage = intl.formatMessage({ id: 'incident.fields.textForResident.placeholder' })
    const NotActualWorkFinishAlertTitle = intl.formatMessage({ id: 'incident.form.alert.notActualWorkFinish.title' })
    const NotActualWorkFinishAlertMessage = intl.formatMessage({ id: 'incident.form.alert.notActualWorkFinish.description' })

    const {
        action: createOrUpdateIncident,
        ActionBar,
        initialValues = {} as BaseIncidentFormProps['initialValues'],
        organizationId,
        loading,
        afterAction,
    } = props

    const router = useRouter()

    const { breakpoints } = useLayoutContext()
    const isSmallWindow = breakpoints.sm && !breakpoints.md || breakpoints.xs
    const { requiredValidator } = useValidations()

    const createIncidentProperty = IncidentProperty.useCreate({})
    const softDeleteIncidentProperty = IncidentProperty.useSoftDelete()

    const createIncidentTicketClassifier = IncidentTicketClassifier.useCreate({})
    const softDeleteIncidentTicketClassifier = IncidentTicketClassifier.useSoftDelete()

    const initialIncidentProperties = useMemo(() => get(initialValues, 'incidentProperties', []), [initialValues]) as IIncidentProperty[]
    const initialIncidentClassifiers = useMemo(() => get(initialValues, 'incidentClassifiers', []), [initialValues]) as IIncidentTicketClassifier[]
    console.log(initialIncidentProperties, initialIncidentClassifiers)

    const initialPropertyIds = useMemo(() => initialIncidentProperties.map(item => item.property.id), [initialIncidentProperties])
    const initialClassifierIds = useMemo(() => initialIncidentClassifiers.map(item => item.classifier.id), [initialIncidentClassifiers])

    const handleFormSubmit = useCallback(async (values) => {
        console.log(values)
        const { properties, allClassifiers, placeClassifier, categoryClassifiers, problemClassifiers, ...incidentValues } = values

        const incident = await createOrUpdateIncident(incidentValues)

        const addedPropertyIds = difference(properties, initialPropertyIds)
        for (const propertyId of addedPropertyIds) {
            await createIncidentProperty({
                property: { connect: { id: propertyId } },
                incident: { connect: { id: incident.id } },
            })
        }

        const deletedPropertyIds = difference(initialPropertyIds, properties)
        const incidentPropertyToDelete = initialIncidentProperties
            .filter(incidentProperty => deletedPropertyIds.includes(incidentProperty.property.id))
        for (const incidentProperty of incidentPropertyToDelete) {
            await softDeleteIncidentProperty(incidentProperty)
        }

        const selectedClassifierIds = allClassifiers
            .filter(classifier => (
                get(classifier, 'place.id') === placeClassifier
            ) && (
                categoryClassifiers.includes(get(classifier, 'category.id'))
            ) && (
                (problemClassifiers.length < 1 && !get(classifier, 'problem.id'))
                || problemClassifiers.includes(get(classifier, 'problem.id'))
            ))
            .map(classifier => classifier.id)

        const addedClassifierIds = difference(selectedClassifierIds, initialClassifierIds)
        for (const classifierId of addedClassifierIds) {
            await createIncidentTicketClassifier({
                classifier: { connect: { id: classifierId } },
                incident: { connect: { id: incident.id } },
            })
        }

        const deletedClassifierIds = difference(initialClassifierIds, selectedClassifierIds)
        const incidentTicketClassifiersToDelete = initialIncidentClassifiers
            .filter(incidentClassifier => deletedClassifierIds.includes(incidentClassifier.classifier.id))
        for (const incidentClassifier of incidentTicketClassifiersToDelete) {
            await softDeleteIncidentTicketClassifier(incidentClassifier)
        }

        if (isFunction(afterAction)) {
            await afterAction(incidentValues)
        } else {
            await router.push('/incident')
        }
    }, [afterAction, createIncidentProperty, createIncidentTicketClassifier, createOrUpdateIncident, initialClassifierIds, initialIncidentClassifiers, initialIncidentProperties, initialPropertyIds, router, softDeleteIncidentProperty, softDeleteIncidentTicketClassifier])

    const propertySelectProps: InputWithCheckAllProps['selectProps'] = useMemo(() => ({
        showArrow: false,
        infinityScroll: true,
        initialValue: initialPropertyIds,
        search: searchOrganizationProperty(organizationId),
        disabled: !organizationId,
        required: true,
    }), [initialPropertyIds, organizationId])

    const propertySelectFormItemProps: InputWithCheckAllProps['selectFormItemProps'] = useMemo(() => ({
        label: PropertiesLabel,
        required: true,
        name: 'properties',
        validateFirst: true,
    }), [])

    const initialFormValues = useMemo(() => ({
        ...initialValues,
        properties: initialPropertyIds,
        classifiers: initialIncidentClassifiers,
    }), [initialIncidentClassifiers, initialPropertyIds, initialValues])
    console.log({ initialFormValues, propertySelectProps })

    const commonRules = useMemo(() => [requiredValidator], [requiredValidator])
    const detailsRules = useMemo(() => [{
        whitespace: true,
        required: true,
        min: MIN_DESCRIPTION_LENGTH,
        message: DetailsErrorMessage,
    }], [])

    const initialWorkFinish = useMemo(() => get(initialValues, 'workFinish'), [initialValues])
    const showNotActualWorkFinishAlert = !isEmpty(initialValues) && initialWorkFinish && dayjs(initialWorkFinish).diff(dayjs()) < 0

    if (loading) {
        return (
            <Loader fill size='large'/>
        )
    }

    return (
        <Row gutter={[0, 40]}>
            <Col span={24} lg={24} xl={22}>
                <FormWithAction
                    initialValues={initialFormValues}
                    action={handleFormSubmit}
                    colon={false}
                    scrollToFirstError={SCROLL_TO_FIRST_ERROR_CONFIG}
                    {...FORM_LAYOUT_PROPS}
                    children={({ handleSave, isLoading, form }) => (
                        <Row gutter={[0, 40]}>
                            { showNotActualWorkFinishAlert && (
                                <Col span={24} lg={20} xl={16}>
                                    {/*todo(alllex202) add icons for alerts in ui kit*/}
                                    <Alert
                                        type='warning'
                                        message={NotActualWorkFinishAlertTitle}
                                        description={NotActualWorkFinishAlertMessage}
                                    />
                                </Col>
                            )}
                            <Col span={24}>
                                <GraphQlSearchInputWithCheckAll
                                    checkAllFieldName='hasAllProperties'
                                    checkAllInitialValue={initialValues.hasAllProperties}
                                    selectFormItemProps={propertySelectFormItemProps}
                                    selectProps={propertySelectProps}
                                    checkBoxOffset={isSmallWindow ? 0 : 6}
                                    CheckAllMessage={CheckAllLabel}
                                    form={form}
                                />
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label={WorkStartLabel}
                                    name='workStart'
                                    required
                                    wrapperCol={{
                                        lg: 8,
                                        xl: 7,
                                    }}
                                    rules={commonRules}
                                >
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        format='DD MMMM YYYY HH:mm'
                                        disabledDate={(currentDate) => {
                                            const workFinish = form.getFieldValue('workFinish')
                                            if (!workFinish) return false
                                            return dayjs(workFinish).diff(currentDate) <= 0
                                        }}
                                        showTime
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label={WorkFinishLabel}
                                    name='workFinish'
                                    wrapperCol={{
                                        lg: 8,
                                        xl: 7,
                                    }}
                                >
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        format='DD MMMM YYYY HH:mm'
                                        disabledDate={(currentDate) => {
                                            const workStart = form.getFieldValue('workStart')
                                            if (!workStart) return false
                                            return dayjs(workStart).diff(currentDate) >= 0
                                        }}
                                        showTime
                                    />
                                </Form.Item>
                            </Col>
                            <Classifiers
                                form={form}
                                initialClassifierIds={initialClassifierIds}
                                rules={commonRules}
                            />
                            <Col span={24}>
                                <Row align='middle'>
                                    <Col {...FORM_LAYOUT_PROPS.labelCol}>
                                        <Label>{WorkTypeLabel}</Label>
                                    </Col>
                                    <Col>
                                        <Row gutter={[24, 0]} align='middle'>
                                            <Col>
                                                <CheckboxFormItem
                                                    name='isEmergency'
                                                    valuePropName='checked'
                                                >
                                                    <Checkbox children={EmergencyTypeLabel}/>
                                                </CheckboxFormItem>
                                            </Col>
                                            <Col>
                                                <CheckboxFormItem
                                                    name='isScheduled'
                                                    valuePropName='checked'
                                                >
                                                    <Checkbox children={ScheduledTypeLabel}/>
                                                </CheckboxFormItem>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label={DetailsLabel}
                                    name='details'
                                    required
                                    rules={detailsRules}
                                >
                                    <TextArea maxLength={500} placeholder={DetailsPlaceholderMessage}/>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label={TextForResidentLabel}
                                    name='textForResident'
                                >
                                    <TextArea maxLength={500} placeholder={TextForResidentPlaceholderMessage} />
                                </Form.Item>
                            </Col>
                            {
                                isFunction(ActionBar)
                                && (
                                    <ActionBar
                                        handleSave={handleSave}
                                        isLoading={isLoading}
                                        form={form}
                                    />
                                )
                            }
                        </Row>
                    )}
                />
            </Col>
        </Row>
    )
}
