/** @jsx jsx */
import { useMutation, useQuery } from '@apollo/client'
import { Table, TableRow, Input, BodyCell, HeaderCell } from '@app/condo/admin-ui/ui'
import { Button } from '@arch-ui/button'
import { Container } from '@arch-ui/layout'
import Select from '@arch-ui/select'
import { PageTitle } from '@arch-ui/typography'
import { jsx } from '@emotion/core'
import PageLoading from '@keystonejs/app-admin-ui/client/components/PageLoading'
import Big from 'big.js'
import  { set, get } from 'lodash'
import React, { useState, Fragment, useCallback, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import {
    DeletePaymentRule,
    DeleteScope,
    usePaymentRulesSelectOptions,
    usePaymentRules,
} from '@condo/domains/acquiring/admin-ui/utils'
import {
    PaymentRule as PaymentRuleGQL,
    PaymentRuleBillingScope as PaymentRuleBillingScopeGQL,
    PaymentRuleMarketPlaceScope as PaymentRuleMarketPlaceScopeGQL,
    AcquiringIntegrationContext as AcquiringIntegrationContextGQL,
} from '@condo/domains/acquiring/gql'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

const moneyRender = (value) => value && !isNaN(Number(value)) ? Big(value).toFixed(2) : null
const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, value]) => !!value))

const PAYMENT_RULE_FIELDS = [{ label: 'Нижняя комиссия', field: 'implicitFee', render: moneyRender }, { label: 'Сервисный сбор', field: 'explicitServiceCharge', render: moneyRender }]
const PAYMENT_RULE_EXTENDED_FIELDS = [{ label: 'Верхняя комиссия', field: 'explicitFee', render: moneyRender }, { label: 'Merchant', field: 'merchant', width: '10em' }, { label: 'MIN Fee', field: 'minFeeAmount', render: moneyRender }, { label: 'MAX Fee', field: 'maxFeeAmount', render: moneyRender }]
const ALL_PAYMENT_FIELDS = PAYMENT_RULE_FIELDS.concat(PAYMENT_RULE_EXTENDED_FIELDS)

function BillingScopeSettingRow ({ scope, refetch }) {
    const services = get(scope, 'serviceIds')
    const account = get(scope, 'bankAccountNumber')
    const address = get(scope, 'property.address') || ''
    const category = get(scope, 'category.name')
    return (
        <Table css={{ marginBottom: '1em' }}>
            <tbody>
                <TableRow><BodyCell colSpan={2}>{address}<DeleteScope scope={scope} type='billing' refetch={refetch}/></BodyCell></TableRow>
                {category && (<TableRow><BodyCell>Category</BodyCell><BodyCell>{category}</BodyCell></TableRow>)}
                {services && (<TableRow><BodyCell>Services</BodyCell><BodyCell>{services.join(', ')}</BodyCell></TableRow>)}
                {account && (<TableRow><BodyCell>Account</BodyCell><BodyCell>{account}</BodyCell></TableRow>)}
            </tbody>
        </Table>
    )
}

function MarketPlaceScopeSettingRow ({ scope, refetch }) {
    return (
        <Table css={{ marginBottom: '1em' }}>
            <tbody>
                <TableRow><BodyCell colSpan={2}>{get(scope, 'property.address')} <DeleteScope scope={scope} type='marketplace' refetch={refetch}/></BodyCell></TableRow>
            </tbody>
        </Table>
    )
}


