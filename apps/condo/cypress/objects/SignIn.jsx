/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */
import { HOME_PAGE_URL } from './Home'

const SIGNIN_URL = `${HOME_PAGE_URL}/auth/signin/`

class SignIn {

    visit () {
        cy.visit(SIGNIN_URL)
        return this
    }

    fillPhone (value) {
        const field = cy.get('[data-ci=signin-phone-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillPassword (value) {
        const field = cy.get('[data-ci=signin-password-item] input')
        field.clear()
        field.type(value)
        return this
    }

    signinClick () {
        const button = cy.get('[data-ci=signin-button]')
        button.click()
        return this
    }
}

export {
    SignIn,
    SIGNIN_URL,
}
