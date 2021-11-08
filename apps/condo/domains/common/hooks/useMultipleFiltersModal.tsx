import React, { CSSProperties, useCallback, useMemo, useState } from 'react'
import Form from 'antd/lib/form'
import { Checkbox, Col, FormInstance, Input, Row, Select, Typography } from 'antd'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import { FormItemProps } from 'antd/es'
import styled from '@emotion/styled'
import { CloseOutlined } from '@ant-design/icons'
import { Gutter } from 'antd/es/grid/row'
import isFunction from 'lodash/isFunction'

import { useIntl } from '@core/next/intl'

import {
    parseQuery,
    QueryArgType,
} from '@condo/domains/common/utils/tables.utils'
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
    FiltersMeta, getFiltersModalPopupContainer,
    getQueryToValueProcessorByType,
    setFiltersToQuery,
} from '../utils/filters.utils'


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

export const getModalFilterComponentByMeta = (filters: IFilters, keyword: string, component: FilterComponentType): React.ReactElement => {
    const type = get(component, 'type')
    const props = {
        // It is necessary so that dropdowns do not go along with the screen when scrolling the modal window
        getPopupContainer: getFiltersModalPopupContainer,
        ...get(component, 'props', {}),
    }

    switch (type) {
        case ComponentType.Input: {
            return <Input {...props} />
        }

        case ComponentType.Date: {
            return <DatePicker format='DD.MM.YYYY' style={DATE_PICKER_STYLE} {...props} />
        }

        case ComponentType.CheckboxGroup: {
            const options = get(component, 'options')
            return <Checkbox.Group options={options} {...props} />
        }

        case ComponentType.DateRange: {
            return <DateRangePicker
                format='DD.MM.YYYY'
                style={DATE_RANGE_PICKER_STYLE}
                separator={null}
                {...props}
            />
        }

        case ComponentType.Select: {
            const options = get(component, 'options')

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
                            title={option.text}
                        >
                            {option.text}
                        </Select.Option>
                    ))}
                </Select>
            )
        }

        case ComponentType.GQLSelect: {
            return <GraphQlSearchInput
                {...props}
            />
        }

        case ComponentType.TagsSelect: {
            return <Select
                mode="tags"
                allowClear
                style={TAGS_SELECT_STYLE}
                dropdownStyle={TAGS_SELECT_DROPDOWN_STYLE}
                {...props}
            />
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
            Component = getModalFilterComponentByMeta(filters, keyword, component)

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

const StyledResetFiltersModalButton = styled(Button)`
  position: absolute;
  left: 10px;
`

const MODAL_PROPS: CSSProperties = { width: 840 }
const CLEAR_ALL_MESSAGE_STYLE: CSSProperties = { fontSize: '12px' }
const FILTER_WRAPPERS_GUTTER: [Gutter, Gutter] = [24, 12]
const MODAL_FORM_VALIDATE_TRIGGER: string[] = ['onBlur', 'onSubmit']

const ResetFiltersModalButton = ({ handleReset }) => {
    const intl = useIntl()
    const ClearAllFiltersMessage = intl.formatMessage({ id: 'ClearAllFilters' })

    return (
        <StyledResetFiltersModalButton
            key={'reset'}
            type={'text'}
            onClick={handleReset}
        >
            <Typography.Text strong type={'secondary'}>
                {ClearAllFiltersMessage} <CloseOutlined style={CLEAR_ALL_MESSAGE_STYLE} />
            </Typography.Text>
        </StyledResetFiltersModalButton>
    )
}

type MultipleFiltersModalProps = {
    isMultipleFiltersModalVisible: boolean,
    setIsMultipleFiltersModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
    filterMetas: Array<FiltersMeta<unknown>>
}

const Modal: React.FC<MultipleFiltersModalProps> = ({
    isMultipleFiltersModalVisible,
    setIsMultipleFiltersModalVisible,
    filterMetas,
}) => {
    const intl = useIntl()
    const FiltersModalTitle = intl.formatMessage({ id: 'FiltersLabel' })
    const ShowMessage = intl.formatMessage({ id: 'Show' })

    const [form, setForm] = useState<FormInstance>(null)

    const router = useRouter()
    const { filters } = parseQuery(router.query)

    const handleReset = useCallback(async () => {
        const keys = Object.keys(form.getFieldsValue())
        const emptyFields = keys.reduce((acc, key) => {
            acc[key] = undefined

            return acc
        }, {})

        form.setFieldsValue(emptyFields)

        await setFiltersToQuery(router, {}, true)
    }, [form, router])

    const handleSubmit = useCallback(async (values) => {
        await setFiltersToQuery(router, { ...filters, ...values }, true)
        setIsMultipleFiltersModalVisible(false)
    }, [filters, router, setIsMultipleFiltersModalVisible])

    const modalFooter = useMemo(() => (
        [
            <ResetFiltersModalButton key={'reset'} handleReset={handleReset} />,
        ]
    ), [handleReset])

    const ModalFormFilters = useMemo(() => {
        if (!form) return
        return getModalComponents(filters, filterMetas, form)
    }, [filters, filterMetas, form])

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
                            {ModalFormFilters}
                        </Row>
                    )
                }
            }
        </BaseModalForm>
    )
}

export function useMultipleFiltersModal <T> (filterMetas: Array<FiltersMeta<T>>) {
    const [isMultipleFiltersModalVisible, setIsMultipleFiltersModalVisible] = useState<boolean>()

    const MultipleFiltersModal = useCallback(() => (
        <Modal
            isMultipleFiltersModalVisible={isMultipleFiltersModalVisible}
            setIsMultipleFiltersModalVisible={setIsMultipleFiltersModalVisible}
            filterMetas={filterMetas}
        />
    ), [isMultipleFiltersModalVisible])

    return { MultipleFiltersModal, setIsMultipleFiltersModalVisible }
}