import { useApolloClient } from '@core/next/apollo'
import { ClassifiersQueryLocal, TicketClassifierTypes } from '../utils/clientSchema/classifierSearch'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { find, get, isEmpty, pick, pickBy, uniqBy } from 'lodash'
import { FormInstance, Select } from 'antd'
import { useRouter } from 'next/router'
import { parseQuery } from '../../common/utils/tables.utils'
import qs from 'qs'

const { Option } = Select

interface Options {
    id: string
    name: string
}

const useTicketClassifierSelect = ({
    onChange,
    // onSearch,
    keyword,
}) => {
    const [classifiers, setClassifiersFromRules] = useState([])
    const [searchClassifiers, setSearchClassifiers] = useState([])
    const classifiersRef = useRef(null)
    const optionsRef = useRef([])
    // const selectedRef = useRef<string>(null)

    const router = useRouter()
    const { filters } = parseQuery(router.query)

    const setClassifiers = (classifiers) => {
        setClassifiersFromRules(classifiers)
        // We need to remove search classifiers when rules start to work
        setSearchClassifiers([])
    }

    // function setSelected (value) {
    //     selectedRef.current = value
    //     // Remove search classifiers when user chosen smth - only classifiers will work for now
    //     setSearchClassifiers([])
    // }

    useEffect(() => {
        optionsRef.current = uniqBy([...classifiers, ...searchClassifiers], 'id')
    }, [classifiers, searchClassifiers])

    const handleChange = (form: FormInstance, value) => {
        onChange && onChange(value)
        form.setFieldsValue({ [keyword]: value })
    }

    const SelectComponent = useMemo(() => {
        const SelectComponentWrapper = (props) => {
            const { disabled, style, form } = props
            return (
                <Select
                    showSearch
                    style={style}
                    allowClear={true}
                    // onSelect={onChange}
                    onChange={(value) => handleChange(form, value)}
                    // onSearch={onSearch}
                    // onClear={() => onChange(null)}
                    optionFilterProp={'title'}
                    // defaultActiveFirstOption={false}
                    disabled={disabled}
                    defaultValue={filters[keyword]}
                    // ref={classifiersRef}
                    showAction={['focus', 'click']}
                    mode={'multiple'}
                >
                    {
                        optionsRef.current.map(classifier => (
                            <Option value={classifier.id} key={classifier.id} title={classifier.name}>
                                {classifier.name}
                            </Option>
                        ))
                    }
                </Select>
            )
        }
        return SelectComponentWrapper
    }, [filters])

    return {
        SelectComponent,
        set: {
            all: setClassifiers,
            // one: setSelected,
            search: setSearchClassifiers,
        },
        ref: classifiersRef,
    }
}

export function useModalFilterClassifiers () {
    const client = useApolloClient()
    const ClassifierLoader = new ClassifiersQueryLocal(client)

    const ClassifierLoaderRef = useRef<ClassifiersQueryLocal>()
    const ruleRef = useRef<{ place: string[], category: string[] }>({ place: [], category: [] })

    const router = useRouter()
    const { filters } = parseQuery(router.query)

    //
    // useEffect(() => {
    //     ruleRef.current = { place: filters['placeClassifier'] || [], category: filters['categoryClassifier'] || [] }
    // }, [])

    const onUserSelect = (id, type) => {
        ruleRef.current = { ...ruleRef.current, [type]: id }
        updateLevels({ [type]: id })
    }

    // const onUserSearch = async (input, type) => {
    //     const classifiers = await ClassifierLoader.search(input, type)
    //     Setter[type].search(classifiers)
    // }

    const {
        set: categorySet,
        SelectComponent: CategorySelect,
    } = useTicketClassifierSelect({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.category),
        // onSearch: (id) => onUserSearch(id, TicketClassifierTypes.category),
        keyword: 'categoryClassifier',
    })

    const {
        set: placeSet,
        SelectComponent: PlaceSelect,
    } = useTicketClassifierSelect({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.place),
        // onSearch: (id) => onUserSearch(id, TicketClassifierTypes.place),
        keyword: 'placeClassifier',
    })

    const Setter = {
        place: placeSet,
        category: categorySet,
    }

    useEffect(() => {
        ClassifierLoaderRef.current = ClassifierLoader

        ClassifierLoaderRef.current.init().then(() => {
            if (
                (filters['placeClassifier'] && filters['placeClassifier'].length > 0) ||
                    (filters['categoryClassifier'] && filters['categoryClassifier'].length > 0)
            ) {
                ruleRef.current = { place: filters['placeClassifier'], category: filters['categoryClassifier'] }
                updateLevels()
            } else {
                [TicketClassifierTypes.place, TicketClassifierTypes.category].forEach(type => {
                    ClassifierLoaderRef.current.search('', type).then(classifiers => {
                        Setter[type].all(classifiers)
                    })
                })
            }
        })

        return () => {
            // clear all loaded data from helper
            ClassifierLoaderRef.current.clear()
        }
    }, [])


    const loadLevels = async () => {
        const { place, category } = ruleRef.current
        const loadedRules = await Promise.all([
            { category, type: 'place' },
            { place, type: 'category' },
        ].map(selector => {
            const { type, ...querySelectors } = selector
            return new Promise<[string, Options[]]>(resolve => {
                const query = {}
                for (const key in querySelectors) {
                    if (querySelectors[key]) {
                        query[key] = { ids: querySelectors[key] }
                    }
                }

                ClassifierLoaderRef.current
                    .findRulesByIds(query)
                    .then(data => {
                        resolve([type, ClassifierLoaderRef.current.rulesToOptions(data, type)])
                    })
            })
        }))

        const result = Object.fromEntries(loadedRules)
        return result
    }

    const updateLevels = async (selected = {} ) => {
        ruleRef.current = { ...ruleRef.current, ...selected }
        const options = await loadLevels()

        Object.keys(Setter).forEach(type => {
            Setter[type].all(options[type])
        })
    }

    return { CategorySelect, PlaceSelect }
}