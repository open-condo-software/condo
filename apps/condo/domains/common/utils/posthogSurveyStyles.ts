/**
 * Custom styles for PostHog surveys
 * These styles are injected into the Shadow DOM to override default PostHog styles
 */

export const POSTHOG_SURVEY_STYLES = `
.survey-backdrop {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: rgba(0, 0, 0, 0.5) !important;
    z-index: 2147482646 !important;
    cursor: pointer !important;
}

.ph-survey {
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    right: auto !important;
    bottom: auto !important;
    transform: translate(-50%, -50%) !important;
    border-radius: 12px !important;
    max-width: 600px !important;
    min-width: 500px !important;
    width: 50vw !important;
    min-height: 400px !important;
    z-index: 2147482647 !important;
    cursor: default !important;
}

.survey-form {
    border-radius: 12px !important;
    overflow: hidden !important;
    background: white !important;
    position: relative !important;
    height: 100% !important
}

.survey-box {
    border-radius: 12px !important;
    background: white !important;
    padding: 16px !important;
}

.thank-you-message {
    padding: 40px !important;
}

.question-header,
.thank-you-message-header {
    margin-bottom: 16px !important;
    padding-right: 40px !important;
    text-align: left !important;
}

.thank-you-message-header {
    font-size: 24px !important;
    font-weight: 600 !important;
    line-height: 1.3 !important;
    margin: 0 0 8px 0 !important;
}

.survey-question,
.thank-you-message-header > h3 {
    font-size: 24px !important;
    font-weight: 600 !important;
    line-height: 1.3 !important;
    margin: 0 0 8px 0 !important;
}

.survey-question-description,
.thank-you-message-header p {
    font-size: 16px !important;
    line-height: 1.5 !important;
    margin: 0 !important;
    color: rgba(0, 0, 0, 0.65) !important;
}

.form-cancel {
    position: absolute !important;
    top: 40px !important;
    right: 40px !important;
    border: none !important;
    background: transparent !important;
    transform: none !important;
    padding: 4px !important;
    cursor: pointer !important;
    z-index: 10 !important;
}

.form-cancel:hover {
    border-radius: 8px !important;
}

.form-cancel svg {
    width: 20px !important;
    height: 20px !important;
    transform: none !important;
}

.question-container {
    margin-bottom: 24px !important;
}

.question-container textarea {
    border-radius: 8px !important;
    min-height: 120px !important;
    margin-top: 16px !important;
}

.bottom-section {
    display: flex !important;
    align-items: end !important;
    justify-content: flex-end !important;
}

.form-submit {
    border-radius: 8px !important;
    width: auto !important;
    min-width: 120px !important;
}

.footer-branding {
    display: none !important;
}
`

export function injectPostHogSurveyStyles (surveyElement?: Element | null): void {
    const element = surveyElement || document.querySelector('[class*="PostHogSurvey-"]')
    
    if (!element?.shadowRoot) {
        return
    }

    const existingStyle = element.shadowRoot.querySelector('#custom-survey-styles')
    if (existingStyle) {
        return
    }

    const styleElement = document.createElement('style')
    styleElement.id = 'custom-survey-styles'
    styleElement.textContent = POSTHOG_SURVEY_STYLES

    element.shadowRoot.appendChild(styleElement)
}

export function createSurveyBackdrop (surveyElement?: Element | null): void {
    const element = surveyElement || document.querySelector('[class*="PostHogSurvey-"]')
    
    if (!element?.shadowRoot) {
        return
    }

    const existingBackdrop = element.shadowRoot.querySelector('.survey-backdrop')
    if (existingBackdrop) {
        return
    }

    const backdrop = document.createElement('div')
    backdrop.className = 'survey-backdrop'
    
    backdrop.addEventListener('click', () => {
        const closeButton = element.shadowRoot?.querySelector('.form-cancel') as HTMLButtonElement
        if (closeButton) {
            closeButton.click()
        }
    })

    const firstChild = element.shadowRoot.firstChild
    if (firstChild) {
        element.shadowRoot.insertBefore(backdrop, firstChild)
    } else {
        element.shadowRoot.appendChild(backdrop)
    }
}

export function clearPostHogInlineStyles (surveyElement?: Element | null): void {
    const element = surveyElement || document.querySelector('[class*="PostHogSurvey-"]')
    
    if (!element) {
        return
    }

    element.removeAttribute('style')
}
