import { B2BAppGlobalFeature, Scalars } from '@app/condo/schema'
import { EventEmitter } from 'eventemitter3'
import pick from 'lodash/pick'
import React, { createContext, useCallback, useState, useContext } from 'react'

// Specify all data needed for specific feature
type MapGenerationFeatureContext = {
    feature: B2BAppGlobalFeature.PropertyMapGeneration
    propertyId: Scalars['ID']['input']
}

type AttachCallRecordToTicketFeatureContext = {
    feature: B2BAppGlobalFeature.AttachCallRecordToTicket
    ticketId: Scalars['ID']['input']
    ticketOrganizationId: Scalars['ID']['input']
}

// Group all features contexts using |
export type FeatureContext = MapGenerationFeatureContext | AttachCallRecordToTicketFeatureContext

// Store all miniapps available features
type IFeaturesType = { [key in B2BAppGlobalFeature]?: string }
// Register new features
type IRegisterFeaturesType = (newFeatures: IFeaturesType) => void
// Request app to launch a feature
type IRequestFeatureAction = (context: FeatureContext) => void
// Handle feature launch request
export type IRequestFeatureHandler = (context: FeatureContext) => void

type IGlobalAppsFeaturesContext = {
    features: IFeaturesType
    registerFeatures: IRegisterFeaturesType
    requestFeature: IRequestFeatureAction
    addFeatureHandler: (handler: IRequestFeatureHandler) => void
    removeFeatureHandler: (handler: IRequestFeatureHandler) => void
}

const GlobalAppsFeaturesContext = createContext<IGlobalAppsFeaturesContext>({
    features: {},
    registerFeatures: () => ({}),
    requestFeature: () => ({}),
    addFeatureHandler: () => ({}),
    removeFeatureHandler: () => ({}),
})

const eventEmitter = new EventEmitter()
const eventName = 'AppFeatureRequest'

const FeaturesEmitter = {
    requestFeature: (payload: FeatureContext) => eventEmitter.emit(eventName, payload),
    addFeatureHandler: (handler: IRequestFeatureHandler) => eventEmitter.on(eventName, handler),
    removeFeatureHandler: (handler: IRequestFeatureHandler) => eventEmitter.off(eventName, handler),
}

export const GlobalAppsFeaturesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [features, setFeatures] = useState<IFeaturesType>({})

    const registerFeatures: IRegisterFeaturesType = useCallback((newFeatures) => {
        setFeatures((prevState => {
            // NOTE: Each feature is served by app, who registered it first
            const nonRegisteredFeatureNames = Object.keys(newFeatures).filter(featureName => !(featureName in prevState))
            const nonRegisteredFeatures = pick(newFeatures, nonRegisteredFeatureNames)


            return {
                ...prevState,
                ...nonRegisteredFeatures,
            }
        }))
    }, [])


    return (
        <GlobalAppsFeaturesContext.Provider value={{
            features,
            registerFeatures,
            requestFeature: FeaturesEmitter.requestFeature,
            addFeatureHandler: FeaturesEmitter.addFeatureHandler,
            removeFeatureHandler: FeaturesEmitter.removeFeatureHandler,
        }}>
            {children}
        </GlobalAppsFeaturesContext.Provider>
    )
}

export const useGlobalAppsFeaturesContext = (): IGlobalAppsFeaturesContext => useContext(GlobalAppsFeaturesContext)
