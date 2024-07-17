/** @jsx jsx */


import { useMutation, useQuery } from '@apollo/client'
import { LoadingButton, Button } from '@arch-ui/button'
import Confirm from '@arch-ui/confirm'
import { jsx } from '@emotion/core'
import { useCallback, useMemo, useState } from 'react'
import { Fragment } from 'react'

import {
    PaymentRule as PaymentRuleGQL,
    PaymentRuleBillingScope as PaymentRuleBillingScopeGQL,
    PaymentRuleMarketPlaceScope as PaymentRuleMarketPlaceScopeGQL,
} from '@condo/domains/acquiring/gql'
import { BankAccount as BankAccountGQL } from '@condo/domains/banking/gql'
import { BillingCategory as BillingCategoryGQL } from '@condo/domains/billing/gql'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { Property as PropertyGQL } from '@condo/domains/property/gql'



const EMPTY_OPTION = { label: '----', value: null }

export const usePaymentRulesSelectOptions = ({ organizationId }) => {
    const { loading: categoriesLoading, data:  { objs: categories = [] } = {} } = useQuery(
        BillingCategoryGQL.GET_ALL_OBJS_QUERY,
        { fetchPolicy: 'network-only' },
    )
    const { loading: propertiesLoading, data:  { objs: properties = [] } = {} } = useQuery(
        PropertyGQL.GET_ALL_OBJS_QUERY,
        { variables: { where: { organization: { id: organizationId } } }, skip: !organizationId, fetchPolicy: 'network-only' },
    )
    const { loading: bankAccountsLoading, data:  { objs: bankAccounts = [] } = {} } = useQuery(
        BankAccountGQL.GET_ALL_OBJS_QUERY,
        { variables: { where: { organization: { id: organizationId } } }, skip: !organizationId, fetchPolicy: 'network-only' },
    )
    const categoriesOptions = useMemo(() => [EMPTY_OPTION]
        .concat(categories.map(category => ({ value: category.id, label: category.name, data: category }))),
    [categories])
    const propertiesOptions = useMemo(() => [EMPTY_OPTION]
        .concat(properties.map(property => ({ value: property.id, label: property.address, data: property }))),
    [properties])
    const bankAccountsOptions = useMemo(() => [EMPTY_OPTION]
        .concat(bankAccounts.map(account => ({ value: account.id, label: `${account.number} (${account.bankName})`, data: account }))),
    [bankAccounts])
    return {
        loading: categoriesLoading || propertiesLoading || bankAccountsLoading,
        categoriesOptions,
        propertiesOptions,
        bankAccountsOptions,
    }
}

export const usePaymentRules = ({ contextId }) => {
    const { loading: paymentRulesLoading, data:  { objs: paymentRules = [] } = {}, refetch: paymentRuleRefetch } = useQuery(
        PaymentRuleGQL.GET_ALL_OBJS_QUERY,
        { fetchPolicy: 'network-only', variables: { where: { context: { id: contextId } } } },
    )
    const { loading: billingScopesLoading, data:  { objs: billingScopes = [] } = {}, refetch: billingScopesRefetch  } = useQuery(
        PaymentRuleBillingScopeGQL.GET_ALL_OBJS_QUERY,
        { fetchPolicy: 'network-only', skip: !paymentRules.length, variables: { where: { paymentRule: { id_in: paymentRules.map(({ id }) => id) } } } },
    )
    const { loading: marketPlaceScopesLoading, data:  { objs: marketPlaceScopes = [] } = {}, refetch: marketPlaceScopesRefetch } = useQuery(
        PaymentRuleMarketPlaceScopeGQL.GET_ALL_OBJS_QUERY,
        { fetchPolicy: 'network-only', skip: !paymentRules.length, variables: { where: { paymentRule: { id_in: paymentRules.map(({ id }) => id) } } } },
    )
    return {
        loading: paymentRulesLoading || billingScopesLoading || marketPlaceScopesLoading,
        paymentRules: paymentRules.map(rule => {
            return {
                ...rule,
                billingScopes: billingScopes.filter(({ paymentRule: { id } }) => id === rule.id),
                marketPlaceScopes: marketPlaceScopes.filter(({ paymentRule: { id } }) => id === rule.id),
            }
        }),
        refetch: async function () {
            await paymentRuleRefetch()
            await billingScopesRefetch()
            await marketPlaceScopesRefetch()
        },
    }

}


