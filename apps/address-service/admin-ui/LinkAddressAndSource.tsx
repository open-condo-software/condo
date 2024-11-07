/** @jsx jsx */
/* eslint-disable no-use-before-define */

import { useLazyQuery, useMutation } from '@apollo/client'
import { LoadingButton } from '@arch-ui/button'
import { Card } from '@arch-ui/card'
import { CheckboxPrimitive } from '@arch-ui/controls'
import { Input } from '@arch-ui/input'
import { Container } from '@arch-ui/layout'
import Select from '@arch-ui/select'
import { gridSize } from '@arch-ui/theme'
import { PageTitle } from '@arch-ui/typography'
import { jsx } from '@emotion/core'
import get from 'lodash/get'
import throttle from 'lodash/throttle'
import { useState, useCallback, useMemo, CSSProperties } from 'react'
import { useToasts, ToastProvider } from 'react-toast-notifications'

import { Address, LINK_ADDRESS_AND_SOURCE_MUTATION } from '@address-service/domains/address/gql'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

const formStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    flexDirection: 'column',
}

const labelStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
}

const Page = () => {
    const { addToast } = useToasts()

    const [source, setSource] = useState('')
    const [tin, setTin] = useState('')
    const [addressesOptions, setAddressesOptions] = useState([])
    const [selectedAddress, setSelectedAddress] = useState(null)
    const [parseUnit, setParseUnit] = useState(false)

    const resetForm = useCallback(() => {
        setSource('')
        setTin('')
        setAddressesOptions([])
        setSelectedAddress(null)
        setParseUnit(false)
    }, [])

    const handleSuccess = useCallback(() => {
        resetForm()
        addToast('Source and address successfully linked', {
            appearance: 'success',
            autoDismiss: true,
        })
    }, [addToast, resetForm])

    const handleError = useCallback((e) => {
        addToast(e.message, {
            appearance: 'error',
            autoDismiss: true,
        })
    }, [addToast])

    const [linkAddressAndSource, { loading: loadingSubmit }] = useMutation(LINK_ADDRESS_AND_SOURCE_MUTATION, {
        onCompleted: handleSuccess,
        onError: handleError,
    })

    const [getAddresses, { loading: loadingAddresses }] = useLazyQuery(Address.GET_ALL_OBJS_QUERY, {
        fetchPolicy: 'network-only',
        onError: handleError,
    })
    
    const throttledGetAddresses = useMemo(
        () => throttle(async newAddress => {
            if (!newAddress) return []
            const { data: { objs } } = await getAddresses({ variables: { where: { address_contains_i: newAddress } } })

            return objs.map(({ id, address }) => ({ label: address, value: id }))
        }, 400),
        [getAddresses]
    )

    const handleSubmit = async (e) => {
        e.preventDefault()
        await linkAddressAndSource({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    source,
                    tin,
                    address: { id: get(selectedAddress, 'value') },
                    parseUnit,
                },
            },
        })
    }

    return (
        <Container>
            <PageTitle>Link address and source</PageTitle>
            <Card css={{ maxWidth: `${gridSize * 52}px`, margin: '0 auto' }}>
                <form
                    style={formStyle}
                    onSubmit={handleSubmit}>
                    <Input
                        value={source}
                        onChange={e => setSource(e.target.value)}
                        css={{ width: '100%' }}
                        placeholder='Source'
                        required
                    />
                    <Input
                        value={tin}
                        onChange={e => setTin(e.target.value)}
                        css={{ width: '100%' }}
                        placeholder='TIN'
                    />
                    <Select
                        value={selectedAddress}
                        cacheOptions
                        loadOptions={throttledGetAddresses}
                        defaultOptions
                        isAsync
                        isClearable
                        isLoading={loadingAddresses}
                        css={{ width: '100%' }}
                        required
                        placeholder='Address'
                        options={addressesOptions}
                        onChange={setSelectedAddress}
                    />
                    <label style={labelStyle}>
                        <CheckboxPrimitive
                            checked={parseUnit}
                            onChange={e => setParseUnit(e.target.checked)}
                        />
                        <span>Parse unit</span>
                    </label>
                    <LoadingButton
                        type='submit'
                        variant='bold'
                        appearance='primary'
                        isLoading={loadingSubmit}
                        isDisabled={!selectedAddress || !source}
                        css={{ marginTop: `${gridSize * 3}px` }}
                    >
                    Link address
                    </LoadingButton>
                </form>
            </Card>
        </Container>
    )
}

const LinkAddressAndSource = () => {
    return (
        <ToastProvider>
            <Page/>
        </ToastProvider>
    )
}

export default LinkAddressAndSource
