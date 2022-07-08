/** @jsx jsx */
import { useState } from 'react'
import { Select as DefaultSelect, Tag } from 'antd'
import { useTracking, TrackingEventType } from '@condo/domains/common/components/TrackingContext'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import isObject from 'lodash/isObject'
import { jsx, css } from '@emotion/react'
import { CustomSelectProps } from './Select'

const tagCss = css`
    height: 32px;
    line-height: 32px;
    margin-top: 6px;
    margin-bottom: 6px;
    background: #f5f5f5;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    font-size: 16px;
    padding-inline-start: 8px;
    padding-inline-end: 4px;
    cursor: pointer;

    .ant-tag-close-icon {
      vertical-align: 0.2px;
    }
`

const tagRender = (props) => {
    const { setSelectInputValue, tags, onChangeSelect, value, ...restProps } = props

    const changeTagValue = () => {
        setSelectInputValue(value)

        const newTags = tags.filter((tag) => {
            return tag !== value
        })

        onChangeSelect(newTags)
    }

    return  (
        <Tag
            closable
            onClick={changeTagValue}
            css={tagCss}
            {...restProps}
        >
            {value}
        </Tag>
    )
}

const SelectTags = <T extends string | number | { value: any, label: any }>(props: CustomSelectProps<T>) => {
    const { eventName: propEventName, eventProperties = {}, onChange, value, ...restProps } = props
    const [selectInputValue, setSelectInputValue] = useState('')
    const { logEvent, getEventName } = useTracking()

    const eventName = propEventName ? propEventName : getEventName(TrackingEventType.Select)
    const componentProperties = { ...eventProperties }

    const onChangeCallback: CustomSelectProps<T>['onChange'] = (value, option) => {
        if (eventName && isObject(option)) {
            const selectedValue = get(option, 'title')

            if (selectedValue) {
                componentProperties['component'] = { value: selectedValue }
                logEvent({ eventName, eventProperties: componentProperties })
            }
        }

        // fire prop onChange callback if it was passed to component props
        if (isFunction(onChange)) {
            onChange(value, option)
            setSelectInputValue('')
        }
    }

    return (
        <DefaultSelect <T>
            {...restProps}
            onChange={onChangeCallback}
            tagRender={(props) => {
                return tagRender({ ...props, setSelectInputValue, tags: value, onChangeSelect: onChange })
            }}
            onSearch={(value) => {
                setSelectInputValue(value)
            }}
            searchValue={selectInputValue}
            value={value}
        />
    )
}

SelectTags.Option = DefaultSelect.Option
SelectTags.OptGroup = DefaultSelect.OptGroup

export default SelectTags
