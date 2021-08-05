import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Select, Input, Col, Form } from 'antd'
const { Option } = Select
import { useApolloClient } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'


import { uniqBy, isEmpty, find, pick } from 'lodash'
import { ClassifiersQueryLocal, ClassifiersQueryRemote, TicketClassifierTypes } from '@condo/domains/ticket/utils/clientSchema/classifierSearch'
import { useTicketValidations } from '@condo/domains/ticket/components/BaseTicketForm/useTicketValidations'

interface Options {
    id: string
    name: string
}
interface ITicketThreeLevelsClassifierHookInput {
    initialValues: {
        classifierRule: string
        placeClassifier: string
        categoryClassifier: string
        descriptionClassifier?: string
    }
}
interface ITicketThreeLevelsClassifierHookOutput {
    ClassifiersEditorComponent: React.FC<{ form, disabled }>
}

interface ITicketClassifierSelectHookInput {
    onChange: (id: string) => void
    onSearch: (id: string) => void
    initialValue: string | null
}

type ClassifierSelectComponent = React.FC<{ disabled?: boolean, style?: React.CSSProperties, value?: string }>
interface ITicketClassifierSelectHookOutput {
    set: {
        all: React.Dispatch<React.SetStateAction<Options[]>>
        one: React.Dispatch<React.SetStateAction<string>>
        search: React.Dispatch<React.SetStateAction<Options[]>>
    }
    SelectComponent: ClassifierSelectComponent
    ref: React.MutableRefObject<HTMLSelectElement>
}

const useTicketClassifierSelectHook = ({
    onChange,
    onSearch,
    initialValue,
}: ITicketClassifierSelectHookInput): ITicketClassifierSelectHookOutput => {
    const [selected, setSelected] = useState<string>(null)
    const [classifiers, setClassifiersFromRules] = useState<Options[]>([])
    const [searchClassifiers, setSearchClassifiers] = useState<Options[]>([])
    const classifiersRef = useRef<HTMLSelectElement>(null)
    const optionsRef = useRef<Options[]>([])

    const setClassifiers = (classifiers) => {
        setClassifiersFromRules(classifiers)
        // We need to remove search classifiers when rules start to work
        setSearchClassifiers([])
    }

    useEffect(() => {
        optionsRef.current = uniqBy([...classifiers, ...searchClassifiers], 'id')
    }, [classifiers, searchClassifiers])

    const SelectComponent = useMemo(() => {
        const SelectComponentWrapper: ClassifierSelectComponent = (props) => {
            const { disabled, style } = props
            return (
                <Select
                    showSearch
                    style={style}
                    allowClear={true}
                    onSelect={onChange}
                    onSearch={onSearch}
                    onClear={() => onChange(null)}
                    optionFilterProp={'title'}
                    defaultActiveFirstOption={false}
                    disabled={disabled}
                    defaultValue={initialValue}
                    ref={classifiersRef}
                    showAction={['focus', 'click']}
                >
                    {
                        optionsRef.current.map(classifier => (
                            <Option value={classifier.id} key={classifier.id} title={classifier.name}>{classifier.name}</Option>
                        ))
                    }

                </Select>
            )
        }
        return SelectComponentWrapper
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, classifiers])

    return {
        SelectComponent,
        set: {
            all: setClassifiers,
            one: setSelected,
            search: setSearchClassifiers,
        },
        ref: classifiersRef,
    }
}

