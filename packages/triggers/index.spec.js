const { TriggersManager } = require('./index')

describe('TriggersManager', () => {
    let triggersMap = null
    let triggersManager = null

    beforeEach(() => {
        triggersMap = new Map()
        triggersManager = new TriggersManager(triggersMap)
    })

    describe('triggersMap management', () => {
        it('add trigger', () => {
            const mockTrigger = {
                rule: {
                    conditions: {
                        all: [
                            {
                                fact: 'fact',
                                operator: 'equal',
                                value: 'value',
                            },
                        ],
                    },
                    event: {
                        type: 'mockTrigger',
                    },
                },
                action: () => {
                    return Promise.resolve()
                },
            }

            triggersManager.addTrigger(mockTrigger)

            expect(triggersMap.has(mockTrigger.rule.event.type)).toBeTruthy()
        })

        it('drop trigger', () => {
            const mockTrigger = {
                rule: {
                    conditions: {
                        all: [
                            {
                                fact: 'fact',
                                operator: 'equal',
                                value: 'value',
                            },
                        ],
                    },
                    event: {
                        type: 'mockTrigger',
                    },
                },
                action: () => {
                    return Promise.resolve()
                },
            }

            triggersManager.addTrigger(mockTrigger)
            triggersManager.dropTrigger(mockTrigger)

            expect(triggersMap.has(mockTrigger.rule.event.type)).toBeFalsy()
        })

        it('flush triggers', () => {
            const mockTrigger = {
                rule: {
                    conditions: {
                        all: [
                            {
                                fact: 'fact',
                                operator: 'equal',
                                value: 'value',
                            },
                        ],
                    },
                    event: {
                        type: 'mockTrigger',
                    },
                },
                action: () => {
                    return Promise.resolve()
                },
            }

            const anotherMockTrigger = {
                rule: {
                    conditions: {
                        all: [
                            {
                                fact: 'fact',
                                operator: 'equal',
                                value: 'value',
                            },
                        ],
                    },
                    event: {
                        type: 'anotherMockTrigger',
                    },
                },
                action: () => {
                    return Promise.resolve()
                },
            }

            triggersManager.addTrigger(mockTrigger)
            triggersManager.addTrigger(anotherMockTrigger)
            triggersManager.flushTriggers()

            expect(triggersMap.size).toEqual(0)
        })
    })

    describe('triggers execution', () => {
        describe('should execute trigger', () => {
            it('sync trigger', (done) => {
                let triggerActionExecuted = false

                const mockTrigger = {
                    rule: {
                        conditions: {
                            all: [
                                {
                                    fact: 'fact',
                                    operator: 'equal',
                                    value: 'should be triggered',
                                },
                            ],
                        },
                        event: {
                            type: 'mockTrigger',
                        },
                    },
                    action: () => {
                        triggerActionExecuted = true
                    },
                }

                triggersManager.addTrigger(mockTrigger)
                triggersManager.executeTrigger({ fact: 'should be triggered' }, {}).then(() => {
                    expect(triggerActionExecuted).toBeTruthy()
                    done()
                })
            })

            describe('async trigger', () => {
                it('single', (done) => {
                    let triggerActionExecuted = false

                    const mockTrigger = {
                        rule: {
                            conditions: {
                                all: [
                                    {
                                        fact: 'fact',
                                        operator: 'equal',
                                        value: 'should be triggered',
                                    },
                                ],
                            },
                            event: {
                                type: 'mockTrigger',
                            },
                        },
                        action: () => {
                            return new Promise((res) => {
                                triggerActionExecuted = true

                                setTimeout(() => {
                                    res()
                                }, 100)
                            })
                        },
                    }

                    triggersManager.addTrigger(mockTrigger)
                    triggersManager.executeTrigger({ fact: 'should be triggered' }, {}).then(() => {
                        expect(triggerActionExecuted).toBeTruthy()
                        done()
                    })
                })

                describe('multiple', () => {
                    it('without priority', (done) => {
                        let triggerActionExecuted = false
                        let anotherTriggerActionExecuted = false

                        const mockTrigger = {
                            rule: {
                                conditions: {
                                    all: [
                                        {
                                            fact: 'fact',
                                            operator: 'equal',
                                            value: 'should be triggered',
                                        },
                                    ],
                                },
                                event: {
                                    type: 'mockTrigger',
                                },
                            },
                            action: () => {
                                return new Promise((res) => {
                                    triggerActionExecuted = true

                                    setTimeout(() => {
                                        res()
                                    }, 100)
                                })
                            },
                        }

                        const anotherMockTrigger = {
                            rule: {
                                conditions: {
                                    all: [
                                        {
                                            fact: 'anotherFact',
                                            operator: 'equal',
                                            value: 'should be triggered',
                                        },
                                    ],
                                },
                                event: {
                                    type: 'anotherMockTrigger',
                                },
                            },
                            action: () => {
                                return new Promise((res) => {
                                    anotherTriggerActionExecuted = true

                                    setTimeout(() => {
                                        res()
                                    }, 100)
                                })
                            },
                        }

                        triggersManager.addTrigger(mockTrigger)
                        triggersManager.addTrigger(anotherMockTrigger)

                        triggersManager.executeTrigger({
                            fact: 'should be triggered',
                            anotherFact: 'should be triggered',
                        }, {}).then(() => {
                            expect(triggerActionExecuted).toBeTruthy()
                            expect(anotherTriggerActionExecuted).toBeTruthy()
                            done()
                        })
                    })

                    it('with priority', (done) => {
                        const calledTriggersOrder = []

                        const mockTrigger = {
                            rule: {
                                conditions: {
                                    all: [
                                        {
                                            fact: 'fact',
                                            operator: 'equal',
                                            value: 'should be triggered',
                                        },
                                    ],
                                },
                                priority: 1,
                                event: {
                                    type: 'mockTrigger',
                                },
                            },
                            action: () => {
                                return new Promise((res) => {
                                    calledTriggersOrder.push('firstTriggerActionExecuted')

                                    setTimeout(() => {
                                        res()
                                    }, 100)
                                })
                            },
                        }

                        const anotherMockTrigger = {
                            rule: {
                                conditions: {
                                    all: [
                                        {
                                            fact: 'anotherFact',
                                            operator: 'equal',
                                            value: 'should be triggered',
                                        },
                                    ],
                                },
                                priority: 2,
                                event: {
                                    type: 'anotherMockTrigger',
                                },
                            },
                            action: () => {
                                return new Promise((res) => {
                                    calledTriggersOrder.push('secondTriggerActionExecuted')

                                    setTimeout(() => {
                                        res()
                                    }, 100)
                                })
                            },
                        }

                        triggersManager.addTrigger(mockTrigger)
                        triggersManager.addTrigger(anotherMockTrigger)

                        triggersManager.executeTrigger({
                            fact: 'should be triggered',
                            anotherFact: 'should be triggered',
                        }, {}).then(() => {
                            expect(calledTriggersOrder).toStrictEqual(['secondTriggerActionExecuted', 'firstTriggerActionExecuted'])
                            done()
                        })
                    })
                })
            })
        })

        describe('should not execute trigger', () => {
            it('if there is no rules found', (done) => {
                let triggerActionExecuted = false

                triggersManager.executeTrigger({ fact: 'should be triggered' }, {}).then(() => {
                    expect(triggerActionExecuted).toBeFalsy()
                    done()
                })
            })

            it('if specific fact did not matched', (done) => {
                let triggerActionExecuted = false

                const mockTrigger = {
                    rule: {
                        conditions: {
                            all: [
                                {
                                    fact: 'fact',
                                    operator: 'equal',
                                    value: 'should be triggered',
                                },
                            ],
                        },
                        event: {
                            type: 'mockTrigger',
                        },
                    },
                    action: () => {
                        triggerActionExecuted = true
                    },
                }

                triggersManager.addTrigger(mockTrigger)
                triggersManager.executeTrigger({ fact: 'should not be triggered' }, {}).then(() => {
                    expect(triggerActionExecuted).toBeFalsy()
                    done()
                })
            })
        })
    })
})