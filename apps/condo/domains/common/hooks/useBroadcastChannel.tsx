import { useCallback, useEffect, useMemo, useRef } from 'react'


type UseBroadcastChannelOptions = {
    sendInCurrentTab?: boolean
}

const DEFAULT_OPTIONS: UseBroadcastChannelOptions = {
    sendInCurrentTab: true,
}

export function useBroadcastChannel (
    channelName: string,
    onMessageReceived: (message: any) => void,
    options: UseBroadcastChannelOptions = DEFAULT_OPTIONS
) {
    const { sendInCurrentTab } = options

    const messageSender = useRef<BroadcastChannel | null>(null)
    const messageReceiver = useRef<BroadcastChannel | null>(null)

    useEffect(() => {
        messageSender.current = new BroadcastChannel(channelName)
        messageReceiver.current = sendInCurrentTab ? new BroadcastChannel(channelName) : messageSender.current

        messageReceiver.current.onmessage = (event) => onMessageReceived(event.data)

        return () => {
            if (messageSender.current) {
                messageSender.current.close()
            }
            if (messageReceiver.current) {
                messageReceiver.current.close()
            }
        }
    }, [channelName, onMessageReceived, sendInCurrentTab])

    const sendMessage = useCallback((message) => {
        messageSender.current.postMessage(message)
    }, [messageSender])

    return {
        sendMessage,
    }
}