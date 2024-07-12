/** @jsx jsx */
import { useMutation, useQuery } from '@apollo/client'
import { AddressSuggestions } from '@app/condo/admin-ui/address/AddressSuggestions'
import { Table, TableRow, Input, BodyCell, HeaderCell } from '@app/condo/admin-ui/ui'
import { LoadingButton, Button } from '@arch-ui/button'
import Confirm from '@arch-ui/confirm'
import { Container } from '@arch-ui/layout'
import Select from '@arch-ui/select'
import { PageTitle } from '@arch-ui/typography'
import { jsx } from '@emotion/core'
import PageLoading from '@keystonejs/app-admin-ui/client/components/PageLoading'
import Big from 'big.js'
import  { set, get } from 'lodash'
import React, { useState, useMemo, Fragment, useCallback, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import {
    PaymentRule as PaymentRuleGQL,
    PaymentRuleBillingScope as PaymentRuleBillingScopeGQL,
    PaymentRuleMarketPlaceScope as PaymentRuleMarketPlaceScopeGQL,
    REGISTER_PAYMENT_RULE_MUTATION,
    AcquiringIntegrationContext as AcquiringIntegrationContextGQL,
} from '@condo/domains/acquiring/gql'
import { BillingCategory as BillingCategoryGQL } from '@condo/domains/billing/gql'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import {
    Property as PropertyGQL,
} from '@condo/domains/property/gql'


const ADDRESS_SERVICE_DOMAIN = 'https://address-service.doma.ai'
const LABELS = {
    marketplace: 'Маркетплейс',
    billing: 'Биллинг',
}

function DeletePaymentRuleModal ({ isOpen, deleteFunction, onClose }) {
    return (
        <Confirm isOpen={isOpen} onKeyDown={ e => { if (e.key === 'Escape') { onClose() } }}>
            <p style={{ marginTop: 0 }}> Вы собираетесь удалить правило </p>
            <footer>
                <Button appearance='danger' variant='ghost' onClick={async () => {
                    await deleteFunction()
                    onClose()
                }}>
                    Удалить
                </Button>
                <Button variant='subtle' onClick={onClose}>Оставить</Button>
            </footer>
        </Confirm>
    )
}

function BillingScopeSettingRow ({ scope }) {
    return (
        <TableRow />
    )
}

function MarketPlaceScopeSettingRow ({ scope }) {
    const { address } = scope
    return (
        <TableRow>
            <BodyCell colSpan={2}>{address}</BodyCell>
        </TableRow>
    )
}

const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, value]) => !!value))
const EMPTY_OPTION = { label: 'NO', value: null }

const useSelectOptions = ({ organizationId }) => {
    const { loading: categoriesLoading, data:  { objs: categories = [] } = {} } = useQuery(
        BillingCategoryGQL.GET_ALL_OBJS_QUERY,
        { fetchPolicy: 'network-only' },
    )
    const { loading: propertiesLoading, data:  { objs: properties = [] } = {} } = useQuery(
        PropertyGQL.GET_ALL_OBJS_QUERY,
        { variables: { organization: { id: organizationId } }, skip: !organizationId, fetchPolicy: 'network-only' },
    )
    const categoriesOptions = useMemo(() => [EMPTY_OPTION]
        .concat(categories.map(({ name, id }) => ({ value: id, label: name }))),
    [categories])
    const propertiesOptions = useMemo(() => [EMPTY_OPTION]
        .concat(properties.map(({ address, id }) => ({ value: id, label: address }))),
    [properties])
    return {
        loading: categoriesLoading || propertiesLoading,
        categoriesOptions,
        propertiesOptions,
    }
}



