/** @jsx jsx */
/* eslint-disable no-use-before-define */

import { useLazyQuery, useMutation } from '@apollo/client'
import { LoadingButton } from '@arch-ui/button'
import { CheckboxPrimitive } from '@arch-ui/controls'
import { Input } from '@arch-ui/input'
import { Container } from '@arch-ui/layout'
import Select from '@arch-ui/select'
import { gridSize } from '@arch-ui/theme'
import { PageTitle } from '@arch-ui/typography'
import { jsx } from '@emotion/core'
import { useToasts } from '@keystonejs/app-admin-ui/node_modules/react-toast-notifications'
import get from 'lodash/get'
import throttle from 'lodash/throttle'
import { useEffect, useState, useCallback, useMemo } from 'react'

import { Address, LINK_ADDRESS_AND_SOURCE_MUTATION } from '@address-service/domains/address/gql'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

const LinkAddressAndSource = () => {
    const [source, setSource] = useState('')
    const [tin, setTin] = useState('')
    const [addressesOptions, setAddressesOptions] = useState([])
    const [selectedAddress, setSelectedAddress] = useState(null)
    const [parseUnit, setParseUnit] = useState(false)
    const { addToast } = useToasts()

    const resetForm = () => {
        setSource('')
        setTin('')
        setAddressesOptions([])
        setSelectedAddress(null)
        setParseUnit(false)
    }

    const [linkAddressAndSource, { loading: loadingSubmit, error: errorSubmit }] = useMutation(LINK_ADDRESS_AND_SOURCE_MUTATION, {
        onCompleted: resetForm,
    })

    const [getAddresses, { loading: loadingAddresses, error: errorAddresses }] = useLazyQuery(Address.GET_ALL_OBJS_QUERY, {
        fetchPolicy: 'network-only',
        onCompleted: ({ objs: addresses }) => {
            setAddressesOptions(addresses.map(({ id, address }) => ({ label: address, value: id })))
        },
    })

    const getAddressesQueryThrottled = useMemo(() => throttle((newSource) => {
        getAddresses({ variables: { where: { address_contains_i: newSource } } })
    }, 400), [getAddresses])

    useEffect(() => {
        if (source) getAddressesQueryThrottled(source)
    }, [source, getAddressesQueryThrottled])

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault()
        await linkAddressAndSource({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    source,
                    tin,
                    address: get(selectedAddress, 'value'),
                    parseUnit,
                },
            },
        })
        addToast('Source and address is successfully linked', {
            appearance: 'success',
            autoDismiss: true,
        })
    }, [linkAddressAndSource, source, tin, selectedAddress, parseUnit])

    return (
        <Container>
            <PageTitle>Link address and source</PageTitle>
            <form css={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '.5rem',
                flexDirection: 'column',
                padding: '1rem',
                marginBottom: `${gridSize * 3}px`,
            }}
            onSubmit={handleSubmit}>
                <Input
                    value={source}
                    onChange={e => setSource(e.target.value)}
                    css={{ width: '100%' }}
                    placeholder='Source'
                />
                <Input
                    value={tin}
                    onChange={e => setTin(e.target.value)}
                    css={{ width: '100%' }}
                    placeholder='TIN'
                />
                <Select
                    value={selectedAddress}
                    isClearable
                    isLoading={loadingAddresses}
                    css={{ width: '100%' }}
                    required
                    isDisabled={errorAddresses}
                    placeholder='Address'
                    options={addressesOptions}
                    onChange={setSelectedAddress}
                />
                <label css={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
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
                >
                    Save
                </LoadingButton>
                {errorSubmit && <span css={{ color: 'red' }}>{errorSubmit.message}</span>}
                {errorAddresses && <span css={{ color: 'red' }}>{errorAddresses.message}</span>}
            </form>
        </Container>
    )
}

export default LinkAddressAndSource
