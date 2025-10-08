# RichTextArea Storybook Stories

## ✅ Исправлено

Все stories переписаны с использованием правильного паттерна:
- Каждая story использует отдельный React компонент (например, `BasicComponent`)
- Хуки (`useState`) вызываются внутри компонентов, а не в render функциях
- Правильная типизация: `const BasicComponent = (args: typeof meta.args) => {}`

## Созданные файлы

1. **`src/stories/Input/RichTextArea.stories.tsx`** - Основной файл со stories
2. **`src/stories/Input/RichTextArea.mdx`** - Документация для Storybook

## Доступные Stories

### 1. **Basic** - Базовый пример
Простой редактор с минимальными настройками для демонстрации основного функционала.

### 2. **WithContent** - С предзаполненным контентом
Демонстрирует работу с чекбоксами и списками:
```
- [ ] Купить молоко
- [x] Сделать зарядку
- [ ] Написать отчет

- Обычный список
- Еще один пункт
```

### 3. **WithSubmit** - С кнопкой отправки
Показывает интеграцию с onSubmit и управление состоянием кнопки.

### 4. **TaskList** - Список задач
Полноценный пример использования для списка задач с заголовками и заметками.

### 5. **CommentBox** - Комментарии с утилитами
Демонстрирует использование в качестве поля комментариев с:
- Отображением отправленных комментариев
- Кнопками утилит (прикрепить, AI, копировать)
- Кнопкой отправки

### 6. **Disabled** - Отключенное состояние
Показывает, как выглядит редактор в disabled состоянии.

### 7. **Comparison** - Сравнение режимов
Side-by-side сравнение обычного TextArea и RichTextArea с одинаковым контентом.

### 8. **SyntaxExamples** - Примеры синтаксиса
Интерактивная демонстрация с подсказками по синтаксису:
- Чекбокс: `- [ ]` + пробел
- Отмеченный чекбокс: `- [x]` + пробел
- Список: `- ` или `* ` + пробел

### 9. **Minimal** - Минимальный пример
Редактор без счетчика символов и утилит.

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
