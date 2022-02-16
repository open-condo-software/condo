/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
require('cy-verify-downloads').addCustomCommand()

Cypress.Commands.add('waitForCaptcha', function () {
    cy.get('iframe').first()
})
