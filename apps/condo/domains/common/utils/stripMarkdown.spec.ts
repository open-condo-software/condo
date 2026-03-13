import { stripMarkdown } from './stripMarkdown'

describe('stripMarkdown', () => {
    it('returns empty string for empty input', () => {
        expect(stripMarkdown('')).toBe('')
        expect(stripMarkdown(null)).toBe('')
        expect(stripMarkdown()).toBe('')
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

    // Additional comprehensive test cases
    it('handles mixed emphasis formatting', () => {
        expect(stripMarkdown('***bold italic*** __bold underline__')).toBe('bold italic bold underline')
    })

    it('handles nested lists', () => {
        const input = '- item 1\n  - nested item\n- item 2\n\n1. numbered\n  1. nested numbered'
        expect(stripMarkdown(input)).toBe('item 1 nested item item 2 numbered nested numbered')
    })

    it('handles complex markdown combinations', () => {
        const input = '# Main Title\n\n## Subtitle\n\nThis is **bold** and _italic_ text with [a link](http://example.com) and `inline code`.\n\n- List item 1\n- List item 2 with **bold**\n\n> A blockquote with `code` inside'
        expect(stripMarkdown(input)).toBe('Main Title Subtitle This is bold and italic text with a link and inline code. List item 1 List item 2 with bold A blockquote with code inside')
    })

    it('preserves plain text and special characters', () => {
        const input = 'Plain text with numbers 123, symbols @#$%, and punctuation .,!?'
        expect(stripMarkdown(input)).toBe('Plain text with numbers 123, symbols @#$%, and punctuation .,!?')
    })

    it('handles strikethrough', () => {
        expect(stripMarkdown('~~strikethrough~~')).toBe('strikethrough')
    })

    it('handles multiple consecutive spaces and line breaks', () => {
        const input = 'text  with   multiple\n\n\nspaces   and\n\nbreaks'
        expect(stripMarkdown(input)).toBe('text with multiple spaces and breaks')
    })

    it('preserves emoji and unicode characters', () => {
        const input = 'Text with emoji 😊 and unicode ñáéíóú'
        expect(stripMarkdown(input)).toBe('Text with emoji 😊 and unicode ñáéíóú')
    })

    it('handles edge case with only whitespace', () => {
        expect(stripMarkdown('   \n\n   \t  \n   ')).toBe('')
    })

    it('preserves URLs in plain text', () => {
        expect(stripMarkdown('Visit https://example.com for more info')).toBe('Visit https://example.com for more info')
    })

    it('handles email addresses', () => {
        expect(stripMarkdown('Contact us at support@example.com')).toBe('Contact us at support@example.com')
    })
})
