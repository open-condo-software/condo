const { colors } = require('@open-condo/ui/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx}',
        './domains/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        colors,
        extend: {},
    },
    plugins: [],
}
