import { Select as DefaultSelect, SelectProps } from 'antd'
import { RefSelectProps } from 'antd/lib/select'
import compact from 'lodash/compact'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import React from 'react'

import { useTracking, TrackingEventPropertiesType, TrackingEventType } from '@condo/domains/common/components/TrackingContext'

export interface CustomSelectProps<T> extends SelectProps<T> {
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
    ref?: React.Ref<RefSelectProps>
}

const Select = <T extends string | number | { value: any, label: any }> (props: CustomSelectProps<T>) => {
    const { eventName: propEventName, eventProperties = {}, onChange, ...restProps } = props
    const { logEvent, getEventName } = useTracking()

    const eventName = propEventName ? propEventName : getEventName(TrackingEventType.Select)
    const componentProperties = { ...eventProperties }

    const onChangeCallback: CustomSelectProps<T>['onChange'] = (value, option) => {
        if (eventName) {
            let selectedValue = null

            if (isArray(option)) {
                selectedValue = compact(option.map(opt => get(opt, 'title', false) || get(opt, 'label')))
            } else {
                selectedValue = get(option, 'title')
            }

            if (!isEmpty(selectedValue)) {
                componentProperties['component'] = { value: selectedValue }

                const componentId = get(restProps, 'id')
                if (componentId) {
                    componentProperties['component']['id'] = componentId
                }

                logEvent({ eventName, eventProperties: componentProperties })
            }
        }

        // fire prop onChange callback if it was passed to component props
        if (isFunction(onChange)) {
            onChange(value, option)
        }
    }

    return (
        <DefaultSelect <T> {...restProps } onChange={onChangeCallback} />
    )
}

Select.Option = DefaultSelect.Option
Select.OptGroup = DefaultSelect.OptGroup

export default Select
