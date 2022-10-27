import React, { useContext, useMemo, useState } from 'react'
import { Modal } from '../Modal'

interface ISearchByPhoneContext {
    isSearchByPhoneModalVisible?: boolean
    setIsSearchByPhoneModalVisible?: React.Dispatch<React.SetStateAction<boolean>>
}

const SearchByPhoneContext = React.createContext<ISearchByPhoneContext>({})

export const useSearchByPhone = () => useContext<ISearchByPhoneContext>(SearchByPhoneContext)

const SearchByPhoneContextProvider: React.FC = (props) => {
    const [isSearchByPhoneModalVisible, setIsSearchByPhoneModalVisible] = useState<boolean>(false)

    return (
        <SearchByPhoneContext.Provider value={{
            isSearchByPhoneModalVisible,
            setIsSearchByPhoneModalVisible,
        }}>
            {props.children}
        </SearchByPhoneContext.Provider>
    )
}

export const withSearchByPhone = PageComponent => props => (
    <SearchByPhoneContextProvider>
        <PageComponent {...props} />
    </SearchByPhoneContextProvider>
)

export const useTest = () => {
    const [isSearchByPhoneModalVisible, setIsSearchByPhoneModalVisible] = useState<boolean>(false)

    const SearchByPhoneModal = useMemo(() => (
        <Modal
            visible={isSearchByPhoneModalVisible}
            title='sex'
            onCancel={() => setIsSearchByPhoneModalVisible(false)}
        />
    ), [isSearchByPhoneModalVisible])

    return { isSearchByPhoneModalVisible, setIsSearchByPhoneModalVisible, SearchByPhoneModal }
}
