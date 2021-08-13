import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

export const initFeatures = (): Array<string> => {
    // TODO(Dimitreee): add prefetch from server by userId
    // TODO(Dimitreee): add url search string parse
    if (typeof window !== 'undefined') {
        // features should be added at local storage as 'featureName1,featureName2'
        const featuresFromStorage = localStorage.getItem('features')

        if (featuresFromStorage) {
            return featuresFromStorage.split(',')
        }
    }

    return []
}

interface IFeature {
    name: string
    fallbackUrl?: string
}

export const Feature: React.FC<IFeature> = (props) => {
    const {
        name,
        children,
        fallbackUrl,
    } = props
    const [features, setFeatures] = useState([])
    const router = useRouter()

    useEffect(() => {
        const featuresFromStorage = initFeatures()

        if (featuresFromStorage.length) {
            setFeatures(featuresFromStorage)
        } else {
            if (fallbackUrl) {
                router.push(fallbackUrl)
            }
        }
    }, [])

    const isFeatureActive = features.includes(name)

    if (isFeatureActive) {
        return children
    }

    return null
}
