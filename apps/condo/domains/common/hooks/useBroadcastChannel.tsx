import { useCallback, useEffect, useRef } from 'react'


type UseBroadcastChannelOptions = {
    sendInCurrentTab?: boolean
}

const DEFAULT_OPTIONS: UseBroadcastChannelOptions = {
    sendInCurrentTab: true,
}

export function useBroadcastChannel<T> (
    channelName: string,
    onMessageReceived: (message?: T) => void,
    options: UseBroadcastChannelOptions = DEFAULT_OPTIONS
) {
    const { sendInCurrentTab } = options

    const messageSender = useRef<BroadcastChannel | null>(null)
    const messageReceiver = useRef<BroadcastChannel | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.BroadcastChannel === 'undefined') return

        messageSender.current = new BroadcastChannel(channelName)
        messageReceiver.current = sendInCurrentTab ? new BroadcastChannel(channelName) : messageSender.current

        messageReceiver.current.onmessage = (event) => onMessageReceived(event.data)

        return () => {
            messageSender.current.close()
            if (sendInCurrentTab) {
                messageReceiver.current.close()
            }

            messageSender.current = null
            messageReceiver.current = null
        }
    }, [channelName, onMessageReceived, sendInCurrentTab])

    const sendMessageToBroadcastChannel = useCallback((message?: T) => {
        if (messageSender.current) {
            messageSender.current.postMessage(message)
        }
    }, [messageSender])

    return {
        sendMessageToBroadcastChannel,
    }
}