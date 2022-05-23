import React from 'react'

/**
 * Here you can override the css for the widget
 */
const JSDWcss = `
iframe[name='JSD widget'] {

}`

const JIRAServiceDeskWidget: React.FC = () => {
    return (
        <>
            <style>{JSDWcss}</style>
            <script data-jsd-embedded data-key="b2cc2738-0f95-44f1-9c26-78b29d2890cb" data-base-url="https://jsd-widget.atlassian.com" src="https://jsd-widget.atlassian.com/assets/embed.js"></script>
        </>
    )
}

export default JIRAServiceDeskWidget
