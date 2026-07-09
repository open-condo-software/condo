import {
    useGetUserFavoriteTicketsQuery,
    useGetUserFavoriteTicketsCountQuery,
    GetUserFavoriteTicketsQuery,
} from '@app/condo/gql'
import { createContext, useContext, useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useAuth } from '@open-condo/next/auth'


interface IFavoriteTicketsContext {
    userFavoriteTickets: GetUserFavoriteTicketsQuery['userFavoriteTickets']
    userFavoriteTicketsCount: number
    loading: boolean
    refetchFavoriteTickets: () => void
}

const FavoriteTicketsContext = createContext<IFavoriteTicketsContext>({
    userFavoriteTickets: [],
    userFavoriteTicketsCount: 0,
    loading: false,
    refetchFavoriteTickets: () => {
        return
    },
})

const useFavoriteTickets = (): IFavoriteTicketsContext => useContext(FavoriteTicketsContext)

const FavoriteTicketsContextProvider = ({ children, extraTicketsQuery = {}, organizationId = null, first, skip: skipProp = false }) => {
    const { user } = useAuth()
    const { persistor } = useCachePersistor()

    const skip = !persistor || !user || skipProp

    const {
        data: userFavoriteTicketsData,
        refetch: refetchFavoriteTickets,
        loading,
    } = useGetUserFavoriteTicketsQuery({
        variables: {
            userId: user?.id,
            ticketWhere: extraTicketsQuery,
            first,
        },
        skip,
    })

    const { data: countData } = useGetUserFavoriteTicketsCountQuery({
        variables: {
            userId: user?.id,
            ticketWhere: organizationId ? { organization: { id: organizationId } } : undefined,
        },
        skip,
    })

    const userFavoriteTickets = useMemo(() => userFavoriteTicketsData?.userFavoriteTickets?.filter(Boolean) || [],
        [userFavoriteTicketsData?.userFavoriteTickets])
    const userFavoriteTicketsCount = useMemo(() => countData?.meta?.count,
        [countData?.meta?.count])

    return (
        <FavoriteTicketsContext.Provider
            value={{
                userFavoriteTickets,
                userFavoriteTicketsCount,
                refetchFavoriteTickets,
                loading: skipProp || loading,
            }}
        >
            {children}
        </FavoriteTicketsContext.Provider>
    )
}

export { useFavoriteTickets, FavoriteTicketsContextProvider }