export const useTicketThreeLevelsClassifierHook = ({ initialValues: {
    classifierRule,
    placeClassifier,
    categoryClassifier,
    descriptionClassifier,
} }: ITicketThreeLevelsClassifierHookInput): ITicketThreeLevelsClassifierHookOutput => {
    const intl = useIntl()
    const PlaceClassifierLabel = intl.formatMessage({ id: 'component.ticketclassifier.PlaceLabel' })
    const CategoryClassifierLabel = intl.formatMessage({ id: 'component.ticketclassifier.CategoryLabel' })
    const DescriptionClassifierLabel = intl.formatMessage({ id: 'component.ticketclassifier.DescriptionLabel' })
    const threeLvlSelectState = useRef({ id: classifierRule, place: null, category:null, description: null })
    const client = useApolloClient()
    const helper = new ClassifiersQueryLocal(client)
    const validations = useTicketValidations()
    const ticketForm = useRef(null)

    const onUserSelect = (id, type) => {
        threeLvlSelectState.current = { ...threeLvlSelectState.current, [type]: id }
        updateLevels({ [type]: id })
    }
    const onUserSearch = async (input, type) => {
        const classifiers = await helper.search(input, type)
        Setter[type].search(classifiers)
    }

    const {
        set: descriptionSet,
        SelectComponent: DescriptionSelect,
    } = useTicketClassifierSelectHook({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.description),
        onSearch: (id) => onUserSearch(id, TicketClassifierTypes.description),
        initialValue: descriptionClassifier,
    })

    const {
        set: categorySet,
        SelectComponent: CategorySelect,
        ref: categoryRef,
    } = useTicketClassifierSelectHook({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.category),
        onSearch: (id) => onUserSearch(id, TicketClassifierTypes.category),
        initialValue: categoryClassifier,
    })

    const {
        set: placeSet,
        SelectComponent: PlaceSelect,
        ref: placeRef,
    } = useTicketClassifierSelectHook({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.place),
        onSearch: (id) => onUserSearch(id, TicketClassifierTypes.place),
        initialValue: placeClassifier,
    })

    const Setter = {
        place: placeSet,
        category: categorySet,
        description: descriptionSet,
    }

    useEffect(() => {
        helper.init().then(_ => {
            if (threeLvlSelectState.current.id) {
                helper.findRules({ id: threeLvlSelectState.current.id }).then(([rule]) => {
                    const { place, category, description } = rule
                    threeLvlSelectState.current = { ...threeLvlSelectState.current, ...{ place: place.id, category: category.id, description: description.id } }
                    updateLevels(threeLvlSelectState.current)
                })
            } else {
                helper.search('', 'place').then(places => {
                    Setter.place.all(places)
                })
                helper.search('', 'category').then(categories => {
                    Setter.category.all(categories)
                })
            }
        })
        return () => {
            // clear all loaded data from helper
            helper.clear()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadLevels = async () => {
        const { place, category, description } = threeLvlSelectState.current
        const loadedRules = await Promise.all([
            { category, description, type: 'place' },
            { place, description, type: 'category' },
            { place, category, type: 'description' },
        ].map(selector => {
            const { type, ...querySelectors } = selector
            return new Promise<[string, Options[]]>(resolve => {
                const query = {}
                for (const key in querySelectors) {
                    if (querySelectors[key]) {
                        query[key] = { id: querySelectors[key] }
                    }
                }
                helper.findRules(query).then(data => resolve([type, helper.rulesToOptions(data, type)]))
            })
        }))
        const result = Object.fromEntries(loadedRules)
        return result
    }

    const openSelect = (ref) => {
        if (ref.current) {
            ref.current.blur()
            setTimeout(ref.current.focus, 0)
        }
    }

    const updateRuleId = async () => {
        const querySelectors = pick(threeLvlSelectState.current, ['place', 'category', 'description'])
        const query = {}
        for (const key in querySelectors) {
            if (querySelectors[key]) {
                query[key] = { id: querySelectors[key] }
            }
        }
        const matchingRules = await helper.findRules(query)
        if (matchingRules.length === 1) {
            threeLvlSelectState.current = { ...threeLvlSelectState.current, id: matchingRules[0].id }
        } else if (threeLvlSelectState.current.place && threeLvlSelectState.current.category) {
            const withEmptyDescription = find(matchingRules, { description: null })
            if (withEmptyDescription){
                threeLvlSelectState.current = { ...threeLvlSelectState.current, id: withEmptyDescription.id }
            }
        }
        ticketForm.current.setFields([
            { name: 'classifierRule', value: threeLvlSelectState.current.id },
            { name: 'placeClassifier', value: threeLvlSelectState.current.place },
            { name: 'categoryClassifier', value: threeLvlSelectState.current.category },
            { name: 'descriptionClassifier', value: threeLvlSelectState.current.description },
        ])
    }

    const updateLevels = async (selected = {}, maxUpdates = 2 ) => {
        threeLvlSelectState.current = { ...threeLvlSelectState.current, ...selected }
        const options = await loadLevels()
        const state = threeLvlSelectState.current
        const updateEmptyState = {}
        Object.keys(Setter).forEach(type => {
            const isExisted = options[type].find(option => option.id === state[type])
            if (!isExisted && state[type]) {
                updateEmptyState[type] = null
            }
        })
        if (!isEmpty(updateEmptyState)) {
            // we need to rebuild all options except selected
            threeLvlSelectState.current = { ...threeLvlSelectState.current, ...updateEmptyState, id: null, ...selected }
            if (maxUpdates > 0) {
                return await updateLevels(selected, --maxUpdates)
            }
        }
        Object.keys(Setter).forEach(type => {
            Setter[type].all(options[type])
            const isExisted = options[type].find(option => option.id === state[type])
            Setter[type].one(isExisted ? state[type] : null)
        })
        await updateRuleId()
        if (!state.place && state.category) {
            openSelect(placeRef)
        } else if (!state.category && state.place) {
            openSelect(categoryRef)
        }
    }


    const ClassifiersEditorComponent = useMemo(() => {
        const ClassifiersEditorWrapper: React.FC<{ form, disabled }> = ({ form, disabled }) => {
            ticketForm.current = form
            return (
                <>
                    <Form.Item name={'classifierRule'} rules={validations.classifierRule} noStyle={true}>
                        <Input type='hidden'></Input>
                    </Form.Item>
                    <Col span={12} style={{ paddingRight: '20px' }}>
                        <Form.Item label={PlaceClassifierLabel} name={'placeClassifier'} rules={validations.placeClassifier}>
                            <PlaceSelect disabled={disabled} />
                        </Form.Item>
                    </Col>
                    <Col span={12} style={{ paddingLeft: '20px' }}>
                        <Form.Item label={CategoryClassifierLabel} name={'categoryClassifier'} rules={validations.categoryClassifier}>
                            <CategorySelect disabled={disabled} />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name={'descriptionClassifier'}  label={DescriptionClassifierLabel}>
                            <DescriptionSelect disabled={disabled} />
                        </Form.Item>
                    </Col>
                </>
            )
        }
        return ClassifiersEditorWrapper
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return {
        ClassifiersEditorComponent,
    }
}
