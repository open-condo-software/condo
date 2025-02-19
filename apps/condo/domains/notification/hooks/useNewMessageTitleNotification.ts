import { useCallback, useEffect, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { useAudio } from '@condo/domains/common/hooks/useAudio'
import { useBroadcastChannel } from '@condo/domains/common/hooks/useBroadcastChannel'


const getCurrentFaviconHref = () => document.getElementById('favicon').getAttribute('href')
const changeFavicon = (href: string) => document.getElementById('favicon').setAttribute('href', href)
const getNewMessageFaviconHref = (newMessagesCount: number) => {
    return newMessagesCount > 9
        ? '/favicons/infinity.svg'
        : `/favicons/${newMessagesCount}.svg`
}

const CLEAR_NEW_MESSAGES_TITLE_BROADCAST_CHANNEL = 'clear-new-messages-title'
const TITLE_BLINK_INTERVAL_IN_MS = 3000

// Play audio and update favicon when new notification received
export const useNewMessageTitleNotification = (unreadMessagesCount: number): void => {
    const intl = useIntl()
    const NewMessagePageTitle = intl.formatMessage({ id: 'notification.UserMessagesList.newMessagePageTitle' })

    const audio = useAudio()
    const unreadMessagesCountRef = useRef<number>()
    const previousMessagesCount = useRef<number>()
    const originalPageTitle = useRef<string>()
    const originalIconHref = useRef<string>()
    const changeTitleInterval = useRef<ReturnType<typeof setInterval>>(null)

    useEffect(() => {
        unreadMessagesCountRef.current = unreadMessagesCount
    }, [unreadMessagesCount])

    // Remember page title for change it back after indicate about new messages
    useEffect(() => {
        if (typeof window === 'undefined') return

        if (document.title !== NewMessagePageTitle) {
            originalPageTitle.current = document.title
        }

        const observer = new MutationObserver(() => {
            if (document.title !== NewMessagePageTitle) {
                originalPageTitle.current = document.title
            }
        })

        if (document.querySelector('title')) {
            observer.observe(document.querySelector('title'), {
                childList: true,
            })
        }

        return () => observer.disconnect()
    }, [NewMessagePageTitle])

    // Remember page favicon on first load
    useEffect(() => {
        if (typeof window === 'undefined') return

        if (!originalIconHref.current) {
            originalIconHref.current = getCurrentFaviconHref()
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined' || unreadMessagesCountRef.current === undefined) {
            return
        }

        // Do not indicate about new messages when it's first messages load
        if (
            previousMessagesCount.current !== undefined &&
            unreadMessagesCountRef.current > previousMessagesCount.current
        ) {
            if (document.hasFocus()) {
                document.title = NewMessagePageTitle
                changeFavicon(getNewMessageFaviconHref(unreadMessagesCountRef.current))

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
                        changeFavicon(getNewMessageFaviconHref(unreadMessagesCountRef.current))
                    }
                }, TITLE_BLINK_INTERVAL_IN_MS)

                audio.playNewItemsFetchedSound()
            }
        }

        previousMessagesCount.current = unreadMessagesCountRef.current
    }, [NewMessagePageTitle, audio])

    const handleBroadcastMessage = useCallback(() => {
        clearInterval(changeTitleInterval.current)
        changeTitleInterval.current = null

        document.title = originalPageTitle.current
        changeFavicon(originalIconHref.current)
    }, [])

    const {
        sendMessageToBroadcastChannel: clearNewMessagesTitleFromAllTabs,
    } = useBroadcastChannel(
        CLEAR_NEW_MESSAGES_TITLE_BROADCAST_CHANNEL,
        handleBroadcastMessage
    )

    // Clear interval and return page title back on page focus
    useEffect(() => {
        if (typeof window === 'undefined') return

        const onFocus = () => clearNewMessagesTitleFromAllTabs(true)

        window.addEventListener('focus', onFocus)
        window.addEventListener('mousemove', onFocus)

        return () => {
            window.removeEventListener('focus', onFocus)
            window.removeEventListener('mousemove', onFocus)

            if (changeTitleInterval.current) {
                clearInterval(changeTitleInterval.current)
                changeTitleInterval.current = null
            }
        }
    }, [clearNewMessagesTitleFromAllTabs])
}