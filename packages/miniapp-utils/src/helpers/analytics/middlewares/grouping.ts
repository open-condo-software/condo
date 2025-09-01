import { Analytics } from '../instance'

import type { AnalyticsPlugin, PluginTrackData } from '../types'

function _addGroupingProperties (data: PluginTrackData): PluginTrackData {
    const { instance } = data

    for (const groupName of instance.groups) {
        const groupKey = Analytics.getGroupKey(groupName)
        const groupValue = instance.storage.getItem(groupKey)

        if (typeof groupValue === 'string') {
            const groupAttrName = `groups.${groupName}`
            data.payload.properties[groupAttrName] = groupValue
        }
    }
    return data
}

export const GroupingMiddlewarePlugin: AnalyticsPlugin = {
    name: 'analytics-plugin-grouping',
    track: _addGroupingProperties,
    page: _addGroupingProperties,
}