function DeletePaymentRuleModal ({ isOpen, deleteFunction, onClose }) {
    return (
        <DeleteConfirmModal
            isOpen={isOpen}
            deleteFunction={deleteFunction}
            onClose={onClose}
            message='You are going to delete PaymentRule with all its scopes'
        />
    )
}

function DeleteScopeModal ({ isOpen, deleteFunction, onClose }) {
    return (
        <DeleteConfirmModal
            isOpen={isOpen}
            deleteFunction={deleteFunction}
            onClose={onClose}
            message='You are going to delete scope'
        />
    )
}

function DeleteConfirmModal ({ isOpen, deleteFunction, onClose, message }) {
    return (
        <Confirm isOpen={isOpen} onKeyDown={ e => { if (e.key === 'Escape') { onClose() } }}>
            <p style={{ marginTop: 0 }}>{message}</p>
            <footer>
                <Button appearance='danger' variant='ghost' onClick={async () => {
                    await deleteFunction()
                    onClose()
                }}>
                    Delete
                </Button>
                <Button variant='subtle' onClick={onClose}>Cancel</Button>
            </footer>
        </Confirm>
    )
}

export const DeletePaymentRule = ({ rule, refetch }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deletePaymentRuleMutation] = useMutation(PaymentRuleGQL.UPDATE_OBJ_MUTATION)
    const [deleteBillingScopeMutation] = useMutation(PaymentRuleBillingScopeGQL.UPDATE_OBJ_MUTATION)
    const [deleteMarketPlaceScopeMutation] = useMutation(PaymentRuleMarketPlaceScopeGQL.UPDATE_OBJ_MUTATION)
    const deletePaymentRule = useCallback(async (rule) => {
        const deleteUpdate = { dv: 1, sender: getClientSideSenderInfo(), deletedAt: new Date().toISOString() }
        if (rule.billingScopes.length) {
            await Promise.all(rule.billingScopes.map(async ({ id }) => {
                await deleteBillingScopeMutation({ variables: { id, data: deleteUpdate } })
            }))
        }
        if (rule.marketPlaceScopes.length) {
            await Promise.all(rule.marketPlaceScopes.map(async ({ id }) => {
                await deleteMarketPlaceScopeMutation({ variables: { id, data: deleteUpdate } })
            }))
        }
        await deletePaymentRuleMutation({ variables: { id: rule.id, data: deleteUpdate } })
        await refetch()
        setIsDeleting(false)
    }, [deleteBillingScopeMutation, deleteMarketPlaceScopeMutation, deletePaymentRuleMutation, refetch])

    return (
        <Fragment>
            <DeletePaymentRuleModal isOpen={isOpen} onClose={() => setIsOpen(false)} deleteFunction={async () => {
                await deletePaymentRule(rule)
            }}/>
            <LoadingButton css={{ float: 'right' }} variant='nuance' appearance='danger' isLoading={isDeleting} onClick={() => setIsOpen(true)}>Delete</LoadingButton>
        </Fragment>
    )
}


export const DeleteScope = ({ scope, type, refetch }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteBillingScopeMutation] = useMutation(PaymentRuleBillingScopeGQL.UPDATE_OBJ_MUTATION)
    const [deleteMarketPlaceScopeMutation] = useMutation(PaymentRuleMarketPlaceScopeGQL.UPDATE_OBJ_MUTATION)
    const deleteScope = useCallback(async (scope, type) => {
        const deleteUpdate = { dv: 1, sender: getClientSideSenderInfo(), deletedAt: new Date().toISOString() }
        if (type === 'billing') {
            await deleteBillingScopeMutation({ variables: { id: scope.id, data: deleteUpdate } })
        } else if (type === 'marketplace') {
            await deleteMarketPlaceScopeMutation({ variables: { id: scope.id, data: deleteUpdate } })
        }
        await refetch()
        setIsDeleting(false)
    }, [deleteBillingScopeMutation, deleteMarketPlaceScopeMutation, refetch])

    return (
        <Fragment>
            <DeleteScopeModal isOpen={isOpen} onClose={() => setIsOpen(false)} deleteFunction={async () => {
                await deleteScope(scope, type)
            }}/>
            <LoadingButton css={{ float: 'right' }} variant='nuance' appearance='danger' isLoading={isDeleting} onClick={() => setIsOpen(true)}>Delete</LoadingButton>
        </Fragment>
    )
}