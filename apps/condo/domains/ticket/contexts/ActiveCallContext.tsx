import { notification } from 'antd'
import axios from 'axios'
import get from 'lodash/get'
import isUndefined from 'lodash/isUndefined'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { usePostMessageContext } from '@condo/domains/common/components/PostMessageProvider'
import { CallRecord, CallRecordFragment } from '@condo/domains/ticket/utils/clientSchema'


const ACTIVE_CALL_KEY = 'activeCall'

type ActiveCallType = {
    callId: string,
    ticketIds: string[]
}

class ActiveCallLocalStorageManager {
    public getActiveCall (): ActiveCallType {
        if (typeof window === 'undefined') return

        try {
            return JSON.parse(localStorage.getItem(ACTIVE_CALL_KEY))
        } catch (e) {
            console.log(e)
        }
    }

    public createActiveCall (callId: string) {
        console.log('localStorage createActiveCall', callId, typeof window === 'undefined')
        if (typeof window === 'undefined') return

        try {
            if (callId) {
                localStorage.setItem(ACTIVE_CALL_KEY, JSON.stringify({ callId }))
            }
        } catch (e) {
            console.error(e)
        }
    }

    public connectTicketToActiveCall (ticketId: string) {
        if (typeof window === 'undefined') return

        try {
            console.log('connectTicketToActiveCall', ticketId)

            const activeCall = this.getActiveCall()
            const newTicketIds = [...get(activeCall, 'ticketIds', []), ticketId]

            console.log('connectTicketToActiveCall newTicketIds', newTicketIds, JSON.stringify({ ...activeCall, ticketIds: newTicketIds }))

            localStorage.setItem(ACTIVE_CALL_KEY, JSON.stringify({ ...activeCall, ticketIds: newTicketIds }))
        } catch (e) {
            console.error(e)
        }
    }

    public removeActiveCall () {
        if (typeof window === 'undefined') return

        localStorage.removeItem(ACTIVE_CALL_KEY)
    }
}

interface IActiveCallContext {
    isCallActive: boolean
    connectedTickets: Array<string>

    attachTicketToActiveCall: (ticketId: string) => void
}

const ActiveCallContext = createContext<IActiveCallContext>({
    isCallActive: false,
    connectedTickets: [],

    attachTicketToActiveCall: null,
})

const useActiveCall = (): IActiveCallContext => useContext(ActiveCallContext)

const ActiveCallContextProvider = ({ children = {} }) => {
    const inlt = useIntl()
    const SavedNotificationMessage = inlt.formatMessage({ id: 'callRecord.savedNotification.message' })
    const SavedNotificationDescription = inlt.formatMessage({ id: 'callRecord.savedNotification.description' })
    const SavedNotificationDescriptionLink = inlt.formatMessage({ id: 'callRecord.savedNotification.descriptionLink' })
    const SaveErrorNotificationMessage = inlt.formatMessage({ id: 'callRecord.saveErrorNotification.message' })
    const SaveErrorNotificationDescription = inlt.formatMessage({ id: 'callRecord.saveErrorNotification.description' })

    const { addEventHandler } = usePostMessageContext()
    const { organization } = useOrganization()

    const [isCallActive, setIsCallActive] = useState(false)
    const [connectedTickets, setConnectedTickets] = useState([])

    const createCallRecordAction = CallRecord.useCreate({})
    const createCallRecordFragmentAction = CallRecordFragment.useCreate({})

    // const [activeCall, setActiveCall] = useState<ActiveCallType>()

    const localStorageManager = useMemo(() => new ActiveCallLocalStorageManager(), [])
    const attachTicketToActiveCall = useCallback((ticketId: string) => {
        localStorageManager.connectTicketToActiveCall(ticketId)
        const newTickets = [...connectedTickets, ticketId]

        setConnectedTickets(newTickets)
    }, [connectedTickets, localStorageManager])

    useEffect(() => {
        if (typeof window !== 'undefined' && !isCallActive) {
            const initialActiveCall = localStorageManager.getActiveCall()

            setIsCallActive(!!get(initialActiveCall, 'callId', false))
            setConnectedTickets(get(initialActiveCall, 'ticketIds', []))
        }
    }, [isCallActive, localStorageManager])

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

        addEventHandler('CondoWebAppSetActiveCall', '*', ({
            callId,
        }) => {
            console.log('CondoWebAppSetActiveCall', callId)

            // setActiveCall({ callId, ticketIds: [] })
            setIsCallActive(true)
            localStorageManager.createActiveCall(callId)

            return { sent: !!callId }
        })

        addEventHandler('CondoWebAppSaveCallRecord', '*', async ({
            callId, fileUrl, startedAt, callerPhone, destCallerPhone, talkTime, isIncomingCall,
        }) => {
            try {
                const response = await axios.get(fileUrl, { responseType: 'blob' })
                const fileName = fileUrl.split('/').reverse()[0]
                const file = new File([response.data], fileName, {
                    type: response.headers['content-type'],
                })
                const activeCall = localStorageManager.getActiveCall()
                const activeCallIdFromStorage = get(activeCall, 'callId')
                const activeCallTicketIds = get(activeCall, 'ticketIds', [])

                if (activeCallIdFromStorage !== callId) return { sent: false }

                console.log('organization', organization.id)

                const callRecord = await createCallRecordAction({
                    organization: { connect: { id: get(organization, 'id') } },
                    file,
                    importId: callId,
                    startedAt,
                    callerPhone,
                    destCallerPhone,
                    talkTime,
                    isIncomingCall,
                })

                for (const ticketId of activeCallTicketIds) {
                    await createCallRecordFragmentAction({
                        ticket: { connect: { id: ticketId } },
                        callRecord: { connect: { id: callRecord.id } },
                        startedAt,
                    })
                }

                return { sent: true }
            } finally {
                setIsCallActive(false)
                setConnectedTickets([])
                localStorageManager.removeActiveCall()
            }
        })

    }, [
        SaveErrorNotificationDescription, SaveErrorNotificationMessage, SavedNotificationDescription,
        SavedNotificationDescriptionLink, SavedNotificationMessage, addEventHandler, isCallActive, localStorageManager,
        organization,
    ])

    return (
        <ActiveCallContext.Provider
            value={{
                attachTicketToActiveCall,

                isCallActive,
                connectedTickets,
            }}
        >
            {children}
        </ActiveCallContext.Provider>
    )
}

export { useActiveCall, ActiveCallContextProvider }