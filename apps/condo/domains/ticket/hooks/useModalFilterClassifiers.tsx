import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import uniqBy from 'lodash/uniqBy'
import isFunction from 'lodash/isFunction'
import { FormInstance, Select } from 'antd'
import { useRouter } from 'next/router'
import isEmpty from 'lodash/isEmpty'

import { useIntl } from '@core/next/intl'
import { useApolloClient } from '@core/next/apollo'

import { FiltersFromQueryType, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { getFiltersModalPopupContainer } from '@condo/domains/common/utils/filters.utils'
import { ClassifiersQueryLocal, TicketClassifierTypes } from '../utils/clientSchema/classifierSearch'
import { get } from 'lodash'

const { Option } = Select

interface Options {
    id: string
    name: string
}

const SHOW_SELECT_ACTIONS: ('focus' | 'click')[] = ['focus', 'click']

const useTicketClassifierSelect = ({
    onChange,
    keyword,
}) => {
    const intl = useIntl()
    const SelectMessage = intl.formatMessage({ id: 'Select' })

    const [classifiers, setClassifiersFromRules] = useState([])
    const [searchClassifiers, setSearchClassifiers] = useState([])
    const [stateForm, setForm] = useState<FormInstance>(null)

    const optionsRef = useRef([])

    const setClassifiers = useCallback((classifiers) => {
        setClassifiersFromRules(classifiers)
        setSearchClassifiers([])
    }, [])

    const setSelected = useCallback((value) => {
        stateForm && stateForm.setFieldsValue({ [keyword]: value })
    }, [keyword, stateForm])

    const Setter = useMemo(() => ({
        all: setClassifiers,
        one: setSelected,
        search: setSearchClassifiers,
    }), [])

    useEffect(() => {
        optionsRef.current = uniqBy([...classifiers, ...searchClassifiers], 'id')
    }, [classifiers, searchClassifiers])

    const handleChange = useCallback((form: FormInstance, value) => {
        if (isFunction(onChange)) onChange(value)

        form.setFieldsValue({ [keyword]: value })
    }, [keyword, onChange])

    const SelectComponent = useCallback( (props) => {
        const { disabled, style, form } = props

        if (!stateForm)
            setForm(stateForm)

        return (
            <Select
                showSearch
                showArrow
                style={style}
                onChange={(value) => handleChange(form, value)}
                optionFilterProp={'title'}
                disabled={disabled}
                value={form.getFieldValue(keyword)}
                showAction={SHOW_SELECT_ACTIONS}
                mode={'multiple'}
                placeholder={SelectMessage}
                getPopupContainer={getFiltersModalPopupContainer}
            >
                {
                    Array.isArray(optionsRef.current) && optionsRef.current.map(classifier => (
                        <Option value={classifier.id} key={classifier.id} title={classifier.name}>
                            {classifier.name}
                        </Option>
                    ))
                }
            </Select>
        )
    }, [SelectMessage, handleChange, keyword, stateForm])

    return {
        SelectComponent,
        set: Setter,
    }
}

const CLASSIFIER_TYPES = [TicketClassifierTypes.place, TicketClassifierTypes.category]
const PLACE_CLASSIFIER_KEYWORD = 'placeClassifier'
const CATEGORY_CLASSIFIER_KEYWORD = 'categoryClassifier'
const PROBLEM_CLASSIFIER_KEYWORD = 'problemClassifier'

const getInitialClassifierValues = (filters: FiltersFromQueryType, keyword: string) => {
    const initialValueFromFilter = get(filters, keyword)

    if (!isEmpty(initialValueFromFilter)) {
        return Array.isArray(initialValueFromFilter) ? initialValueFromFilter : [initialValueFromFilter]
    } else {
        return []
    }
}

export function useModalFilterClassifiers () {
    const client = useApolloClient()
    const router = useRouter()
    const ClassifierLoader = useMemo(() => new ClassifiersQueryLocal(client), [client])

    const ruleRef = useRef({ place: [], category: [], problem: [] })

    const onUserSelect = useCallback(async (id, type) => {
        ruleRef.current = { ...ruleRef.current, [type]: id }
        await updateLevels({ [type]: id })
    }, [])

    const {
        set: categorySet,
        SelectComponent: CategorySelect,
    } = useTicketClassifierSelect({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.category),
        keyword: CATEGORY_CLASSIFIER_KEYWORD,
    })

    const {
        set: placeSet,
        SelectComponent: PlaceSelect,
    } = useTicketClassifierSelect({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.place),
        keyword: PLACE_CLASSIFIER_KEYWORD,
    })

    const {
        set: problemSet,
        SelectComponent: ProblemSelect,
    } = useTicketClassifierSelect({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.problem),
        keyword: PROBLEM_CLASSIFIER_KEYWORD,
    })

    const Setter = useMemo(() => (
        {
            place: placeSet,
            category: categorySet,
            problem: problemSet,
        }
    ), [placeSet, categorySet, problemSet])

    const loadLevels = useCallback(async () => {
        const { place, category, problem } = ruleRef.current

        const rules = await ClassifierLoader.findRulesBySelectedClassifiers(place, category, problem)

        return {
            place: ClassifierLoader.rulesToOptions(rules, 'place'),
            category: ClassifierLoader.rulesToOptions(rules, 'category'),
            problem: ClassifierLoader.rulesToOptions(rules, 'problem').filter(rule => rule.id),
        }
    }, [ClassifierLoader])

    const updateLevels = useCallback(async (selected = {} ) => {
        ruleRef.current = { ...ruleRef.current, ...selected }
        const options = await loadLevels()

        Object.keys(Setter).forEach(type => {
            Setter[type].all(options[type])
            const isExisted = options[type].find(option => ruleRef.current[type] && ruleRef.current[type].includes(option.id))
            Setter[type].one(isExisted ? ruleRef.current[type] : null)
        })
    }, [Setter, loadLevels])

    useEffect(() => {
        const { filters } = parseQuery(router.query)
        const initialPlaceClassifierIds = getInitialClassifierValues(filters, PLACE_CLASSIFIER_KEYWORD)
        const initialCategoryClassifierIds = getInitialClassifierValues(filters, CATEGORY_CLASSIFIER_KEYWORD)
        const initialProblemClassifierIds = getInitialClassifierValues(filters, PROBLEM_CLASSIFIER_KEYWORD)

        ClassifierLoader.init().then(async () => {
            if (!isEmpty(initialPlaceClassifierIds) || !isEmpty(initialCategoryClassifierIds)) {
                ruleRef.current = {
                    place: initialPlaceClassifierIds,
                    category: initialCategoryClassifierIds,
                    problem: initialProblemClassifierIds,
                }
                await updateLevels()
            } else {
                CLASSIFIER_TYPES.forEach(type => {
                    ClassifierLoader.search('', type).then(classifiers => {
                        Setter[type].all(classifiers)
                    })
                })

                ruleRef.current = {
                    place: [],
                    category: [],
                    problem: [],
                }
            }
        })

        return () => {
            ClassifierLoader.clear()
        }
    }, [router.query, client, Setter, updateLevels])

    return useMemo(() => ({ CategorySelect, PlaceSelect, ProblemSelect }), [CategorySelect, PlaceSelect, ProblemSelect])
}