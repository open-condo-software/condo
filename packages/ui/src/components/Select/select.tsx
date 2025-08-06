import { Select as DefaultSelect } from 'antd'
import classNames from 'classnames'
import compact from 'lodash/compact'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback } from 'react'

import { ChevronDown, Close, Check, Inbox } from '@open-condo/icons'
import { Typography } from '@open-condo/ui/src'
import type { TypographyTextProps } from '@open-condo/ui/src'
import { sendAnalyticsChangeEvent, extractChildrenContent } from '@open-condo/ui/src/components/_utils/analytics'

import { SELECT_TYPES } from './constants'
import { useItems } from './hooks/useItems'

import type { Either } from '../_utils/types'
import type { SelectProps as DefaultSelectProps } from 'antd'

export const SELECT_CLASS_PREFIX = 'condo-select'
export const Option: typeof DefaultSelect.Option = DefaultSelect.Option
export const OptGroup: typeof DefaultSelect.OptGroup = DefaultSelect.OptGroup

export type OptionType = {
    label: string
    value?: string | number | null
    disabled?: boolean
    textType?: TypographyTextProps['type']
    title?: string
    key?: React.Key
    hidden?: boolean
}

export type OptionsGroupType = {
    label: string
    options: Array<OptionType>
    key?: React.Key
}

export type OptionsItem = Either<OptionType, OptionsGroupType> | null

type OnChangeType = (
    value: OptionType['value'] | Array<OptionType['value']>,
    option: React.PropsWithChildren<OptionType> | Array<React.PropsWithChildren<OptionType>>
) => void

/**
 * NOTE: Ant have bad interface for Select
 * It may work with multiple values, but it is not specified in the interface.
 */
type CustomSelectProps<ValueType = SelectValueTypeBase> = Either<{
    value?: ValueType | null
}, {
    mode: 'multiple'
    value?: Array<ValueType>
}>

type SelectValueTypeBase = string | number | null | undefined
export type SelectProps<ValueType = SelectValueTypeBase> = Pick<DefaultSelectProps<ValueType, OptionType>,
'disabled'
| 'loading'
| 'id'
| 'dropdownAlign'
| 'filterOption'
| 'optionFilterProp'
| 'allowClear'
| 'showSearch'
| 'defaultValue'
| 'onSearch'
| 'searchValue'
> & {
    placeholder?: string
    options: Array<OptionsItem>
    displayMode?: 'fill-parent' | 'fit-content'
    type?: typeof SELECT_TYPES[number]
    onChange?: OnChangeType
    notFoundContentLabel?: string
    ellipsis?: 'end' | 'start'
    showArrow?: boolean
} & CustomSelectProps<ValueType>

// TODO(DOMA-8757): default props autoClearSearchValue = false. Multi select search should not reset after selection
const Select = <ValueType extends SelectValueTypeBase>(props: SelectProps<ValueType>): React.ReactElement => {
    const {
        mode,
        options,
        displayMode = 'fill-parent',
        type,
        onChange,
        id,
        notFoundContentLabel,
        value,
        ellipsis = 'suffix',
        ...rest
    } = props

    const children = useItems(options, id)

    const className = classNames({
        [`${SELECT_CLASS_PREFIX}-${displayMode}`]: displayMode,
        [`${SELECT_CLASS_PREFIX}-${type}`]: !mode && type,
        [`${SELECT_CLASS_PREFIX}-ellipsis-${ellipsis}`]: ellipsis,
    })

    const dropDownClassName = classNames({
        [`${SELECT_CLASS_PREFIX}-dropdown-ellipsis-${ellipsis}`]: ellipsis,
    })

    const handleChange = useCallback<OnChangeType>((value, option) => {
        let title
        let selectedValue
        if (!!mode && Array.isArray(option) && !isEmpty(option)) {
            title = compact(option.map(opt => extractChildrenContent(opt.children)))
            selectedValue = compact(option.map(opt => String(opt.value)))
        } else if (!mode && !Array.isArray(option) && option) {
            title = extractChildrenContent(option.children)
            selectedValue = String(option.value)
        }

        if (title && selectedValue) {
            sendAnalyticsChangeEvent('Select', { label: title, value: selectedValue, id })
        }

        if (onChange) {
            onChange(value, option)
        }
    }, [id, mode, onChange])

    return (
        <DefaultSelect
            showArrow
            {...rest}
            id={id}
            mode={mode}
            prefixCls={SELECT_CLASS_PREFIX}
            className={className}
            popupClassName={dropDownClassName}
            suffixIcon={<ChevronDown size='small' />}
            onChange={handleChange}
            removeIcon={<Close size='small' />}
            clearIcon={<Close size='small' />}
            menuItemSelectedIcon={<Check size='small' />}
            value={value}
            notFoundContent={
                <>
                    <Inbox size='large' />
                    {notFoundContentLabel && <Typography.Text size='medium'>
                        {notFoundContentLabel}
                    </Typography.Text>}
                </>
            }
        >
            {children}
        </DefaultSelect>
    )
}

export {
    Select,
}