function AddPaymentRule ({ type, categoriesOptions, refetch }) {
    const [active, setIsActive] = useState(false)
    const { context: contextId } = useParams()

    const rule = useRef({
        implicitFee: '',
        explicitFee: '',
        explicitServiceCharge: '',
        minFeeAmount: '',
        maxFeeAmount: '',
        merchant: '',
        address: '',
        tin: '',
        routingNumber: '',
        bankAccount: '',
        sourceBankAccount: '',
        category: '',
        serviceIds: '',
    })

    const [savePaymentRuleMutation] = useMutation(REGISTER_PAYMENT_RULE_MUTATION)
    const suggestUrl = `${ADDRESS_SERVICE_DOMAIN}/suggest?context=suggestHouse`
    const changeRule = useCallback((field, value) => {
        set(rule.current, field, value)
    }, [])

    const savePaymentRule = useCallback(async (rule) => {
        const { implicitFee, explicitFee, explicitServiceCharge, merchant, minFeeAmount, maxFeeAmount } = rule
        const { routingNumber, bankAccount: number, tin } = rule
        const { sourceBankAccount: bankAccount, serviceIds, category, address } = rule
        const scope = compact({ bankAccount, serviceIds, category, address })
        if (scope.category) {
            scope.category = { connect: { id: scope.category } }
        }
        try {
            await savePaymentRuleMutation({ variables: { 
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    acquiringIntegrationContext: { id: contextId },
                    fee: compact({
                        implicitFee,
                        explicitFee,
                        explicitServiceCharge,
                        merchant,
                        minFeeAmount,
                        maxFeeAmount,
                    }),
                    bankAccount: { tin, routingNumber, number },
                    ...type === 'marketplace' ? {
                        marketPlaceScope: scope,
                    } : {},
                    ...type === 'billing' ? {
                        billingScope: scope,
                    } : {},
                },
            } })
            await refetch()
            setIsActive(false)
        } catch (err) {
            console.log(err)
        }
    }, [contextId, refetch, savePaymentRuleMutation, type, setIsActive])
    if (!active) {
        return (<Button variant='nuance'  css={{ marginRight: '1em' }} onClick={() => setIsActive(true)}>Добавить ({LABELS[type]})</Button>)
    } else {
        return (
            <Fragment>
                <Table css={{ width: '100%', marginTop: '2em', marginBottom: '2em' }} >
                    <tbody>
                        <TableRow>
                            <HeaderCell colSpan={2}>{LABELS[type]}
                                <Button css={{ float: 'right', marginRight: '1em' }} variant='ghost' appearance='create' onClick={async () => {
                                    await savePaymentRule(rule.current)
                                }}>Сохранить</Button>
                                <Button css={{ float: 'right', marginRight: '1em' }} variant='subtle'  onClick={() => setIsActive(false)}>Отменить</Button>
                            </HeaderCell>
                        </TableRow>
                        <TableRow><BodyCell>Нижняя комиссия (ЮР.Лицо)</BodyCell><BodyCell><Input css={{ width: '5em' }} value={rule.current.implicitFee} onChange={ value => changeRule('implicitFee', value) } /></BodyCell></TableRow>
                        <TableRow><BodyCell>Верхняя комиссия (ФИЗ.Лицо)</BodyCell><BodyCell><Input css={{ width: '5em' }} value={rule.current.explicitFee} onChange={ value => changeRule('explicitFee', value) } /></BodyCell></TableRow>
                        <TableRow><BodyCell>Сервисный сбор (ФИЗ.Лицо)</BodyCell><BodyCell><Input css={{ width: '5em' }} value={rule.current.explicitServiceCharge} onChange={ value => changeRule('explicitServiceCharge', value) } /></BodyCell></TableRow>
                        <TableRow><BodyCell>Минимальная комиссия</BodyCell><BodyCell><Input css={{ width: '5em' }} value={rule.current.minFeeAmount} onChange={ value => changeRule('minFeeAmount', value) } /></BodyCell></TableRow>
                        <TableRow><BodyCell>Максимальная комиссия</BodyCell><BodyCell><Input css={{ width: '5em' }} value={rule.current.maxFeeAmount} onChange={ value => changeRule('maxFeeAmount', value) } /></BodyCell></TableRow>
                        <TableRow><BodyCell>Мерчант</BodyCell><BodyCell><Input css={{ width: '12em' }} value={rule.current.merchant} onChange={ value => changeRule('merchant', value) } /></BodyCell></TableRow>
                        <TableRow>
                            <BodyCell>
                                <Table>
                                    <tbody>
                                        <TableRow><BodyCell>Инн</BodyCell><BodyCell><Input css={{ width: '10em' }} onChange={ value => changeRule('tin', value) } /></BodyCell></TableRow>
                                        <TableRow><BodyCell>БИК</BodyCell><BodyCell><Input css={{ width: '8em' }} onChange={ value => changeRule('routingNumber', value) } /></BodyCell></TableRow>
                                        <TableRow><BodyCell>Р/С</BodyCell><BodyCell><Input css={{ width: '14em' }} onChange={ value => changeRule('bankAccount', value) } /></BodyCell></TableRow>
                                    </tbody>
                                </Table>
                            </BodyCell>
                            <BodyCell css={{ verticalAlign: 'top' }}>
                                <Table>
                                    <tbody>
                                        <TableRow><HeaderCell colSpan={3}>Ограничения</HeaderCell></TableRow>
                                        <TableRow><BodyCell>Адрес</BodyCell><BodyCell colSpan={2}>
                                            <AddressSuggestions url={suggestUrl} onChange={({ value }) => changeRule('address', value)}></AddressSuggestions>
                                        </BodyCell></TableRow>
                                        { type === 'billing' ? (
                                            <Fragment>
                                                <TableRow><BodyCell>Р/С</BodyCell><BodyCell colSpan={2}><Input css={{ width: '14em' }} onChange={ value => changeRule('sourceBankAccount', value) } /></BodyCell></TableRow>
                                                <TableRow><BodyCell>Категория</BodyCell>
                                                    <BodyCell colSpan={2}>
                                                        <Select
                                                            options={categoriesOptions}
                                                            onChange={({ value }) => changeRule('category', value)}
                                                        />
                                                    </BodyCell>
                                                </TableRow>
                                                <TableRow><BodyCell>Услуги</BodyCell><BodyCell colSpan={2}><Input css={{ width: '14em' }} onChange={ value => changeRule('serviceIds', value) } /></BodyCell></TableRow>
                                            </Fragment>
                                        ) : null }
                                    </tbody>
                                </Table>
                            </BodyCell>
                        </TableRow>
                    </tbody>
                </Table>
            </Fragment>)
    }
}

