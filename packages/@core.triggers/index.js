/*
* Triggers manager.
* - add triggers
* - drop triggers
* - execute triggers validation triggers conditions using *json-rules-engine* and similar rules language
*
* */

const Q = require('q')
const { Engine, Rule } = require('json-rules-engine')
const get = require('lodash/get')

class TriggersManager {
    constructor (triggersMap) {
        this.engine = new Engine()
        this.triggers = triggersMap || new Map()
    }

    addTrigger (trigger) {
        const { rule, action } = trigger
        const triggerName = get(rule, ['event', 'type'])

        if (!triggerName) {
            throw new Error('Trigger event type was not provided')
        }

        if (this.triggers.has(triggerName)) {
            throw new Error(`Trigger ${triggerName} is already registered. Rule event type should be unique`)
        }

        const engineRule = new Rule(rule)

        this.triggers.set(triggerName, { rule: engineRule, action })
        this.engine.addRule(engineRule)
    }

    dropTrigger (trigger) {
        const { rule } = trigger
        const triggerName = get(rule, ['event', 'type'])

        if (!this.triggers.has(triggerName)) {
            throw new Error(`There is no Trigger with name: ${triggerName} found, unable to drop`)
        }

        this.triggers.delete(triggerName)
        this.engine.removeRule(rule)
    }

    flushTriggers () {
        this.triggers.forEach(( triggerName, { rule }) => {
            this.engine.removeRule(rule)
        })

        this.triggers.clear()
    }

    executeTrigger (data, context) {
        if (this.triggers.size > 0) {
            return this.engine.run(data)
                .then(({ events }) => {
                    const actions = events.map((event) => {
                        const trigger = this.triggers.get(event.type)

                        if (!trigger) {
                            throw new Error(`Trigger with name ${event.params.name} is not found`)
                        }

                        const { action } = trigger

                        if (!action) {
                            throw new Error(`Trigger action from ${event.params.name} is not found`)
                        }

                        return action(data, context)
                    })

                    if (actions.length) {
                        // return chained version of triggers action using q:
                        return actions.reduce(Q.when, Q())
                    }

                    return Promise.resolve()
                })
        }

        return Promise.resolve()

    }
}

const triggersManager = new TriggersManager()

// TODO(Dimtiree): add dynamic trigger registration
const registerTriggers = (modulesList) => {
    modulesList.forEach(
        (module) => {
            Object.values(module).forEach((trigger) => {
                triggersManager.addTrigger(trigger)
            })
        })
}

module.exports = {
    TriggersManager,
    triggersManager,
    registerTriggers,
}