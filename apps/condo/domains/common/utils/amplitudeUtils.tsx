import React from 'react'
// TODO: remove this file completely
type AmplitudeInstance = {
    init: (apiKey: string, userId: string | undefined, config: Record<string, unknown>) => void
    logEvent: ILogEvent
    setUserId: (userId: string) => void
    setUserProperties: (userProperties: unknown) => void
}

type AmplitudeContextType = { amplitudeInstance: null | AmplitudeInstance, eventProperties: unknown }

type InitAmplitudeProps = {
    amplitudeInstance: AmplitudeInstance
    apiKey: string
    userId: string
    config?: Record<string, unknown>
}

interface ILogEvent {
    (eventType: string, eventProperties: unknown, callback?: () => void): void
}

const AmplitudeContext = React.createContext<AmplitudeContextType>({ amplitudeInstance: null, eventProperties: {} })

const useAmplitudeContext = () => {
    return React.useContext(AmplitudeContext)
}

const initAmplitude = (props: InitAmplitudeProps) => {
    return () => {
        const { amplitudeInstance, apiKey, userId, config = {} } = props

        if (amplitudeInstance && typeof amplitudeInstance.init === 'function' && typeof amplitudeInstance.logEvent === 'function') {
            if (apiKey) {
                amplitudeInstance.init(apiKey, undefined, config)
            }
            if (userId) {
                amplitudeInstance.setUserId(userId)
            }
        }
    }
}

const AmplitudeProvider: React.FC<InitAmplitudeProps> = (props) => {
    const { amplitudeInstance, children } = props

    const init = React.useMemo(() => {
        return initAmplitude(props)
    }, [props])

    init()

    return (
        <AmplitudeContext.Provider value={{
            amplitudeInstance,
            eventProperties: {},
        }}>
            {children}
        </AmplitudeContext.Provider>
    )
}

type EventPropertiesType = Record<string, unknown>

interface IUseAmplitude {
    (eventProperties?: EventPropertiesType, instanceName?: string): {
        logEvent: ILogEvent,
        eventProperties: EventPropertiesType,
        amplitudeInstance: AmplitudeInstance,
    }
}

const useAmplitude = (eventProperties = {}, instanceName = '$default_instance') => {
    const { amplitudeInstance, eventProperties: inheritProperties } = useAmplitudeContext()

    return React.useMemo(() => {
        const logEvent: ILogEvent = (eventType, eventPropertiesIn, callback) => {
            if (!amplitudeInstance){
                return
            }
            let computedProps = inheritProperties

            if (typeof eventProperties === 'function') {
                computedProps = eventProperties(computedProps)
            } else {
                computedProps = Object.assign(Object.assign({}, computedProps), eventProperties || {})
            }

            if (typeof eventPropertiesIn === 'function') {
                computedProps = eventPropertiesIn(computedProps)
            } else {
                computedProps = Object.assign(Object.assign({}, computedProps), eventPropertiesIn || {})
            }

            amplitudeInstance.logEvent(eventType, computedProps, callback)
        }

        return {
            logEvent,
            eventProperties: inheritProperties,
            amplitudeInstance,
        }
    }, [eventProperties, amplitudeInstance, inheritProperties, instanceName])
}

type AmplitudeProps = {
    eventProperties?: EventPropertiesType
    instanceName?: string
    userProperties?: EventPropertiesType
}

const Amplitude: React.FC<AmplitudeProps> = (props) => {
    const { eventProperties = {}, instanceName, userProperties, children } = props
    const { logEvent, eventProperties: inheritEventProperties, amplitudeInstance } = useAmplitude(undefined, instanceName)

    React.useMemo(() => {
        return () => {
            if (amplitudeInstance && userProperties) {
                amplitudeInstance.setUserProperties(userProperties)
            }
        }
    }, [userProperties, amplitudeInstance])()

    const value = React.useMemo(() => ({
        eventProperties: Object.assign(Object.assign({}, inheritEventProperties), eventProperties || {}),
        amplitudeInstance,
    }), [eventProperties, amplitudeInstance])

    if (!eventProperties) {
        return typeof children === 'function' ? children({ logEvent }) : children || null
    }

    return (
        <AmplitudeContext.Provider value={value}>
            {children}
        </AmplitudeContext.Provider>
    )

}

export { AmplitudeProvider, useAmplitude, Amplitude }
