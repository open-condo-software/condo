import React, { ReactNode } from 'react'

import { BaseProps, BaseSuggestions } from './BaseSuggestions'
import { AddressServiceAddress, AddressServiceSuggestion } from './types'


import './address.css'

export class AddressSuggestions extends BaseSuggestions<AddressServiceAddress, BaseProps<AddressServiceAddress>> {

    loadSuggestionsUrl = this.props.url

    getLoadSuggestionsData = (): Record<string, unknown> => {

        const { query } = this.state

        return {
            query,
        }
    }

    protected renderOption = (suggestion: AddressServiceSuggestion<AddressServiceAddress>): ReactNode => {
        const { renderOption } = this.props
        const { query } = this.state

        return renderOption ? (
            renderOption(suggestion, query)
        ) : (
            <span>{suggestion.value}</span>
        )
    }
}