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
import { throttle } from 'lodash'
import { Fragment, useEffect, useMemo, useState } from 'react'

import { Address, LINK_ADDRESS_AND_SOURCE_MUTATION } from '@address-service/domains/address/gql'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

const LinkAddressAndSource = () => {
    const [source, setSource] = useState('')
    const [tin, setTin] = useState('')
    const [addressesOptions, setAddressesOptions] = useState([])
    const [selectedAddress, setSelectedAddress] = useState(null)
    const [withUnitName, setWithUnitName] = useState(false)

    const reset = () => {
        setSource('')
        setTin('')
        setAddressesOptions([])
        setSelectedAddress({ label: null, value: null })
        setWithUnitName(false)
    }

    const [linkAddressAndSource, { loading: loadingSubmit, error: errorSubmit }] = useMutation(LINK_ADDRESS_AND_SOURCE_MUTATION,
        {
            onCompleted: reset,
        }
    )
    const [getAddresses, { error: errorAddresses }] = useLazyQuery(Address.GET_ALL_OBJS_QUERY, {
        fetchPolicy: 'network-only',
        onCompleted: ({ objs: addresses }) => {
            setAddressesOptions(addresses.map(({ id, address }) => ({ label: address, value: id })))
        },
    })

    const getAddressesQueryThrottled = useMemo(() => {
        return throttle((newSource) => {
            getAddresses({ variables: { where: { address_contains_i: newSource } } })
        }, 400)
    }, [getAddresses])

    useEffect(() => {
        if (source) getAddressesQueryThrottled(source)
    }, [source, getAddressesQueryThrottled])

    const submit = async () => {
        await linkAddressAndSource({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    source,
                    tin,
                    address: selectedAddress,
                    withUnitName,
                },
            },
        })
    }

    return (
        <Fragment>
            <Container>
                <PageTitle>Link address and source</PageTitle>
                <form
                    css={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '.5rem',
                        flexDirection: 'column',
                        padding: '1rem',
                        marginBottom: `${gridSize * 3}px`,
                    }}
                    onSubmit={submit}
                >
                    <Input value={source} onChange={e => setSource(e.target.value)} css={{ width: '100%' }} placeholder='Source'/>
                    <Input value={tin} onChange={setTin} css={{ width: '100%' }} placeholder='TIN'/>
                    <Select
                        css={{
                            width: '100%',
                        }}
                        required={true}
                        isClearable={true}
                        isDisabled={errorAddresses}
                        placeholder='Address'
                        selectedOption={selectedAddress}
                        options={addressesOptions}
                        onChange={({ value }) => setSelectedAddress(value)}
                    />
                    <label css={{ display: 'flex' }}>
                        <CheckboxPrimitive
                            value={withUnitName}
                            onChange={e => setWithUnitName(e.target.checked)}
                            checked={withUnitName}
                        />
                        <span>With unit name</span>
                    </label>
                    <LoadingButton variant='nuance' appearance='primary' onClick={submit}
                        isLoading={loadingSubmit}>Save</LoadingButton>
                    {errorSubmit && (
                        <span css={{ color: 'red' }}>
                            {errorSubmit.message}
                        </span>
                    )}
                    {errorAddresses && (
                        <span css={{ color: 'red' }}>
                            {errorAddresses.message}
                        </span>
                    )}
                </form>
            </Container>
        </Fragment>
    )
}

export default LinkAddressAndSource
