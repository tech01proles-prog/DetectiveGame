# Инструкция по установке фото для case-003

## Структура папок

Все файлы должны находиться в:
```
/workspace/open-cases/public/scenarios/case-003/
├── portraits/          # Портреты персонажей
├── locations/          # Изображения локаций
└── modules/            # Модули сценария
    ├── base/           # Базовые данные (персонажи, локации)
    └── scenario/       # Сценарий (улики, диалоги, события)
```

## Портреты персонажей

### Куда закинуть:
`/workspace/open-cases/public/scenarios/case-003/portraits/`

### Как назвать файлы:
Формат: `{character_id}.svg` или `{character_id}.png`

Список персонажей и имён файлов:
- `victor.svg` — Виктор Кросс
- `maya.svg` — Майя Беннетт
- `elena.svg` — Елена Беннетт
- `daniel.svg` — Дэниел Кроу
- `nora.svg` — Нора Вэйл
- `marcus.svg` — Маркус Хилл
- `june.svg` — Джун Пак
- `sam.svg` — Сэмюэл Рид
- `leah.svg` — Лия Моррис

**Примечание:** Для поддержки эмоций можно использовать формат `{character_id}_{emotion}.svg`, где emotion: `neutral`, `angry`, `happy`, `sad`, `suspicious`. В текущей версии используется базовый портрет без эмоции.

## Изображения локаций

### Куда закинуть:
`/workspace/open-cases/public/scenarios/case-003/locations/`

### Как назвать файлы:
Формат: `{location_name}.svg` или `{location_name}.png`

Список локаций и имён файлов:
- `home.svg` — Дом Беннеттов
- `school.svg` — Lincoln High School
- `lab.svg` — Rainier Photo Lab
- `market.svg` — Madison Market
- `garage.svg` — Reed Auto Repair
- `tower.svg` — Cross Industries Tower
- `news.svg` — City News Room
- `storage.svg` — Northline Storage
- `warehouse.svg` — Заброшенный склад

## Технические требования

### Форматы файлов:
- **SVG** (рекомендуется): Векторная графика, масштабируется без потерь
- **PNG**: Растровое изображение, минимальный размер 400x400px

### Размеры:
- Портреты: 200x200px (минимум), соотношение сторон 1:1
- Локации: 400x400px (минимум), соотношение сторон 16:9 или 1:1

### Стиль:
- Единый художественный стиль для всех изображений
- Приглушённая цветовая палитра (нуар/детектив)
- Чёткие силуэты и узнаваемые объекты

## Пример структуры после установки:

```
case-003/
├── portraits/
│   ├── victor.svg
│   ├── maya.svg
│   ├── elena.svg
│   ├── daniel.svg
│   ├── nora.svg
│   ├── marcus.svg
│   ├── june.svg
│   ├── sam.svg
│   └── leah.svg
├── locations/
│   ├── home.svg
│   ├── school.svg
│   ├── lab.svg
│   ├── market.svg
│   ├── garage.svg
│   ├── tower.svg
│   ├── news.svg
│   ├── storage.svg
│   └── warehouse.svg
└── modules/
    ├── base/
    │   └── characters_locations.json
    └── scenario/
        └── case_003_scenario.json
```

## Проверка работы

После размещения файлов:
1. Откройте игру
2. Выберите scenario case-003
3. Проверьте отображение портретов в диалогах
4. Проверьте отображение локаций на карте и при посещении

Если изображения не отображаются:
- Проверьте правильность имён файлов (регистр важен!)
- Проверьте путь в JSON файлах (`portrait`, `image` поля)
- Убедитесь, что файлы имеют правильный формат (SVG/PNG)
