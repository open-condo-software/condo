import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Select, Input, Col, Form, Typography, Skeleton } from 'antd'
const { Option } = Select
import { useApolloClient } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'


import { uniqBy, isEmpty } from 'lodash'
import { ClassifiersQueryLocal, IClassifiersSearch, TicketClassifierTypes } from '@condo/domains/ticket/utils/clientSchema/classifierSearch'
import { useTicketValidations } from '@condo/domains/ticket/components/BaseTicketForm/useTicketValidations'


interface Options {
    id: string
    name: string
}
interface ITicketThreeLevelsClassifierHookInput {
    initialValues: { classifierRule: string }
}

interface ITicketClassifierSelectHookInput {
    onChange: (id: string) => void
    type: TicketClassifierTypes
    helper: IClassifiersSearch
}

type ClassifierSelectComponent = React.FC<{
    disabled?: boolean
    style?: React.CSSProperties
}>

interface ITicketClassifierSelectHookOutput {
    set: {
        all: React.Dispatch<React.SetStateAction<Options[]>>
        one: React.Dispatch<React.SetStateAction<string>>
    }
    SelectComponent: ClassifierSelectComponent
    ref: React.MutableRefObject<HTMLSelectElement>
}

const useTicketClassifierSelectHook = ({
    onChange,
    type,
    helper,
}: ITicketClassifierSelectHookInput): ITicketClassifierSelectHookOutput => {
    const [selected, setSelected] = useState<string>(null)
    const [classifiers, setClassifiersFromLinks] = useState<Options[]>([])
    const [searchClassifiers, setSearchClassifiers] = useState<Options[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const classifiersRef = useRef<HTMLSelectElement>(null)
    const optionsRef = useRef<Options[]>([])

    const setClassifiers = (classifiers) => {
        setClassifiersFromLinks(classifiers)
        // We need to remove search classifiers
        setSearchClassifiers([])
    }

    useEffect(() => {
        helper.search('', type)
        return () => console.log('Select destroyed', type)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSearch = async (input) => {
        setIsLoading(true)
        const loaded = await helper.search(input, type)
        setSearchClassifiers(loaded)
        setIsLoading(false)
    }

    useEffect(() => {
        optionsRef.current = uniqBy([...classifiers, ...searchClassifiers], 'id')
    }, [classifiers, searchClassifiers])

    const SelectComponent = useMemo(() => {
        const SelectComponentWrapper: React.FC<{ disabled?: boolean, style?: React.CSSProperties }> = (props) => {
            const { disabled, style } = props
            return (
                <Select
                    showSearch
                    style={style}
                    allowClear={true}
                    onSelect={onChange}
                    onSearch={handleSearch}
                    onClear={() => onChange(null)}
                    optionFilterProp={'title'}
                    defaultActiveFirstOption={false}
                    value={selected}
                    disabled={disabled}
                    loading={isLoading}
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
        },
        ref: classifiersRef,
    }
}

export const useTicketThreeLevelsClassifierHook = ({ initialValues: { classifierRule } }: ITicketThreeLevelsClassifierHookInput): JSX.Element => {
    const intl = useIntl()
    const PlaceClassifierLabel = intl.formatMessage({ id: 'component.ticketclassifier.PlaceLabel' })
    const CategoryClassifierLabel = intl.formatMessage({ id: 'component.ticketclassifier.CategoryLabel' })
    const DescriptionClassifierLabel = intl.formatMessage({ id: 'component.ticketclassifier.DescriptionLabel' })
    const threeLvlSelectState = useRef({ id: classifierRule, place: null, category:null, description: null })
    const client = useApolloClient()
    const helper = new ClassifiersQueryLocal(client)
    const validations = useTicketValidations()


    const onUserSelect = (id, type) => {
        threeLvlSelectState.current = { ...threeLvlSelectState.current, [type]: id }
        updateLevels({ [type]: id })
    }

    const {
        set: descriptionSet,
        SelectComponent: DescriptionSelect,
    } = useTicketClassifierSelectHook({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.description),
        helper,
        type: TicketClassifierTypes.place,
    })

    const {
        set: categorySet,
        SelectComponent: CategorySelect,
        ref: categoryRef,
    } = useTicketClassifierSelectHook({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.category),
        helper,
        type: TicketClassifierTypes.category,
    })

    const {
        set: placeSet,
        SelectComponent: PlaceSelect,
        ref: placeRef,
    } = useTicketClassifierSelectHook({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.place),
        helper,
        type: TicketClassifierTypes.place,
    })

    const Setter = {
        place: placeSet,
        category: categorySet,
        description: descriptionSet,
    }

    useEffect(() => {
        helper.init().then(_ => {
            if (threeLvlSelectState.current.id) {
                helper.findRules({ id: threeLvlSelectState.current.id }).then(([link]) => {
                    const { place, category, description } = link
                    threeLvlSelectState.current = { ...threeLvlSelectState.current, ...{ place: place.id, category: category.id, description: description.id } }
                    updateLevels(threeLvlSelectState.current).then(_ => updateRuleId())
                })
            }
        })
        return () => {
            helper.clear()
            return console.log('3 lvl select destroyed')
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const load3levels = async () => {
        console.log('load3levels')
        const { place, category, description } = threeLvlSelectState.current
        const loadedLinks = await Promise.all([
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
        const result = Object.fromEntries(loadedLinks)
        return result
    }

    const openSelect = (ref) => {
        if (ref.current) {
            ref.current.blur()
            setTimeout(ref.current.focus, 0)
        }
    }

    const updateRuleId = async () => {
        console.log('updateRuleId', threeLvlSelectState.current)
        const { id, ...querySelectors } = threeLvlSelectState.current
        const query = {}
        for (const key in querySelectors) {
            if (querySelectors[key]) {
                query[key] = { id: querySelectors[key] }
            }
        }
        const matchingRules = await helper.findRules(query)
        console.log('matchingRules', matchingRules)
        if (matchingRules.length === 1) {
            console.log('switch rule from ', id, ' to ', matchingRules[0].id)
            threeLvlSelectState.current = { ...threeLvlSelectState.current, id: matchingRules[0].id }
        }
    }

    const updateLevels = async (selected = {}) => {
        threeLvlSelectState.current = { ...threeLvlSelectState.current, ...selected }
        const options = await load3levels()
        const state = threeLvlSelectState.current
        const updateEmptyState = {}
        Object.keys(Setter).forEach(type => {
            const isExisted = options[type].find(x => x.id === state[type])
            if (!isExisted && state[type]) {
                updateEmptyState[type] = null
            }
        })
        if (!isEmpty(updateEmptyState)) {
            threeLvlSelectState.current = { ...threeLvlSelectState.current, ...updateEmptyState, ...selected }
            return await updateLevels(selected)
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

    const ClassifiersEditorComponent = ({ form }) => {
        return (
            <>
                <Col span={24}>
                    <Form.Item name={'classifierRule'} rules={validations.classifierRule} >
                        <Input type='text' value={threeLvlSelectState.current.id}></Input>
                    </Form.Item>
                </Col>
                <Col span={12} style={{ paddingRight: '20px' }}>
                    <Form.Item label={PlaceClassifierLabel} name={'placeClassifier'} rules={validations.placeClassifier} valuePropName='selected'>
                        <PlaceSelect />
                    </Form.Item>
                </Col>
                <Col span={12} style={{ paddingLeft: '20px' }}>
                    <Form.Item label={CategoryClassifierLabel} name={'categoryClassifier'} rules={validations.categoryClassifier} valuePropName='selected'>
                        <CategorySelect />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item name={'descriptionClassifier'}  label={DescriptionClassifierLabel} valuePropName='selected'>
                        <DescriptionSelect />
                    </Form.Item>
                </Col>
            </>
        )
    }


    return {
        ClassifiersEditorComponent,
    }
}
