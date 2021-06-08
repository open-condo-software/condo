# Common style patterns

 - By default, we always try to keep the style consistent.
 - Visually, the style should look as if it was written by one person.
 - We try to keep logical groupings in imports, fields, and components.
 - Remember that reading your code will take more time than writing it.

# Change esLint style

If you want to change linting please follow the https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin 
official recommendations!

# React component style

You should follow the next style for all react components:

```
const ComponentName: React.FC = (props) => {
    // 1. Translations: we want to keep the layout clean! You should extract all translations as veriables with Message/Label suffix!
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' }) // <CamelCase>Message
    const ButtonLabel = intl.formatMessage({ id: 'containers.FormTableExcelImport.ButtonLabel' }) // <CamalCase>Label

    // 2. Hook calls
    // 3. Use effects
    // 4. Handlers

    // 5. JSX
}
```
