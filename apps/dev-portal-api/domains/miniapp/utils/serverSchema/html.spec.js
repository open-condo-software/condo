const { injectScriptTags } = require('./html')

const TAGS = '<script src="www/cordova-bridge-adapter.js"></script>'

describe('html utils', () => {
    describe('injectScriptTags', () => {
        test('injects after plain <head>', () => {
            const input = '<html><head><title>App</title></head></html>'
            const result = injectScriptTags(input, TAGS)
            expect(result).toBe(`<html><head>${TAGS}<title>App</title></head></html>`)
        })

        test('injects after <head> with attributes', () => {
            const input = '<html><head lang="en"><title>App</title></head></html>'
            const result = injectScriptTags(input, TAGS)
            expect(result).toBe(`<html><head lang="en">${TAGS}<title>App</title></head></html>`)
        })

        test('injects after <head> preceded by doctype', () => {
            const input = '<!DOCTYPE html><html><head><title>App</title></head></html>'
            const result = injectScriptTags(input, TAGS)
            expect(result).toBe(`<!DOCTYPE html><html><head>${TAGS}<title>App</title></head></html>`)
        })

        test('injects after <head> preceded by <html> with attributes', () => {
            const input = '<html lang="ru"><head><title>App</title></head></html>'
            const result = injectScriptTags(input, TAGS)
            expect(result).toBe(`<html lang="ru"><head>${TAGS}<title>App</title></head></html>`)
        })

        test('injects multiple script tags', () => {
            const multipleTags = '<script src="a.js"></script><script src="b.js"></script>'
            const input = '<html><head></head></html>'
            const result = injectScriptTags(input, multipleTags)
            expect(result).toBe(`<html><head>${multipleTags}</head></html>`)
        })

        test('injects empty scriptTags without modifying content', () => {
            const input = '<html><head><title>App</title></head></html>'
            const result = injectScriptTags(input, '')
            expect(result).toBe(input)
        })

        test('returns content unchanged when no <head tag present', () => {
            const input = '<html><body><p>No head</p></body></html>'
            expect(injectScriptTags(input, TAGS)).toBe(input)
        })

        test('returns content unchanged when <head has no closing >', () => {
            const input = '<html><head'
            expect(injectScriptTags(input, TAGS)).toBe(input)
        })

        test('only injects after the first <head occurrence', () => {
            const input = '<html><head><noscript><!-- <head> --></noscript></head></html>'
            const result = injectScriptTags(input, TAGS)
            expect(result).toBe(`<html><head>${TAGS}<noscript><!-- <head> --></noscript></head></html>`)
        })

        test('injects after uppercase <HEAD>', () => {
            const input = '<html><HEAD><title>App</title></HEAD></html>'
            const result = injectScriptTags(input, TAGS)
            expect(result).toBe(`<html><HEAD>${TAGS}<title>App</title></HEAD></html>`)
        })

        test('injects after mixed-case <Head>', () => {
            const input = '<html><Head lang="en"><title>App</title></Head></html>'
            const result = injectScriptTags(input, TAGS)
            expect(result).toBe(`<html><Head lang="en">${TAGS}<title>App</title></Head></html>`)
        })

        test('handles self-closing-like <head/> gracefully', () => {
            const input = '<html><head/><body></body></html>'
            const result = injectScriptTags(input, TAGS)
            expect(result).toBe(`<html><head>${TAGS}</head><body></body></html>`)
        })

        test('handles self-closing <head/> with attributes', () => {
            const input = '<html><head lang="ru"/><body></body></html>'
            const result = injectScriptTags(input, TAGS)
            expect(result).toBe(`<html><head lang="ru">${TAGS}</head><body></body></html>`)
        })

        describe('CSP meta tag present', () => {
            test('inserts script tags after CSP meta tag', () => {
                const csp = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'">'
                const input = `<html><head>${csp}<title>App</title></head></html>`
                const result = injectScriptTags(input, TAGS)
                expect(result).toBe(`<html><head>${csp}${TAGS}<title>App</title></head></html>`)
            })

            test('does not modify CSP tag content', () => {
                const csp = '<meta http-equiv="Content-Security-Policy" content="script-src \'nonce-abc\'">'
                const input = `<html><head>${csp}</head></html>`
                const result = injectScriptTags(input, TAGS)
                expect(result.includes(csp)).toBe(true)
                // nosemgrep: javascript.lang.security.audit.unknown-value-with-script-tag.unknown-value-with-script-tag
                expect(result.indexOf(TAGS)).toBe(result.indexOf(csp) + csp.length)
            })

            test('inserts after CSP even when CSP is not the first child', () => {
                const csp = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'">'
                const input = `<html><head><title>App</title>${csp}<link rel="stylesheet" href="a.css"></head></html>`
                const result = injectScriptTags(input, TAGS)
                const cspEnd = result.indexOf(csp) + csp.length
                // nosemgrep: javascript.lang.security.audit.unknown-value-with-script-tag.unknown-value-with-script-tag
                expect(result.slice(cspEnd, cspEnd + TAGS.length)).toBe(TAGS)
            })

            test('detects CSP with uppercase http-equiv value', () => {
                const csp = '<meta http-equiv="CONTENT-SECURITY-POLICY" content="default-src \'self\'">'
                const input = `<html><head>${csp}<title>App</title></head></html>`
                const result = injectScriptTags(input, TAGS)
                const cspEnd = result.indexOf(csp) + csp.length
                // nosemgrep: javascript.lang.security.audit.unknown-value-with-script-tag.unknown-value-with-script-tag
                expect(result.slice(cspEnd, cspEnd + TAGS.length)).toBe(TAGS)
            })

            test('detects CSP with mixed-case http-equiv value', () => {
                const csp = '<meta http-equiv="content-security-policy" content="default-src \'self\'">'
                const input = `<html><head>${csp}<title>App</title></head></html>`
                const result = injectScriptTags(input, TAGS)
                const cspEnd = result.indexOf(csp) + csp.length
                // nosemgrep: javascript.lang.security.audit.unknown-value-with-script-tag.unknown-value-with-script-tag
                expect(result.slice(cspEnd, cspEnd + TAGS.length)).toBe(TAGS)
            })

            test('does not treat unrelated meta tags as CSP', () => {
                const input = '<html><head><meta charset="utf-8"><title>App</title></head></html>'
                const result = injectScriptTags(input, TAGS)
                expect(result).toBe(`<html><head>${TAGS}<meta charset="utf-8"><title>App</title></head></html>`)
            })
        })

        describe('malformed HTML preservation', () => {
            test('preserves <body> tag with attributes when HTML contains unclosed tags', () => {
                const input = [
                    '<!DOCTYPE html>',
                    '<html><head><title>App</title></head>',
                    '<body class="main" style="font-size:12px;">',
                    '<ul>',
                    '  <li><a href="#"><b>Unclosed bold</a></li>',
                    '</ul>',
                    '</body></html>',
                ].join('\n')
                // nosemgrep: javascript.lang.security.audit.unknown-value-with-script-tag.unknown-value-with-script-tag
                const result = injectScriptTags(input, TAGS)
                expect(result).toBe([
                    '<!DOCTYPE html>',
                    `<html><head>${TAGS}<title>App</title></head>`,
                    '<body class="main" style="font-size:12px;">',
                    '<ul>',
                    '  <li><a href="#"><b>Unclosed bold</a></li>',
                    '</ul>',
                    '</body></html>',
                ].join('\n'))
            })

            test('does not strip HTML comments', () => {
                const input = '<html><head><!-- jQuery library --><title>App</title></head><body></body></html>'
                const result = injectScriptTags(input, TAGS)
                expect(result).toBe(`<html><head>${TAGS}<!-- jQuery library --><title>App</title></head><body></body></html>`)
            })

            test('preserves all original content when HTML has unclosed tags in body', () => {
                const input = [
                    '<!DOCTYPE html>',
                    '<html><head><title>App</title></head>',
                    '<body class="container" style="font-family: sans-serif;">',
                    '<div><a href="#"><b>Unclosed</a></div>',
                    '</body></html>',
                ].join('\n')
                // nosemgrep: javascript.lang.security.audit.unknown-value-with-script-tag.unknown-value-with-script-tag
                const result = injectScriptTags(input, TAGS)
                expect(result).toBe([
                    '<!DOCTYPE html>',
                    `<html><head>${TAGS}<title>App</title></head>`,
                    '<body class="container" style="font-family: sans-serif;">',
                    '<div><a href="#"><b>Unclosed</a></div>',
                    '</body></html>',
                ].join('\n'))
            })
        })
    })
})