import React, { useCallback, useState } from 'react'
import Form from 'antd/lib/form'
import { Checkbox, Col, FormInstance, Input, Row, Select, Typography } from 'antd'
import { useRouter } from 'next/router'
import { get, pickBy } from 'lodash'
import { FormItemProps } from 'antd/es'
import qs from 'qs'
import styled from '@emotion/styled'
import { CloseOutlined } from '@ant-design/icons'

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

import { ComponentType, FilterComponentType, FiltersMeta, getQueryToValueProcessorByType } from '../utils/filters.utils'


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

    return (
        <Col span={size}>
            <Form.Item
                name={name}
                initialValue={queryToValueProcessor && value ? queryToValueProcessor(value) : value}
                label={label}
                {...formItemProps}
            >
                {children}
            </Form.Item>
        </Col>
    )
}

const FILTERS_POPUP_CONTAINER_ID = 'filtersPopupContainer'

export const getModalFilterComponentByMeta = (filters, name, component: FilterComponentType): React.ReactElement => {
    const type = get(component, 'type')
    const props = {
        // It is necessary so that dropdowns do not go along with the screen when scrolling the modal window
        getPopupContainer: () => document.getElementById(FILTERS_POPUP_CONTAINER_ID),
        ...get(component, 'props', {}),
    }

    switch (type) {
        case ComponentType.Input: {
            return <Input {...props} />
        }

        case ComponentType.Date: {
            return <DatePicker format='DD.MM.YYYY' style={{ width: '100%' }} {...props} />
        }

        case ComponentType.CheckboxGroup: {
            const options = get(component, 'options')
            return <Checkbox.Group options={options} {...props} />
        }

        case ComponentType.DateRange: {
            return <DateRangePicker
                format='DD.MM.YYYY'
                style={{ width: '100%' }}
                separator={null}
                {...props}
            />
        }

        case ComponentType.Select: {
            const options = get(component, 'options')
            return (
                <Select
                    defaultValue={get(filters, name)}
                    {...props}
                >
                    {options.map(option => (
                        <Select.Option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
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
                style={{ width: '100%' }}
                dropdownStyle={{ display: 'none' }}
                {...props}
            />
        }

        default: return
    }
}

function getModalComponents <T> (filters, filterMetas: Array<FiltersMeta<T>>, form: FormInstance): React.ReactElement[] {
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
            Component = typeof componentGetter === 'function' ? componentGetter(form) : componentGetter
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

const ResetFiltersModalButton = styled(Button)`
  position: absolute;
  left: 10px;
`

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
    const [form, setForm] = useState<FormInstance>(null)
    const intl = useIntl()
    const FiltersModalTitle = intl.formatMessage({ id: 'FiltersLabel' })
    const ShowMessage = intl.formatMessage({ id: 'Show' })
    const ClearAllFiltersMessage = intl.formatMessage({ id: 'ClearAllFilters' })

    const router = useRouter()
    const { filters } = parseQuery(router.query)

    const handleReset = useCallback(async () => {
        const resetFields = {}
        const formKeys = Object.keys(form.getFieldsValue())
        formKeys.forEach(key => {
            resetFields[key] = undefined
        })
        form.setFieldsValue(resetFields)

        if ('offset' in router.query) router.query['offset'] = '0'
        const query = qs.stringify(
            { ...router.query, filters: JSON.stringify({}) },
            { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
        )

        await router.push(router.route + query)
    }, [form])

    const handleSubmit = useCallback((values) => {
        if ('offset' in router.query) router.query['offset'] = '0'
        const query = qs.stringify(
            { ...router.query, filters: JSON.stringify(pickBy({ ...filters, ...values })) },
            { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
        )

        router.push(router.route + query)
        setIsMultipleFiltersModalVisible(false)
    }, [])

    return (
        <BaseModalForm
            visible={isMultipleFiltersModalVisible}
            modalProps={{ width: 840 }}
            cancelModal={() => setIsMultipleFiltersModalVisible(false)}
            ModalTitleMsg={FiltersModalTitle}
            ModalSaveButtonLabelMsg={ShowMessage}
            showCancelButton={false}
            validateTrigger={['onBlur', 'onSubmit']}
            handleSubmit={handleSubmit}
            modalExtraFooter={[
                <ResetFiltersModalButton
                    key={'reset'}
                    type={'text'}
                    onClick={handleReset}
                >
                    <Typography.Text strong type={'secondary'}>
                        {ClearAllFiltersMessage} <CloseOutlined style={{ fontSize: '12px' }} />
                    </Typography.Text>
                </ResetFiltersModalButton>,
            ]}
        >
            {
                (form: FormInstance) => {
                    setForm(form)

                    return (
                        <Row justify={'space-between'} gutter={[24, 12]} id={FILTERS_POPUP_CONTAINER_ID}>
                            {getModalComponents(filters, filterMetas, form)}
                        </Row>
                    )
                }
            }
        </BaseModalForm>
    )
}

export function useMultipleFiltersModal <T> (filterMetas: Array<FiltersMeta<T>>) {
    const [isMultipleFiltersModalVisible, setIsMultipleFiltersModalVisible] = useState<boolean>()

    const MultipleFiltersModal = useCallback(() => {
        return <Modal
            isMultipleFiltersModalVisible={isMultipleFiltersModalVisible}
            setIsMultipleFiltersModalVisible={setIsMultipleFiltersModalVisible}
            filterMetas={filterMetas}
        />
    }, [isMultipleFiltersModalVisible])

    return { MultipleFiltersModal, setIsMultipleFiltersModalVisible }
}