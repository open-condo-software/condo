const { injectScriptTags } = require('./html')

const TAGS = '<script src="https://cdn.example.com/sdk.js"></script>'

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

        test('handles self-closing-like <head/> gracefully (treats > as end of tag)', () => {
            const input = '<html><head/><body></body></html>'
            const result = injectScriptTags(input, TAGS)
            expect(result).toBe(`<html><head/>${TAGS}<body></body></html>`)
        })
    })
})