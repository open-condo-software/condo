import {
    CreateIncidentMutationFn,
    UpdateIncidentMutationFn,
    GetIncidentByIdQuery,
    GetIncidentPropertiesByIncidentIdQuery,
    GetIncidentClassifierIncidentByIncidentIdQuery,
    useCreateIncidentClassifierIncidentMutation,
    useCreateIncidentPropertyMutation,
    useUpdateIncidentClassifierIncidentMutation,
    useUpdateIncidentPropertyMutation,
    useGetIncidentClassifierIncidentByIncidentIdLazyQuery,
} from '@app/condo/gql'
import {
    IncidentCreateInput as IIncidentCreateInput,
    IncidentUpdateInput as IIncidentUpdateInput,
    IncidentStatusType,
    IncidentClassifier as IIncidentClassifier,
    IncidentWorkTypeType,
} from '@app/condo/schema'
import { Col, Form, FormInstance, Row, RowProps, Typography, notification, InputRef } from 'antd'
import { FormProps } from 'antd/lib/form/Form'
import { ColProps } from 'antd/lib/grid/col'
import dayjs from 'dayjs'
import difference from 'lodash/difference'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import uniq from 'lodash/uniq'
import { DefaultOptionType } from 'rc-select/lib/Select'
import React, { ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Options as ScrollOptions } from 'scroll-into-view-if-needed'

import { CheckCircle, Copy, Sparkles } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Space, Radio, RadioGroup, Input, Button, Tooltip } from '@open-condo/ui'

import AIInputNotification from '@condo/domains/ai/components/AIInputNotification'
import { FLOW_TYPES } from '@condo/domains/ai/constants'
import { useAIFlow, useAIConfig } from '@condo/domains/ai/hooks/useAIFlow'
import Select from '@condo/domains/common/components/antd/Select'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { renderDeletedOption } from '@condo/domains/common/components/GraphQlSearchInput'
import {
    GraphQlSearchInputWithCheckAll,
    InputWithCheckAllProps,
} from '@condo/domains/common/components/GraphQlSearchInputWithCheckAll'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'
import Prompt from '@condo/domains/common/components/Prompt'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { analytics } from '@condo/domains/common/utils/analytics'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'
import { INCIDENT_WORK_TYPE_SCHEDULED, INCIDENT_WORK_TYPE_EMERGENCY } from '@condo/domains/ticket/constants/incident'
import { MIN_DESCRIPTION_LENGTH } from '@condo/domains/ticket/constants/restrictions'
import { IncidentClassifiersQueryLocal, Option } from '@condo/domains/ticket/utils/clientSchema/incidentClassifierSearch'
import { searchOrganizationProperty } from '@condo/domains/ticket/utils/clientSchema/search'

import styles from './BaseIncidentForm.module.css'

import type { FormRule as Rule } from 'antd'


type FormWithActionChildrenProps = ComponentProps<ComponentProps<typeof FormWithAction>['children']>

type ActionBarProps = Pick<FormWithActionChildrenProps, 'handleSave' | 'isLoading' | 'form'>

type incidentInitialValue = Omit<GetIncidentByIdQuery['incident'], 'workStart' | 'workFinish'> & {
    workStart?: dayjs.Dayjs | null
    workFinish?: dayjs.Dayjs | null
}

export type BaseIncidentFormProps = {
    loading?: boolean
    ActionBar?: React.FC<ActionBarProps>
    initialValues?: incidentInitialValue & {
        incidentProperties: GetIncidentPropertiesByIncidentIdQuery['incidentProperties']
        incidentClassifiers: GetIncidentClassifierIncidentByIncidentIdQuery['incidentClassifierIncident']
    }
    organizationId: string
    action: (values: IIncidentCreateInput | IIncidentUpdateInput) => Promise<Awaited<ReturnType<CreateIncidentMutationFn | UpdateIncidentMutationFn>>>
    afterAction?: () => Promise<void>
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
    lg: 14,
    xl: 14,
}

