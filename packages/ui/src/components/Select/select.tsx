import { Select as DefaultSelect } from 'antd'
import classNames from 'classnames'
import compact from 'lodash/compact'
import React, { useCallback } from 'react'

import { ChevronDown } from '@open-condo/icons'
import { Typography } from '@open-condo/ui/src'
import type { TypographyTextProps } from '@open-condo/ui/src'
import { sendAnalyticsSelectEvent, extractChildrenContent } from '@open-condo/ui/src/components/_utils/analytics'

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
}>
type OnChangeType = (value: OptionType['value'], option: OptionType | Array<OptionType>) => void

export type SelectProps = Pick<DefaultSelectProps, 'disabled' | 'value' | 'loading' | 'children' | 'id'> & {
    placeholder: string
    options?: Array<OptionType>
    displayMode?: 'fill-parent' | 'fit-content'
    type?: typeof SELECT_TYPES[number]
    onChange?: OnChangeType
}

export interface ISelect {
    (props: SelectProps): React.ReactElement
}

const Select: ISelect = (props) => {
    const { options, children, displayMode = 'fill-parent', type, onChange, id, ...rest } = props
    const className = classNames({
        [`${SELECT_CLASS_PREFIX}-${displayMode}`]: displayMode,
        [`${SELECT_CLASS_PREFIX}-${type}`]: type,
    })

    const handleChange = useCallback<OnChangeType>((value, option) => {
        let title
        if (Array.isArray(option)) {
            title = compact(option.map(opt => extractChildrenContent(opt.children)))
        } else {
            title = extractChildrenContent(option.children)
        }

        if (title) {
            sendAnalyticsSelectEvent('Select', { label: title, value: String(value), id })
        }

        if (onChange) {
            onChange(value, option)
        }
    }, [id, onChange])

    return (
        <DefaultSelect
            {...rest}
            id={id}
            prefixCls={SELECT_CLASS_PREFIX}
            className={className}
            suffixIcon={<ChevronDown size='small' />}
            onChange={handleChange}
        >
            {options
                ? options.map(({ label, value, textType, disabled }, optionIndex) => (
                    <Option key={optionIndex} value={value} disabled={disabled}>
                        <Typography.Text size='medium' disabled={disabled} type={textType}>
                            {label}
                        </Typography.Text>
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
