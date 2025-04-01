Condo development guide
=====

* [Quick start](./docs/quick-start.md)
* [Project structure](./docs/project-structure.md)
* [Migrations guide](./docs/migrations.md)
* [Utils](./docs/utils)
* [Checklists](./docs/checklists)

## Customization guide for open source developers

### Adding translations

Sometimes, in your custom forks you need to add or override translations, for this you should write custom translations in `lang/<locale>/<locale>.custom.json`

These translations then can be used just as regular translations in condo

`lang/en/en.custom.json`
```json
{
  "custom.example": "Test"
}
```

`any component`
```js
const TestCustomTranslation = intl.formatMessage({ id: 'custom.example' })

console.log(TestCustomTranslation) // Test
```

Translations inside the custom translations file **will overwrite** other translations.

Best practice is to start your custom translation with prefix `custom`, that way it is guaranteed that these translations will not collide with translations in condo