import { Ticket } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, FormInstance, Row, RowProps, Tabs } from 'antd'
import { FormItemProps } from 'antd/es'
import { SizeType } from 'antd/lib/config-provider/SizeContext'
import Form from 'antd/lib/form'
import has from 'lodash/has'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import isFunction from 'lodash/isFunction'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import pickBy from 'lodash/pickBy'
import { useRouter } from 'next/router'
import React, { createContext, CSSProperties, useCallback, useContext, useMemo, useState } from 'react'
import { Options } from 'scroll-into-view-if-needed'

import { Close, Filter } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Modal as DefaultModal, Button, Typography, Checkbox, Tooltip, Input } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import Select from '@condo/domains/common/components/antd/Select'
import { Button as CommonButton } from '@condo/domains/common/components/Button'
import { analytics } from '@condo/domains/common/utils/analytics'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { OptionType, parseQuery, QueryArgType } from '@condo/domains/common/utils/tables.utils'
import { IFilters } from '@condo/domains/ticket/utils/helpers'

import { FormWithAction } from '../components/containers/FormList'
import { DeleteButtonWithConfirmModal } from '../components/DeleteButtonWithConfirmModal'
import { GraphQlSearchInput } from '../components/GraphQlSearchInput'
import { useLayoutContext } from '../components/LayoutContext'
import { Loader } from '../components/Loader'
import DatePicker from '../components/Pickers/DatePicker'
import DateRangePicker from '../components/Pickers/DateRangePicker'
import { FILTERS_POPUP_CONTAINER_ID } from '../constants/filters'
import {
    ComponentType,
    FilterComponentSize,
    nonCustomFilterComponentType,
    FiltersMeta,
    getFiltersModalPopupContainer,
    getFiltersQueryData,
    getQueryToValueProcessorByType,
} from '../utils/filters.utils'


interface IFilterComponentProps<T> {
    name: string
    label?: string
    size?: FilterComponentSize
    queryToValueProcessor?: (a: QueryArgType) => T | T[]
    formItemProps?: FormItemProps
    filters: IFilters
    children: React.ReactNode
}

const LABEL_COL_PROPS = {
    style: {
        padding: 0,
        margin: 0,
    },
}

export type FiltersTooltipDataObject<T> = {
    name: string
    label: string
    getFilteredValue: (record: T) => string
    getTooltipValue: (record: T) => string
}

type FiltersTooltipProps<T> = {
    filters: IFilters
    tooltipData: FiltersTooltipDataObject<T>[]
    total: number
    tickets: Ticket[]
}

export const FiltersTooltip: React.FC<FiltersTooltipProps<unknown>> = ({ total, filters, tooltipData, tickets,  ...otherProps }) => {
    const rowindex = otherProps.children[0]?.props?.index
    const ticket = tickets[rowindex]

    const filteredFieldsOutOfTable = ticket && tooltipData.filter(({ name, getFilteredValue }) => {
        return !isEmpty(filters[name]) && filters[name].includes(getFilteredValue(ticket))
    })

    const getTooltipText = useCallback(() => (
        filteredFieldsOutOfTable
            .map(({ label, getTooltipValue }, index) => (
                <Typography.Paragraph key={index}>
                    <Typography.Text strong> {label}: </Typography.Text> {getTooltipValue(ticket)}
                </Typography.Paragraph>
            ))
    ), [filteredFieldsOutOfTable, ticket])

    if (total > 0 && filteredFieldsOutOfTable && filteredFieldsOutOfTable.length > 0) {
        return (
            <Tooltip title={getTooltipText()}>
                <tr {...otherProps} />
            </Tooltip>
        )
    }

    return (
        <tr {...otherProps} />
    )
}

function FilterComponent<T> ({
    name,
    label,
    size = FilterComponentSize.Large,
    queryToValueProcessor,
    formItemProps,
    filters,
    children,
}: IFilterComponentProps<T>) {
    const value = filters?.[name]
    const initialValue = queryToValueProcessor && value ? queryToValueProcessor(value) : value

    return (
        <Col span={size}>
            <Form.Item
                name={name}
                initialValue={initialValue}
                label={label}
                labelCol={LABEL_COL_PROPS}
                {...formItemProps}
            >
                {children}
            </Form.Item>
        </Col>
    )
}

