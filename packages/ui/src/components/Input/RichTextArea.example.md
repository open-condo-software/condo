# RichTextArea Component

## Overview
RichTextArea теперь доступен как `Input.RichTextArea` - это обёртка над `TextArea` с автоматическим добавлением кнопок для чекбоксов и списков.

## Базовое использование

```tsx
import { Input } from '@open-condo/ui'

function MyComponent() {
    const [value, setValue] = useState('')
    
    return (
        <Input.RichTextArea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Введите текст..."
            showCount={true}
            maxLength={1000}
        />
    )
}
```

## Архитектура

### Три уровня компонентов:

1. **RichTextArea** (базовый) - чистый Slate.js редактор
   - Принимает стандартный `onChange` с `ChangeEvent`
   - Не знает про кнопки и панели

2. **TextArea** (обёртка) - универсальный компонент
   - Принимает проп `component` для кастомного редактора
   - Управляет bottom panel, счётчиком, кнопкой отправки
   - Агностичен к типу редактора

3. **Input.RichTextArea** (удобство) - готовая обёртка
   - Автоматически добавляет кнопки чекбокса и списка
   - Использует `TextArea` с `component={RichTextArea}`

## Использование с кастомным компонентом

Вы можете использовать `TextArea` с любым кастомным компонентом:

```tsx
import { TextArea, RichTextArea } from '@open-condo/ui'

// Напрямую с RichTextArea (без автоматических кнопок)
<TextArea
    component={RichTextArea}
    value={value}
    onChange={onChange}
/>

// Или с Input.RichTextArea (с автоматическими кнопками)
<Input.RichTextArea
    value={value}
    onChange={onChange}
/>
```

## Создание кастомного редактора

Любой компонент, соответствующий `TextAreaComponentProps`, будет работать:

```tsx
import { TextAreaComponentProps } from '@open-condo/ui'

const MyCustomEditor: React.FC<TextAreaComponentProps> = ({
    value,
    onChange,
    placeholder,
    disabled,
    className,
    autoFocus,
    maxLength,
}) => {
    return (
        <div className={className}>
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                autoFocus={autoFocus}
                maxLength={maxLength}
            />
        </div>
    )
}

// Использование
<TextArea
    component={MyCustomEditor}
    value={value}
    onChange={onChange}
    bottomPanelUtils={[...]} // Ваши кнопки
/>
```

## Markdown Shortcuts

- `- [ ]` + Space → Невыполненная задача
- `- [x]` + Space → Выполненная задача
- `- ` + Space → Элемент списка
- `* ` + Space → Элемент списка

## Props

Все пропсы от `TextArea`:

| Prop | Тип | Описание |
|------|-----|----------|
| `value` | `string` | Значение текста |
| `onChange` | `(e: ChangeEvent) => void` | Обработчик изменения |
| `onSubmit` | `(value: string) => void` | Обработчик отправки |
| `placeholder` | `string` | Placeholder текст |
| `disabled` | `boolean` | Отключить редактор |
| `showCount` | `boolean` | Показать счётчик символов |
| `maxLength` | `number` | Максимальная длина текста |
| `bottomPanelUtils` | `React.ReactElement[]` | Дополнительные кнопки |

## Преимущества архитектуры

1. **Разделение ответственности**: TextArea не знает про RichTextArea
2. **Расширяемость**: Легко добавить любой кастомный редактор
3. **Переиспользование**: TextArea работает с любым компонентом
4. **Чистота кода**: Нет дублирования логики

## Миграция

### Было (enableRichText):
```tsx
<Input.TextArea
    enableRichText={true}
    value={value}
    onChange={onChange}
/>
```

### Стало:
```tsx
<Input.RichTextArea
    value={value}
    onChange={onChange}
/>
```

## Формат данных

Markdown-подобный формат:

```markdown
- [ ] Невыполненная задача
- [x] Выполненная задача
- Элемент списка
Обычный параграф
```
