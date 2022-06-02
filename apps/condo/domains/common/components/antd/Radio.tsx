import React from 'react'
import { Radio as DefaultRadio, RadioProps } from 'antd'
import { useTracking, TrackingEventPropertiesType, TrackingEventType } from '@condo/domains/common/components/TrackingContext'

export interface CustomRadioProps extends RadioProps {
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
}

const Radio = (props: CustomRadioProps) => {
    const { eventName: propEventName, eventProperties = {}, onChange, ...restProps } = props
    const { getTrackingWrappedCallback, getEventName } = useTracking()

    const eventName = propEventName ? propEventName : getEventName(TrackingEventType.Radio)
    const componentProperties = { ...eventProperties }

    if (restProps.value) {
        componentProperties['component'] = { value: restProps.value }
    }

    const onChangeCallback = eventName ? getTrackingWrappedCallback(eventName, componentProperties, onChange) : onChange

    return (
        <DefaultRadio {...restProps} onChange={onChangeCallback} />
    )
}

Radio.Group = DefaultRadio.Group
Radio.Button = DefaultRadio.Button

export default Radio
