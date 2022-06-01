import React from 'react'
import { Radio as DefaultRadio, RadioProps } from 'antd'
import { useTracking, TrackingEventPropertiesType, TrackingEventType } from '@condo/domains/common/components/TrackingContext'

export interface CustomRadioProps extends RadioProps {
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
}

const Radio = (props: CustomRadioProps) => {
    const { eventProperties = {}, onChange, ...restProps } = props
    const { instrument, getEventName } = useTracking()
    const eventName = getEventName(TrackingEventType.Radio)

    const onChangeCallback = eventName
        ? instrument(eventName, {
            ...eventProperties, component: { value: restProps.value, name: restProps.name },
        }, onChange)
        : onChange

    return (
        <DefaultRadio {...restProps} onChange={onChangeCallback} />
    )
}

Radio.Group = DefaultRadio.Group
Radio.Button = DefaultRadio.Button

export default Radio
