# RichTextArea Storybook Stories

## ✅ Реализовано

### Основные возможности:
1. **Кнопки в bottomPanelUtils** - кнопки чекбокса и списка автоматически добавляются в общий список утилит
2. **Markdown сериализация** - функции `serializeToMarkdown`/`deserializeFromMarkdown` для работы с markdown
3. **Автоматическое преобразование** - ввод `- [ ]` + пробел создает чекбокс
4. **Интерактивные элементы** - чекбоксы можно кликать

### Архитектура:
- **Кнопки интегрированы** - `createCheckboxButton()` и `createListButton()` создают кнопки, которые добавляются в `bottomPanelUtils`
- **Доступ к editor** - через `ref.current.editor` можно получить доступ к Slate editor
- **Markdown формат** - данные хранятся как обычный markdown текст

### Исправления:
- Переименованы функции: `serializeToString` → `serializeToMarkdown`, `deserializeFromString` → `deserializeFromMarkdown`
- Кнопки перемещены из отдельного toolbar в `bottomPanelUtils`
- Сокращено количество stories до 4 основных
- Добавлен недостающий пакет `slate-dom@^0.117.0`

## Созданные файлы

1. **`src/stories/Input/RichTextArea.stories.tsx`** - Основной файл со stories
2. **`src/stories/Input/RichTextArea.mdx`** - Документация для Storybook

## Доступные Stories (сокращено до основных)

### 1. **Basic** - Базовый пример
Простой редактор с кнопками чекбокса и списка, автоматически добавленными в bottomPanelUtils.

### 2. **WithContent** - С предзаполненным контентом
Демонстрирует работу с чекбоксами и списками в markdown формате:
```markdown
- [ ] Купить молоко
- [x] Сделать зарядку
- [ ] Написать отчет

- Обычный список
- Еще один пункт
```

### 3. **WithSubmit** - С кнопкой отправки
Показывает интеграцию с onSubmit и управление состоянием кнопки.

### 4. **WithUtils** - С дополнительными утилитами
Демонстрирует, как кнопки чекбокса и списка автоматически добавляются к другим утилитам (прикрепить, копировать) в общий список bottomPanelUtils.

## Запуск Storybook

```bash
cd packages/ui
yarn storybook
```

Затем откройте:
```
http://localhost:6006/?path=/story/components-input-richtextarea--basic
```

## Интерактивные элементы

Все stories интерактивны и позволяют:
- ✅ Вводить текст и видеть автопреобразование
- ✅ Кликать по чекбоксам для изменения состояния
- ✅ Использовать Backspace для обратного преобразования
- ✅ Тестировать различные комбинации синтаксиса

## Controls (аргументы)

В Storybook доступны следующие контролы:
- `enableRichText` - включить/выключить WYSIWYG режим
- `placeholder` - текст placeholder
- `disabled` - отключить редактор
- `showCount` - показать счетчик символов
- `maxLength` - максимальная длина текста
- `autoSize` - настройки автоматического размера

## Примеры использования в коде

### Базовое использование
```tsx
import { Input } from '@open-condo/ui'

function MyComponent() {
    const [value, setValue] = useState('')
    
    return (
        <Input.TextArea
            enableRichText
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    )
}
```

### С кнопкой отправки
```tsx
<Input.TextArea
    enableRichText
    value={value}
    onChange={(e) => setValue(e.target.value)}
    onSubmit={handleSubmit}
    isSubmitDisabled={!value.trim()}
/>
```

### В форме комментариев
```tsx
<Input.TextArea
    enableRichText
    value={comment}
    onChange={(e) => setComment(e.target.value)}
    onSubmit={handleSubmit}
    bottomPanelUtils={[
        <Button icon={<Paperclip />} />,
        <Button icon={<Copy />} />,
    ]}
/>
```

## Тестирование

Для тестирования stories:

1. Запустите Storybook
2. Откройте любую story
3. Попробуйте ввести:
   - `- [ ]` + пробел → чекбокс
   - `- [x]` + пробел → отмеченный чекбокс
   - `- ` + пробел → список
   - `* ` + пробел → список
4. Кликните по чекбоксу для изменения состояния
5. Нажмите Backspace в начале строки для обратного преобразования

## Документация

MDX файл (`RichTextArea.mdx`) содержит:
- Описание компонента
- Таблицы с синтаксисом
- Примеры использования
- Технические детали
- Рекомендации по использованию

## Структура stories

Каждая story использует паттерн:
```tsx
export const StoryName: Story = {
    render: (args) => {
        const [value, setValue] = useState('')
        return (
            <Component.TextArea
                {...args}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        )
    },
}
```

Это позволяет:
- Управлять состоянием внутри story
- Использовать args из Controls
- Демонстрировать реальное поведение компонента
