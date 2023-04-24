/**
 * Similar to cy.visit(url), but will track page loading time.
 * @param {string} url
 * @example trackedVisit('/auth/signin/')
 */

const trackedVisit: (url) => Cypress.Chainable<Performance> = (url) => {
    // transforms /auth/signin/ to auth.signin
    const normalizedUrl = url.replace(/^\/?|\/?$/g, '').replaceAll('/', '.')

    return cy.visit(url, {
        onBeforeLoad: (win) => {
            win.performance.mark(`${normalizedUrl}.startLoading`)
        },
        onLoad: (win) => {
            win.performance.mark(`${normalizedUrl}.stopLoading`)
        },
    }).its('performance').then((p) => {
        p.measure(`${normalizedUrl}.pageLoad`, `${normalizedUrl}.startLoading`, `${normalizedUrl}.stopLoading`)
        const measure = p.getEntriesByName(`${normalizedUrl}.pageLoad`)[0]

        cy.log(`[helpers.ts] ${normalizedUrl} loaded in: ${measure.duration}`)
        cy.task('metrics:histogram', [`${normalizedUrl}.pageload`, measure.duration])
    })
}

type Span = {
    name: string,
    fullName: string,
    finish: () => void,
}

/**
 * SimpleTracer helps to trace cypress testcases dividing them into semantic part
 */
class SimpleTracer {
    name: string
    perf: Performance
    spans: Array<Span>
    private _finished: boolean

    constructor (name: string) {
        this.name = name
        this.perf = performance
        this.spans = []
        this._finished = false
    }

    startSpan: (spanName: string) => Span = (spanName) => {
        if (this._finished == true) {
            throw new Error(`You can't start spans on a finished trace! Trace: ${this.name}, Span: ${spanName}`)
        }
        
        const [spanStartMark, spanEndMark] = this._getSpanMarkNames(spanName)
        this.perf.mark(spanStartMark)
        const span = {
            name: spanName,
            fullName: this.name + '.' + spanName,
            finish: () => {
                this.perf.mark(spanEndMark)
                this._registerSpan(spanName)
            },
        }
        this.spans.push(span)
        return span
    }

    finish: () => Cypress.Chainable<unknown> = () => {
        this._finished = true
        return cy.task('grafana:drawTrace', [this.name, this.spans])
    }

    _getSpanMarkNames: (spanName: string) => [string, string] = (spanName) => {
        const spanStartMark = 'span.' + this.name + '.' + spanName + '.start'
        const spanEndMark = 'span.' + this.name + '.' + spanName + '.end'
        return [ spanStartMark, spanEndMark ]
    }

    _registerSpan: (spanName: string) => void = (spanName) => {
        const [spanStartMark, spanEndMark] = this._getSpanMarkNames(spanName)
        const measure = this.perf.measure(this.name + '.' + spanName, spanStartMark, spanEndMark)
        cy.task('metrics:histogram', [`${this.name}.${spanName}`, measure.duration])
    }
}

export {
    trackedVisit,
    SimpleTracer,
}