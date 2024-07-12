import { debounce } from 'debounce'
import { nanoid } from 'nanoid'
import React, { ChangeEvent, MouseEvent, FocusEvent, ReactNode, ElementType } from 'react'

import { makeRequest } from './request'
import { CommonProps, AddressServiceSuggestion } from './types'

export type BaseProps<SuggestionType> = CommonProps<SuggestionType>

export interface BaseState<SuggestionType> {
    query: string;
    displaySuggestions: boolean;
    inputQuery: string;
    isFocused: boolean;
    suggestions: Array<AddressServiceSuggestion<SuggestionType>>;
    suggestionIndex: number;
}

export abstract class BaseSuggestions<SuggestionType, OwnProps> extends React.PureComponent<
BaseProps<SuggestionType> & OwnProps,
BaseState<SuggestionType>
> {

    protected loadSuggestionsUrl = ''

    protected dontPerformBlurHandler = false

    protected _uid?: string

    protected didMount: boolean

    private textInput?: HTMLInputElement

    constructor (props: BaseProps<SuggestionType> & OwnProps) {
        super(props)

        this.didMount = false

        const { defaultQuery, value, delay } = this.props
        const valueQuery = value ? value.value : undefined

        this.setupDebounce(delay)

        this.state = {
            query: (defaultQuery as string | undefined) || valueQuery || '',
            inputQuery: (defaultQuery as string | undefined) || valueQuery || '',
            isFocused: false,
            displaySuggestions: true,
            suggestions: [],
            suggestionIndex: -1,
        }
    }

    componentDidMount (): void {
        this.didMount = true
    }

    componentDidUpdate (prevProps: Readonly<BaseProps<SuggestionType> & OwnProps>): void {
        const { value, delay = 100 } = this.props
        const { query, inputQuery } = this.state
        if (prevProps.value !== value) {
            const newQuery = value ? value.value : ''
            if (query !== newQuery || inputQuery !== newQuery) {
                this.setState({ query: newQuery, inputQuery: newQuery })
            }
        }

        if (delay !== prevProps.delay) {
            this.setupDebounce(delay)
        }
    }

    componentWillUnmount (): void {
        this.didMount = false
    }

    get uid (): string {
        if (this.props.uid) {
            return this.props.uid
        }
        if (!this._uid) {
            this._uid = nanoid()
        }
        return this._uid
    }


    protected getSuggestionsUrl = (): string => {
        const { url } = this.props

        return url || this.loadSuggestionsUrl
    }

    protected setupDebounce = (delay: number | undefined): void => {
        if (typeof delay === 'number' && delay > 0) {
            this.fetchSuggestions = debounce(this.performFetchSuggestions, delay)
        } else {
            this.fetchSuggestions = this.performFetchSuggestions
        }
    }

    protected abstract getLoadSuggestionsData (): Record<string, unknown>

    protected fetchSuggestions = (): void => {
        //
    }

    private handleInputFocus = (event: FocusEvent<HTMLInputElement>) => {
        this.setState({ isFocused: true })

        const { suggestions } = this.state

        if (suggestions.length === 0) {
            this.fetchSuggestions()
        }

        const { inputProps } = this.props
        if (inputProps && inputProps.onFocus) {
            inputProps.onFocus(event)
        }
    }

    private handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
        const { suggestions, suggestionIndex } = this.state
        const { selectOnBlur, inputProps } = this.props

        this.setState({ isFocused: false })
        if (suggestions.length === 0) {
            this.fetchSuggestions()
        }

        if (selectOnBlur && !this.dontPerformBlurHandler) {
            if (suggestions.length > 0) {
                const suggestionIndexToSelect =
                    suggestionIndex >= 0 && suggestionIndex < suggestions.length ? suggestionIndex : 0
                this.selectSuggestion(suggestionIndexToSelect, true)
            }
        }

        this.dontPerformBlurHandler = false

        if (inputProps && inputProps.onBlur) {
            inputProps.onBlur(event)
        }
    }

    private handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target
        const { inputProps } = this.props
        if (this.didMount) {
            this.setState({ query: value, inputQuery: value, displaySuggestions: !!value }, () => {
                this.fetchSuggestions()
            })
        }

        if (inputProps && inputProps.onChange) {
            inputProps.onChange(event)
        }
    }

    private handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        this.handleKeyboard(event)

        const { inputProps } = this.props
        if (inputProps && inputProps.onKeyDown) {
            inputProps.onKeyDown(event)
        }
    }

    private handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        this.handleKeyboard(event)

        const { inputProps } = this.props
        if (inputProps && inputProps.onKeyPress) {
            inputProps.onKeyPress(event)
        }
    }

    private handleKeyboard = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const { suggestions, suggestionIndex, inputQuery } = this.state
        if (event.which === 40) {
            // Arrow down
            event.preventDefault()
            if (suggestionIndex < suggestions.length - 1) {
                const newSuggestionIndex = suggestionIndex + 1
                const newInputQuery = suggestions[newSuggestionIndex].value
                if (this.didMount) {
                    this.setState({ suggestionIndex: newSuggestionIndex, query: newInputQuery })
                }
            }
        } else if (event.which === 38) {
            // Arrow up
            event.preventDefault()
            if (suggestionIndex >= 0) {
                const newSuggestionIndex = suggestionIndex - 1
                const newInputQuery = newSuggestionIndex === -1 ? inputQuery : suggestions[newSuggestionIndex].value
                if (this.didMount) {
                    this.setState({ suggestionIndex: newSuggestionIndex, query: newInputQuery })
                }
            }
        } else if (event.which === 13) {
            // Enter
            event.preventDefault()
            if (suggestionIndex >= 0) {
                this.selectSuggestion(suggestionIndex)
            }
        }
    }

    private performFetchSuggestions = () => {
        const { minChars = 3 } = this.props
        const { query } = this.state

        if (typeof minChars === 'number' && minChars > 0 && query.length < minChars) {
            this.setState({ suggestions: [], suggestionIndex: -1 })
            return
        }

        makeRequest(
            'GET',
            this.getSuggestionsUrl() + '&s=' + encodeURIComponent(query),
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                json: this.getLoadSuggestionsData(),
            },
            (suggestions: AddressServiceSuggestion<SuggestionType>[]) => {
                if (this.didMount) {
                    this.setState({ suggestions, suggestionIndex: -1 })
                }
            },
        )
    }

    private onSuggestionClick = (index: number, event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        this.selectSuggestion(index)
    }

    private selectSuggestion = (index: number, isSilent = false) => {
        const { suggestions } = this.state
        const { selectOnBlur, onChange } = this.props

        if (suggestions.length >= index - 1) {
            const suggestion = suggestions[index]
            if (selectOnBlur) {
                this.dontPerformBlurHandler = true
            }
            this.setState({ query: suggestion.value, inputQuery: suggestion.value, displaySuggestions: false }, () => {
                if (!isSilent) {
                    this.fetchSuggestions()
                    setTimeout(() => this.setCursorToEnd(this.textInput))
                }
            })

            if (onChange) {
                onChange(suggestion)
            }
        }
    }

    private setCursorToEnd = (element: HTMLInputElement | undefined) => {
        if (element) {
            const valueLength = element.value.length
            if (element.selectionStart || element.selectionStart === 0) {
                // eslint-disable-next-line no-param-reassign
                element.selectionStart = valueLength
                // eslint-disable-next-line no-param-reassign
                element.selectionEnd = valueLength
                element.focus()
            }
        }
    }

    protected getSuggestionKey = (suggestion: AddressServiceSuggestion<SuggestionType>): string => suggestion.value

    public focus = (): void => {
        if (this.textInput) {
            this.textInput.focus()
        }
    }

    protected abstract renderOption (suggestion: AddressServiceSuggestion<SuggestionType>): ReactNode

    public render (): ReactNode {
        const {
            inputProps,
            hintText,
            containerClassName,
            hintClassName,
            suggestionsClassName,
            suggestionClassName,
            currentSuggestionClassName,
            customInput,
            children,
        } = this.props
        const { query, isFocused, suggestions, suggestionIndex, displaySuggestions } = this.state

        const Component = typeof customInput !== 'undefined' ? (customInput as ElementType) : 'input'

        const optionsExpanded = isFocused && suggestions && displaySuggestions && suggestions.length > 0
        return (
            <div
                role='combobox'
                aria-expanded={optionsExpanded ? 'true' : 'false'}
                aria-owns={this.uid}
                aria-controls={this.uid}
                aria-haspopup='listbox'
                className={containerClassName || 'address-service address-service-container'}
            >
                <div>
                    <Component
                        autoComplete='off'
                        className='address-service-input'
                        {...inputProps}
                        value={query}
                        ref={(input: HTMLInputElement) => {
                            this.textInput = input
                        }}
                        onChange={this.handleInputChange}
                        onKeyPress={this.handleInputKeyPress}
                        onKeyDown={this.handleInputKeyDown}
                        onFocus={this.handleInputFocus}
                        onBlur={this.handleInputBlur}
                    />
                </div>
                {optionsExpanded && (
                    <ul
                        id={this.uid}
                        aria-expanded
                        role='listbox'
                        className={suggestionsClassName || 'address-service-suggestions'}
                    >
                        {typeof hintText !== 'undefined' && (
                            <div className={hintClassName || 'address-service-suggestion-note'}>{hintText}</div>
                        )}
                        {suggestions.map((suggestion, index) => {
                            let suggestionClass = suggestionClassName || 'address-service-suggestion'
                            if (index === suggestionIndex) {
                                suggestionClass += ` ${currentSuggestionClassName || 'address-service-suggestion-current'}`
                            }
                            return (
                                <button
                                    role='option'
                                    aria-selected={index === suggestionIndex ? 'true' : 'false'}
                                    key={this.getSuggestionKey(suggestion)}
                                    onMouseDown={this.onSuggestionClick.bind(this, index)}
                                    className={suggestionClass}
                                >
                                    {this.renderOption(suggestion)}
                                </button>
                            )
                        })}
                    </ul>
                )}
                {children}
            </div>
        )
    }
}