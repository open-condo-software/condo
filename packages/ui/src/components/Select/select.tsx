import { Select as DefaultSelect } from 'antd'
import classNames from 'classnames'
import compact from 'lodash/compact'
import React, { useCallback } from 'react'

import { ChevronDown, Close, Check, Inbox } from '@open-condo/icons'
import { Typography } from '@open-condo/ui/src'
import type { TypographyTextProps } from '@open-condo/ui/src'
import { sendAnalyticsChangeEvent, extractChildrenContent } from '@open-condo/ui/src/components/_utils/analytics'

import { SELECT_TYPES } from './constants'

import type { SelectProps as DefaultSelectProps } from 'antd'

const SELECT_CLASS_PREFIX = 'condo-select'
const Option: typeof DefaultSelect.Option = DefaultSelect.Option
const OptGroup: typeof DefaultSelect.OptGroup = DefaultSelect.OptGroup

export type OptionType = React.PropsWithChildren<{
    label: React.ReactNode
    value?: string | number | null
    disabled?: boolean
    textType?: TypographyTextProps['type']
    title?: string
}>
type OnChangeType = (value: OptionType['value'], option: OptionType | Array<OptionType>) => void

type SelectValueTypeBase = string | number | null | undefined
export type SelectProps<ValueType = SelectValueTypeBase> = Pick<DefaultSelectProps<ValueType, OptionType>,
'disabled'
| 'value'
| 'loading'
| 'children'
| 'id'
| 'dropdownAlign'
| 'filterOption'
| 'optionFilterProp'
| 'allowClear'
| 'showSearch'
| 'defaultValue'
> & {
    placeholder?: string
    options?: Array<OptionType>
    displayMode?: 'fill-parent' | 'fit-content'
    type?: typeof SELECT_TYPES[number]
    onChange?: OnChangeType
    isMultiple?: boolean
    notFoundContentLabel?: string
}

const Select = <ValueType extends SelectValueTypeBase>(props: SelectProps<ValueType>): React.ReactElement => {
    const { options, children, displayMode = 'fill-parent', type, onChange, id, isMultiple, notFoundContentLabel,  ...rest } = props

    const className = classNames({
        [`${SELECT_CLASS_PREFIX}-${displayMode}`]: displayMode,
        [`${SELECT_CLASS_PREFIX}-${type}`]: !isMultiple && type,
    })

    // TODO(DOMA-5597): Fix value types on multiple-select
    const handleChange = useCallback<OnChangeType>((value, option) => {
        let title
        if (Array.isArray(option)) {
            title = compact(option.map(opt => extractChildrenContent(opt.children)))
        } else {
            title = extractChildrenContent(option.children)
        }

        if (title) {
            // TODO(DOMA-5597): Key prop should be used here
            sendAnalyticsChangeEvent('Select', { label: title, value: String(value), id })
        }

        if (onChange) {
            onChange(value, option)
        }
    }, [id, onChange])

    return (
        <DefaultSelect
            {...rest}
            id={id}
            mode={isMultiple ? 'multiple' : undefined}
            prefixCls={SELECT_CLASS_PREFIX}
            className={className}
            suffixIcon={<ChevronDown size='small' />}
            onChange={handleChange}
            removeIcon={<Close size='small' />}
            clearIcon={<Close size='small' />}
            menuItemSelectedIcon={<Check size='small' />}
            showArrow
            notFoundContent={
                <>
                    <Inbox size='large' />
                    {notFoundContentLabel && <Typography.Text size='medium'>
                        {notFoundContentLabel}
                    </Typography.Text>}
                </>
            }
        >
            {options
                ? options.map(({ label, value, textType, disabled, title }, optionIndex) => (
                    <Option
                        key={optionIndex}
                        value={value}
                        disabled={disabled}
                        title={(title || typeof label !== 'string') ? title : label}
                    >
                        <Typography.Text size='medium' disabled={disabled} type={textType} children={label} />
                    </Option>
                ))
                : children
            }
        </DefaultSelect>
    )
}

export {
    Select,
    Option,
    OptGroup,
}
