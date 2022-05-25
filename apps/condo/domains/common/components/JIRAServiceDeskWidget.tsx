import React from 'react'
import getConfig from 'next/config'
/**
 * Here you can override the css for the widget
 */
const JSDWcss = `
iframe[name='JSD widget'] {

}`

const JIRAServiceDeskWidget: React.FC = () => {
    const { publicRuntimeConfig } = getConfig()
    const { JSDWDataKey } = publicRuntimeConfig
    return JSDWDataKey ? (
        <>
            <style>{JSDWcss}</style>
            <script data-jsd-embedded data-key={JSDWDataKey} data-base-url="https://jsd-widget.atlassian.com" src="https://jsd-widget.atlassian.com/assets/embed.js"></script>
        </>
    ) : null
}

export default JIRAServiceDeskWidget
