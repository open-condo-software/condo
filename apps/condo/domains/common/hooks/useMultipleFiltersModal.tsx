import { SizeType } from 'antd/lib/config-provider/SizeContext'
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Form from 'antd/lib/form'
import { Checkbox, Col, FormInstance, Input, Row, Select, Typography } from 'antd'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'
import { FormItemProps } from 'antd/es'
import { CloseOutlined } from '@ant-design/icons'
import { Gutter } from 'antd/es/grid/row'
import isFunction from 'lodash/isFunction'

import { OptionType, parseQuery, QueryArgType } from '@condo/domains/common/utils/tables.utils'
import { IFilters } from '@condo/domains/ticket/utils/helpers'

import DatePicker from '../components/Pickers/DatePicker'
import DateRangePicker from '../components/Pickers/DateRangePicker'
import { GraphQlSearchInput } from '../components/GraphQlSearchInput'
import { Button } from '../components/Button'
import { BaseModalForm } from '../components/containers/FormList'
import { FILTERS_POPUP_CONTAINER_ID } from '../constants/filters'

import {
    ComponentType,
    FilterComponentType,
    FiltersMeta,
    getFiltersModalPopupContainer,
    getQueryToValueProcessorByType,
    updateQuery,
} from '../utils/filters.utils'
import { FILTER_TABLE_KEYS, FiltersStorage } from '../utils/FiltersStorage'
import { Tooltip } from '../components/Tooltip'
import { colors } from '../constants/style'
import isEmpty from 'lodash/isEmpty'
import { useOrganization } from '@core/next/organization'

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
                {...formItemProps}
            >
                {children}
            </Form.Item>
        </Col>
    )
}

const DATE_PICKER_STYLE: CSSProperties = { width: '100%' }
const DATE_RANGE_PICKER_STYLE: CSSProperties = { width: '100%' }
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
                    format='DD.MM.YYYY'
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
                    format='DD.MM.YYYY'
                    style={DATE_RANGE_PICKER_STYLE}
                    separator={null}
                    {...props}
                />
            )
        }

        case ComponentType.Select: {
            const options: OptionType[] = get(component, 'options')

            return (
                <Select
                    defaultValue={get(filters, keyword)}
                    optionFilterProp={'title'}
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
                </Select>
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
                <Select
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
const MODAL_PROPS: CSSProperties = { width: 840 }
const CLEAR_ALL_MESSAGE_STYLE: CSSProperties = { fontSize: '12px' }
const FILTER_WRAPPERS_GUTTER: [Gutter, Gutter] = [24, 12]
const MODAL_FORM_VALIDATE_TRIGGER: string[] = ['onBlur', 'onSubmit']

type ResetFiltersModalButtonProps = {
    filterTableKey?: FILTER_TABLE_KEYS
    handleReset?: () => void
    style?: CSSProperties
    size?: SizeType
}

const ResetFiltersModalButton: React.FC<ResetFiltersModalButtonProps> = ({
    filterTableKey,
    handleReset: handleResetFromProps,
    style,
    size = 'large',
}) => {
    const intl = useIntl()
    const ClearAllFiltersMessage = intl.formatMessage({ id: 'ClearAllFilters' })
    const router = useRouter()
    const { organization } = useOrganization()

    const handleReset = useCallback(async () => {
        await updateQuery(router, {})

        if (filterTableKey) {
            FiltersStorage.clearFilters(organization.id, filterTableKey)
        }

        if (isFunction(handleResetFromProps)) {
            await handleResetFromProps()
        }
    }, [filterTableKey, handleResetFromProps, router])

    return (
        <Button
            style={style}
            key={'reset'}
            type={'text'}
            onClick={handleReset}
            size={size}
        >
            <Typography.Text strong type={'secondary'}>
                {ClearAllFiltersMessage} <CloseOutlined style={CLEAR_ALL_MESSAGE_STYLE} />
            </Typography.Text>
        </Button>
    )
}

// const FiltersTemplateSelect = () => {
//
//
//     return (
//
//     )
// }

type MultipleFiltersModalProps = {
    isMultipleFiltersModalVisible: boolean
    setIsMultipleFiltersModalVisible: React.Dispatch<React.SetStateAction<boolean>>
    filterMetas: Array<FiltersMeta<unknown>>
    filterTableKey?: FILTER_TABLE_KEYS
}

const Modal: React.FC<MultipleFiltersModalProps> = ({
    isMultipleFiltersModalVisible,
    setIsMultipleFiltersModalVisible,
    filterMetas,
    filterTableKey,
}) => {
    const intl = useIntl()
    const FiltersModalTitle = intl.formatMessage({ id: 'FiltersLabel' })
    const ShowMessage = intl.formatMessage({ id: 'Show' })

    const [form, setForm] = useState<FormInstance>(null)

    const router = useRouter()
    const { filters } = parseQuery(router.query)
    const { organization } = useOrganization()

    const handleReset = useCallback(async () => {
        const keys = Object.keys(form.getFieldsValue())
        const emptyFields = keys.reduce((acc, key) => {
            acc[key] = undefined

            return acc
        }, {})

        form.setFieldsValue(emptyFields)
    }, [form, router])

    const handleSubmit = useCallback(async (values) => {
        const newFilters = { ...filters, ...values }
        await updateQuery(router, newFilters)
        setIsMultipleFiltersModalVisible(false)

        if (filterTableKey) {
            FiltersStorage.saveFilters(organization.id, filterTableKey, newFilters)
        }
    }, [filterTableKey, filters, router, setIsMultipleFiltersModalVisible])

    const modalFooter = useMemo(() => (
        [
            <ResetFiltersModalButton
                filterTableKey={filterTableKey}
                key={'reset'}
                handleReset={handleReset}
                style={RESET_FILTERS_BUTTON_STYLE}
            />,
        ]
    ), [handleReset])
    
    return (
        <BaseModalForm
            visible={isMultipleFiltersModalVisible}
            modalProps={MODAL_PROPS}
            cancelModal={() => setIsMultipleFiltersModalVisible(false)}
            ModalTitleMsg={FiltersModalTitle}
            ModalSaveButtonLabelMsg={ShowMessage}
            showCancelButton={false}
            validateTrigger={MODAL_FORM_VALIDATE_TRIGGER}
            handleSubmit={handleSubmit}
            modalExtraFooter={modalFooter}
        >
            {
                (form: FormInstance) => {
                    setForm(form)

                    return (
                        <Row justify={'space-between'} gutter={FILTER_WRAPPERS_GUTTER} id={FILTERS_POPUP_CONTAINER_ID}>
                            {getModalComponents(filters, filterMetas, form)}
                        </Row>
                    )
                }
            }
        </BaseModalForm>
    )
}

export function useMultipleFiltersModal <T> (filterMetas: Array<FiltersMeta<T>>, filterTableKey?: FILTER_TABLE_KEYS) {
    const [isMultipleFiltersModalVisible, setIsMultipleFiltersModalVisible] = useState<boolean>()

    const MultipleFiltersModal = useCallback(() => (
        <Modal
            isMultipleFiltersModalVisible={isMultipleFiltersModalVisible}
            setIsMultipleFiltersModalVisible={setIsMultipleFiltersModalVisible}
            filterMetas={filterMetas}
            filterTableKey={filterTableKey}
        />
    ), [isMultipleFiltersModalVisible])

    return { MultipleFiltersModal, ResetFiltersModalButton, setIsMultipleFiltersModalVisible }
}