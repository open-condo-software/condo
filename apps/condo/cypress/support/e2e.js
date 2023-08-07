import './commands'

Cypress.on('uncaught:exception', (err) => {
    if (err.message.toLowerCase().includes('resizeobserver')) {
        return false
    }
})

const prepareTestEnvironment = () => {
    cy.viewport('macbook-13')

    cy.intercept('POST', '/admin/api', (req) =>
        new Promise((resolve, reject) => {
            req.alias = req.body.operationName
            resolve()
        })
    )
}

beforeEach(prepareTestEnvironment)
