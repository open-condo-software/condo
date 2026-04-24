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
    max-height: 100vh !important;
    height: fit-content !important;
    z-index: 2147482647 !important;
    cursor: default !important;
    overflow-y: auto !important;
}

@media (max-width: 768px) {
    .ph-survey {
        width: calc(100vw - 32px) !important;
        transform: none !important;
        top: auto !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        min-width: unset !important;
        max-width: unset !important;
        margin: 16px !important;
    }
}

@media (max-width: 480px) {
    .ph-survey {
        width: calc(100vw - 24px) !important;
        margin: 12px !important;
        border-radius: 8px !important;
    }
    
    .survey-form,
    .survey-box {
        gap: 0px !important;
        border-radius: 8px !important;
    }
    
    .form-cancel {
        top: 20px !important;
        right: 20px !important;
    }
    
    .survey-question {
        padding-right: 30px !important;
    }
}

.ph-survey * {
    font-family: 'Wix Madefor Display', -apple-system, BlinkMacSystemFont, Helvetica, sans-serif !important;
}

.survey-form {
    border-radius: 12px !important;
    background: white !important;
    border: none !important;
    position: relative !important;
    height: fit-content !important
}

.survey-box {
    border-radius: 12px !important;
    background: white !important;
    padding: 0 16px !important;
}

.thank-you-message {
    padding: 40px !important;
}

.question-header,
.thank-you-message-header {
    margin-bottom: 16px !important;
    text-align: left !important;
}

.survey-question {
    padding-right: 40px !important;
}

.thank-you-message-header {
    font-size: 24px !important;
    font-weight: 600 !important;
    margin: 0 0 8px 0 !important;
}

.survey-question,
.thank-you-message-header > h3 {
    font-size: 24px !important;
    font-weight: 600 !important;
    margin: 0 0 40px 0 !important;
}

.survey-question-description,
.thank-you-message-header p {
    font-size: 14px !important;
    line-height: 1.5715 !important;
    margin: 0 !important;
}

.form-cancel {
    position: absolute !important;
    top: 30px !important;
    right: 40px !important;
    border: none !important;
    background: transparent !important;
    transform: none !important;
    padding: 8px !important;
    cursor: pointer !important;
    z-index: 10 !important;
}

.form-cancel:hover {
    border-radius: 8px !important;
}

.form-cancel svg {
    width: 12px !important;
    height: 12px !important;
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
    font-size: 16px !important;
    min-width: 120px !important;
    padding: 12px 20px !important;
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