const DATE_PICKER_STYLE: CSSProperties = { width: '100%' }
const DATE_RANGE_PICKER_STYLE: CSSProperties = { width: '100%' }
const DATE_PICKER_DATE_FORMAT = 'DD.MM.YYYY'
const TAGS_SELECT_STYLE: CSSProperties = { width: '100%' }
const SELECT_STYLE: CSSProperties = { width: '100%' }
const GQL_SELECT_STYLE: CSSProperties = { width: '100%' }
const TAGS_SELECT_DROPDOWN_STYLE = { display: 'none' }

export const getModalFilterComponentByMeta = (filters: IFilters, keyword: string, component: nonCustomFilterComponentType, form: FormInstance): React.ReactElement => {
    switch (component?.type) {
        case ComponentType.Input: {
            return (
                <Input
                    {...component?.props}
                />
            )
        }

        case ComponentType.Date: {
            return (
                <DatePicker
                    format={DATE_PICKER_DATE_FORMAT}
                    style={DATE_PICKER_STYLE}
                    {...component.props}
                    // It is necessary so that dropdowns do not go along with the screen when scrolling the modal window
                    getPopupContainer={getFiltersModalPopupContainer}
                />
            )
        }

        case ComponentType.Checkbox: {
            return (
                <Checkbox
                    defaultChecked={filters?.[keyword] === 'true'}
                    checked={form.getFieldValue(keyword) === 'true'}
                    onChange={event => {
                        form.setFieldsValue({ [keyword]: event?.target.checked ? String(event?.target.checked) : false })
                    }}
                    {...component.props}
                />
            )
        }

        case ComponentType.DateRange: {
            return (
                <DateRangePicker
                    format={DATE_PICKER_DATE_FORMAT}
                    style={DATE_RANGE_PICKER_STYLE}
                    separator={null}
                    {...component.props}
                    getPopupContainer={getFiltersModalPopupContainer}
                />
            )
        }

        case ComponentType.Select: {
            const options: OptionType[] = component?.options

            return (
                <Select
                    defaultValue={filters?.[keyword]}
                    style={SELECT_STYLE}
                    optionFilterProp='title'
                    {...component?.props}
                    getPopupContainer={getFiltersModalPopupContainer}
                >
                    {options.map(option => (
                        <Select.Option
                            key={option.value}
                            value={option.value}
                            title={option.label}
                        >
                            {option.label}
                        </Select.Option>
                    ))}
                </Select>
            )
        }

        case ComponentType.GQLSelect: {
            const initialData = form.getFieldValue(keyword)

            return (
                <GraphQlSearchInput
                    initialValue={initialData}
                    style={GQL_SELECT_STYLE}
                    allowClear={false}
                    {...component.props}
                    getPopupContainer={getFiltersModalPopupContainer}
                />
            )
        }

        case ComponentType.TagsSelect: {
            return (
                <Select
                    mode='tags'
                    allowClear
                    style={TAGS_SELECT_STYLE}
                    dropdownStyle={TAGS_SELECT_DROPDOWN_STYLE}
                    {...component?.props}
                />
            )
        }

        default: return
    }
}

function getModalComponents <T> (filters: IFilters, filterMetas: Array<FiltersMeta<T>>, form: FormInstance, breakpoints): React.ReactElement[] {
    if (!form) return

    return filterMetas.map(filterMeta => {
        const { keyword, component } = filterMeta

        const modalFilterComponentWrapper = component?.modalFilterComponentWrapper
        if (!modalFilterComponentWrapper) return

        const size = modalFilterComponentWrapper?.size
        const spaceSizeAfter = modalFilterComponentWrapper?.spaceSizeAfter
        const label = modalFilterComponentWrapper?.label
        const formItemProps = modalFilterComponentWrapper?.formItemProps
        const type = component?.type

        let Component
        if (component?.type === ComponentType.Custom) {
            const componentGetter = component?.modalFilterComponent
            Component = isFunction(componentGetter) ? componentGetter(form) : componentGetter
        }
        else {
            Component = getModalFilterComponentByMeta(filters, keyword, component, form)
        }

        const queryToValueProcessor = getQueryToValueProcessorByType(type)

        return (
            <>
                <FilterComponent
                    key={keyword}
                    name={keyword}
                    filters={filters}
                    size={!breakpoints.TABLET_LARGE ? 24 : size}
                    label={label}
                    formItemProps={formItemProps}
                    queryToValueProcessor={queryToValueProcessor}
                >
                    {Component}
                </FilterComponent>
                {
                    spaceSizeAfter && <Col span={spaceSizeAfter}/>
                }
            </>
        )
    })
}

