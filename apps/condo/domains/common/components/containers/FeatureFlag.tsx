/**
 * Basic component for feature flags
 *
 * enabledFlags are stored in localstorage like this: feat1,feat2,feat3
 * disabledFlags are not present in localstorage
 *
 * Feature flags are configured in .env file. Look at .env.example
 *
 * To use feature flags you need two components:
 * - controller (UI for client-side configuration of feature flags)
 * - container (Feature wrapper)
 *
 * You also have access to the function hasFeature(name) to handle other cases
 *
 */

import { Switch, Alert } from 'antd'
import getConfig from 'next/config'
import React, { ReactNode, useMemo, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

import { useIntl } from '@open-condo/next/intl'
import { Button, Modal } from '@open-condo/ui'


const getEnabledFeatures = (): Array<string> => {
    if (typeof window !== 'undefined') {
        const featuresFromStorage = localStorage.getItem('features')

        if (featuresFromStorage) {
            return featuresFromStorage.split(',')
        }
    }

    return []
}

const getAllFeatures = (): Array<string> => {
    const { publicRuntimeConfig } = getConfig()
    let { featureFlagsConfig } = publicRuntimeConfig

    try {
        featureFlagsConfig = JSON.parse(featureFlagsConfig)
        return featureFlagsConfig
    } catch (err) {
        console.error(`Feature flags are not configured properly, found: ${featureFlagsConfig}, error ${err}`)
    }

    return []
}

const toggleFeature = (name: string): void => {
    if (typeof window !== 'undefined') {
        const enabledFeatures = getEnabledFeatures()
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
 */
export const hasFeature = (featureName: string): boolean => {
    const enabledFeatures = getEnabledFeatures()
    return enabledFeatures.includes(featureName)
}

interface IFeature {
    name: string
    fallback?: ReactNode
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

    if (hasFeature(name)) {
        return <>{ children }</>
    }

    if (fallback) {
        return (
            <>{fallback}</>
        )
    }

    return null
}

/**
 * Controller which allows to set feature flags in localstorage using non-trivial cheat-code interface
 */
export const FeatureFlagsController: React.FC = () => {

    useHotkeys('d+o+m+a', () => setIsModalVisible(true))

    const intl = useIntl()

    const SaveMessage = intl.formatMessage({ id: 'save' })
    const featureFlagsTitle = intl.formatMessage({ id: 'featureFlags.modal.title' } )
    const featureFlagsDescription = intl.formatMessage({ id: 'featureFlags.modal.description' } )

    const [isModalVisible, setIsModalVisible] = useState(false)

    const allFeatures = getAllFeatures()

    const handleOk = () => {
        setIsModalVisible(false)
        window.location.reload()
    }

    const footer = useMemo(() => [
        <Button type='primary' key='save' onClick={handleOk}>
            {SaveMessage}
        </Button>,
    ], [])

    const enabledFlags = getEnabledFeatures()

    return (
        <>
            <Modal title={ featureFlagsTitle }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={footer}
            >
                <Alert message={ featureFlagsDescription } type='success' />
                {
                    allFeatures.map((name) => (
                        <>
                            <div style={{ paddingTop: '30px' }}>
                                <h2><b>{name}</b></h2>
                                <Switch defaultChecked={enabledFlags.includes(name)} checkedChildren='1' unCheckedChildren='0' onChange={() => toggleFeature(name)} />
                            </div>
                        </>
                    ))
                }
            </Modal>
        </>
    )
}
