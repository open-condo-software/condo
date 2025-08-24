import { useCallback, useEffect, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { useAudio } from '@condo/domains/common/hooks/useAudio'
import { useBroadcastChannel } from '@condo/domains/common/hooks/useBroadcastChannel'
import { useExecuteWithLock } from '@condo/domains/common/hooks/useExecuteWithLock'
import { useUserMessagesList } from '@condo/domains/notification/contexts/UserMessagesListContext'


const getCurrentFaviconHref = () => document.getElementById('favicon').getAttribute('href')
const changeFavicon = (href: string) => document.getElementById('favicon').setAttribute('href', href)
const getNewMessageFaviconHref = (newMessagesCount: number) => {
    return newMessagesCount > 9
        ? '/favicons/infinity.svg'
        : `/favicons/${newMessagesCount}.svg`
}

const TAB_WITH_AUDIO_LOCK_NAME = 'tab-with-audio'
const CLEAR_NEW_MESSAGES_TITLE_BROADCAST_CHANNEL = 'clear-new-messages-title'
const FOCUS_BROADCAST_CHANNEL = 'tab-focus-status'
const TITLE_BLINK_INTERVAL_IN_MS = 3000

// Play audio and update favicon when new notification received
export const useNewMessageTitleNotification = (unreadMessagesCount: number, lastMessageCreatedAt: string): void => {
    const intl = useIntl()
    const NewMessagePageTitle = intl.formatMessage({ id: 'notification.UserMessagesList.newMessagePageTitle' })

    const audio = useAudio()
    const { isNotificationSoundEnabled } = useUserMessagesList()

    const previousMessageCreatedAt = useRef<string>()
    const originalPageTitle = useRef<string>()
    const originalIconHref = useRef<string>()
    const changeTitleInterval = useRef<ReturnType<typeof setInterval>>(null)
    const isNotificationSoundEnabledRef = useRef<boolean>(isNotificationSoundEnabled)

    useEffect(() => {
        isNotificationSoundEnabledRef.current = isNotificationSoundEnabled
    }, [isNotificationSoundEnabled])

    // Lock tab that allowed to play audio
    const isTabWithAudioRef = useRef<boolean>(false)
    useExecuteWithLock(TAB_WITH_AUDIO_LOCK_NAME, () => isTabWithAudioRef.current = true)

    // Audio can played only if no tab focused
    const isAnyTabFocusedRef = useRef<boolean>(false)
    const {
        sendMessageToBroadcastChannel: sendTabFocusStateMessage,
    } = useBroadcastChannel<{ focused: boolean }>(FOCUS_BROADCAST_CHANNEL, (message) => {
        isAnyTabFocusedRef.current = message.focused
    })
    const broadcastFocusStatus = useCallback(() => {
        sendTabFocusStateMessage({ focused: document.hasFocus() })
    }, [sendTabFocusStateMessage])
    useEffect(() => {
        window.addEventListener('focus', broadcastFocusStatus)
        window.addEventListener('click', broadcastFocusStatus)
        window.addEventListener('blur', broadcastFocusStatus)
        return () => {
            window.removeEventListener('focus', broadcastFocusStatus)
            window.removeEventListener('click', broadcastFocusStatus)
            window.removeEventListener('blur', broadcastFocusStatus)
        }
    }, [broadcastFocusStatus])
    useEffect(() => {
        broadcastFocusStatus()
    }, [broadcastFocusStatus])

    // Remember page title for change it back after indicate about new messages
    useEffect(() => {
        if (document.title && document.title !== NewMessagePageTitle) {
            originalPageTitle.current = document.title
        }

        const observer = new MutationObserver(() => {
            if (document.title && document.title !== NewMessagePageTitle) {
                originalPageTitle.current = document.title
            }
        })

        if (document.querySelector('title')) {
            observer.observe(document.querySelector('title'), {
                childList: true,
            })
        }

        return () => {
            observer.disconnect()
        }
    }, [NewMessagePageTitle, lastMessageCreatedAt])

    // Remember page favicon on first load
    useEffect(() => {
        if (!originalIconHref.current) {
            originalIconHref.current = getCurrentFaviconHref()
        }
    }, [])

    useEffect(() => {
        if (unreadMessagesCount === undefined || lastMessageCreatedAt === undefined) {
            return
        }
        if (changeTitleInterval.current) {
            clearInterval(changeTitleInterval.current)
            changeTitleInterval.current = null
        }

        // Do not indicate about new messages when it's first messages load
        if (
            originalPageTitle.current &&
            unreadMessagesCount > 0 &&
            previousMessageCreatedAt.current !== undefined &&
            new Date(previousMessageCreatedAt.current) < new Date(lastMessageCreatedAt)
        ) {
            if (isAnyTabFocusedRef.current) {
                document.title = NewMessagePageTitle
                changeFavicon(getNewMessageFaviconHref(unreadMessagesCount))

                setTimeout(() => {
                    document.title = originalPageTitle.current
                    changeFavicon(originalIconHref.current)
                }, TITLE_BLINK_INTERVAL_IN_MS)
            } else {
                changeTitleInterval.current = setInterval(() => {
                    if (document.title !== originalPageTitle.current) {
                        document.title = originalPageTitle.current
                        changeFavicon(originalIconHref.current)
                    } else {
                        document.title = NewMessagePageTitle
                        changeFavicon(getNewMessageFaviconHref(unreadMessagesCount))
                    }
                }, TITLE_BLINK_INTERVAL_IN_MS)

                if (
                    isNotificationSoundEnabledRef.current &&
                    isTabWithAudioRef.current &&
                    !isAnyTabFocusedRef.current
                ) {
                    audio.playNewItemsFetchedSound()
                }
            }
        }

        previousMessageCreatedAt.current = lastMessageCreatedAt
    }, [lastMessageCreatedAt, unreadMessagesCount])

    const handleBroadcastMessage = useCallback(() => {
        if (changeTitleInterval.current) {
            clearInterval(changeTitleInterval.current)
            changeTitleInterval.current = null
        }
        if (originalPageTitle.current && document.title !== originalPageTitle.current) {
            document.title = originalPageTitle.current
        }
        if (originalIconHref.current) {
            changeFavicon(originalIconHref.current)
        }
    }, [])

    const {
        sendMessageToBroadcastChannel: clearNewMessagesTitleFromAllTabs,
    } = useBroadcastChannel(
        CLEAR_NEW_MESSAGES_TITLE_BROADCAST_CHANNEL,
        handleBroadcastMessage
    )

    // Clear interval and return page title back on page focus
    useEffect(() => {
        const onFocus = () => clearNewMessagesTitleFromAllTabs(true)

        window.addEventListener('focus', onFocus)
        window.addEventListener('click', onFocus)

        return () => {
            window.removeEventListener('focus', onFocus)
            window.removeEventListener('click', onFocus)

            if (changeTitleInterval.current) {
                clearInterval(changeTitleInterval.current)
                changeTitleInterval.current = null
            }
        }
    }, [clearNewMessagesTitleFromAllTabs])
}