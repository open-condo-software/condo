// features should be added at local storage as 'featureName1,featureName2'

import React, { ReactNode, useEffect, useState } from 'react'
import { Modal, Switch } from 'antd'
import useKeyboardShortcut from 'use-keyboard-shortcut'


const _getEnabledFeatures = (): Array<string> => {
    if (typeof window !== 'undefined') {
        const featuresFromStorage = localStorage.getItem('features')

        if (featuresFromStorage) {
            return featuresFromStorage.split(',')
        }
    }

    return []
}

const _toggleFeature = (name: string): void => {
    if (typeof window !== 'undefined') {
        const enabledFeatures = _getEnabledFeatures()
        const index = enabledFeatures.indexOf(name)

        if (index !== -1) {
            enabledFeatures.splice(index, 1)
        } else {
            enabledFeatures.push(name)
        }

        localStorage.setItem('features', enabledFeatures.join(','))
    }
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
export const FeatureFlagRequired: React.FC<IFeature> = (props) => {
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

    return (
        <>
            {fallback}
        </>
    )
}

/**
 * Controller which allows to set feature flags in localstorage using non-trivial cheat-code interface
 */
export const FeatureFlagsController: React.FC = () => {

    useKeyboardShortcut(['D', 'O', 'M', 'A'], () => showModal(), { overrideSystem: false })

    const [isModalVisible, setIsModalVisible] = useState(false)

    const featureFlagsConfig = ['billing', 'settings', 'se']

    const showModal = () => {
        setIsModalVisible(true)
    }

    const enabledFlags = _getEnabledFeatures()

    return (
        <>
            <Modal title="Flags" visible={isModalVisible} onOk={() => setIsModalVisible(false)} >
                {
                    featureFlagsConfig.map((name) => (
                        <>
                            <div>
                                <h2><b>{name}</b></h2>
                                <Switch defaultChecked={enabledFlags.includes(name)} checkedChildren="1" unCheckedChildren="0" onChange={() => _toggleFeature(name)} />
                            </div>
                        </>
                    ))
                }
            </Modal>
        </>
    )
}
