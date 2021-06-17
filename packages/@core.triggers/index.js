/*
*
* Register triggers,
* manage triggers,
* execute triggers.
*
* */

const { Engine, Rule } = require('json-rules-engine')

class TriggersManager {
    registerTrigger (trigger) {
        const { rule: ruleDefs, action } = trigger
        if (this.triggers.has(ruleDefs.name)) {
            throw new Error(`Trigger ${ruleDefs.name} is already registered`)
        }

        const rule = new Rule(ruleDefs)

        this.triggers.set(ruleDefs.name, { rule, action })
        this.engine.addRule(rule)
    }

    dropTrigger (trigger) {
        const { name, rule } = trigger

        if (!this.triggers.has(name)) {
            throw new Error(`There is no Trigger with name: ${name} found, unable to drop`)
        }

        this.triggers.delete(name)
        this.engine.removeRule(rule)
    }

    executeTrigger (data, context) {
        if (this.triggers.size === 0) {
            throw new Error('No triggers registered')
        }

        return this.engine.run(data)
            .then(({ events }) => {
                const actions = events.map((event) => {
                    const trigger = this.triggers.get(event.params.name)

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
                    return Promise.all(actions)
                }
            })
    }

    triggers = new Map()
    engine = new Engine()
}

const triggersManager = new TriggersManager()

// TODO:Dimtiree add dynamic trigger registration
const registerTriggers = (modulesList) => {
    modulesList.forEach(
        (module) => {
            Object.values(module).forEach((trigger) => {
                triggersManager.registerTrigger(trigger)
            })
        })
}

module.exports = {
    triggersManager,
    registerTriggers,
}