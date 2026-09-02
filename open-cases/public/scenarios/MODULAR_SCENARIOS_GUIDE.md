# Модульная структура сценариев Open Cases

## Обзор изменений

Сценарии теперь разделены на модули для гибкой настройки и повторного использования компонентов.

### Структура папок

```
scenarios/{scenario-id}/
├── portraits/              # Портреты персонажей
├── locations/              # Изображения локаций  
├── modules/
│   ├── base/               # Базовые данные (переиспользуемые)
│   │   └── characters_locations.json
│   └── scenario/           # Уникальный сценарий
│       └── case_XXX_scenario.json
└── map-bg.png              # Фон карты (опционально)
```

## Типы модулей

### 1. Base Module (`base/characters_locations.json`)

**Назначение:** Базовые данные, которые могут переиспользоваться между сценариями.

**Содержит:**
- `characters[]` — список всех персонажей с базовыми характеристиками
- `locations[]` — список всех локаций с координатами и описанием
- `scenario` — мета-информация (ID, название, город, год)

**Что НЕ содержит:**
- Улики (clues)
- Диалоги (dialogueNodes)
- Временную шкалу (timeline)
- Начальное расположение персонажей

**Пример использования:** Один базовый модуль может использоваться для нескольких сценариев в одном сеттинге.

### 2. Scenario Module (`scenario/case_XXX_scenario.json`)

**Назначение:** Уникальные данные конкретного сценария.

**Содержит:**
- `clues[]` — все улики сценария
- `timeline[]` — временная шкала событий
- `dialogueNodes{}` — диалоги с персонажами
- `initialCharacterLocations{}` — где находятся персонажи в начале игры
- `characterMovementSchedule[]` — расписание перемещений персонажей
- `solution{}` — решение сценария (для проверки ответов)

**Особенности:**
- Определяет сюжет и расследование
- Содержит взаимодействия с игроком
- Задаёт динамику перемещения персонажей

## Система перемещения персонажей

### Гибридная модель

Персонажи перемещаются по гибридной схеме:
1. **Скриптовая часть** — заранее заданное расписание (`characterMovementSchedule`)
2. **Автоматическая часть** — движок сам вычисляет местоположение по времени

### Формат расписания

```json
"characterMovementSchedule": [
  {
    "characterId": "daniel",
    "movements": [
      {
        "time": 480,
        "locationId": "lincoln_school",
        "duration": 180,
        "reason": "Уроки"
      },
      {
        "time": 660,
        "locationId": "bennett_home",
        "duration": 60,
        "reason": "Визит к Елене"
      }
    ]
  }
]
```

**Поля:**
- `time` — время начала перемещения в минутах от полуночи (480 = 8:00 AM)
- `locationId` — ID локации, где будет персонаж
- `duration` — сколько времени проведёт в этой локации (минуты)
- `reason` — причина/контекст (для отладки и нарратива)

### Вычисление местоположения

Функция `getCharacterLocationAtTime()` в `modular-loader.ts`:
```typescript
// Пример: где Дэниел в 10:30 (630 минут)?
const location = getCharacterLocationAtTime(
  "daniel",
  630,
  initialLocations,
  movementSchedule
);
// Вернёт "lincoln_school" (уроки с 8:00 до 11:00)
```

## Загрузка сценария

### Старый способ (единый файл)
```typescript
import { fetchScenario } from './game/scenario/loader';
const result = await fetchScenario('case-003');
```

### Новый способ (модульная загрузка)
```typescript
import { loadModularScenario } from './game/scenario/modular-loader';
const result = await loadModularScenario('case-003');
```

**Процесс загрузки:**
1. Загружается `modules/base/characters_locations.json`
2. Загружается `modules/scenario/case_003_scenario.json`
3. Модули объединяются функцией `mergeModules()`
4. Проводится валидация объединённых данных
5. Возвращается полный объект сценария

## Создание нового сценария

### Шаг 1: Скопировать структуру
```bash
mkdir -p scenarios/case-004/modules/{base,scenario}
mkdir -p scenarios/case-004/{portraits,locations}
```

### Шаг 2: Создать базовый модуль
Скопируйте `characters_locations.json` из case-003 и отредактируйте:
- Измените `scenario.id`, `title`, `city`
- Добавьте/удалите персонажей
- Добавьте/удалите локации

### Шаг 3: Создать сценарий модуль
Скопируйте `case_003_scenario.json` и замените:
- Все улики (`clues[]`)
- Временную шкалу (`timeline[]`)
- Диалоги (`dialogueNodes{}`)
- Расписание перемещений (`characterMovementSchedule[]`)
- Решение (`solution{}`)

### Шаг 4: Добавить изображения
Поместите файлы портретов и локаций в соответствующие папки.

### Шаг 5: Проверка
Запустите игру и проверьте:
- Все ли персонажи отображаются
- Все ли локации доступны
- Работают ли диалоги
- Перемещаются ли персонажи

## API для разработчиков

### Функции modular-loader.ts

#### `loadModularScenario(scenarioId: string)`
Загружает и объединяет модули сценария.

#### `validateScenario(data: any)`
Проверяет корректность структуры сценария.

#### `getCharacterLocationAtTime(characterId, gameTime, initialLocations, movementSchedule)`
Вычисляет местоположение персонажа в заданное время.

#### `createInitialGameState(data, initialCharacterLocations)`
Создаёт начальное состояние игры с учётом модульной структуры.

## Миграция старых сценариев

Для миграции существующего `scenario.json`:

1. Извлеките `characters[]` и `locations[]` → `modules/base/characters_locations.json`
2. Извлеките `clues[]`, `timeline[]`, `dialogueNodes{}` → `modules/scenario/case_XXX_scenario.json`
3. Добавьте `initialCharacterLocations{}` и `characterMovementSchedule[]` в сценарий модуль
4. Обновите код загрузки на использование `loadModularScenario()`

## Преимущества модульной структуры

1. **Переиспользование** — одни и те же персонажи/локации в разных сценариях
2. **Разделение ответственности** — база отдельно, сюжет отдельно
3. **Упрощение тестирования** — можно тестировать модули независимо
4. **Гибкость** — легко создавать вариации сценариев
5. **Производительность** — загрузка только необходимых модулей