interface IFilterContext {
    selectedFiltersTemplate: undefined
    setSelectedFiltersTemplate: React.Dispatch<(prevState: undefined) => undefined>
}

const FilterContext = createContext<IFilterContext>(null)

export const useMultipleFilterContext = (): IFilterContext => useContext<IFilterContext>(FilterContext)

export const MultipleFilterContextProvider: React.FC = ({ children }) => {
    const [selectedFiltersTemplate, setSelectedFiltersTemplate] = useState()

    const filterContextValue: IFilterContext = useMemo(() => ({
        selectedFiltersTemplate,
        setSelectedFiltersTemplate,
    }), [selectedFiltersTemplate])

    return (
        <FilterContext.Provider
            children={children}
            value={filterContextValue}
        />
    )
}

const FILTER_WRAPPERS_GUTTER: RowProps['gutter'] = [24, 12]
const MODAL_FORM_VALIDATE_TRIGGER: string[] = ['onBlur', 'onSubmit']
const RESET_BUTTON_CONTENT_STYLE = { display: 'flex', alignItems: 'center', gap: 4 }

type ResetFiltersModalButtonProps = {
    handleReset?: () => void
    style?: CSSProperties
    size?: SizeType
}

const ResetFiltersModalButton: React.FC<ResetFiltersModalButtonProps> = ({
    handleReset: handleResetFromProps,
    style,
    size = 'middle',
}) => {
    const intl = useIntl()
    const ClearAllFiltersMessage = intl.formatMessage({ id: 'ClearAllFilters' })
    const router = useRouter()

    const handleReset = useCallback(async () => {
        await router.replace({ query: omit(router.query, ['filters', 'sort', 'offset']) }, undefined, { shallow: true })

        if (isFunction(handleResetFromProps)) {
            await handleResetFromProps()
        }
    }, [handleResetFromProps, router])

    return (
        <CommonButton
            style={style}
            key='reset'
            type='text'
            onClick={handleReset}
            size={size}
            data-cy='common__filters-button-reset'
        >
            <div style={RESET_BUTTON_CONTENT_STYLE}>
                <Close size='medium' />
                <Typography.Text>{ClearAllFiltersMessage}</Typography.Text>
            </div>
        </CommonButton>
    )
}

const { TabPane } = Tabs
const MAIN_ROW_GUTTER: RowProps['gutter'] = [0, 10]
const SCROLL_TO_FIRST_ERROR_CONFIG: Options = { behavior: 'smooth', block: 'center' }
const NON_FIELD_ERROR_NAME = '_NON_FIELD_ERROR_'
const MOBILE_RESET_BUTTON_STYLE: CSSProperties = { paddingLeft: 12, paddingRight: 12 }
const DESKTOP_MODAL_FOOTER_GUTTER: RowProps['gutter'] = [16, 16]
const BUTTON_GROUP_GUTTER: RowProps['gutter'] = [16, 0]

type MultipleFiltersModalProps<F = unknown> = {
    isMultipleFiltersModalVisible: boolean
    setIsMultipleFiltersModalVisible: React.Dispatch<React.SetStateAction<boolean>>
    filterMetas: Array<FiltersMeta<F>>
    filtersSchemaGql?
    onReset?: () => void
    onSubmit?: (filters) => void
    detailedLogging?: Array<string>
    extraQueryParameters?: Record<string, unknown>
}

const isEqualSelectedFiltersTemplateAndFilters = (selectedFiltersTemplate, filters) => {
    const templateFilters = selectedFiltersTemplate?.fields ?? null
    if (!templateFilters) return false
    if (has(templateFilters, '__typename')) delete templateFilters['__typename']
    return isEqual(omitBy(templateFilters, isEmpty), filters)
}

