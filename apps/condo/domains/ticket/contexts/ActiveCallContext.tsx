import { notification } from 'antd'
import isUndefined from 'lodash/isUndefined'
import { createContext, useContext, useEffect, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { usePostMessageContext } from '@condo/domains/common/components/PostMessageProvider'

import type { FC, PropsWithChildren } from 'react'

interface IActiveCallContext {
    isCallActive: boolean
    connectedTickets: Array<string>
}

const ActiveCallContext = createContext<IActiveCallContext>({
    isCallActive: false,
    connectedTickets: [],
})

const useActiveCall = (): IActiveCallContext => useContext(ActiveCallContext)

const ActiveCallContextProvider: FC<PropsWithChildren> = ({ children }) => {
    const inlt = useIntl()
    const SavedNotificationMessage = inlt.formatMessage({ id: 'callRecord.savedNotification.message' })
    const SavedNotificationDescription = inlt.formatMessage({ id: 'callRecord.savedNotification.description' })
    const SavedNotificationDescriptionLink = inlt.formatMessage({ id: 'callRecord.savedNotification.descriptionLink' })
    const SaveErrorNotificationMessage = inlt.formatMessage({ id: 'callRecord.saveErrorNotification.message' })
    const SaveErrorNotificationDescription = inlt.formatMessage({ id: 'callRecord.saveErrorNotification.description' })

    const { addEventHandler } = usePostMessageContext()

    const [isCallActive, setIsCallActive] = useState(false)
    const [connectedTickets, setConnectedTickets] = useState([])

    useEffect(() => {
        if (isUndefined(window)) {
            return
        }

        addEventHandler('CondoWebSetActiveCall', '*', ({
            isCallActive: newCallState, connectedTickets, error,
        }) => {
            setIsCallActive(newCallState)
            setConnectedTickets(connectedTickets)

            if (isCallActive && !newCallState) {
                error ?
                    notification.warning({
                        message: SaveErrorNotificationMessage,
                        description: SaveErrorNotificationDescription,
                    }) :
                    notification.info({
                        message: SavedNotificationMessage,
                        description: (
                            <Typography.Text size='medium'>
                                {SavedNotificationDescription}&nbsp;
                                <Typography.Link href='/callRecord'>{SavedNotificationDescriptionLink}</Typography.Link>
                            </Typography.Text>
                        ),
                    })
            }

            return { sent: !!error }
        })
    }, [SaveErrorNotificationDescription, SaveErrorNotificationMessage, SavedNotificationDescription, SavedNotificationDescriptionLink, SavedNotificationMessage, addEventHandler, isCallActive])

    return (
        <ActiveCallContext.Provider
            value={{
                isCallActive,
                connectedTickets,
            }}
        >
            {children}
        </ActiveCallContext.Provider>
    )
}

export { useActiveCall, ActiveCallContextProvider }