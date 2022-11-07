import React, { useCallback } from 'react'
import { Select as DefaultSelect, SelectProps } from 'antd'
import { useTracking, TrackingEventPropertiesType, TrackingEventType } from '@condo/domains/common/components/TrackingContext'
import { RefSelectProps } from 'antd/lib/select'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'

export interface CustomSelectProps<T> extends SelectProps<T> {
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
    ref?: React.Ref<RefSelectProps>
}

const Select = <T extends string | number | { value: any, label: any }> (props: CustomSelectProps<T>) => {
    const { eventName: propEventName, eventProperties = {}, onSelect, ...restProps } = props
    const { logEvent, getEventName } = useTracking()

    const eventName = propEventName ? propEventName : getEventName(TrackingEventType.Select)
    const componentProperties = { ...eventProperties }

    const onSelectCallback = useCallback((value, option) => {
        if (eventName) {
            const componentValue = get(option, 'title')

            if (componentValue) {
                const componentId = get(restProps, 'id')
                componentProperties['component'] = { value: componentValue }

                if (componentId) {
                    componentProperties['component']['id'] = componentId
                }

                logEvent({ eventName, eventProperties: componentProperties })
            }
        }

        if (isFunction(onSelect)) {
            onSelect(value, option)
        }
    }, [onSelect])

    return (
        <DefaultSelect <T> {...restProps } onSelect={onSelectCallback} />
    )
}

Select.Option = DefaultSelect.Option
Select.OptGroup = DefaultSelect.OptGroup

export default Select
