import React, { createContext, useCallback, useState, useContext } from 'react'
import { B2BAppGlobalFeature } from '@app/condo/schema'
import pick from 'lodash/pick'

type IFeaturesType = { [key in B2BAppGlobalFeature]?: string }
type IRegisterFeaturesType = (newFeatures: IFeaturesType) => void

type IGlobalAppsFeaturesContext = {
    features: IFeaturesType
    registerFeatures: IRegisterFeaturesType
}

const GlobalAppsFeaturesContext = createContext<IGlobalAppsFeaturesContext>({
    features: {},
    registerFeatures: () => ({}),
})

export const GlobalAppsFeaturesProvider: React.FC = ({ children }) => {
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
        <GlobalAppsFeaturesContext.Provider value={{ features, registerFeatures }}>
            {children}
        </GlobalAppsFeaturesContext.Provider>
    )
}

export const useGlobalAppsFeaturesContext = (): IGlobalAppsFeaturesContext => useContext(GlobalAppsFeaturesContext)
