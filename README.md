# Веб-застосунок `Paint`

Графічний редактор, реалізований на **TypeScript** (Frontend) та **PHP** (Backend) з реалізацією патернів програмування, системою шарів (Layers),
історією команд (Undo/Redo), фільтрами та хмарним і локальним збереженням малюнків.

## Зміст

1. [Інтерфейс користувача (UI)](#1-інтерфейс-користувача-ui)
2. [Функціональні можливості](#2-функціональні-можливості)
3. [Архітектура та паттерни](#3-архітектура-та-паттерни)
4. [Програмні принципи (SOLID, KISS, DRY)](#4-програмні-принципи)
5. [Структура проекту](#5-структура-проекту)
6. [Технології та рефакторинг](#6-технології-та-рефакторинг)
7. [Запуск локально](#7-запуск-локально)

---

## 1. Інтерфейс користувача (UI)

### [Навігаційна панель](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/main.ts#L33-L78)

- **Інструменти:** Вибір між Пензлем, Гумкою, Лінією, Прямокутником, Колом та Заливкою.
- **Керування історією:** Кнопки Undo (Ctrl+Z) та Redo (Ctrl+Y).
- **Фільтри:** Випадаючий список (Grayscale, Invert, Sepia, Brightness) з кнопкою Apply.
- **Експорт:** Можливість завантажити малюнок у форматах PNG, JPG або JSON.
- **Галерея (📂):** Кнопка відкриття списку збережених на сервері робіт.
- **Збереження:** Поле для назви малюнка та кнопка Save (з індикацією статусу).

### Робоча область

- **Ліва панель:** Вибір кольору
  (**[wireColorPicker](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/main.ts#L187)**), пресети
  палітри, повзунки розміру пензля та прозорості (Opacity).
- **Центр ([Canvas](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/main.ts#L117-L120)):** Основне
  полотно з підтримкою
  **[Drag-and-Drop](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/main.ts#L532)** для завантаження
  JSON-файлів.
- **Права панель ([Layers](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/main.ts#L216)):**
  Керування шарами (додавання, видалення, перейменування, блокування, видимість та зміна порядку).

### Галерея ([wireGallery](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/main.ts#L406))

- Список усіх малюнків, збережених у базі даних MySQL.
- Відображення назви, дати та автоматично згенерованого прев'ю (Thumbnail).
- Кнопка видалення (✕) з підтвердженням.

---

## 2. Функціональні можливості

### Двигун малювання ([CanvasEngine](https://github.com/Mycola23/KPZ-PAINT/blob/frontend\src\engine\CanvasEngine.ts))

- **Багатошаровість:** Кожен шар — це окремий елемент Canvas, що дозволяє редагувати частини малюнка незалежно.
- **Адаптивність:** Координати миші автоматично масштабуються під розмір Canvas.
- **Попередній перегляд:** Інструменти відображають "фантомний" результат перед остаточним нанесенням на шар.

### Система збереження

- **[Cloud Save](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/main.ts#L360):** Збереження
  структури шарів у форматі JSON та фінального зображення у PNG у БД.
- **[Autosave](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/main.ts#L399):** Автоматичне
  збереження кожні 30 секунд у `localStorage`.
- **[Recovery](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/main.ts#L512):** При оновленні
  сторінки пропонується відновити останню незавершену роботу.

---

## 3. Архітектура та паттерни

Проект побудований на гнучкій архітектурі, що дозволяє легко додавати нові інструменти та фільтри.

- **Composite:** Реалізовано в системі шарів.
  [LayerGroup](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/layers/LayerGroup.ts#L5) та
  [Layer](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/layers/Layer.ts#L9) реалізують інтерфейс
  [ILayerComponent](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/layers/ILayerComponent.ts#L1), що
  дозволяє працювати з групами шарів як з одиничними об'єктами.
- **Command:** Кожна дія на полотні (малювання, фільтр, очищення) обгортається в об'єкт команди
  ([`DrawCommand`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/commands/Commands.ts#L12),
  [`FilterCommand`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/commands/Commands.ts#L67),
  [`ClearCommand`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/commands/Commands.ts#L46)). Це
  забезпечує функціонал Undo/Redo.
- **Observer:**
  [`CanvasEngine`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/engine/CanvasEngine.ts#L20) та
  `Layer` наслідують
  [`Observable`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/patterns/Observable.ts#L1). UI
  автоматично оновлюється (список шарів, стан кнопок), коли змінюється стан двигуна.
- **Factory Method:**
  [`ToolFactory`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/tools/ToolFactory.ts#L6) створює
  об'єкти інструментів за ключовим словом, ізолюючи логіку створення від основного додатка.
- **Strategy:** Інструменти малювання та фільтри реалізують спільні інтерфейси
  ([`ITool`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/tools/ITool.ts),
  [`IFilter`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/filters/IFilter.ts)), що дозволяє
  двигуну використовувати їх уніфіковано.
- **Mediator:**
  [`CanvasEngine`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/engine/CanvasEngine.ts#L20)
  виступає центральним вузлом, який координує роботу шарів, інструментів та історії команд.

---

## 4. Програмні принципи

**SRP (Single Responsibility Principle)**

Кожен клас має одну чітко визначену відповідальність:

- [`DrawingController`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/backend/src/Controller/DrawingController.php#L10)
  відповідає тільки за HTTP-запити.
- [`CanvasAdapter`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/patterns/CanvasAdapter.ts#L3) —
  тільки за перетворення даних (JSON/Base64).

**OCP (Open/Closed Principle):**

Код відкритий для розширення, закритий для змін.

Нові фільтри або інструменти додаються шляхом створення нових класів (відповідно в
[`Filters.ts`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/filters/Filters.ts),
[`Tools.ts`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/tools/Tools.ts)) без зміни коду
`CanvasEngine`.

**DIP (Dependency Inversion Principle):**

Залежності через абстракції, не через конкретні класи.

- [`BrushTool`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/tools/Tools.ts#L49) залежить від
  [`OffscreenTool`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/tools/Tools.ts#L11)
- [`GrayscaleFilter`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/filters/Filters.ts#L12)
  залежить від [`IFilter`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/filters/IFilter.ts)
  Конкретні реалізації інструментів створюються лише фабрикою
  [ToolFactory.cs](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/tools/ToolFactory.ts#L6), а
  фільтри (оскільки не зберігають state) кожен раз при застосуванні

**KISS (Keep It Simple, Stupid):**

Прості рішення кращі за складні, якщо вони виконують завдання

- Обробка кольорів: Замість створення складних об'єктів для кольорів, додаток використовує звичайні HEX-рядки. Це спрощує роботу з системним
  `<input type="color">` та передачу даних між Frontend та Backend без зайвих перетворень.
- Логіка роутингу в PHP реалізована через простий масив регулярних виразів без важких фреймворків
  [`Router.php`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/backend/src/Router/Router.php#L7).
- Використання вбудованого Canvas API: Для реалізації базових фігур (коло, прямокутник) використовуються нативні методи `arc()` та `strokeRect()`, що
  дозволяє уникнути підключення важких математичних бібліотек для рендерингу.

**DRY — Don't Repeat Yourself**

Уникання дублювання логіки для полегшення підтримки.

- **Базовий клас
  [`Observable<T>`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/patterns/Observable.ts):** Логіка
  патерну "Observer" (підписка на події, сповіщення) винесена в один універсальний клас. Його використовують `CanvasEngine`, `Layer`, `LayerGroup` та
  `CommandHistory`. Це позбавляє необхідності переписувати методи `subscribe` та `notify` у кожному класі.
- **Абстракція
  [`OffscreenTool`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/tools/Tools.ts#L11):**
  інструменти як Пензель, Гумка потребують тимчасового "закадрового" канвасу для попереднього перегляду. Логіка створення цього канвасу та перенесення
  малюнка на основний шар винесена в абстрактний клас `OffscreenTool`, що економить десятки рядків коду в кожному окремому інструменті.
- **Централізована обробка JSON у PHP
  ([`BaseController`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/backend/src/Controller/BaseController.php#L8)):**
  Методи для відправки JSON-відповідей (`ok`, `error`, `created`) та зчитування тіла запиту визначені один раз у базовому контролері. Усі інші
  контролери просто наслідують їх, що гарантує єдиний формат відповідей у всьому API.
- **Уніфікований
  [`CanvasAdapter`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/patterns/CanvasAdapter.ts#L3):**
  Вся логіка конвертації полотна у формати PNG, JPG та JSON зібрана в одному місці. Це дозволяє використовувати один і той самий код як для ручного
  експорту користувачем, так і для фонового створення прев'ю під час збереження на сервер.

---

## 5. Структура проекту

```text
Paint
├── backend/                # PHP API
│   ├── public/             # Точка входу (index.php) та завантажені файли
│   └── src/
│       ├── Controller/     # Обробка API запитів
│       ├── Model/          # Логіка роботи з БД
│       ├── Router/         # Простий REST роутер
│       └── Database/       # Підключення до MySQL (Singleton)
├── frontend/               # TypeScript застосунок
│   ├── src/
│   │   ├── api/            # Клієнт для зв'язку з бекендом
│   │   ├── commands/       # Паттерн Command (Undo/Redo)
│   │   ├── engine/         # Ядро додатка (CanvasEngine)
│   │   ├── layers/         # Логіка шарів (Composite)
│   │   ├── tools/          # Інструменти (Factory, Strategy)
│   │   ├── filters/        # Фільтри зображення
│   │   └── patterns/       # Базові класи (Observable, Adapter)
│   └── main.ts             # Точка входу та ініціалізація UI
```

---

## 6. Технології та рефакторинг

### Технологічний стек

- **Frontend:** TypeScript, Vite, Sass (SCSS).
- **Backend:** PHP 8.2+, PDO MySQL.
- **Database:** MySQL (таблиця `drawings`).

### Застосовані техніки рефакторингу

- **Extract Interface:** Створення
  [`ILayerComponent`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/layers/ILayerComponent.ts) для
  уніфікації роботи з шарами.
- **Extract Method (Виділення методу):** Розбиття великого методу `init()` у класі
  [`PaintApp`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/main.ts#L7-L27) на декілька
  спеціалізованих методів (`wireToolbar`, `wireColorPicker`, `wireLayerPanel`, `wireKeyboard`). Це значно покращило читабельність коду ініціалізації
  та дозволило ізолювати логіку підписки на події для кожного компонента інтерфейсу окремо.
- **Replace Magic Number with Constant:** Використання ваг люмінофорів (0.299, 0.587, 0.114) як іменованих констант у фільтрі
  [`GrayScale`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/filters/Filters.ts#L6-L27)
- **Polymorphism instead of Conditionals:** Заміна `if(tool === 'brush')` на виклик методу
  [`tool.onMove()`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/frontend/src/engine/CanvasEngine.ts#L291-L296).
- **Singleton:** Клас [`DB`](https://github.com/Mycola23/KPZ-PAINT/blob/6db9fecf3352ed60de8dea5dd969f68b188b6205/backend/src/Database/DB.php#L11) у
  PHP забезпечує єдине підключення до бази даних.

---

## 7. Запуск локально

### Вимоги

- PHP 8.1+
- MySQL 8.0+
- Node.js 18+
- TypeScript 5.9.3+
- Vite: 8.0.0+

### Кроки інсталяції

1. Склонуйте собі репозиторій

```
git clone https://github.com/Mycola23/KPZ-PAINT
```

2. **Налаштування БД:** Створіть базу даних та таблицю `drawings`.
3. **Backend:**
    - Налаштуйте `.env` файл у папці `backend` (хост, назва БД, логін/пароль).
    - Запустіть вбудований сервер: `php -S localhost:8000 -t public/`.
4. **Frontend:**
    - Перейдіть у папку `frontend`.
    - Встановіть залежності: `npm install`.
    - Запустіть сервер розробки: `npm run dev`.
5. **Proxy:** Переконайтесь, що у `vite.config.ts` вказано правильну адресу вашого PHP-сервера.

---

Developed by Mycola Lytvynenko 😽
