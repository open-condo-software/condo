/**
 * @jest-environment node
 */

const { isValidWebhookUrl } = require('./PaymentStatusChangeWebhookUrl')

describe('isValidWebhookUrl', () => {
    describe('HTTPS URLs', () => {
        test('should accept valid HTTPS URLs', () => {
            expect(isValidWebhookUrl('https://example.com/webhook')).toBe(true)
            expect(isValidWebhookUrl('https://api.example.com/callback')).toBe(true)
            expect(isValidWebhookUrl('https://subdomain.example.com:8443/path')).toBe(true)
        })
    })

    describe('HTTP localhost', () => {
        test('should accept HTTP URLs for localhost', () => {
            expect(isValidWebhookUrl('http://localhost/webhook')).toBe(true)
            expect(isValidWebhookUrl('http://localhost:3000/callback')).toBe(true)
            expect(isValidWebhookUrl('http://localhost:8080/api/webhook')).toBe(true)
        })
    })

    describe('HTTP non-localhost', () => {
        test('should reject HTTP URLs for any other domain', () => {
            expect(isValidWebhookUrl('http://example.com/webhook')).toBe(false)
            expect(isValidWebhookUrl('http://api.example.com/callback')).toBe(false)
            expect(isValidWebhookUrl('http://test-server.local/webhook')).toBe(false)
        })

        test('should reject HTTP URLs for 127.0.0.1', () => {
            expect(isValidWebhookUrl('http://127.0.0.1/webhook')).toBe(false)
            expect(isValidWebhookUrl('http://127.0.0.1:8080/callback')).toBe(false)
        })
    })

    describe('Unsupported protocols', () => {
        test('should reject unsupported protocols', () => {
            expect(isValidWebhookUrl('ftp://example.com/file')).toBe(false)
            // nosemgrep: javascript.lang.security.detect-insecure-websocket.detect-insecure-websocket
            expect(isValidWebhookUrl('ws://example.com/socket')).toBe(false)
            expect(isValidWebhookUrl('file:///path/to/file')).toBe(false)
        })
    })

    describe('Invalid URL formats', () => {
        test('should reject invalid URL formats', () => {
            expect(isValidWebhookUrl('not-a-url')).toBe(false)
            expect(isValidWebhookUrl('example.com')).toBe(false)
            expect(isValidWebhookUrl('//example.com')).toBe(false)
        })

        test('should reject null, undefined, and empty strings', () => {
            expect(isValidWebhookUrl(null)).toBe(false)
            expect(isValidWebhookUrl(undefined)).toBe(false)
            expect(isValidWebhookUrl('')).toBe(false)
        })

        test('should reject non-string values', () => {
            expect(isValidWebhookUrl(123)).toBe(false)
            expect(isValidWebhookUrl({})).toBe(false)
            expect(isValidWebhookUrl([])).toBe(false)
        })
    })

    describe('Edge cases', () => {
        test('should handle URLs with query parameters', () => {
            expect(isValidWebhookUrl('https://example.com/webhook?token=abc123')).toBe(true)
            expect(isValidWebhookUrl('http://localhost:3000/webhook?debug=true')).toBe(true)
        })

        test('should handle URLs with fragments', () => {
            expect(isValidWebhookUrl('https://example.com/webhook#section')).toBe(true)
            expect(isValidWebhookUrl('http://localhost/webhook#test')).toBe(true)
        })

        test('should handle URLs with authentication', () => {
            expect(isValidWebhookUrl('https://user:pass@example.com/webhook')).toBe(true)
            expect(isValidWebhookUrl('http://user:pass@localhost/webhook')).toBe(true)
        })

        test('should handle URLs with non-standard ports', () => {
            expect(isValidWebhookUrl('https://example.com:8443/webhook')).toBe(true)
            expect(isValidWebhookUrl('http://localhost:8080/webhook')).toBe(true)
        })

        test('should handle URLs with IPv6 addresses', () => {
            expect(isValidWebhookUrl('http://[::1]:3000/webhook')).toBe(false)
            expect(isValidWebhookUrl('https://[2001:db8::1]/webhook')).toBe(true)
        })

        test('should handle URLs with complex paths', () => {
            expect(isValidWebhookUrl('https://example.com/api/v1/webhooks/payment/callback')).toBe(true)
            expect(isValidWebhookUrl('http://localhost/api/v2/webhooks/status')).toBe(true)
        })
    })
})
