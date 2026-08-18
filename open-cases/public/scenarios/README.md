# OPEN CASES — Система загрузки сценариев

## Обзор

Эта система позволяет загружать новые детективные сценарии в игру через структурированные JSON файлы. Каждый сценарий содержит все необходимые данные: персонажей, улики, локации, диалоги и решение.

## Структура файлов

```
/public/scenarios/
├── scenario-schema.json       # JSON Schema для валидации
├── AI_SCENARIO_INSTRUCTION.md # Инструкция для ИИ
├── case-001/                  # Пример сценария
│   ├── scenario.json          # Основное описание сценария
│   ├── portraits/             # Изображения персонажей
│   │   ├── maya.jpg
│   │   ├── elena.jpg
│   │   └── ...
│   └── locations/             # Изображения локаций
│       ├── home.jpg
│       ├── school.jpg
│       └── ...
└── case-002/                  # Новый сценарий
    └── scenario.json
```

## Как добавить новый сценарий

### Шаг 1: Создайте папку сценария

```bash
mkdir -p /workspace/open-cases/public/scenarios/case-XXX/portraits
mkdir -p /workspace/open-cases/public/scenarios/case-XXX/locations
```

### Шаг 2: Создайте JSON файл

Используйте инструкцию `AI_SCENARIO_INSTRUCTION.md`:
1. Скопируйте инструкцию в чат с ИИ
2. Добавьте описание вашей истории
3. Получите готовый JSON
4. Сохраните как `scenario.json`

### Шаг 3: Добавьте изображения

Поместите изображения в соответствующие папки:
- Портреты персонажей: `portraits/{character_id}.jpg`
- Изображения локаций: `locations/{location_id}.jpg`

### Шаг 4: Проверьте валидность

JSON должен соответствовать схеме `scenario-schema.json`.

## API для работы со сценариями

### Загрузка сценария

```typescript
import { fetchScenario, loadScenarioFromJson } from '@/game/scenario/loader';

// Загрузка из файла
const result = await fetchScenario('case-001');
if (result.success) {
  const data = result.data; // ScenarioData
} else {
  console.error(result.errors);
}

// Загрузка из JSON строки
const json = '{"scenario": {...}, ...}';
const result = loadScenarioFromJson(json);
```

### Валидация

```typescript
import { validateScenario } from '@/game/scenario/loader';

const validation = validateScenario(data);
if (!validation.valid) {
  console.error('Ошибки:', validation.errors);
}
```

### Доступ к данным

```typescript
import { 
  getCharacterById, 
  getClueById, 
  getLocationById,
  getDialogueNode 
} from '@/game/scenario/loader';

const character = getCharacterById(data, 'elena');
const clue = getClueById(data, 'clue_phone');
const location = getLocationById(data, 'bennett_home');
```

## Система дедукции

### Предъявление улик персонажам

```typescript
import { presentEvidence } from '@/game/scenario/deduction';

const result = presentEvidence(
  data,           // ScenarioData
  'leah',         // characterId
  'clue_news',    // clueId  
  'склад подмена' // player notes (keywords)
);

// Результат:
{
  success: true,
  newClues: ['clue_truth'],
  characterReaction: 'Лия нервничает...',
  newDialogue: {...},
  triggersEvent: 'leah_confronted'
}
```

### Проверка связей между уликами

```typescript
import { areCluesRelated, getClueConnections } from '@/game/scenario/deduction';

// Проверить связь
const related = areCluesRelated(data, 'clue_phone', 'clue_photo'); // true/false

// Получить все связи улики
const connections = getClueConnections(data, 'clue_phone');
```

### Ветвление на основе ключевых слов

```typescript
import { evaluateActionBranching } from '@/game/scenario/deduction';

const result = evaluateActionBranching(
  data,
  'lincoln_school',
  'school_records',
  'противоречие время' // заметки игрока
);

// Если keywords найдены, может вернуться alternateOutcome
```

### Расчёт уверенности теории

