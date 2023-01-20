import { createContext, useContext } from 'react'

import { AddressApi, IAddressApi } from '../utils/addressApi'

type AddressApiContextValueType = {
    addressApi: IAddressApi | null,
}

const AddressApiContext = createContext<AddressApiContextValueType>({ addressApi: new AddressApi() })

export const useAddressApi = () => useContext(AddressApiContext)