const PaymentRuleSettings = (props) => {
    const { rule, type, refetch, billingScopes, marketPlaceScopes } = props
    const { tin, routingNumber, offsettingAccount, bankName, number, name } = rule.bankAccount
    const { explicitFee, implicitFee, explicitServiceCharge, merchant } = rule
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deletePaymentRuleMutation] = useMutation(PaymentRuleGQL.UPDATE_OBJ_MUTATION)
    const [deleteBillingScopeMutation] = useMutation(PaymentRuleBillingScopeGQL.UPDATE_OBJ_MUTATION)
    const [deleteMarketPlaceScopeMutation] = useMutation(PaymentRuleMarketPlaceScopeGQL.UPDATE_OBJ_MUTATION)
    const deletePaymentRule = useCallback(async (ruleId) => {
        const deleteUpdate = { dv: 1, sender: getClientSideSenderInfo(), deletedAt: new Date().toISOString() }
        if (billingScopes.length) {
            await Promise.all(billingScopes.map(async ({ id }) => {
                await deleteBillingScopeMutation({ variables: { id, data: deleteUpdate } })
            }))
        }
        if (marketPlaceScopes.length) {
            await Promise.all(marketPlaceScopes.map(async ({ id }) => {
                await deleteMarketPlaceScopeMutation({ variables: { id, data: deleteUpdate } })
            }))
        }
        await deletePaymentRuleMutation({ variables: { id: ruleId, data: deleteUpdate } })
        await refetch()
        setIsDeleting(false)
    }, [billingScopes, deleteBillingScopeMutation, deleteMarketPlaceScopeMutation, deletePaymentRuleMutation, marketPlaceScopes, refetch])

    return (
        <Fragment>
            <Table css={{ width: '100%', marginBottom: '50px' }}>
                <tbody>
                    <TableRow>
                        <HeaderCell colSpan={2}>{LABELS[type]}
                            <DeletePaymentRuleModal isOpen={isOpen} onClose={() => setIsOpen(false)} deleteFunction={async () => {
                                await deletePaymentRule(rule.id)
                            }}/>
                            <LoadingButton css={{ float: 'right' }} variant='nuance' appearance='danger' isLoading={isDeleting} onClick={() => setIsOpen(true)}>Удалить правило</LoadingButton>
                        </HeaderCell>
                    </TableRow>
                    { implicitFee ? (<TableRow><BodyCell>Нижняя комиссия (ЮР.Лицо)</BodyCell><BodyCell>{ implicitFee ? Big(implicitFee).toFixed(2) : '-'} %</BodyCell></TableRow>) : null }
                    { explicitFee ? (<TableRow><BodyCell>Верхняя комиссия (ФИЗ.Лицо)</BodyCell><BodyCell>{ explicitFee ? Big(explicitFee).toFixed(2) : '-'} %</BodyCell></TableRow>) : null }
                    { explicitServiceCharge ? (<TableRow><BodyCell>Сервисный сбор (ФИЗ.Лицо)</BodyCell><BodyCell>{ explicitServiceCharge ? Big(explicitServiceCharge).toFixed(2) : '-'} %</BodyCell></TableRow>) : null }
                    { merchant ? (<TableRow><BodyCell>Мерчант</BodyCell><BodyCell>{merchant}</BodyCell></TableRow>) : '' }
                    <TableRow>
                        <BodyCell>
                            <Table>
                                <tbody>
                                    <TableRow><BodyCell>Получатель</BodyCell><BodyCell>{name}</BodyCell></TableRow>
                                    <TableRow><BodyCell>Инн</BodyCell><BodyCell>{tin}</BodyCell></TableRow>
                                    <TableRow><BodyCell>БИК</BodyCell><BodyCell>{routingNumber}</BodyCell></TableRow>
                                    <TableRow><BodyCell>Банк</BodyCell><BodyCell>{bankName}</BodyCell></TableRow>
                                    <TableRow><BodyCell>КОР/С</BodyCell><BodyCell>{offsettingAccount}</BodyCell></TableRow>
                                    <TableRow><BodyCell>Р/С</BodyCell><BodyCell><b>{number}</b></BodyCell></TableRow>
                                </tbody>
                            </Table>
                        </BodyCell>
                        <BodyCell css={{ verticalAlign: 'top' }}>
                            <Table>
                                <tbody>
                                    <TableRow><HeaderCell colSpan={2}>Ограничения</HeaderCell></TableRow>
                                    { billingScopes.map((billingScope, index) => <BillingScopeSettingRow scope={billingScope} key={`b-${index}`} />)}
                                    { marketPlaceScopes.map((marketPlaceScope, index) => (<MarketPlaceScopeSettingRow scope={marketPlaceScope} key={`m-${index}`} />))}
                                </tbody>
                            </Table>
                        </BodyCell>
                    </TableRow>
                </tbody>
            </Table>
        </Fragment>
    )
}