```typescript
import { calculateTheoryConfidence, canFormTheory } from '@/game/scenario/deduction';

// Можно ли сделать финальный вывод?
const canFinish = canFormTheory(data, foundClueIds);

// Насколько верна теория?
const confidence = calculateTheoryConfidence(data, foundClueIds, {
  person: 'leah',
  motive: 'exposure',
  method: 'lured',
  location: 'northline_storage'
}); // 0-100
```

## Карта и шаблоны

### Доступные шаблоны карт

```typescript
import { getMapTemplate, getMapTemplateIds } from '@/game/maps/templates';

// Получить все ID шаблонов
const ids = getMapTemplateIds(); // ['seattle_downtown', 'small_town', ...]

// Получить конкретный шаблон
const template = getMapTemplate('seattle_downtown');
/*
{
  id: 'seattle_downtown',
  name: 'Центр Сиэтла',
  minZoom: 13,
  maxZoom: 16,
  bounds: [[47.589, -122.340], [47.623, -122.296]],
  center: [47.6088, -122.313],
  defaultZoom: 14.2
}
*/
```

### Координаты локаций

Координаты должны быть:
- **Осмысленными**: отражать логику перемещений по сюжету
- **В пределах шаблона**: внутри bounds выбранного mapTemplate
- **Не случайными**: важные локации ближе к центру, удалённые — к краям

## Ключевые слова и ветвление

### Определение ключевых слов

В `keywordDefinitions` укажите слова, которые триггерят события:

```json
{
  "противоречие": {
    "description": "Игрок заметил противоречие",
    "triggersEvent": "contradiction_noticed",
    "unlocksDialogue": ["elena_contradiction"]
  },
  "склад": {
    "description": "Игрок подозревает склад",
    "unlocksLocations": ["northline_storage"]
  }
}
```

### Использование в действиях

```json
{
  "id": "confront_with_keywords",
  "label": "Обвинить с доказательствами",
  "requiresKeywords": ["противоречие", "склад"],
  "alternateOutcome": "confession_triggered"
}
```

## Решение и подсчёт очков

### Структура решения

```json
{
  "solution": {
    "culpritCharacterId": "leah",
    "motiveKeywords": ["exposure", "подмена"],
    "methodKeywords": ["lured", "сообщение"],
    "keyLocationId": "northline_storage",
    "minimumCluesRequired": 10
  }
}
```

### Подсчёт

- **person** (35 очков): правильный преступник
- **motive** (25 очков): правильный мотив (ключевые слова)
- **method** (20 очков): правильный метод
- **location** (20 очков): правильная локация
- **Бонус** (до 10 очков): за найденные critical улики

## Пример полного цикла

```typescript
// 1. Загрузить сценарий
const { data } = await fetchScenario('case-001');

// 2. Создать начальное состояние
import { createInitialGameState } from '@/game/scenario/loader';
const state = createInitialGameState(data);

// 3. Игрок исследует локацию
import { performAction } from '@/game/engine';
const newState = performAction(state, 'bennett_home', 'home_room');

// 4. Игрок предъявляет улику
import { presentEvidence } from '@/game/scenario/deduction';
const evidenceResult = presentEvidence(
  data, 
  'leah', 
  'clue_leah_contact',
  state.notes
);

// 5. Проверить возможность финала
import { canFormTheory, calculateTheoryConfidence } from '@/game/scenario/deduction';
if (canFormTheory(data, newState.foundClueIds)) {
  const score = calculateTheoryConfidence(data, newState.foundClueIds, theory);
  if (score >= 70) {
    // Победа!
  }
}
```

## Советы по созданию сценариев

1. **Начинайте с решения**: определите преступника, мотив, метод
2. **Создайте цепочку улик**: каждая critical улика ведёт к следующей
3. **Добавьте ложные следы**: important улики могут указывать на других
4. **Продумайте ветвление**: какие keywords открывают альтернативы
5. **Тестируйте координаты**: убедитесь, что все локации видны на карте

## Следующие шаги

1. Используйте `AI_SCENARIO_INSTRUCTION.md` для создания нового сценария
2. Поместите JSON в `/public/scenarios/case-XXX/scenario.json`
3. Добавьте изображения в папки `portraits/` и `locations/`
4. Протестируйте загрузку через DevTools консоли
