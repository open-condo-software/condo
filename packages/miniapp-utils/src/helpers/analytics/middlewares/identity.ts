import type { AnalyticsPlugin, PluginTrackData } from '../types'

const IDENTITY_PROPERTIES = ['app', 'version']

function _addIdentityProperties (data: PluginTrackData): PluginTrackData {
    const { instance } = data

    for (const contextPropertyName of IDENTITY_PROPERTIES) {
        const propertyValue = instance.getState(`context.${contextPropertyName}`)
        if (typeof propertyValue === 'string') {
            data.payload.properties[contextPropertyName] = propertyValue
        }
    }

    return data
}

export const IdentityMiddlewarePlugin: AnalyticsPlugin = {
    name: 'analytics-plugin-identity',
    track: _addIdentityProperties,
    page: _addIdentityProperties,
}