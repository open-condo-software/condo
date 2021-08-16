// features should be added at local storage as 'featureName1,featureName2'

import React, { ReactNode, useEffect, useState } from 'react'

const _getEnabledFeatures = (): Array<string> => {
    if (typeof window !== 'undefined') {
        const featuresFromStorage = localStorage.getItem('features')

        if (featuresFromStorage) {
            return featuresFromStorage.split(',')
        }
    }

    return []
}

/**
 * Returns true if feature is found in localstorage, false otherwise
 * @param name - name of the feature
 */
export const hasFeature = (name: string): boolean => {
    const enabledFeatures = _getEnabledFeatures()
    return enabledFeatures.includes(name)
}

interface IFeature {
    name: string
    fallback: ReactNode
}

/**
 * Container which will return { children } or { fallback } based on feature flag state
 */
export const WithFeatureFlag: React.FC<IFeature> = (props) => {
    const {
        name,
        children,
        fallback,
    } = props

    const [features, setFeatures] = useState([])

    useEffect(() => {
        const enabledFeatures = _getEnabledFeatures()

        if (enabledFeatures.length) {
            setFeatures(enabledFeatures)
        } 
    }, [])

    const hasFeature = features.includes(name)

    if (hasFeature) {
        return <>{ children }</>
    }

    return fallback
}

/**
 * Controller which allows to set feature flags in loc alstorage using non-trivial cheat-code interface
 */
export const FeatureFlagsController = ({ children }) => {
    alert('lol')
    return <>{ children }</>
}
