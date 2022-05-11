import { SizeType } from 'antd/lib/config-provider/SizeContext'
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Form from 'antd/lib/form'
import {
    Checkbox,
    Col,
    FormInstance,
    Input,
    Row,
    Select,
    Tabs,
    Typography,
    Modal as DefaultModal,
    ModalProps,
} from 'antd'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'
import { FormItemProps } from 'antd/es'
import { CloseOutlined } from '@ant-design/icons'
import { Gutter } from 'antd/es/grid/row'
import isFunction from 'lodash/isFunction'
import isEmpty from 'lodash/isEmpty'
import pickBy from 'lodash/pickBy'
import { useOrganization } from '@core/next/organization'

import {
    OptionType,
    parseQuery,
    QueryArgType,
} from '@condo/domains/common/utils/tables.utils'
import { IFilters } from '@condo/domains/ticket/utils/helpers'

import DatePicker from '../components/Pickers/DatePicker'
import DateRangePicker from '../components/Pickers/DateRangePicker'
import { GraphQlSearchInput } from '../components/GraphQlSearchInput'
import { Button } from '../components/Button'
import { FormWithAction } from '../components/containers/FormList'
import { Loader } from '../components/Loader'
import { DeleteButtonWithConfirmModal } from '../components/DeleteButtonWithConfirmModal'
import { FILTERS_POPUP_CONTAINER_ID } from '../constants/filters'
import {
    ComponentType,
    FilterComponentType,
    FiltersMeta,
    getFiltersModalPopupContainer,
    getQueryToValueProcessorByType,
    updateQuery,
} from '../utils/filters.utils'
import { colors } from '../constants/style'
import { Tooltip } from '../components/Tooltip'
import { SelectStyled } from '../components/SelectStyled'

enum FilterComponentSize {
    Medium = 12,
    Large = 24,
}

interface IFilterComponentProps<T> {
    name: string
    label?: string
    size?: FilterComponentSize
    queryToValueProcessor?: (a: QueryArgType) => T | T[],
    formItemProps?: FormItemProps
    filters: IFilters,
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
    rowObject: T
    total: number
}

const TOOLTIP_PARAGRAPH_STYLE: CSSProperties = { color: colors.white, margin: 0 }
const TOOLTIP_TEXT_STYLE: CSSProperties = { color: colors.white }