function AddPaymentRule ({ type, bankAccountsOptions, refetch }) {
    const [active, setIsActive] = useState(false)
    const [extended, setIsExtended] = useState(false)
    const { context: contextId } = useParams()
    const rule = useRef(Object.fromEntries(ALL_PAYMENT_FIELDS.map(({ field }) => ([field, '']))))
    const [savePaymentRuleMutation] = useMutation(PaymentRuleGQL.CREATE_OBJ_MUTATION)
    const changeRule = useCallback((field, value) => { set(rule.current, field, value) }, [])
    const savePaymentRule = useCallback(async (rule) => {
        const { bankAccount: bankAccountId, ...restFields } = rule
        try {
            await savePaymentRuleMutation({ variables: { 
                data: {
                    dv: 1, sender: getClientSideSenderInfo(),
                    context: { connect: { id: contextId } },
                    bankAccount: { connect: { id: bankAccountId } },
                    ...compact(restFields),
                },
            } })
            await refetch()
            setIsActive(false)
        } catch (err) {
            console.log(err)
        }
    }, [contextId, refetch, savePaymentRuleMutation, setIsActive])
    if (!active) {
        return (
            <Button appearance='create'  css={{ marginRight: '1em' }} onClick={() => setIsActive(true)}>Add PaymentRule</Button>
        )
    } else {
        return (
            <Fragment>
                <Table css={{ width: '100%', marginTop: '2em', marginBottom: '1em' }} >
                    <tbody>
                        <TableRow>
                            <HeaderCell colSpan={2}>{type}
                                <Button css={{ float: 'right' }} variant='subtle'  onClick={() => setIsActive(false)}>Cancel</Button>
                                <Button css={{ float: 'left' }} variant='subtle'  onClick={() => setIsExtended(!extended)}>{extended ? 'Collapse' : 'Extend'}</Button>
                            </HeaderCell>
                        </TableRow>
                        <Fragment>
                            { PAYMENT_RULE_FIELDS.map(({ label, field, width = '5em' }, index) => (
                                <TableRow key={'main-' + index}><BodyCell>{label}</BodyCell><BodyCell><Input css={{ width }} value={rule.current[field]} onChange={ value => changeRule(field, value) } /></BodyCell></TableRow>
                            )) }
                        </Fragment>
                        <Fragment>
                            { extended && PAYMENT_RULE_EXTENDED_FIELDS.map(({ label, field, width = '5em' }, index) => (
                                <TableRow key={'extend-' + index}><BodyCell>{label}</BodyCell><BodyCell><Input css={{ width }} value={rule.current[field]} onChange={ value => changeRule(field, value) } /></BodyCell></TableRow>
                            )) }
                        </Fragment>
                        <TableRow>
                            <BodyCell>Куда пойдут деньги</BodyCell>
                            <BodyCell>
                                <Select
                                    options={bankAccountsOptions}
                                    onChange={({ value }) => changeRule('bankAccount', value)}
                                />
                            </BodyCell>
                        </TableRow>
                    </tbody>
                </Table>
                <Button css={{ float: 'right', marginRight: '1em' }} variant='ghost' appearance='create' onClick={async () => {
                    await savePaymentRule(rule.current)
                }}>Save</Button>
            </Fragment>)
    }
}

const AddScopeToRule = ({ categoriesOptions, propertiesOptions, refetch, rule }) => {
    const [type, setType] = useState('billing')
    const [active, setIsActive] = useState(false)
    const typeOptions = [{ label: 'Billing', value: 'billing' }, { label: 'MarketPlace', value: 'marketplace' }]
    const scope = useRef({
        category: '',
        property: '',
        bankAccountNumber: '',
        serviceIds: '',
    })
    const changeScope = useCallback((field, value) => { set(scope.current, field, value) }, [])
    const [createBillingScopeMutation] = useMutation(PaymentRuleBillingScopeGQL.CREATE_OBJ_MUTATION)
    const [createMarketPlaceScopeMutation] = useMutation(PaymentRuleMarketPlaceScopeGQL.CREATE_OBJ_MUTATION)
    const addScope = useCallback(async (scope, type) => {
        const createInput = compact(scope)
        if (createInput.hasOwnProperty('category')) {
            createInput.category = { connect: { id: createInput.category } }
        }
        if (createInput.hasOwnProperty('property')) {
            createInput.property = { connect: { id: createInput.property } }
        }
        if (createInput.serviceIds) {
            createInput.serviceIds = createInput.serviceIds.split(',').map(str => str.trim())
        }
        const options = { variables: { data: {
            dv: 1, sender: getClientSideSenderInfo(),
            paymentRule: { connect: { id: rule.id } },
            ...createInput,
        } } }
        if (type === 'billing') {
            await createBillingScopeMutation(options)
        } else {
            await createMarketPlaceScopeMutation(options)
        }
        await refetch()
        setIsActive(false)

    }, [createBillingScopeMutation, createMarketPlaceScopeMutation, refetch, rule])


    if (!active) {
        return (
            <Button appearance='create'  variant='ghost' css={{ float: 'right', marginTop: '1em' }} onClick={() => setIsActive(true)}>Add Scope</Button>
        )
    } else {
        return (
            <Fragment>
                <Table css={{ width: '100%', marginBottom: '50px' }}>
                    <tbody>
                        <TableRow>
                            <BodyCell>Type</BodyCell>
                            <BodyCell css={{ width: '70%' }}><Select
                                options={typeOptions}
                                onChange={({ value }) => setType(value)}
                                value={
                                    typeOptions.find(option => option.value === type)
                                }
                            /></BodyCell>
                        </TableRow>
                        <TableRow><BodyCell>Property</BodyCell><BodyCell><Select
                            options={propertiesOptions}
                            onChange={({ value }) => changeScope('property', value)}
                        /></BodyCell></TableRow>
                        {
                            type === 'billing' && (
                                <Fragment>
                                    <TableRow><BodyCell>Category</BodyCell><BodyCell><Select
                                        options={categoriesOptions}
                                        onChange={({ value }) => changeScope('category', value)}
                                    /></BodyCell></TableRow>
                                    <TableRow><BodyCell>BankAccount</BodyCell><BodyCell>
                                        <Input css={{ width: '14em' }} value={get(scope, 'bankAccountNumber')}
                                            onChange={value => changeScope('bankAccountNumber', value)}/>
                                    </BodyCell></TableRow>
                                    <TableRow><BodyCell>Services</BodyCell><BodyCell>
                                        <Input css={{ width: '12em' }} value={get(scope, 'serviceIds')}
                                            onChange={value => changeScope('serviceIds', value)}/>
                                    </BodyCell></TableRow>
                                </Fragment>
                            )
                        }
                    </tbody>
                </Table>
                <Button css={{ float: 'right', marginRight: '1em' }} variant='ghost' appearance='create' onClick={async () => {
                    await addScope(scope.current, type)
                }}>Save</Button>
            </Fragment>
        )
    }
}

