import { Input as BaseInput, InputProps } from 'antd'
import get from 'lodash/get'
import React, { useEffect, useRef } from 'react'

import { useTracking, TrackingEventPropertiesType, TrackingEventType } from '../TrackingContext'

export interface CustomInputProps extends InputProps {
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
}
const DEBOUNCE_TIMEOUT = 1000

const Input = (props: CustomInputProps) => {
    const { eventName: propEventName, eventProperties, ...restProps } = props
    const firstRender = useRef(true)
    const { logEvent, getEventName } = useTracking()

    const eventName = propEventName ? propEventName : getEventName(TrackingEventType.Input)
    const componentProperties = { ...eventProperties }

    if (restProps.value) {
        componentProperties['component'] = { value: restProps.value }

        const componentId = get(restProps, 'id')
        if (componentId) {
            componentProperties['component']['id'] = componentId
        }
    }

    useEffect(() => {
        let timeoutId
        if (!firstRender.current && eventName && restProps.value && restProps.type !== 'hidden') {
            timeoutId = setTimeout(() => {
                logEvent({ eventName, eventProperties: componentProperties })
            }, DEBOUNCE_TIMEOUT)
        }

        firstRender.current = false

        return () => clearTimeout(timeoutId)
    }, [restProps.value])

    return <BaseInput {...restProps} />
}

Input.Password = BaseInput.Password
Input.TextArea = BaseInput.TextArea
Input.Search = BaseInput.Search
Input.Group = BaseInput.Group

export default Input