const Modal: React.FC<MultipleFiltersModalProps> = ({
    isMultipleFiltersModalVisible,
    setIsMultipleFiltersModalVisible,
    filterMetas,
    filtersSchemaGql,
    onReset,
    onSubmit,
    detailedLogging,
    extraQueryParameters,
}) => {
    const intl = useIntl()
    const FiltersModalTitle = intl.formatMessage({ id: 'FiltersLabel' })
    const ApplyMessage = intl.formatMessage({ id: 'filters.Apply' })
    const NewFilterMessage = intl.formatMessage({ id: 'filters.NewFilter' })
    const TemplateMessage = intl.formatMessage({ id: 'filters.Template' })
    const NewTemplateLabel = intl.formatMessage({ id: 'filters.NewTemplateLabel' })
    const TemplateLabel = intl.formatMessage({ id: 'filters.TemplateLabel' })
    const NewTemplatePlaceholder = intl.formatMessage({ id: 'filters.NewTemplatePlaceholder' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const DeleteTitle = intl.formatMessage({ id: 'filters.DeleteTitle' })
    const DeleteMessage = intl.formatMessage({ id: 'filters.DeleteMessage' })
    const SaveTemplateMessage = intl.formatMessage({ id: 'filters.SaveTemplate' })
    const DeleteTemplateMessage = intl.formatMessage({ id: 'filters.DeleteTemplate' })
    const FieldRequiredMessage = intl.formatMessage({ id: 'field.required' })

    const router = useRouter()
    const { filters } = parseQuery(router.query)
    const searchFilter = filters?.search ?? null
    const { employee } = useOrganization()
    const { breakpoints } = useLayoutContext()

    const [form] = Form.useForm()

    const { selectedFiltersTemplate, setSelectedFiltersTemplate } = useMultipleFilterContext()
    const [openedFiltersTemplate, setOpenedFiltersTemplate] = useState<typeof filtersSchemaGql>(
        isEqualSelectedFiltersTemplateAndFilters(selectedFiltersTemplate, filters) ? selectedFiltersTemplate : null
    )

    const { objs: filtersTemplates, loading, refetch } = filtersSchemaGql.useObjects({
        sortBy: 'createdAt_ASC',
        where: {
            employee: { id: employee.id },
            deletedAt: null,
        },
    })

    const createFiltersTemplateAction = filtersSchemaGql.useCreate({
        employee: { connect: { id: employee.id } },
    }, refetch)

    const updateFiltersTemplateAction = filtersSchemaGql.useUpdate({
        employee: { connect: { id: employee.id } },
    }, refetch)

    const resetFilters = useCallback(() => {
        const keys = Object.keys(form.getFieldsValue())
        const emptyFields = keys.reduce((acc, key) => {
            acc[key] = undefined
            return acc
        }, {})

        form.setFieldsValue(emptyFields)
    }, [form])

    const showTemplateNameError = useCallback((fieldName: string) => {
        form.setFields([{ name: fieldName, errors: [FieldRequiredMessage] }])
        form.scrollToField(fieldName, SCROLL_TO_FIRST_ERROR_CONFIG)
    }, [FieldRequiredMessage, form])

    const handleSaveFiltersTemplate = useCallback(async () => {
        const { newTemplateName, existedTemplateName, ...otherValues } = form.getFieldsValue()
        const filtersValue = omitBy(otherValues, isEmpty)
        const trimmedNewTemplateName = newTemplateName && newTemplateName.trim()
        const trimmedExistedTemplateName = existedTemplateName && existedTemplateName.trim()
        if (openedFiltersTemplate && !trimmedExistedTemplateName) {
            showTemplateNameError('existedTemplateName')
            return
        }
        if (!openedFiltersTemplate && !trimmedNewTemplateName) {
            showTemplateNameError('newTemplateName')
            return
        }

        if (trimmedNewTemplateName) {
            const createdFilter = await createFiltersTemplateAction({
                name: trimmedNewTemplateName,
                fields: filtersValue,
            })
            setSelectedFiltersTemplate(createdFilter || null)
        }

        if (trimmedExistedTemplateName) {
            const updatedFilter = await updateFiltersTemplateAction({
                name: trimmedExistedTemplateName,
                fields: filtersValue,
            }, openedFiltersTemplate)
            setSelectedFiltersTemplate(updatedFilter || null)
        }

        if (filtersValue.hasOwnProperty(NON_FIELD_ERROR_NAME)) delete filtersValue[NON_FIELD_ERROR_NAME]
        await handleSubmit(filtersValue)
    }, [createFiltersTemplateAction, form, openedFiltersTemplate, setSelectedFiltersTemplate, showTemplateNameError, updateFiltersTemplateAction])

    const handleDeleteFiltersTemplate = useCallback(async () => {
        await updateFiltersTemplateAction({
            deletedAt: new Date().toDateString(),
        }, openedFiltersTemplate)

        resetFilters()
        setSelectedFiltersTemplate(null)
        setOpenedFiltersTemplate(null)
    }, [updateFiltersTemplateAction, openedFiltersTemplate, resetFilters, setSelectedFiltersTemplate])

    const handleSubmit = useCallback(async (values) => {
        const { newTemplateName, existedTemplateName, ...otherValues } = values
        const filtersValue = pickBy(otherValues)

        analytics.track('filter_changed', { location: window.location.href })

        if (searchFilter) {
            filtersValue.search = searchFilter
        }
        if (isFunction(onSubmit)) {
            onSubmit(filtersValue)
        }

        const newParameters = getFiltersQueryData(filtersValue)
        await updateQuery(router, { newParameters: { ...newParameters, ...extraQueryParameters } }, { routerAction: 'replace', shallow: true })
        setIsMultipleFiltersModalVisible(false)
    }, [searchFilter, onSubmit, router, setIsMultipleFiltersModalVisible])

    const ExistingFiltersTemplateNameInputRules = useMemo(
        () => [{ required: true, message: FieldRequiredMessage, whitespace: true }], [FieldRequiredMessage])

    const NewFiltersTemplateNameInputRules = useMemo(
        () => [{ required: false, message: FieldRequiredMessage, whitespace: true }], [FieldRequiredMessage])

    const ExistingFiltersTemplateNameInput = useCallback(() => (
        <Form.Item
            name='existedTemplateName'
            label={TemplateLabel}
            labelCol={LABEL_COL_PROPS}
            initialValue={openedFiltersTemplate?.name}
            required
            rules={ExistingFiltersTemplateNameInputRules}
        >
            <Input placeholder={NewTemplatePlaceholder} />
        </Form.Item>
    ), [ExistingFiltersTemplateNameInputRules, NewTemplatePlaceholder, TemplateLabel, openedFiltersTemplate])

    const NewFiltersTemplateNameInput = useCallback(() => (
        <Form.Item
            name='newTemplateName'
            label={NewTemplateLabel}
            labelCol={LABEL_COL_PROPS}
            rules={NewFiltersTemplateNameInputRules}
        >
            <Input placeholder={NewTemplatePlaceholder} />
        </Form.Item>
    ), [NewFiltersTemplateNameInputRules, NewTemplateLabel, NewTemplatePlaceholder])

    const handleSubmitButtonClick = useCallback(async () => {
        const values = form.getFieldsValue()
        if (values.hasOwnProperty(NON_FIELD_ERROR_NAME)) delete values[NON_FIELD_ERROR_NAME]
        await handleSubmit(values)
        setSelectedFiltersTemplate(openedFiltersTemplate)
    }, [form, handleSubmit, openedFiltersTemplate, setSelectedFiltersTemplate])

    const handleResetButtonClick = useCallback(() => {
        setOpenedFiltersTemplate(null)
        setSelectedFiltersTemplate(null)
        resetFilters()
        isFunction(onReset) && onReset()
    }, [onReset, resetFilters, setSelectedFiltersTemplate])

    const modalFooter = useMemo(() => {
        // mobile footer
        if (!breakpoints.TABLET_LARGE) {
            return [
                <ResetFiltersModalButton
                    size='large'
                    key='reset'
                    handleReset={handleResetButtonClick}
                    style={MOBILE_RESET_BUTTON_STYLE}
                />,
                openedFiltersTemplate && (
                    <DeleteButtonWithConfirmModal
                        key='delete'
                        title={DeleteTitle}
                        message={DeleteMessage}
                        okButtonLabel={DeleteLabel}
                        action={handleDeleteFiltersTemplate}
                        buttonContent={DeleteTemplateMessage}
                        showButtonIcon
                    />
                ),
                <Button
                    key='saveFilters'
                    onClick={handleSaveFiltersTemplate}
                    id='ModalFilterSaveClick'
                    type='secondary'
                >
                    {SaveTemplateMessage}
                </Button>,
                <Button
                    key='submit'
                    onClick={handleSubmitButtonClick}
                    id='ModalFilterSubmitClick'
                    type='primary'
                    data-cy='common__filters-button-submit'
                >
                    {ApplyMessage}
                </Button>,
            ]
        }

        // desktop footer
        return (
            <Row justify='end' gutter={DESKTOP_MODAL_FOOTER_GUTTER}>
                <Col>
                    <ResetFiltersModalButton
                        size='large'
                        key='reset'
                        handleReset={handleResetButtonClick}
                    />
                </Col>
                <Col>
                    <Row gutter={BUTTON_GROUP_GUTTER}>
                        {
                            openedFiltersTemplate && (
                                <Col>
                                    <DeleteButtonWithConfirmModal
                                        key='delete'
                                        title={DeleteTitle}
                                        message={DeleteMessage}
                                        okButtonLabel={DeleteLabel}
                                        action={handleDeleteFiltersTemplate}
                                    />
                                </Col>
                            )
                        }
                        <Col>
                            <Button
                                key='saveFilters'
                                onClick={handleSaveFiltersTemplate}
                                id='ModalFilterSaveClick'
                                type='secondary'
                            >
                                {SaveTemplateMessage}
                            </Button>
                        </Col>
                        <Col>
                            <Button
                                key='submit'
                                onClick={handleSubmitButtonClick}
                                id='ModalFilterSubmitClick'
                                type='primary'
                                data-cy='common__filters-button-submit'
                            >
                                {ApplyMessage}
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>
        )
    }, [ApplyMessage, DeleteLabel, DeleteMessage, DeleteTemplateMessage, DeleteTitle, SaveTemplateMessage, breakpoints.TABLET_LARGE, handleDeleteFiltersTemplate, handleResetButtonClick, handleSaveFiltersTemplate, handleSubmitButtonClick, openedFiltersTemplate])

    const handleCancelModal = useCallback(() => setIsMultipleFiltersModalVisible(false), [setIsMultipleFiltersModalVisible])

    const handleTabChange = useCallback((filtersTemplateId) => {
        const openedTemplateId = openedFiltersTemplate?.id

        if (openedTemplateId === filtersTemplateId) {
            return
        }

        if (filtersTemplateId) {
            const filtersTemplate = filtersTemplates.find(filterTemplate => filterTemplate.id === filtersTemplateId)

            setOpenedFiltersTemplate(filtersTemplate ?? null)
        }

        resetFilters()
    }, [filtersTemplates, resetFilters, openedFiltersTemplate, setOpenedFiltersTemplate])

    const tabsActiveKey = useMemo(() => openedFiltersTemplate?.id || 'newFilter', [openedFiltersTemplate])

    const templatesTabs = useMemo(() => filtersTemplates.map((filterTemplate, index) => (
        <TabPane
            tab={filterTemplate?.name || `${TemplateMessage} ${index + 1}`}
            key={filterTemplate.id}
        >
            <ExistingFiltersTemplateNameInput />
        </TabPane>
    )), [ExistingFiltersTemplateNameInput, TemplateMessage, filtersTemplates])

    const initialFormValues = useMemo(() => openedFiltersTemplate?.fields || (selectedFiltersTemplate ? {} : filters), [filters, selectedFiltersTemplate, openedFiltersTemplate])
    const modalComponents = useMemo(() => getModalComponents(pickBy(initialFormValues), filterMetas, form, breakpoints), [breakpoints, filterMetas, form, initialFormValues])

    const ModalFormItems = useCallback(() => {
        return (
            <Col span={24}>
                <Row gutter={FILTER_WRAPPERS_GUTTER} id={FILTERS_POPUP_CONTAINER_ID}>
                    {modalComponents}
                </Row>
            </Col>
        )
    }, [modalComponents])

    return (
        <DefaultModal
            title={FiltersModalTitle}
            open={isMultipleFiltersModalVisible}
            onCancel={handleCancelModal}
            footer={modalFooter}
            width='big'
            scrollX={false}
        >
            {
                !loading ? (
                    <FormWithAction
                        validateTrigger={MODAL_FORM_VALIDATE_TRIGGER}
                        handleSubmit={handleSubmit}
                        formInstance={form}
                        scrollToFirstError={SCROLL_TO_FIRST_ERROR_CONFIG}
                    >
                        {
                            () => (
                                <Row gutter={MAIN_ROW_GUTTER}>
                                    <Col span={24}>
                                        {
                                            !isEmpty(filtersTemplates) ? (
                                                <Tabs onChange={handleTabChange} activeKey={tabsActiveKey}>
                                                    <TabPane tab={NewFilterMessage} key='newFilter'>
                                                        <NewFiltersTemplateNameInput />
                                                    </TabPane>
                                                    {templatesTabs}
                                                </Tabs>
                                            ) : (
                                                <NewFiltersTemplateNameInput />
                                            )
                                        }
                                    </Col>
                                    <ModalFormItems />
                                </Row>
                            )
                        }
                    </FormWithAction>
                ) : <Loader />
            }
        </DefaultModal>
    )
}

export const useAppliedFiltersCount = (): number => {
    const router = useRouter()
    const { filters } = useMemo(() => parseQuery(router.query), [router.query])
    const reduceNonEmpty = useCallback((cnt, filter) => cnt + Number((typeof filters[filter] === 'string' || Array.isArray(filters[filter])) && filters[filter].length > 0), [filters])
    return useMemo(() => Object.keys(filters).reduce(reduceNonEmpty, 0), [filters, reduceNonEmpty])
}

const AppliedFiltersCounter = styled.div`
  width: 23px;
  height: 22px;
  border-radius: 100px;
  color: ${colors.gray[1]};
  background-color: ${colors.pink[5]};
  border: 3px solid ${colors.gray[1]};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  position: absolute;
  right: -10px;
  top: -10px;
  box-sizing: content-box;
  z-index: 10;
`

const FILTERS_BUTTON_WRAPPER_STYLES: CSSProperties = { position: 'relative' }

const FiltersButton = ({ setIsMultipleFiltersModalVisible }) => {
    const intl = useIntl()
    const FiltersButtonLabel = intl.formatMessage({ id: 'FiltersLabel' })

    const appliedFiltersCount = useAppliedFiltersCount()

    const handleOpenMultipleFilter = useCallback(() => {
        setIsMultipleFiltersModalVisible(true)
    }, [setIsMultipleFiltersModalVisible])

    return (
        <div style={FILTERS_BUTTON_WRAPPER_STYLES}>
            <Button
                type='secondary'
                onClick={handleOpenMultipleFilter}
                icon={<Filter size='medium'/>}
                data-cy='ticket__filters-button'
                children={FiltersButtonLabel}
            />
            {
                appliedFiltersCount > 0 ? (
                    <AppliedFiltersCounter>
                        {appliedFiltersCount}
                    </AppliedFiltersCounter>
                ) : null
            }
        </div>
    )
}

type UseMultipleFiltersModalInput<F = unknown> = Pick<MultipleFiltersModalProps,
'filtersSchemaGql'
| 'onReset'
| 'onSubmit'
| 'detailedLogging'
| 'extraQueryParameters'> & { filterMetas: Array<FiltersMeta<F>> }

type UseMultipleFiltersModalOutput = {
    MultipleFiltersModal: React.FC
    ResetFiltersModalButton: typeof ResetFiltersModalButton
    OpenFiltersButton: React.FC
    appliedFiltersCount: number
}

export function useMultipleFiltersModal <F> ({
    filterMetas,
    filtersSchemaGql,
    onReset,
    onSubmit,
    detailedLogging = [],
    extraQueryParameters,
}: UseMultipleFiltersModalInput<F>): UseMultipleFiltersModalOutput {
    const [isMultipleFiltersModalVisible, setIsMultipleFiltersModalVisible] = useState<boolean>()

    const appliedFiltersCount = useAppliedFiltersCount()

    const MultipleFiltersModal = useCallback(() => (
        <Modal
            isMultipleFiltersModalVisible={isMultipleFiltersModalVisible}
            setIsMultipleFiltersModalVisible={setIsMultipleFiltersModalVisible}
            filterMetas={filterMetas}
            filtersSchemaGql={filtersSchemaGql}
            onReset={onReset}
            onSubmit={onSubmit}
            detailedLogging={detailedLogging}
            extraQueryParameters={extraQueryParameters}
        />
    ), [detailedLogging, filterMetas, filtersSchemaGql, isMultipleFiltersModalVisible, onReset, onSubmit, extraQueryParameters])

    const ResetFilterButton = useCallback((props) => (
        <ResetFiltersModalButton handleReset={onReset} {...props} />
    ), [onReset])

    const OpenFiltersButton = useCallback(() => (
        <FiltersButton setIsMultipleFiltersModalVisible={setIsMultipleFiltersModalVisible} />
    ), [])

    return useMemo(() => ({ MultipleFiltersModal, ResetFiltersModalButton: ResetFilterButton, OpenFiltersButton, appliedFiltersCount }), [MultipleFiltersModal, OpenFiltersButton, ResetFilterButton, appliedFiltersCount])
}
