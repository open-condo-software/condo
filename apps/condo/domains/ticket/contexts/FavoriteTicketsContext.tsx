import { 
    useGetUserFavoriteTicketsQuery,
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

const FavoriteTicketsContextProvider = ({ children, extraTicketsQuery = {} }) => {
    const { user } = useAuth()
    const { persistor } = useCachePersistor()

    const {
        data: userFavoriteTicketsData,
        refetch: refetchFavoriteTickets,
        loading,
    } = useGetUserFavoriteTicketsQuery({
        variables: {
            userId: user?.id,
            ticketWhere: extraTicketsQuery,
        },
        skip: !persistor || !user,
    })
    const userFavoriteTickets = useMemo(() => userFavoriteTicketsData?.userFavoriteTickets?.filter(Boolean) || [],
        [userFavoriteTicketsData?.userFavoriteTickets])
    const userFavoriteTicketsCount = useMemo(() => userFavoriteTicketsData?.meta?.count,
        [userFavoriteTicketsData?.meta?.count])

    return (
        <FavoriteTicketsContext.Provider
            value={{
                userFavoriteTickets,
                userFavoriteTicketsCount,
                refetchFavoriteTickets,
                loading,
            }}
        >
            {children}
        </FavoriteTicketsContext.Provider>
    )
}

export { useFavoriteTickets, FavoriteTicketsContextProvider }