const PaymentRuleSettings = (props) => {
    const { rule, type, refetch, categoriesOptions, propertiesOptions } = props
    const { tin, routingNumber, offsettingAccount, bankName, number, name } = rule.bankAccount
    return (
        <Fragment>
            <Table css={{ width: '100%', marginBottom: '50px' }}>
                <tbody>
                    <TableRow>
                        <HeaderCell colSpan={2}>{type}
                            <DeletePaymentRule rule={rule} refetch={refetch}></DeletePaymentRule>
                        </HeaderCell>
                    </TableRow>
                    <Fragment>
                        { ALL_PAYMENT_FIELDS.map(({ label, field, render }, index) => (rule[field] ? (
                            <TableRow><BodyCell>{label}</BodyCell><BodyCell>{render ? render(rule[field]) : rule[field]}</BodyCell></TableRow>
                        ) : null)) }
                    </Fragment>
                    <TableRow>
                        <BodyCell css={{ verticalAlign: 'top' }}>
                            <Table>
                                <tbody>
                                    <TableRow><BodyCell>Recipient</BodyCell><BodyCell>{name}</BodyCell></TableRow>
                                    <TableRow><BodyCell>TIN</BodyCell><BodyCell>{tin}</BodyCell></TableRow>
                                    <TableRow><BodyCell>Routing number</BodyCell><BodyCell>{routingNumber}</BodyCell></TableRow>
                                    <TableRow><BodyCell>Bank name</BodyCell><BodyCell>{bankName}</BodyCell></TableRow>
                                    <TableRow><BodyCell>Offsetting account</BodyCell><BodyCell>{offsettingAccount}</BodyCell></TableRow>
                                    <TableRow><BodyCell>Bank account</BodyCell><BodyCell><b>{number}</b></BodyCell></TableRow>
                                </tbody>
                            </Table>
                        </BodyCell>
                        <BodyCell css={{ verticalAlign: 'top' }}>
                            { rule.billingScopes.map((billingScope, index) => <BillingScopeSettingRow scope={billingScope} refetch={refetch} key={`b-${index}`} />)}
                            { rule.marketPlaceScopes.map((marketPlaceScope, index) => (<MarketPlaceScopeSettingRow scope={marketPlaceScope} refetch={refetch} key={`m-${index}`} />))}
                            <AddScopeToRule categoriesOptions={categoriesOptions} propertiesOptions={propertiesOptions} refetch={refetch} rule={rule} />
                        </BodyCell>
                    </TableRow>
                </tbody>
            </Table>
        </Fragment>
    )
}

export default function PaymentRulesSettingsPage () {
    const { context: contextId } = useParams()
    const [organization, setOrganization] = useState()
    const { loading: contextLoading, data:  { objs: contexts = [] } = {} } = useQuery(
        AcquiringIntegrationContextGQL.GET_ALL_OBJS_QUERY,
        { fetchPolicy: 'network-only', variables: { where: { id: contextId } } },
    )
    useEffect(() => { setOrganization(get(contexts, '[0].organization')) }, [contexts])
    const { loading: isOptionsLoading, categoriesOptions, propertiesOptions, bankAccountsOptions } = usePaymentRulesSelectOptions({ organizationId: get(organization, 'id') })
    const { loading: paymentRulesLoading, paymentRules, refetch } = usePaymentRules({ contextId })
    if (isOptionsLoading || contextLoading || paymentRulesLoading) {
        return (<PageLoading/>)
    }
    return (
        <Fragment>
            <Container css={{ marginTop: '50px', marginBottom: '50px', position: 'relative' }}>
                { organization ? (<PageTitle>{get(organization, 'name')} ({get(organization, 'tin')})</PageTitle>) : null }
            </Container>
            <Container css={{ marginTop: '50px', marginBottom: '50px', position: 'relative' }}>
                {
                    paymentRules.map((rule, index) => {
                        return (
                            <PaymentRuleSettings
                                key={index}
                                rule={rule}
                                refetch={refetch}
                                categoriesOptions={categoriesOptions}
                                propertiesOptions={propertiesOptions}
                            />
                        )
                    })
                }
                <AddPaymentRule
                    context={contextId}
                    refetch={refetch}
                    bankAccountsOptions={bankAccountsOptions}
                />
            </Container>
        </Fragment>
    )
}
