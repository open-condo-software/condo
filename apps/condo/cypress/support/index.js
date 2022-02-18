import './commands'

let commands = []
let testAttributes

// Cypress.on('test:before:run', () => {
//     commands.length = 0
// })

Cypress.on('test:after:run', (attributes) => {
    console.log('Test "%s" has finished in %dms', attributes.title, attributes.duration)
    console.table(commands)
    testAttributes = {
        title: attributes.title,
        duration: attributes.duration,
        commands: Cypress._.cloneDeep(commands),
    }
    commands.length = 0

})

Cypress.on('command:start', (c) => {
    commands.push({
        name: c.attributes.name,
        started: +new Date(),
    })
})

Cypress.on('command:end', (c) => {
    const lastCommand = commands[commands.length - 1]

    if (lastCommand.name !== c.attributes.name) {
        throw new Error('Last command is wrong')
    }

    lastCommand.endedAt = +new Date()
    lastCommand.elapsed = lastCommand.endedAt - lastCommand.started
})

const sendTestTimings = () => {
    if (!testAttributes) {
        return
    }

    const attr = testAttributes
    testAttributes = null
    cy.task('testTimings', attr)
}

beforeEach(sendTestTimings)

after(sendTestTimings)