export default function PaymentRulesSettingsPage () {
    const { context: contextId } = useParams()
    const [organization, setOrganization] = useState({ id: '', name: '', tin: '' })
    const { isLoading: isOptionsLoading, categoriesOptions, propertiesOptions } = useSelectOptions({ organizationId: organization.id })
    console.log(propertiesOptions, categoriesOptions)

    const { loading: contextLoading, data:  { objs: contexts = [] } = {} } = useQuery(
        AcquiringIntegrationContextGQL.GET_ALL_OBJS_QUERY,
        { fetchPolicy: 'network-only', variables: { where: { id: contextId } } },
    )

    useEffect(() => {
        setOrganization(get(contexts, '[0].organization'))
        console.log(organization)
    }, [contexts])


    const { loading: paymentRulesLoading, data:  { objs: paymentRules = [] } = {}, refetch: paymentRuleRefetch } = useQuery(
        PaymentRuleGQL.GET_ALL_OBJS_QUERY,
        { fetchPolicy: 'network-only', variables: { where: { context: { id: contextId } } } },
    )
    const { loading: billingScopesLoading, data:  { objs: billingScopes = [] } = {} } = useQuery(
        PaymentRuleBillingScopeGQL.GET_ALL_OBJS_QUERY,
        { fetchPolicy: 'network-only', variables: { where: { paymentRule: { id_in: paymentRules.map(({ id }) => id) } } } },
    )
    const { loading: marketPlaceScopesLoading, data:  { objs: marketPlaceScopes = [] } = {} } = useQuery(
        PaymentRuleMarketPlaceScopeGQL.GET_ALL_OBJS_QUERY,
        { fetchPolicy: 'network-only', variables: { where: { paymentRule: { id_in: paymentRules.map(({ id }) => id) } } } },
    )

    if (isOptionsLoading || contextLoading || paymentRulesLoading || billingScopesLoading || marketPlaceScopesLoading) {
        return (<PageLoading/>)
    }

    return (
        <Fragment>
            <Container css={{ marginTop: '50px', marginBottom: '50px', position: 'relative' }}>
                { organization ? (<PageTitle>{organization.name} ({organization.tin})</PageTitle>) : null }
            </Container>
            <Container css={{ marginTop: '50px', marginBottom: '50px', position: 'relative' }}>
                {
                    paymentRules.map((rule, index) => {
                        const ruleBillingScopes = billingScopes.filter(({ paymentRule: { id } }) => id === rule.id)
                        const ruleMarketPlaceScopes = marketPlaceScopes.filter(({ paymentRule: { id } }) => id === rule.id)
                        const type = ruleBillingScopes.length ? 'billing' : ruleMarketPlaceScopes ? 'marketplace' : 'default'
                        return (
                            <PaymentRuleSettings
                                key={index}
                                rule={rule}
                                categoriesOptions={categoriesOptions}
                                billingScopes={ruleBillingScopes}
                                type={type}
                                refetch={paymentRuleRefetch}
                                marketPlaceScopes={ruleMarketPlaceScopes}
                            />
                        )
                    })
                }
                <AddPaymentRule type='billing' categoriesOptions={categoriesOptions} refetch={paymentRuleRefetch}/>
                <AddPaymentRule type='marketplace' refetch={paymentRuleRefetch}/>
            </Container>
        </Fragment>
    )
}
