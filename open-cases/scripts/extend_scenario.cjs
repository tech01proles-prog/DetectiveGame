const fs = require('fs');
const path = require('path');

// Пути к файлам
const scenarioPath = path.join(__dirname, '..', 'public', 'scenarios', 'case-001', 'scenario.json');

// Чтение текущего сценария
let scenario;
try {
    const data = fs.readFileSync(scenarioPath, 'utf8');
    scenario = JSON.parse(data);
} catch (error) {
    console.error('Ошибка чтения сценария:', error.message);
    process.exit(1);
}

// Инициализация массивов если их нет
if (!scenario.locations) scenario.locations = [];
if (!scenario.characters) scenario.characters = [];
if (!scenario.dialogue_nodes) scenario.dialogue_nodes = [];
if (!scenario.clues) scenario.clues = [];
if (!scenario.connections) scenario.connections = [];

// Генерация названий улиц и локаций
const streetNames = [
    "Мейпл Стрит", "Оук Авеню", "Пайн Роуд", "Сидар Лейн", "Эльм Стрит",
    "Бёрч Драйв", "Уолнат Корт", "Черри Блоссом", "Магнолия Вэй", "Аспен Плейс",
    "Виллоу Крик", "Хикори Хилл", "Сикамор Роуд", "Редвуд Драйв", "Спрус Стрит",
    "Фир Авеню", "Хемлок Лейн", "Джунипер Вэй", "Ларч Корт", "Тамарак Плейс",
    "Коттонвуд Драйв", "Бассвуд Роуд", "Айронвуд Лейн", "Боксельдер Вэй", "Катамба Корт"
];

const locationTypes = [
    "Переулок", "Парк", "Склад", "Кафе", "Гараж", 
    "Магазин", "Офис", "Квартира", "Подвал", "Чердак",
    "Аллея", "Мост", "Набережная", "Станция", "Бар"
];

const characters = [
    { name: "Прохожий", role: "Свидетель" },
    { name: "Продавец", role: "Торговец" },
    { name: "Полицейский", role: "Охрана" },
    { name: "Бездомный", role: "Информатор" },
    { name: "Курьер", role: "Связной" },
    { name: "Бармен", role: "Наблюдатель" },
    { name: "Таксист", role: "Водитель" },
    { name: "Старушка", role: "Местная жительница" }
];

// Получаем текущие ID локаций и персонажей, чтобы не дублировать
const existingLocationIds = new Set(scenario.locations.map(l => l.id));
const existingCharacterIds = new Set(scenario.characters.map(c => c.id));
const existingDialogueIds = new Set(scenario.dialogue_nodes.map(d => d.id));

let locationCounter = 1;
let characterCounter = 1;
let dialogueCounter = 1;

// Находим максимальные существующие номера
for (const id of existingLocationIds) {
    const match = id.match(/loc_(\d+)/);
    if (match) locationCounter = Math.max(locationCounter, parseInt(match[1]) + 1);
}
for (const id of existingCharacterIds) {
    const match = id.match(/char_(\d+)/);
    if (match) characterCounter = Math.max(characterCounter, parseInt(match[1]) + 1);
}
for (const id of existingDialogueIds) {
    const match = id.match(/dialogue_(\d+)/);
    if (match) dialogueCounter = Math.max(dialogueCounter, parseInt(match[1]) + 1);
}

console.log(`Начинаем с: loc_${locationCounter}, char_${characterCounter}, dialogue_${dialogueCounter}`);

// Добавляем 30 новых локаций
console.log("Добавление 30 новых локаций...");
for (let i = 0; i < 30; i++) {
    const locId = `loc_${locationCounter + i}`;
    const streetName = streetNames[i % streetNames.length];
    const locType = locationTypes[i % locationTypes.length];
    
    scenario.locations.push({
        id: locId,
        title: `${streetName}, ${locType}`,
        description: `Тёмное место на окраине города. Здесь что-то определённо произошло. Тени скрывают больше, чем показывают фонари.`,
        coordinates: {
            x: Math.floor(Math.random() * 80) + 10,
            y: Math.floor(Math.random() * 80) + 10
        },
        isLocked: false,
        requiredClues: []
    });
}

// Добавляем 15 новых персонажей
console.log("Добавление 15 новых персонажей...");
for (let i = 0; i < 15; i++) {
    const charId = `char_${characterCounter + i}`;
    const charData = characters[i % characters.length];
    const locId = `loc_${locationCounter + (i * 2) % 30}`;
    
    scenario.characters.push({
        id: charId,
        name: `${charData.name} #${i + 1}`,
        age: 20 + Math.floor(Math.random() * 40),
        role: charData.role,
        relation: "Случайный свидетель",
        summary: `Подозрительный тип, замеченный поблизости. Кажется, он что-то знает.`,
        quote: `"Я здесь никого не видел."`,
        portrait: "",
        locationId: locId,
        status: "witness"
    });
}

