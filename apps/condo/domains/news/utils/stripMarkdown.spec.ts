import { stripMarkdown } from './stripMarkdown'

describe('stripMarkdown', () => {
    it('returns empty string for empty input', () => {
        expect(stripMarkdown('')).toBe('')
        expect(stripMarkdown(null)).toBe('')
        expect(stripMarkdown(undefined)).toBe('')
    })

    it('removes emphasis and inline formatting', () => {
        expect(stripMarkdown('**bold** _italic_ `code` ~strike~')).toBe('bold italic code strike')
    })

    it('removes links and images preserving text content', () => {
        expect(stripMarkdown('[OpenCondo](https://example.com) ![alt](https://example.com/image.png) text'))
            .toBe('OpenCondo text')
    })

    it('removes block level markdown like headings, quotes and lists', () => {
        const input = '# Title\n> quote\n- item one\n1. item two'
        expect(stripMarkdown(input)).toBe('Title quote item one item two')
    })

    it('normalizes line breaks to single spaces and trims result', () => {
        const input = 'line one\n\nline two\n'
        expect(stripMarkdown(input)).toBe('line one line two')
    })
})
