import { UserFavoriteTicket as TUserFavoriteTicket } from '@app/condo/schema'
import { createContext, useContext } from 'react'

import { UserFavoriteTicket } from '@condo/domains/ticket/utils/clientSchema'

import { useAuth } from '@/domains/common/utils/next/auth'


interface IFavoriteTicketsContext {
    userFavoriteTickets: TUserFavoriteTicket[]
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

    const {
        objs: userFavoriteTickets,
        count: userFavoriteTicketsCount,
        refetch: refetchFavoriteTickets,
        loading,
    } = UserFavoriteTicket.useAllObjects({
        where: {
            user: { id: user.id },
            ticket: extraTicketsQuery,
        },
    })

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