// Добавляем диалоги для новых персонажей
console.log("Добавление диалоговых узлов...");
for (let i = 0; i < 15; i++) {
    const charId = `char_${characterCounter + i}`;
    const baseDialogueId = dialogueCounter + (i * 3);
    const clueId = `clue_new_${i + 1}`;
    
    // Начальный диалог
    scenario.dialogue_nodes.push({
        id: `dialogue_${baseDialogueId}`,
        characterId: charId,
        text: [
            "Вы выглядите как тот, кто задаёт слишком много вопросов.",
            "Я здесь никого не видел. И вам советую уйти.",
            "Что вам нужно? У меня нет времени на разговоры."
        ],
        answers: [
            {
                text: "Я просто ищу информацию о вчерашнем вечере.",
                nextId: `dialogue_${baseDialogueId + 1}`
            },
            {
                text: "Не будьте так подозрительны. Я детектив.",
                nextId: `dialogue_${baseDialogueId + 2}`,
                triggersEvent: {
                    type: "add_keyword",
                    keyword: "detected_investigator"
                }
            },
            {
                text: "Хорошо, я пойду. Извините за беспокойство.",
                nextId: null
            }
        ]
    });
    
    // Продолжение диалога
    scenario.dialogue_nodes.push({
        id: `dialogue_${baseDialogueId + 1}`,
        characterId: charId,
        text: [
            "Информация? В этом городе информация стоит дорого.",
            "Вчера вечером? Да, я кое-что слышал. Странные звуки со стороны старого склада."
        ],
        answers: [
            {
                text: "Какие именно звуки?",
                nextId: `dialogue_${baseDialogueId + 2}`,
                triggersEvent: {
                    type: "add_clue",
                    clueId: clueId
                }
            },
            {
                text: "Спасибо. Это всё, что мне нужно.",
                nextId: null
            }
        ]
    });
    
    // Финальный диалог с уликой
    scenario.dialogue_nodes.push({
        id: `dialogue_${baseDialogueId + 2}`,
        characterId: charId,
        text: [
            "Ладно, ладно. Я видел, как оттуда выбежал какой-то человек. Он обронил это.",
            "Только никому не говорите, что это от меня."
        ],
        answers: [
            {
                text: "Спасибо за помощь.",
                nextId: null,
                triggersEvent: {
                    type: "add_clue",
                    clueId: clueId
                }
            }
        ],
        requiresKeywords: ["detected_investigator"]
    });
}

// Добавляем новые улики
console.log("Добавление новых улик...");
for (let i = 0; i < 15; i++) {
    const clueId = `clue_new_${i + 1}`;
    const locId = `loc_${locationCounter + (i * 2) % 30}`;
    
    scenario.clues.push({
        id: clueId,
        title: `Улика #${i + 1}`,
        description: "Странный предмет, найденный на месте происшествия. Может иметь отношение к делу.",
        locationFound: locId,
        imageUrl: ""
    });
}

// Добавляем связи между старыми и новыми локациями
console.log("Добавление связей...");
const startLocation = scenario.locations[0]?.id;
if (startLocation) {
    for (let i = 0; i < 5; i++) {
        const newLocId = `loc_${locationCounter + i * 5}`;
        
        const exists = scenario.connections.some(c => 
            (c.from === startLocation && c.to === newLocId) ||
            (c.from === newLocId && c.to === startLocation)
        );
        
        if (!exists) {
            scenario.connections.push({
                from: startLocation,
                to: newLocId
            });
        }
    }
}

// Сохраняем обновлённый сценарий
try {
    fs.writeFileSync(scenarioPath, JSON.stringify(scenario, null, 2), 'utf8');
    console.log("✅ Сценарий успешно обновлён!");
    console.log(`📍 Добавлено 30 новых локаций (с loc_${locationCounter} по loc_${locationCounter + 29})`);
    console.log(`👥 Добавлено 15 новых персонажей`);
    console.log(`💬 Добавлено 45 новых диалоговых узлов`);
    console.log(`🔍 Добавлено 15 новых улик`);
    console.log(`🔗 Добавлено 5 новых связей`);
} catch (error) {
    console.error('Ошибка записи сценария:', error.message);
    process.exit(1);
}