type OptionType = Required<Pick<DefaultOptionType, 'label' | 'value'>>
type FilterAvailableItemsType = (props: {
    availableClassifiers: IIncidentClassifier[]
    type: 'category' | 'problem'
    selectedItems: string[]
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
                ? selectedCategories.includes(classifier?.category?.id)
                : true
        ))
        return withoutEmpty(convertToSelectOptions(ClassifierLoader.rulesToOptions(filteredClassifiers, 'problem')))
    }, [ClassifierLoader, classifiers, selectedCategories])

    const handleChangeCategories = useCallback((ids) => {
        setSelectedCategories(ids)
        if (selectedProblems.length > 0) {
            const availableClassifiers = classifiers.filter(classifier => (
                ids.includes(classifier?.category?.id)
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
            const initialCategoryIds = uniq(initialClassifiers.map(classifier => classifier?.category?.id))
            const initialProblemIds = uniq(initialClassifiers.map(classifier => classifier?.problem?.id || null).filter(Boolean))
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

const getPropertyKey = (incidentProperty: GetIncidentPropertiesByIncidentIdQuery['incidentProperties'][number]) => incidentProperty?.property?.id || `incident-property-${incidentProperty?.id}`

const INITIAL_VALUES = {} as BaseIncidentFormProps['initialValues']

const REFRESH_COPY_BUTTON_INTERVAL_IN_MS = 3000

type TextForResidentInputProps = {
    incidentForm: FormInstance
    incidentId?: string
}
export const TextForResidentInput: React.FC<TextForResidentInputProps> = ({ incidentForm, incidentId }) => {
    const intl = useIntl()

    const TextForResidentLabel = intl.formatMessage({ id: 'incident.fields.textForResident.label' })
    const TextForResidentPlaceholderMessage = intl.formatMessage({ id: 'incident.fields.textForResident.placeholder' })
    const CopyTooltipText = intl.formatMessage({ id: 'Copy' })
    const CopiedTooltipText = intl.formatMessage({ id: 'Copied' })
    const UpdateTextMessage = intl.formatMessage({ id: 'ai.improveText' })
    const GenericErrorMessage = intl.formatMessage({ id: 'ServerErrorPleaseTryAgainLater' })

    const textAreaRef = useRef<InputRef>()
    const [rewriteText, setRewriteText] = useState<string>('')
    const [copied, setCopied] = useState<boolean>()
    const [aiNotificationShow, setAiNotificationShow] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState('')

    const [runRewriteTextAIFlow, {
        loading: rewriteTextLoading,
        data: rewriteTextData,
    }] = useAIFlow<{ answer: string }>({
        flowType: FLOW_TYPES.INCIDENT_REWRITE_TEXT_FOR_RESIDENT,
        modelName: 'Incident',
        itemId: incidentId || null,
    })

    const { enabled: aiEnabled, features: {
        rewriteIncidentTextForResident: rewriteIncidentTextForResidentEnabled,
    } } = useAIConfig()

    useEffect(() => {
        setRewriteText(rewriteTextData?.answer)
    }, [rewriteTextData?.answer])

    useEffect(() => {
        if (( errorMessage || rewriteText)) {
            setAiNotificationShow(true)
        }
    }, [errorMessage, rewriteText])

    const handleRewriteNewsTextClick = useCallback(async () => {
        const context = {
            userInput: incidentForm.getFieldValue('textForResident') || '',
        }

        const id = incidentId || 'newIncident'
        analytics.track('click', {
            value: `incidentId: ${id}`,
            location: window.location.href,
            component: 'Button',
            type: 'rewrite_text',
        })

        const result = await runRewriteTextAIFlow({ context })

        if (result.error) {
            setErrorMessage(result.localizedErrorText || GenericErrorMessage)
            notification.error({ message: result.localizedErrorText || GenericErrorMessage })
        }
    }, [GenericErrorMessage, incidentForm, runRewriteTextAIFlow])

    const closeAINotification = () => {
        setAiNotificationShow(false)
        setTimeout(()=> {
            setErrorMessage('')
            setRewriteText('')
        }, 200)
    }

    const handleApplyGeneratedMessage = () => {
        const id = incidentId || 'newIncident'
        analytics.track('click', {
            value: `incidentId: ${id}`,
            type: 'apply-generated_message',
            location: window.location.href,
            component: 'Button',
        })

        textAreaRef.current.focus()

        closeAINotification()
        if (!errorMessage) incidentForm.setFieldsValue({ textForResident: rewriteText })
    }

    const handleRegenerateMessage = () => {
        const id = incidentId || 'newIncident'
        analytics.track('click', {
            value: `incidentId: ${id}`,
            type: 'regenerate_message',
            location: window.location.href,
            component: 'Button',
        })

        if (rewriteText) handleRewriteNewsTextClick()
    }

    const handleCloseAINotification = () => {
        const id = incidentId || 'newIncident'
        analytics.track('click', {
            value: `incidentId: ${id}`,
            type: 'close_ai_notification',
            location: window.location.href,
            component: 'Button',
        })

        closeAINotification()
    }

    const handleCopyClick = useCallback(async () => {
        if (copied) return

        try {
            const value = incidentForm.getFieldValue('textForResident')
            await navigator.clipboard.writeText(value)
            setCopied(true)

            setTimeout(() => setCopied(false), REFRESH_COPY_BUTTON_INTERVAL_IN_MS)
        } catch (e) {
            console.error('Unable to copy to clipboard', e)
        }
    }, [copied])

    return (
        <Form.Item
            label={TextForResidentLabel}
            shouldUpdate
            wrapperCol={FORM_ITEM_WRAPPER_COL}
        >
            {
                ({ getFieldValue }) => {
                    const value = getFieldValue('textForResident')

                    return (
                        <AIInputNotification
                            onApply={handleApplyGeneratedMessage}
                            onClose={handleCloseAINotification}
                            onUpdate={handleRegenerateMessage}
                            result={rewriteText}
                            open={aiNotificationShow}
                            errorMessage={errorMessage}
                            updateLoading={rewriteTextLoading}
                        >
                            <Form.Item
                                name='textForResident'
                                noStyle
                            >
                                <Input.TextArea
                                    ref={textAreaRef}
                                    placeholder={TextForResidentPlaceholderMessage}
                                    name='textForResident'
                                    disabled={rewriteTextLoading}
                                    maxLength={1000}
                                    autoSize={{ minRows: 2, maxRows: 5 }}
                                    className={styles.textAreaWithoutSubmit}
                                    bottomPanelUtils={[
                                        <Tooltip
                                            title={copied ? CopiedTooltipText : CopyTooltipText }
                                            placement='top'
                                            key='copyButton'
                                        >
                                            <Button
                                                minimal
                                                compact
                                                type='secondary'
                                                size='medium'
                                                disabled={!value || rewriteTextLoading}
                                                onClick={handleCopyClick}
                                                icon={copied ? (<CheckCircle size='small' />) : (<Copy size='small'/>) }
                                            />
                                        </Tooltip>,
                                        ...(
                                            aiEnabled && rewriteIncidentTextForResidentEnabled ? [
                                                <Button
                                                    key='improveButton'
                                                    compact
                                                    minimal
                                                    type='secondary'
                                                    size='medium'
                                                    disabled={!value || rewriteTextLoading}
                                                    loading={rewriteTextLoading}
                                                    icon={<Sparkles size='small' />}
                                                    onClick={handleRewriteNewsTextClick}
                                                >
                                                    {UpdateTextMessage}
                                                </Button>,
                                            ] : []
                                        ),
                                    ]}
                                />
                            </Form.Item>
                        </AIInputNotification>
                    )
                }
            }
        </Form.Item>
    )
}

const DATE_FORMAT = 'DD.MM.YYYY, HH:mm'

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
    const NotActualWorkFinishAlertTitle = intl.formatMessage({ id: 'incident.form.alert.notActualWorkFinish.title' })
    const NotActualWorkFinishAlertMessage = intl.formatMessage({ id: 'incident.form.alert.notActualWorkFinish.description' })
    const PromptTitle = intl.formatMessage({ id: 'incident.form.prompt.exit.title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'incident.form.prompt.exit.message' })
    const notAvailableMessage = intl.formatMessage({ id: 'global.notAvailable' })
    const SelectPlaceholder = intl.formatMessage({ id: 'Select' })
    const GenericErrorMessage = intl.formatMessage({ id: 'ServerErrorPleaseTryAgainLater' })

    const {
        action: createOrUpdateIncident,
        afterAction,
        ActionBar,
        initialValues = INITIAL_VALUES,
        loading,
        organizationId,
        showOrganization = false,
    } = props

    const [incidentForm] = Form.useForm()

    const { breakpoints } = useLayoutContext()
    const isSmallWindow = !breakpoints.TABLET_LARGE
    const { requiredValidator } = useValidations()

    const [createIncidentProperty] = useCreateIncidentPropertyMutation()
    const [updateIncidentProperty] = useUpdateIncidentPropertyMutation()

    const [createIncidentClassifierIncident] = useCreateIncidentClassifierIncidentMutation()
    const [updateIncidentClassifierIncident] = useUpdateIncidentClassifierIncidentMutation()

    const [fetchClassifiers] = useGetIncidentClassifierIncidentByIncidentIdLazyQuery()

    const initialIncidentOrganization = useMemo(() => initialValues?.organization?.name || null, [initialValues])
    const initialIncidentProperties = useMemo(() => initialValues?.incidentProperties || [], [initialValues])
    const initialIncidentClassifiers = useMemo(() => initialValues?.incidentClassifiers || [], [initialValues])
    const initialPropertyIds = useMemo(() => initialIncidentProperties.map(item => item?.property?.id || null).filter(Boolean), [initialIncidentProperties])
    const initialPropertyIdsWithDeleted = useMemo(() => initialIncidentProperties.map(item => getPropertyKey(item)), [initialIncidentProperties])
    const initialClassifierIds = useMemo(() => initialIncidentClassifiers.map(item => item?.classifier?.id || null), [initialIncidentClassifiers])

    const [runGenerateNewsAIFlow] = useAIFlow<{ title: string, body: string }>({
        flowType: FLOW_TYPES.GENERATE_NEWS_BY_INCIDENT,
        modelName: 'Incident',
        itemId: props?.initialValues?.id || null,
    })

    const handleFormSubmit = useCallback(async (values) => {
        const { properties, allClassifiers, categoryClassifiers, problemClassifiers, generateNews, ...incidentValues } = values

        const {
            data: incidentData,
        } = await createOrUpdateIncident(incidentValues)
        const incidentId = incidentData?.incident.id || null

        const addedPropertyIds = difference(properties, initialPropertyIdsWithDeleted)
        for (const propertyId of addedPropertyIds) {
            if (incidentId) {
                await createIncidentProperty({
                    variables: {
                        data: {
                            property: { connect: { id: propertyId } },
                            incident: { connect: { id: incidentId } },
                            sender: getClientSideSenderInfo(),
                            dv: 1,
                        },
                    },
                })
            }
        }

        const deletedPropertyIds = difference(initialPropertyIdsWithDeleted, properties)
        const incidentPropertyToDelete = initialIncidentProperties
            .filter(incidentProperty => deletedPropertyIds.includes(getPropertyKey(incidentProperty)))
        for (const incidentProperty of incidentPropertyToDelete) {
            if (incidentId) {
                await updateIncidentProperty({
                    variables: {
                        id: incidentProperty.id,
                        data: {
                            deletedAt: new Date().toISOString(),
                            sender: getClientSideSenderInfo(),
                            dv: 1,
                        },
                    },
                })
            }
        }

        const selectedClassifiersByCategoryAndProblem = allClassifiers
            .filter(classifier => categoryClassifiers.includes(classifier?.category?.id)
                && problemClassifiers.includes(classifier?.problem?.id))
        const selectedCategoryWithoutSelectedProblemIds = difference(
            categoryClassifiers,
            uniq(selectedClassifiersByCategoryAndProblem.map(classifier => classifier?.category?.id))
        )
        const selectedClassifiersWithoutProblem = allClassifiers
            .filter((classifier) =>
                !classifier?.problem?.id && selectedCategoryWithoutSelectedProblemIds.includes(classifier?.category?.id)
            )
        const selectedClassifierIds = [...selectedClassifiersByCategoryAndProblem, ...selectedClassifiersWithoutProblem]
            .map(classifier => classifier?.id)

        const addedClassifierIds = difference(selectedClassifierIds, initialClassifierIds)
        for (const classifierId of addedClassifierIds) {
            await createIncidentClassifierIncident({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        classifier: { connect: { id: classifierId } },
                        incident: { connect: { id: incidentId } },
                    },
                },
            })
        }

        const deletedClassifierIds = difference(initialClassifierIds, selectedClassifierIds)
        const incidentClassifierIncidentToDelete = initialIncidentClassifiers
            .filter(incidentClassifier => deletedClassifierIds.includes(incidentClassifier.classifier.id))
        for (const incidentClassifier of incidentClassifierIncidentToDelete) {
            await updateIncidentClassifierIncident({
                variables: {
                    id: incidentClassifier?.id,
                    data: {
                        deletedAt: new Date().toISOString(),
                        sender: getClientSideSenderInfo(),
                        dv: 1,
                    },
                },
            })
        }

        if (incidentId) {
            fetchClassifiers({
                variables: {
                    incidentId,
                },
                fetchPolicy: 'network-only',
            })
        }

        if (generateNews) {
            try {
                const selectedClassifiers = allClassifiers
                    .filter(classifier => selectedClassifierIds.includes(classifier.id))
                    .map(classifier => ({
                        category: classifier?.category?.name || '',
                        problem: classifier?.problem?.name || '',
                    }))

                const context = {
                    selectedClassifiers,
                    details: incidentValues.details,
                    textForResident: incidentValues.textForResident || '',
                    workFinish: incidentValues.workFinish ? dayjs(incidentValues.workFinish).format(DATE_FORMAT) : '',
                    workStart: incidentValues.workStart ? dayjs(incidentValues.workStart).format(DATE_FORMAT) : dayjs().format(DATE_FORMAT),
                    workType: incidentValues.workType || INCIDENT_WORK_TYPE_SCHEDULED,
                    isFinished: false,
                }

                const result = await runGenerateNewsAIFlow({ context })

                if (result.error) {
                    notification.error({ message: result.localizedErrorText || GenericErrorMessage })
                    return
                }

                let validBefore: string | undefined
                if (incidentValues.workFinish) {
                    validBefore = dayjs(incidentValues.workFinish).toISOString()
                } else if (incidentValues.workType === IncidentWorkTypeType.Emergency) {
                    validBefore = dayjs().add(7, 'days').toISOString()
                }

                const initialValue = {
                    title: result?.data?.title,
                    body: result?.data?.body,
                    propertyIds: properties,
                    hasAllProperties: incidentValues.hasAllProperties,
                    type: incidentValues.workType === INCIDENT_WORK_TYPE_EMERGENCY ? NEWS_TYPE_EMERGENCY : NEWS_TYPE_COMMON,
                    ...(validBefore ? { validBefore } : undefined),
                }
                window.open(`/news/create?initialValue=${encodeURIComponent(JSON.stringify(initialValue))}&initialStep=${encodeURIComponent(JSON.stringify(1))}`, '_blank')
            } catch (error) {
                notification.error({ message: GenericErrorMessage })
            }
        }

        if (afterAction) {
            await afterAction()
        }
    }, [runGenerateNewsAIFlow, createOrUpdateIncident, initialPropertyIdsWithDeleted, initialIncidentProperties, initialClassifierIds, initialIncidentClassifiers, createIncidentProperty, updateIncidentProperty, createIncidentClassifierIncident, updateIncidentClassifierIncident, fetchClassifiers])

    const renderPropertyOptions: InputWithCheckAllProps['selectProps']['renderOptions'] = useCallback((options, renderOption) => {
        const deletedPropertyOptions = initialIncidentProperties.map((incidentProperty) => {
            const property = {
                id: getPropertyKey(incidentProperty),
                address: incidentProperty?.property?.address || incidentProperty?.propertyAddress || null,
                addressMeta: incidentProperty?.property?.addressMeta || incidentProperty?.propertyAddressMeta || null,
                deleted: !incidentProperty?.property,
            }
            return {
                value: property?.id,
                text: property?.address,
                data: { property },
            }
        }).filter((option) => option?.data?.property?.deleted || false)

        return [...deletedPropertyOptions, ...options]
            .map((option) => option?.data?.property?.deleted
                ? renderDeletedOption(intl, option)
                : renderOption(option)
            )
    }, [initialIncidentProperties])

    const propertySelectProps: InputWithCheckAllProps['selectProps'] = useMemo(() => ({
        showArrow: false,
        infinityScroll: true,
        initialValue: initialPropertyIds,
        search: searchOrganizationProperty(organizationId),
        disabled: !organizationId,
        required: true,
        placeholder: SelectPlaceholder,
        renderOptions: renderPropertyOptions,
    }), [initialPropertyIds, organizationId, SelectPlaceholder, renderPropertyOptions])

    const propertySelectFormItemProps: InputWithCheckAllProps['selectFormItemProps'] = useMemo(() => ({
        label: PropertiesLabel,
        required: true,
        name: 'properties',
        validateFirst: true,
        wrapperCol: FORM_ITEM_WRAPPER_COL,
    }), [PropertiesLabel])

    const initialFormValues = useMemo(() => ({
        workType: null,
        ...initialValues,
        properties: initialPropertyIdsWithDeleted,
        classifiers: initialIncidentClassifiers,
    }), [initialIncidentClassifiers, initialPropertyIdsWithDeleted, initialValues])

    const commonRules = useMemo(() => [requiredValidator], [requiredValidator])
    const detailsRules = useMemo(() => [{
        whitespace: true,
        required: true,
        min: MIN_DESCRIPTION_LENGTH,
        message: DetailsErrorMessage,
    }], [DetailsErrorMessage])
    const finishWorkRules: Rule[] = useMemo(() => getFinishWorkRules(WorkFinishErrorMessage), [WorkFinishErrorMessage])

    const initialWorkFinish = useMemo(() => initialValues?.workFinish || null, [initialValues])
    const status = useMemo(() => initialValues?.status || null, [initialValues])
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
                    formInstance={incidentForm}
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
                                {
                                    showNotActualWorkFinishAlert && (
                                        <Col span={24} lg={20}>
                                            <Alert
                                                type='warning'
                                                message={NotActualWorkFinishAlertTitle}
                                                description={NotActualWorkFinishAlertMessage}
                                                showIcon
                                            />
                                        </Col>
                                    )
                                }
                                {
                                    showOrganization && initialIncidentOrganization && (
                                        <Col span={24}>
                                            <Form.Item
                                                label={OrganizationLabel}
                                                wrapperCol={FORM_ITEM_WRAPPER_COL}
                                            >
                                                {initialIncidentOrganization}
                                            </Form.Item>
                                        </Col>
                                    )
                                }
                                <Col span={24}>
                                    <GraphQlSearchInputWithCheckAll
                                        checkAllFieldName='hasAllProperties'
                                        checkAllInitialValue={initialValues?.hasAllProperties}
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
                                    <Form.Item
                                        label={DetailsLabel}
                                        name='details'
                                        required
                                        rules={detailsRules}
                                        wrapperCol={FORM_ITEM_WRAPPER_COL}
                                    >
                                        <Input.TextArea
                                            placeholder={DetailsPlaceholderMessage}
                                            name='details'
                                            maxLength={1500}
                                            autoSize={{ minRows: 2, maxRows: 5 }}
                                            className={styles.textAreaWithoutSubmit}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <TextForResidentInput
                                        incidentForm={incidentForm}
                                        incidentId={initialValues?.id || null}
                                    />
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