export const FiltersTooltip: React.FC<FiltersTooltipProps<unknown>> = ({ total, filters, tooltipData, rowObject, ...otherProps }) => {
    const filteredFieldsOutOfTable = rowObject && tooltipData.filter(({ name, getFilteredValue }) => {
        return !isEmpty(filters[name]) && filters[name].includes(getFilteredValue(rowObject))
    })
    const getTooltipText = useCallback(() => (
        filteredFieldsOutOfTable
            .map(({ label, getTooltipValue }, index) => (
                <Typography.Paragraph style={TOOLTIP_PARAGRAPH_STYLE} key={index}>
                    <Typography.Text style={TOOLTIP_TEXT_STYLE} strong> {label}: </Typography.Text> {getTooltipValue(rowObject)}
                </Typography.Paragraph>
            ))
    ), [filteredFieldsOutOfTable, rowObject])

    const [isTooltipVisible, setIsTooltipVisible] = useState<boolean>(false)

    return total > 0 && filteredFieldsOutOfTable && filteredFieldsOutOfTable.length > 0 ? (
        <>
            <Tooltip
                visible={isTooltipVisible}
                title={getTooltipText()}
                color={colors.black}
            >
                <tr
                    {...otherProps}
                    onMouseMove={() => {
                        setIsTooltipVisible(true)
                    }}
                    onMouseLeave={() => {
                        setIsTooltipVisible(false)
                    }}
                />
            </Tooltip>
        </>
    ) : <tr {...otherProps} />
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
    const value = get(filters, name)
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
const TAGS_SELECT_DROPDOWN_STYLE = { display: 'none' }

export const getModalFilterComponentByMeta = (filters: IFilters, keyword: string, component: FilterComponentType, form: FormInstance): React.ReactElement => {
    const type = get(component, 'type')
    const props = {
        // It is necessary so that dropdowns do not go along with the screen when scrolling the modal window
        getPopupContainer: getFiltersModalPopupContainer,
        ...get(component, 'props', {}),
    }

    switch (type) {
        case ComponentType.Input: {
            return (
                <Input
                    {...props}
                />
            )
        }

        case ComponentType.Date: {
            return (
                <DatePicker
                    format={DATE_PICKER_DATE_FORMAT}
                    style={DATE_PICKER_STYLE}
                    {...props}
                />
            )
        }

        case ComponentType.CheckboxGroup: {
            const options: OptionType[] = get(component, 'options')

            return (
                <Checkbox.Group
                    options={options}
                    {...props}
                />
            )
        }

        case ComponentType.DateRange: {
            return (
                <DateRangePicker
                    format={DATE_PICKER_DATE_FORMAT}
                    style={DATE_RANGE_PICKER_STYLE}
                    separator={null}
                    {...props}
                />
            )
        }

        case ComponentType.Select: {
            const options: OptionType[] = get(component, 'options')

            return (
                <SelectStyled
                    defaultValue={get(filters, keyword)}
                    optionFilterProp={'title'}
                    raisedClearButton
                    {...props}
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
                </SelectStyled>
            )
        }

        case ComponentType.GQLSelect: {
            const initialData = form.getFieldValue(keyword)

            return (
                <GraphQlSearchInput
                    initialValue={initialData}
                    {...props}
                />
            )
        }

        case ComponentType.TagsSelect: {
            return (
                <SelectStyled
                    mode="tags"
                    allowClear
                    style={TAGS_SELECT_STYLE}
                    dropdownStyle={TAGS_SELECT_DROPDOWN_STYLE}
                    {...props}
                />
            )
        }

        default: return
    }
}

function getModalComponents <T> (filters: IFilters, filterMetas: Array<FiltersMeta<T>>, form: FormInstance): React.ReactElement[] {
    if (!form) return

    return filterMetas.map(filterMeta => {
        const { keyword, component } = filterMeta

        const modalFilterComponentWrapper = get(component, 'modalFilterComponentWrapper')
        if (!modalFilterComponentWrapper) return

        const size = get(modalFilterComponentWrapper, 'size')
        const label = get(modalFilterComponentWrapper, 'label')
        const formItemProps = get(modalFilterComponentWrapper, 'formItemProps')
        const type = get(component, 'type')

        let Component
        if (type === ComponentType.Custom) {
            const componentGetter = get(component, 'modalFilterComponent')
            Component = isFunction(componentGetter) ? componentGetter(form) : componentGetter
        }
        else
            Component = getModalFilterComponentByMeta(filters, keyword, component, form)

        const queryToValueProcessor = getQueryToValueProcessorByType(type)

        return (
            <FilterComponent
                key={keyword}
                name={keyword}
                filters={filters}
                size={size}
                label={label}
                formItemProps={formItemProps}
                queryToValueProcessor={queryToValueProcessor}
            >
                {Component}
            </FilterComponent>
        )
    })
}

const RESET_FILTERS_BUTTON_STYLE: CSSProperties = { position: 'absolute', left: '10px' }
const MODAL_PROPS: ModalProps = { width: 840 }
const CLEAR_ALL_MESSAGE_STYLE: CSSProperties = { fontSize: '12px' }
const FILTER_WRAPPERS_GUTTER: [Gutter, Gutter] = [24, 12]
const MODAL_FORM_VALIDATE_TRIGGER: string[] = ['onBlur', 'onSubmit']
const TAB_STYLE = { paddingTop: 20 }

type ResetFiltersModalButtonProps = {
    handleReset?: () => void
    style?: CSSProperties
    size?: SizeType
}

const ResetFiltersModalButton: React.FC<ResetFiltersModalButtonProps> = ({
    handleReset: handleResetFromProps,
    style,
    size = 'large',
}) => {
    const intl = useIntl()
    const ClearAllFiltersMessage = intl.formatMessage({ id: 'ClearAllFilters' })
    const router = useRouter()

    const handleReset = useCallback(async () => {
        await updateQuery(router, {})

        if (isFunction(handleResetFromProps)) {
            await handleResetFromProps()
        }
    }, [handleResetFromProps, router])

    return (
        <Button
            style={style}
            key={'reset'}
            type={'text'}
            onClick={handleReset}
            size={size}
            data-cy={'common__filters-button-reset'}
        >
            <Typography.Text strong type={'secondary'}>
                {ClearAllFiltersMessage} <CloseOutlined style={CLEAR_ALL_MESSAGE_STYLE} />
            </Typography.Text>
        </Button>
    )
}

const { TabPane } = Tabs
const MAIN_ROW_GUTTER: [Gutter, Gutter] = [0, 10]

type MultipleFiltersModalProps = {
    isMultipleFiltersModalVisible: boolean
    setIsMultipleFiltersModalVisible: React.Dispatch<React.SetStateAction<boolean>>
    filterMetas: Array<FiltersMeta<unknown>>
    filtersSchemaGql?
}

const Modal: React.FC<MultipleFiltersModalProps> = ({
    isMultipleFiltersModalVisible,
    setIsMultipleFiltersModalVisible,
    filterMetas,
    filtersSchemaGql,
}) => {
    const intl = useIntl()
    const FiltersModalTitle = intl.formatMessage({ id: 'FiltersLabel' })
    const ApplyMessage = intl.formatMessage({ id: 'filters.Apply' })
    const NewFilterMessage = intl.formatMessage({ id: 'filters.NewFilter' })
    const TemplateMessage = intl.formatMessage({ id: 'filters.Template' })
    const NewTemplateLabel = intl.formatMessage({ id: 'filters.NewTemplateLabel' })
    const NewTemplatePlaceholder = intl.formatMessage({ id: 'filters.NewTemplatePlaceholder' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const DeleteTitle = intl.formatMessage({ id: 'filters.DeleteTitle' })
    const DeleteMessage = intl.formatMessage({ id: 'filters.DeleteMessage' })
    const SaveTemplateMessage = intl.formatMessage({ id: 'filters.SaveTemplate' })

    const [selectedFiltersTemplate, setSelectedFiltersTemplate] = useState()
    const [isSaveFiltersTemplateButtonDisabled, setIsSaveFiltersTemplateButtonDisabled] = useState<boolean>(true)

    const router = useRouter()
    const { filters } = parseQuery(router.query)
    const { link } = useOrganization()

    const handleSaveRef = useRef(null)
    const [form, setForm] = useState<FormInstance>()

    const { objs: filtersTemplates, loading, refetch } = filtersSchemaGql.useObjects({
        sortBy: 'createdAt_ASC',
        where: {
            employee: { id: link.id },
            deletedAt: null,
        },
    })

    useEffect(() => {
        setSelectedFiltersTemplate(get(filtersTemplates, '0', null))
    }, [loading])

    const createFiltersTemplateAction = filtersSchemaGql.useCreate({
        employee: link.id,
    }, refetch)

    const updateFiltersTemplateAction = filtersSchemaGql.useUpdate({
        employee: link.id,
    }, refetch)

    const handleResetFilters = useCallback(async () => {
        const keys = Object.keys(form.getFieldsValue())
        const emptyFields = keys.reduce((acc, key) => {
            acc[key] = undefined
            return acc
        }, {})

        form.setFieldsValue(emptyFields)
    }, [form])

    const handleSaveFiltersTemplate = useCallback(async () => {
        const { newTemplateName, existedTemplateName, ...otherValues } = form.getFieldsValue()
        const filtersValue = pickBy(otherValues)

        if (newTemplateName) {
            await createFiltersTemplateAction({
                name: newTemplateName,
                fields: filtersValue,
            })
        }

        if (existedTemplateName) {
            await updateFiltersTemplateAction({
                name: existedTemplateName,
                fields: filtersValue,
            }, selectedFiltersTemplate)
        }

        await handleSaveRef.current()
    }, [createFiltersTemplateAction, form, selectedFiltersTemplate, updateFiltersTemplateAction])

    const handleDeleteFiltersTemplate = useCallback(async () => {
        await updateFiltersTemplateAction({
            deletedAt: new Date().toDateString(),
        }, selectedFiltersTemplate)

        setSelectedFiltersTemplate(null)
    }, [selectedFiltersTemplate, updateFiltersTemplateAction])

    const handleSubmit = useCallback(async (values) => {
        const { newTemplateName, existedTemplateName, ...otherValues } = values
        const filtersValue = pickBy(otherValues)

        await updateQuery(router, filtersValue)
        setIsMultipleFiltersModalVisible(false)
    }, [router, setIsMultipleFiltersModalVisible])

    const ExistingFiltersTemplateNameInput = useCallback(() => (
        <Form.Item
            name='existedTemplateName'
            initialValue={get(selectedFiltersTemplate, 'name')}
        >
            <Input />
        </Form.Item>
    ), [selectedFiltersTemplate])

    const NewFiltersTemplateNameInput = useCallback(() => (
        <Form.Item
            name='newTemplateName'
            label={NewTemplateLabel}
            labelCol={LABEL_COL_PROPS}
        >
            <Input placeholder={NewTemplatePlaceholder} />
        </Form.Item>
    ), [NewTemplateLabel, NewTemplatePlaceholder])

    const handleSubmitButtonClick = useCallback(() => handleSaveRef.current(), [])

    const modalFooter = useMemo(() => [
        <ResetFiltersModalButton
            key={'reset'}
            handleReset={handleResetFilters}
            style={RESET_FILTERS_BUTTON_STYLE}
        />,
        selectedFiltersTemplate && (
            <DeleteButtonWithConfirmModal
                key={'delete'}
                title={DeleteTitle}
                message={DeleteMessage}
                okButtonLabel={DeleteLabel}
                action={handleDeleteFiltersTemplate}
                buttonCustomProps={{ type: 'sberDangerGhost' }}
            />
        ),
        <Button
            key={'saveFilters'}
            onClick={handleSaveFiltersTemplate}
            disabled={isSaveFiltersTemplateButtonDisabled}
            type={'sberGrey'}
            secondary
        >
            {SaveTemplateMessage}
        </Button>,
        <Button
            key={'submit'}
            onClick={handleSubmitButtonClick}
            type={'sberPrimary'}
            data-cy={'common__filters-button-submit'}
        >
            {ApplyMessage}
        </Button>,
    ], [
        DeleteLabel, DeleteMessage, DeleteTitle, SaveTemplateMessage, ApplyMessage, handleDeleteFiltersTemplate,
        handleResetFilters, handleSaveFiltersTemplate, handleSubmitButtonClick, isSaveFiltersTemplateButtonDisabled,
        selectedFiltersTemplate,
    ])

    const handleCancelModal = useCallback(() => setIsMultipleFiltersModalVisible(false),
        [setIsMultipleFiltersModalVisible])

    const handleTabChange = useCallback(async (filtersTemplateId) => {
        const selectedTemplateId = get(selectedFiltersTemplate, 'id')

        if (selectedTemplateId === filtersTemplateId) {
            return
        }

        if (filtersTemplateId) {
            const filtersTemplate = filtersTemplates.find(filterTemplate => filterTemplate.id === filtersTemplateId)

            setSelectedFiltersTemplate(filtersTemplate)
        }

        setIsSaveFiltersTemplateButtonDisabled(true)
        await handleResetFilters()
    }, [filtersTemplates, handleResetFilters, selectedFiltersTemplate])

    const handleFormValuesChange = useCallback(() => {
        const { newTemplateName, existedTemplateName } = form.getFieldsValue(['newTemplateName', 'existedTemplateName'])
        const isTemplateValueNameExist = Boolean(newTemplateName || existedTemplateName)

        setIsSaveFiltersTemplateButtonDisabled(!isTemplateValueNameExist)
    },
    [form])

    const tabsActiveKey = useMemo(() => get(selectedFiltersTemplate, 'id', 'newFilter'), [selectedFiltersTemplate])

    const templatesTabs = useMemo(() => filtersTemplates.map((filterTemplate, index) => (
        <TabPane
            tab={get(filterTemplate, 'name', `${TemplateMessage} ${index + 1}`)}
            key={filterTemplate.id}
            style={TAB_STYLE}
        >
            <ExistingFiltersTemplateNameInput />
        </TabPane>
    )), [ExistingFiltersTemplateNameInput, TemplateMessage, filtersTemplates])

    const initialFormValues = useMemo(() => get(selectedFiltersTemplate, 'fields', filters), [filters, selectedFiltersTemplate])
    const modalComponents = useMemo(() => getModalComponents(pickBy(initialFormValues), filterMetas, form), [filterMetas, form, initialFormValues])

    const ModalFormItems = useCallback(() => {
        return (
            <Col span={24}>
                <Row justify="space-between" gutter={FILTER_WRAPPERS_GUTTER} id={FILTERS_POPUP_CONTAINER_ID}>
                    {modalComponents}
                </Row>
            </Col>
        )
    }, [modalComponents])

    return (
        <DefaultModal
            title={FiltersModalTitle}
            visible={isMultipleFiltersModalVisible}
            onCancel={handleCancelModal}
            footer={modalFooter}
            centered
            {...MODAL_PROPS}
        >
            {
                !loading ? (
                    <FormWithAction
                        validateTrigger={MODAL_FORM_VALIDATE_TRIGGER}
                        handleSubmit={handleSubmit}
                        onChange={handleFormValuesChange}
                    >
                        {
                            ({ handleSave, form }) => {
                                setForm(form)
                                handleSaveRef.current = handleSave

                                return (
                                    <Row gutter={MAIN_ROW_GUTTER}>
                                        <Col span={24}>
                                            {
                                                !isEmpty(filtersTemplates) ? (
                                                    <Tabs onChange={handleTabChange} activeKey={tabsActiveKey}>
                                                        {templatesTabs}
                                                        <TabPane tab={NewFilterMessage} key={'newFilter'}>
                                                            <NewFiltersTemplateNameInput />
                                                        </TabPane>
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
                        }
                    </FormWithAction>
                ) : <Loader />
            }
        </DefaultModal>
    )
}

export function useMultipleFiltersModal <T> (filterMetas: Array<FiltersMeta<T>>, filtersSchemaGql) {
    const [isMultipleFiltersModalVisible, setIsMultipleFiltersModalVisible] = useState<boolean>()

    const MultipleFiltersModal = useCallback(() => (
        <Modal
            isMultipleFiltersModalVisible={isMultipleFiltersModalVisible}
            setIsMultipleFiltersModalVisible={setIsMultipleFiltersModalVisible}
            filterMetas={filterMetas}
            filtersSchemaGql={filtersSchemaGql}
        />
    ), [isMultipleFiltersModalVisible])

    return { MultipleFiltersModal, ResetFiltersModalButton, setIsMultipleFiltersModalVisible }
}
