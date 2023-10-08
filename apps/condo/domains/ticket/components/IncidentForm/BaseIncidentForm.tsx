import {
    Incident as IIncident,
    IncidentProperty as IIncidentProperty,
    IncidentClassifierIncident as IIncidentClassifierIncident,
    IncidentCreateInput as IIncidentCreateInput,
    IncidentUpdateInput as IIncidentUpdateInput,
    QueryAllIncidentsArgs as IQueryAllIncidentsArgs,
    IncidentStatusType,
    IncidentClassifier as IIncidentClassifier,
} from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Form, FormInstance, Row, RowProps, Typography } from 'antd'
import { FormProps } from 'antd/lib/form/Form'
import { ColProps } from 'antd/lib/grid/col'
import dayjs from 'dayjs'
import difference from 'lodash/difference'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import uniq from 'lodash/uniq'
import { useRouter } from 'next/router'
import { Rule } from 'rc-field-form/lib/interface'
import { DefaultOptionType } from 'rc-select/lib/Select'
import React, { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react'
import { Options as ScrollOptions } from 'scroll-into-view-if-needed'

import { IGenerateHooksResult } from '@open-condo/codegen/generate.hooks'
import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Space, Radio, RadioGroup } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import Select from '@condo/domains/common/components/antd/Select'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import {
    GraphQlSearchInputWithCheckAll,
    InputWithCheckAllProps,
} from '@condo/domains/common/components/GraphQlSearchInputWithCheckAll'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'
import Prompt from '@condo/domains/common/components/Prompt'
import { useInputWithCounter } from '@condo/domains/common/hooks/useInputWithCounter'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { INCIDENT_WORK_TYPE_SCHEDULED, INCIDENT_WORK_TYPE_EMERGENCY } from '@condo/domains/ticket/constants/incident'
import { MIN_DESCRIPTION_LENGTH } from '@condo/domains/ticket/constants/restrictions'
import {
    IncidentClassifierIncident,
    IncidentProperty,
} from '@condo/domains/ticket/utils/clientSchema'
import { IncidentClassifiersQueryLocal, Option } from '@condo/domains/ticket/utils/clientSchema/incidentClassifierSearch'
import { searchOrganizationProperty } from '@condo/domains/ticket/utils/clientSchema/search'


type FormWithActionChildrenProps = ComponentProps<ComponentProps<typeof FormWithAction>['children']>

type ActionBarProps = Pick<FormWithActionChildrenProps, 'handleSave' | 'isLoading' | 'form'>

type IncidentClientUtilsType = IGenerateHooksResult<IIncident, IIncidentCreateInput, IIncidentUpdateInput, IQueryAllIncidentsArgs>

export type BaseIncidentFormProps = {
    loading?: boolean
    ActionBar?: React.FC<ActionBarProps>
    initialValues?: Pick<IIncident, 'id'
    | 'workStart'
    | 'workFinish'
    | 'workType'
    | 'status'
    | 'details'
    | 'textForResident'
    | 'hasAllProperties'
    > & {
        incidentProperties: IIncidentProperty[],
        incidentClassifiers: IIncidentClassifierIncident[],
    }
    organizationId: string
    action: (values: IIncidentCreateInput | IIncidentUpdateInput) => ReturnType<ReturnType<IncidentClientUtilsType['useCreate' | 'useUpdate']>>
    afterAction?: (values: IIncidentCreateInput | IIncidentUpdateInput) => void
    showOrganization?: boolean
}

type FormLayoutProps = Pick<FormProps, 'labelCol' | 'wrapperCol' | 'layout' | 'labelAlign'>

type ClassifiersProps = {
    initialClassifierIds: string[]
    rules: Rule[]
} & Pick<FormWithActionChildrenProps, 'form'>

