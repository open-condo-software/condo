import { useMemo } from 'react'
import { z } from 'zod'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'

import { CHAT_WITH_CONDO_BUTTON_CONFIG } from '@condo/domains/common/constants/featureflags'

export type ChatWithCondoScenarioButton = {
    buttonId: string
    buttonName: string
    buttonDescription: string
}

export type ChatWithCondoButtonConfig = {
    welcomeMessage: string
    buttons: ChatWithCondoScenarioButton[]
}

const ButtonConfigFlagObjectSchema = z.preprocess((raw) => {
    if (typeof raw !== 'string') return raw

    try {
        return JSON.parse(raw)
    } catch {
        return null
    }
}, z.record(z.string(), z.unknown()))

export function useChatWithCondoButtonConfig (): ChatWithCondoButtonConfig | null {
    const { useFlagValue } = useFeatureFlags()
    const raw = useFlagValue<unknown>(CHAT_WITH_CONDO_BUTTON_CONFIG)

    return useMemo(() => {
        if (raw === null || raw === undefined || raw === false) return null

        const objectResult = ButtonConfigFlagObjectSchema.safeParse(raw)
        if (!objectResult.success) return null

        const value = objectResult.data
        const welcomeMessage = z.string().trim().safeParse(value.welcome_message)
        const buttonsRaw = z.array(z.unknown()).safeParse(value.buttons)
        const buttons: ChatWithCondoScenarioButton[] = buttonsRaw.success
            ? buttonsRaw.data
                .map((item) => {
                    const rowResult = z.record(z.string(), z.unknown()).safeParse(item)
                    if (!rowResult.success) return null

                    const row = rowResult.data
                    const buttonIdRaw = row.button_id
                    const buttonId = buttonIdRaw !== undefined && buttonIdRaw !== null
                        ? String(buttonIdRaw).trim()
                        : ''
                    const buttonName = z.string().trim().safeParse(row.button_name)
                    const buttonDescription = z.string().trim().safeParse(row.button_description)

                    if (!buttonId || !buttonName.success || !buttonName.data) {
                        return null
                    }

                    return {
                        buttonId,
                        buttonName: buttonName.data,
                        buttonDescription: buttonDescription.success ? buttonDescription.data : '',
                    }
                })
                .filter((button): button is ChatWithCondoScenarioButton => button !== null)
            : []

        const parsedWelcomeMessage = welcomeMessage.success ? welcomeMessage.data : ''
        if (!parsedWelcomeMessage && buttons.length === 0) {
            return null
        }

        return {
            welcomeMessage: parsedWelcomeMessage,
            buttons,
        }
    }, [raw])
}