export const FORM_LAYOUT_PROPS: FormLayoutProps = {
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

export const FORM_ITEM_WRAPPER_COL: ColProps = {
    lg: 8,
    xl: 7,
}

export const TextArea = styled(Input.TextArea)`
  &.ant-input {
    min-height: 120px;
  }
`

type OptionType = Required<Pick<DefaultOptionType, 'label' | 'value'>>
type FilterAvailableItemsType = (props: {
    availableClassifiers: IIncidentClassifier[],
    type: 'category' | 'problem',
    selectedItems: string[],
}) => string[]

const convertToSelectOptions: (items: Option[]) => OptionType[] = (items) => items.map(item => ({ label: item.name, value: item.id }))
const withoutEmpty: (items: OptionType[]) => OptionType[] = (items) => items.filter(item => item.value)

const DISPLAY_NONE_STYLE: React.CSSProperties = { display: 'none' }

export const Classifiers: React.FC<ClassifiersProps> = (props) => {
    const intl = useIntl()
    const SelectMessage = intl.formatMessage({ id: 'Select' })
    const CategoryClassifierLabel = intl.formatMessage({ id: 'incident.fields.categoryClassifier.label' })
    const ProblemClassifierLabel = intl.formatMessage({ id: 'incident.fields.problemClassifier.label' })
    const LoadingLabel = intl.formatMessage({ id: 'Loading' })
    const SelectCategoryMessage = intl.formatMessage({ id: 'incident.fields.categoryClassifier.placeholder' })

    const { form, initialClassifierIds, rules } = props

    const client = useApolloClient()
    const ClassifierLoader = useMemo(() => new IncidentClassifiersQueryLocal(client), [client])

    const [classifiers, setClassifiers] = useState<IIncidentClassifier[]>([])
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [selectedProblems, setSelectedProblems] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    const intersectionClassifiers: FilterAvailableItemsType = useCallback((props) => {
        const { availableClassifiers, type, selectedItems } = props
        const availableItems = withoutEmpty(convertToSelectOptions(ClassifierLoader.rulesToOptions(availableClassifiers, type)))
        return selectedItems.filter(id => availableItems.some(item => item.value === id))
    }, [ClassifierLoader])

    const renderCategories = useMemo(() => {
        return convertToSelectOptions(ClassifierLoader.rulesToOptions(classifiers, 'category'))
    }, [ClassifierLoader, classifiers])

    const renderProblems = useMemo(() => {
        const filteredClassifiers = classifiers.filter(classifier => (
            selectedCategories.length > 0
                ? selectedCategories.includes(get(classifier, 'category.id'))
                : true
        ))
        return withoutEmpty(convertToSelectOptions(ClassifierLoader.rulesToOptions(filteredClassifiers, 'problem')))
    }, [ClassifierLoader, classifiers, selectedCategories])

    const handleChangeCategories = useCallback((ids) => {
        setSelectedCategories(ids)
        if (selectedProblems.length > 0) {
            const availableClassifiers = classifiers.filter(classifier => (
                ids.includes(get(classifier, 'category.id'))
            ))
            const intersection = intersectionClassifiers({ availableClassifiers: availableClassifiers, selectedItems: selectedProblems, type: 'problem' })
            setSelectedProblems(intersection)
            form.setFieldValue('problemClassifiers', intersection)
        }
    }, [form, intersectionClassifiers, classifiers, selectedProblems])

    const handleChangeProblems = useCallback((ids) => {
        setSelectedProblems(ids)
    }, [])

    const categoryPlaceholder = useMemo(() => loading ? LoadingLabel : SelectMessage, [LoadingLabel, SelectMessage, loading])
    const problemPlaceholder = useMemo(() => {
        if (loading) return LoadingLabel
        if (selectedCategories.length < 1) return SelectCategoryMessage
        return SelectMessage
    }, [LoadingLabel, SelectCategoryMessage, SelectMessage, loading, selectedCategories.length])

    useEffect(() => {
        setLoading(true)
        ClassifierLoader.init().then(async () => {
            const classifiers = await ClassifierLoader.search('', 'rules', null, 500) as IIncidentClassifier[]
            const initialClassifiers = classifiers.filter(classifier => initialClassifierIds.includes(classifier.id))
            const initialCategoryIds = uniq(initialClassifiers.map(classifier => get(classifier, 'category.id')))
            const initialProblemIds = uniq(initialClassifiers.map(classifier => get(classifier, 'problem.id', null)).filter(Boolean))
            setClassifiers(classifiers)
            setSelectedCategories(initialCategoryIds)
            setSelectedProblems(initialProblemIds)
            form.setFieldsValue({
                allClassifiers: classifiers,
                categoryClassifiers: initialCategoryIds,
                problemClassifiers: initialProblemIds,
            })
            setLoading(false)
        })
    }, [ClassifierLoader, form, initialClassifierIds])

    return (
        <>
            <Col span={24} style={DISPLAY_NONE_STYLE}>
                <Form.Item name='allClassifiers' />
            </Col>
            <Col span={24}>
                <Form.Item
                    label={CategoryClassifierLabel}
                    required
                    wrapperCol={FORM_ITEM_WRAPPER_COL}
                    name='categoryClassifiers'
                    rules={rules}
                >
                    <Select<OptionType>
                        options={renderCategories}
                        mode='multiple'
                        disabled={loading}
                        placeholder={categoryPlaceholder}
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
                    wrapperCol={FORM_ITEM_WRAPPER_COL}
                    name='problemClassifiers'
                >
                    <Select<OptionType>
                        options={renderProblems}
                        mode='multiple'
                        disabled={loading || selectedCategories.length < 1}
                        placeholder={problemPlaceholder}
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


export const FORM_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']
export const SCROLL_TO_FIRST_ERROR_CONFIG: ScrollOptions = { behavior: 'smooth', block: 'center' }
export const SHOW_TIME_CONFIG = { defaultValue: dayjs('00:00:00:000', 'HH:mm:ss:SSS') }
export const VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
export const FULL_WIDTH_STYLE: React.CSSProperties = { width: '100%' }
export const getFinishWorkRules: (error: string) => Rule[] = (error) => [(form) => {
    return {
        type: 'date',
        message: error,
        validator: () => {
            const { workStart, workFinish } = form.getFieldsValue(['workStart', 'workFinish'])
            if (workStart && workFinish) {
                const diff = dayjs(workFinish).diff(workStart)
                if (diff < 0) return Promise.reject()
            }
            return Promise.resolve()
        },
    }
}]

type handleChangeDateType = (form: FormInstance, fieldName: string) => ComponentProps<typeof DatePicker>['onChange']
export const handleChangeDate: handleChangeDateType = (form, fieldName) => (value) => {
    if (!value) return

    // NOTE: We do forced zeroing of seconds and milliseconds so that there are no problems with validation
    form.setFieldValue(fieldName, value.set('seconds', 0).set('milliseconds', 0))
}


const INITIAL_VALUES = {} as BaseIncidentFormProps['initialValues']

export const BaseIncidentForm: React.FC<BaseIncidentFormProps> = (props) => {
    const intl = useIntl()
    const CheckAllLabel = intl.formatMessage({ id: 'incident.fields.properties.checkAll.label' })
    const OrganizationLabel = intl.formatMessage({ id: 'incident.fields.organization.label' })
    const PropertiesLabel = intl.formatMessage({ id: 'incident.fields.properties.label' })
    const WorkStartLabel = intl.formatMessage({ id: 'incident.fields.workStart.label' })
    const WorkFinishLabel = intl.formatMessage({ id: 'incident.fields.workFinish.label' })
    const WorkFinishErrorMessage = intl.formatMessage({ id: 'incident.fields.workFinish.error.lessThenWorkStart' })
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
    const PromptTitle = intl.formatMessage({ id: 'incident.form.prompt.exit.title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'incident.form.prompt.exit.message' })
    const notAvailableMessage = intl.formatMessage({ id: 'global.notAvailable' })
    const SelectPlaceholder = intl.formatMessage({ id: 'Select' })

    const {
        action: createOrUpdateIncident,
        ActionBar,
        afterAction,
        initialValues = INITIAL_VALUES,
        loading,
        organizationId,
        showOrganization = false,
    } = props

    const router = useRouter()

    const { breakpoints } = useLayoutContext()
    const isSmallWindow = !breakpoints.TABLET_LARGE
    const { requiredValidator } = useValidations()
    const Details = useInputWithCounter(TextArea, 500)
    const TextForResident = useInputWithCounter(TextArea, 500)

    const createIncidentProperty = IncidentProperty.useCreate({})
    const softDeleteIncidentProperty = IncidentProperty.useSoftDelete()

    const createIncidentClassifierIncident = IncidentClassifierIncident.useCreate({})
    const softDeleteIncidentClassifierIncident = IncidentClassifierIncident.useSoftDelete()

    const initialIncidentOrganization = useMemo(() => get(initialValues, 'organization.name'), [initialValues])
    const initialIncidentProperties = useMemo(() => get(initialValues, 'incidentProperties', []), [initialValues]) as IIncidentProperty[]
    const initialIncidentClassifiers = useMemo(() => get(initialValues, 'incidentClassifiers', []), [initialValues]) as IIncidentClassifierIncident[]

    const initialPropertyIds = useMemo(() => initialIncidentProperties.map(item => get(item, 'property.id')), [initialIncidentProperties])
    const initialClassifierIds = useMemo(() => initialIncidentClassifiers.map(item => get(item, 'classifier.id')), [initialIncidentClassifiers])

    const handleFormSubmit = useCallback(async (values) => {
        const { properties, allClassifiers, categoryClassifiers, problemClassifiers, ...incidentValues } = values

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

        const selectedClassifiersByCategoryAndProblem = allClassifiers
            .filter(classifier => categoryClassifiers.includes(get(classifier, 'category.id'))
                && problemClassifiers.includes(get(classifier, 'problem.id')))
        const selectedCategoryWithoutSelectedProblemIds = difference(
            categoryClassifiers,
            uniq(selectedClassifiersByCategoryAndProblem.map(classifier => get(classifier, 'category.id')))
        )
        const selectedClassifiersWithoutProblem = allClassifiers
            .filter(classifier => !get(classifier, 'problem.id') &&
                selectedCategoryWithoutSelectedProblemIds.includes(get(classifier, 'category.id')))
        const selectedClassifierIds = [...selectedClassifiersByCategoryAndProblem, ...selectedClassifiersWithoutProblem]
            .map(classifier => get(classifier, 'id'))

        const addedClassifierIds = difference(selectedClassifierIds, initialClassifierIds)
        for (const classifierId of addedClassifierIds) {
            await createIncidentClassifierIncident({
                classifier: { connect: { id: classifierId } },
                incident: { connect: { id: incident.id } },
            })
        }

        const deletedClassifierIds = difference(initialClassifierIds, selectedClassifierIds)
        const incidentClassifierIncidentToDelete = initialIncidentClassifiers
            .filter(incidentClassifier => deletedClassifierIds.includes(incidentClassifier.classifier.id))
        for (const incidentClassifier of incidentClassifierIncidentToDelete) {
            await softDeleteIncidentClassifierIncident(incidentClassifier)
        }

        if (isFunction(afterAction)) {
            await afterAction(incidentValues)
        } else {
            await router.push('/incident')
        }
    }, [afterAction, createIncidentProperty, createIncidentClassifierIncident, createOrUpdateIncident, initialClassifierIds, initialIncidentClassifiers, initialIncidentProperties, initialPropertyIds, router, softDeleteIncidentProperty, softDeleteIncidentClassifierIncident])

    const propertySelectProps: InputWithCheckAllProps['selectProps'] = useMemo(() => ({
        showArrow: false,
        infinityScroll: true,
        initialValue: initialPropertyIds,
        search: searchOrganizationProperty(organizationId),
        disabled: !organizationId,
        required: true,
        placeholder: SelectPlaceholder,
    }), [initialPropertyIds, organizationId, SelectPlaceholder])

    const propertySelectFormItemProps: InputWithCheckAllProps['selectFormItemProps'] = useMemo(() => ({
        label: PropertiesLabel,
        required: true,
        name: 'properties',
        validateFirst: true,
    }), [PropertiesLabel])

    const initialFormValues = useMemo(() => ({
        workType: null,
        ...initialValues,
        properties: initialPropertyIds,
        classifiers: initialIncidentClassifiers,
    }), [initialIncidentClassifiers, initialPropertyIds, initialValues])

    const commonRules = useMemo(() => [requiredValidator], [requiredValidator])
    const detailsRules = useMemo(() => [{
        whitespace: true,
        required: true,
        min: MIN_DESCRIPTION_LENGTH,
        message: DetailsErrorMessage,
    }], [DetailsErrorMessage])
    const finishWorkRules: Rule[] = useMemo(() => getFinishWorkRules(WorkFinishErrorMessage), [WorkFinishErrorMessage])

    const initialWorkFinish = useMemo(() => get(initialValues, 'workFinish'), [initialValues])
    const status = useMemo(() => get(initialValues, 'status'), [initialValues])
    const showNotActualWorkFinishAlert = !isEmpty(initialValues)
        && !isEmpty(status)
        && status === IncidentStatusType.Actual
        && initialWorkFinish
        && dayjs(initialWorkFinish).diff(dayjs()) < 0

    if (loading) {
        return (
            <Loader fill size='large'/>
        )
    }

    return (
        <Row gutter={VERTICAL_GUTTER}>
            <Col span={24} lg={24} xl={22}>
                <FormWithAction
                    initialValues={initialFormValues}
                    action={handleFormSubmit}
                    colon={false}
                    scrollToFirstError={SCROLL_TO_FIRST_ERROR_CONFIG}
                    validateTrigger={FORM_VALIDATE_TRIGGER}
                    {...FORM_LAYOUT_PROPS}
                    children={({ handleSave, isLoading, form }) => (
                        <>
                            <Prompt
                                title={PromptTitle}
                                form={form}
                                handleSave={handleSave}
                            >
                                <Typography.Paragraph>
                                    {PromptHelpMessage}
                                </Typography.Paragraph>
                            </Prompt>
                            <Row gutter={VERTICAL_GUTTER}>
                                { showNotActualWorkFinishAlert && (
                                    <Col span={24} lg={20} xl={16}>
                                        <Alert
                                            type='warning'
                                            message={NotActualWorkFinishAlertTitle}
                                            description={NotActualWorkFinishAlertMessage}
                                            showIcon
                                        />
                                    </Col>
                                )}
                                {
                                    showOrganization && initialIncidentOrganization && (
                                        <Col span={24}>
                                            <Form.Item
                                                label={OrganizationLabel}
                                            >
                                                {initialIncidentOrganization}
                                            </Form.Item>
                                        </Col>
                                    )
                                }
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
                                        wrapperCol={FORM_ITEM_WRAPPER_COL}
                                        rules={commonRules}
                                    >
                                        <DatePicker
                                            style={FULL_WIDTH_STYLE}
                                            format='DD MMMM YYYY HH:mm'
                                            showTime={SHOW_TIME_CONFIG}
                                            onChange={handleChangeDate(form, 'workStart')}
                                            placeholder={SelectPlaceholder}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        label={WorkFinishLabel}
                                        name='workFinish'
                                        wrapperCol={FORM_ITEM_WRAPPER_COL}
                                        rules={finishWorkRules}
                                    >
                                        <DatePicker
                                            style={FULL_WIDTH_STYLE}
                                            format='DD MMMM YYYY HH:mm'
                                            showTime={SHOW_TIME_CONFIG}
                                            onChange={handleChangeDate(form, 'workFinish')}
                                            placeholder={SelectPlaceholder}
                                        />
                                    </Form.Item>
                                </Col>
                                <Classifiers
                                    form={form}
                                    initialClassifierIds={initialClassifierIds}
                                    rules={commonRules}
                                />
                                <Col span={24}>
                                    <Form.Item
                                        label={WorkTypeLabel}
                                        name='workType'
                                    >
                                        <RadioGroup>
                                            <Space size={isSmallWindow ? 16 : 40} wrap>
                                                <Radio value={null}>{notAvailableMessage}</Radio>
                                                <Radio value={INCIDENT_WORK_TYPE_SCHEDULED}>{ScheduledTypeLabel}</Radio>
                                                <Radio value={INCIDENT_WORK_TYPE_EMERGENCY}>{EmergencyTypeLabel}</Radio>
                                            </Space>
                                        </RadioGroup>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Row justify='end'>
                                        <Col span={24}>
                                            <Form.Item
                                                label={DetailsLabel}
                                                name='details'
                                                required
                                                rules={detailsRules}
                                            >
                                                <Details.InputWithCounter rows={4} placeholder={DetailsPlaceholderMessage} />
                                            </Form.Item>
                                        </Col>
                                        <Col>
                                            <Details.Counter />
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={24}>
                                    <Row justify='end'>
                                        <Col span={24}>
                                            <Form.Item
                                                label={TextForResidentLabel}
                                                name='textForResident'
                                            >
                                                <TextForResident.InputWithCounter rows={4} placeholder={TextForResidentPlaceholderMessage} />
                                            </Form.Item>
                                        </Col>
                                        <Col>
                                            <TextForResident.Counter />
                                        </Col>
                                    </Row>
                                </Col>
                                {
                                    isFunction(ActionBar)
                                    && (
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
