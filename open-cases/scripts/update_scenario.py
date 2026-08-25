#!/usr/bin/env python3
import json
from pathlib import Path

scenario_path = Path("/workspace/open-cases/public/scenarios/case-003/scenario.json")
with open(scenario_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. UPDATE CHARACTERS
characters_updates = {
    "victor": {"motive": "Сокрытие незаконных операций Cross Industries", "alibi": "Деловой ужин в Harbor View 19:00-21:30", "secret": "Оффшорные счета, Сэм — сообщник", "trustLevel": 2},
    "maya": {"motive": "Жертва похищения, хотела раскрыть правду", "alibi": "В школе до 20:14", "secret": "Тайно фотографировала грузы для Лии", "trustLevel": 5},
    "elena": {"motive": "Нет — мать пропавшей", "alibi": "Дома весь вечер", "secret": "Знала что Майя что-то скрывает", "trustLevel": 5},
    "daniel": {"motive": "Нет — учитель", "alibi": "В школе до 20:30", "secret": "Получал угрозы, скрывал от полиции", "trustLevel": 4},
    "nora": {"motive": "Нет — помогала", "alibi": "В лаборатории до 21:00", "secret": "Видела подозрительные фото Майи", "trustLevel": 4},
    "marcus": {"motive": "Деньги — $5000 за молчание", "alibi": "Доставка для Madison Market", "secret": "Дал неполные показания", "trustLevel": 2},
    "june": {"motive": "Нет — подруга", "alibi": "Дома, переписывалась с Майей", "secret": "Получала странные сообщения", "trustLevel": 4},
    "sam": {"motive": "Деньги и шантаж от Виктора", "alibi": "В гараже весь вечер", "secret": "Предоставил гараж для содержания Майи", "trustLevel": 1},
    "leah": {"motive": "Нет — журналист", "alibi": "В редакции до вечера", "secret": "Получила компромат на Cross Industries", "trustLevel": 5}
}

for char in data['characters']:
    if char['id'] in characters_updates:
        char.update(characters_updates[char['id']])

# 2. ADD FALSE CLUES
false_clues = [
    {"id": "clue_25_fake_witness", "title": "Ложный свидетель", "type": "показание", "description": "Анонимный звонок о видении Майи в парке", "detail": "Голосовой модулятор", "locationId": "loc_2", "importance": "important", "relatedCharacters": ["victor"], "isRedHerring": True, "foundWhen": "После опроса"},
    {"id": "clue_26_planted_evidence", "title": "Подброшенный рюкзак", "type": "предмет", "description": "Рюкзак near abandoned warehouse", "detail": "ДНК не совпадает", "locationId": "abandoned_warehouse", "importance": "important", "relatedCharacters": ["victor", "sam"], "isRedHerring": True, "foundWhen": "При осмотре"},
    {"id": "clue_27_fake_security_log", "title": "Фальшивый журнал охраны", "type": "документ", "description": "Запись о выходе Виктора в 19:45", "detail": "Время изменено", "locationId": "cross_tower", "importance": "critical", "relatedCharacters": ["victor"], "isRedHerring": True, "isFalseDocument": True, "documentTexture": "security_log", "stampText": "ALTERED", "stampColor": "#dc2626", "foundWhen": "Проверка записей"},
    {"id": "clue_28_misleading_gps", "title": "GPS трекер", "type": "электроника", "description": "В машине Маркуса", "detail": "Неверный маршрут", "locationId": "madison_market", "importance": "important", "relatedCharacters": ["marcus", "victor"], "isRedHerring": True, "foundWhen": "Обыск фургона"}
]
data['clues'].extend(false_clues)

# 3. ADD LOCATIONS - cross_tower and abandoned_warehouse first
new_locs = []
# Keep first 7
for loc in data['locations'][:7]:
    if loc['id'] == 'rainier_lab': loc['requiresClueIds'] = ['clue_02_photo']
    elif loc['id'] == 'reed_garage': loc['requiresClueIds'] = ['clue_03_van']
    elif loc['id'] == 'city_news': loc['requiresClueIds'] = ['clue_08_chat']
    elif loc['id'] == 'northline_storage': loc['requiresClueIds'] = ['clue_07_manifest', 'clue_11_storage']
    new_locs.append(loc)

# Add cross_tower
new_locs.append({
    "id": "cross_tower", "title": "Cross Tower", "subtitle": "Штаб-квартира Cross Industries",
    "description": "Высотное здание в центре Сиэтла. Офис Виктора Кросса.",
    "lat": 47.6062, "lng": -122.3321, "address": "4th Ave, Downtown Seattle",
    "image": "locations/tower.svg", "category": "Корпорация", "initial": False, "discovered": False,
    "clueIds": ["clue_12_cross", "clue_15_encrypted", "clue_19_ledger", "clue_20_bribe", "clue_21_fake_receipt", "clue_22_alibi", "clue_27_fake_security_log"],
    "characterIds": ["victor"],
    "actions": [
        {"id": "cross_tower_victor", "label": "Допросить Виктора", "description": "Вопросы об алиби", "clueIds": [], "characterId": "victor", "once": True},
        {"id": "search_victor_office", "label": "Обыскать офис", "description": "Искать документы", "clueIds": ["clue_19_ledger", "clue_20_bribe"], "once": True, "requiresClueIds": ["clue_14_threat"]},
        {"id": "access_server_room", "label": "Взломать серверы", "description": "Зашифрованные файлы", "clueIds": ["clue_15_encrypted", "clue_27_fake_security_log"], "once": True, "requiresClueIds": ["clue_12_cross"]}
    ],
    "coordinates": {"x": 25, "y": 45}, "lockedReason": "Нужны доказательства связи Виктора с похищением"
})

# Add abandoned_warehouse
new_locs.append({
    "id": "abandoned_warehouse", "title": "Заброшенный склад", "subtitle": "Место содержания Майи",
    "description": "Старый промышленный склад. Здесь удерживали Майю.",
    "lat": 47.5892, "lng": -122.3287, "address": "Industrial District, Seattle",
    "image": "locations/warehouse.svg", "category": "Промышленный", "initial": False, "discovered": False,
    "clueIds": ["clue_23_final", "clue_24_location", "clue_26_planted_evidence"],
    "characterIds": ["maya"],
    "actions": [
        {"id": "search_warehouse", "label": "Обыскать склад", "description": "Искать следы Майи", "clueIds": ["clue_23_final", "clue_24_location"], "once": True, "requiresClueIds": ["clue_11_storage"]},
        {"id": "examine_evidence", "label": "Изучить улики", "description": "Проверить предметы", "clueIds": ["clue_26_planted_evidence"], "once": True, "requiresClueIds": ["clue_23_final"]}
    ],
    "coordinates": {"x": 15, "y": 80}, "lockedReason": "Нужны координаты из сообщений Лии"
})

# Add loc_1 through loc_30 with images and actions
location_templates = [
    ("loc_1", "Мейпл Стрит, Переулок", "Улица", "locations/alley.svg", "Тёмный переулок возле школы"),
    ("loc_2", "Оук Авеню, Парк", "Парк", "locations/park.svg", "Общественный парк"),
    ("loc_3", "Пайн Роуд, Склад", "Промышленный", "locations/warehouse_generic.svg", "Старый складской комплекс"),
    ("loc_4", "Сидар Лейн, Кафе", "Бизнес", "locations/cafe.svg", "Небольшое кафе"),
    ("loc_5", "Эльм Стрит, Гараж", "Сервис", "locations/garage_small.svg", "Частный гараж"),
    ("loc_6", "Бёрч Авеню, Офис", "Бизнес", "locations/office.svg", "Офисное здание"),
    ("loc_7", "Валоут Стрит, Банк", "Финансы", "locations/bank.svg", "Отделение банка"),
    ("loc_8", "Честнат Роуд, Больница", "Медицина", "locations/hospital.svg", "Городская больница"),
    ("loc_9", "Аш Стрит, Полицейский участок", "Правоохранение", "locations/police.svg", "Полицейский участок"),
    ("loc_10", "Спрус Лейн, Заправка", "Сервис", "locations/gas_station.svg", "АЗС"),
    ("loc_11", "Магнолия Блувард, Торговый центр", "Торговля", "locations/mall.svg", "Торговый центр"),
    ("loc_12", "Лорел Авеню, Отель", "Гостиница", "locations/hotel.svg", "Отель"),
    ("loc_13", "Хоторн Стрит, Библиотека", "Образование", "locations/library.svg", "Публичная библиотека"),
    ("loc_14", "Сикомор Лейн, Ресторан", "Бизнес", "locations/restaurant.svg", "Ресторан Harbor View"),
    ("loc_15", "Редвуд Драйв, Автошкола", "Образование", "locations/driving_school.svg", "Автошкола"),
    ("loc_16", "Поплар Стрит, Почта", "Сервис", "locations/post_office.svg", "Почтовое отделение"),
    ("loc_17", "Уиллоу Авеню, Фитнес-центр", "Спорт", "locations/gym.svg", "Спортивный зал"),
    ("loc_18", "Ок Стрит, Кинотеатр", "Развлечения", "locations/cinema.svg", "Кинотеатр"),
    ("loc_19", "Сайпресс Лейн, Химчистка", "Сервис", "locations/dry_cleaner.svg", "Химчистка"),
    ("loc_20", "Фир Стрит, Ветклиника", "Медицина", "locations/vet.svg", "Ветеринарная клиника"),
    ("loc_21", "Хемлок Авеню, Музей", "Культура", "locations/museum.svg", "Городской музей"),
    ("loc_22", "Джунипер Лейн, Аптека", "Медицина", "locations/pharmacy.svg", "Аптека"),
    ("loc_23", "Ларч Стрит, Бар", "Развлечения", "locations/bar.svg", "Бар"),
    ("loc_24", "Свитгам Авеню, Цветочный магазин", "Торговля", "locations/florist.svg", "Цветочный магазин"),
    ("loc_25", "Коттонвуд Лейн, Прачечная", "Сервис", "locations/laundry.svg", "Прачечная"),
    ("loc_26", "Редседар Стрит, Антикварный магазин", "Торговля", "locations/antique.svg", "Антикварный магазин"),
    ("loc_27", "Биглиф Авеню, Нотариус", "Юридический", "locations/notary.svg", "Нотариальная контора"),
    ("loc_28", "Винewood Лейн, Студия звукозаписи", "Развлечения", "locations/studio.svg", "Студия"),
    ("loc_29", "Палм Стрит, Турфирма", "Бизнес", "locations/travel_agency.svg", "Турфирма"),
    ("loc_30", "Эльм Стрит, Бар", "Развлечения", "locations/pub.svg", "Паб")
]

for i, (lid, title, cat, img, desc) in enumerate(location_templates):
    coords = {"x": 50, "y": 50}
    for existing_loc in data['locations'][7:]:
        if existing_loc['id'] == lid:
            coords = existing_loc.get('coordinates', {"x": 50, "y": 50})
            break
    
    action = {"id": f"action_{lid}", "label": "Исследовать", "description": f"Осмотреть {desc}", "clueIds": [], "once": True}
    
    new_locs.append({
        "id": lid, "title": title, "subtitle": "", "description": desc,
        "lat": None, "lng": None, "address": "", "image": img, "category": cat,
        "initial": False, "discovered": False, "clueIds": [], "characterIds": [],
        "actions": [action], "coordinates": coords
    })

data['locations'] = new_locs

# 4. KEYWORD DEFINITIONS
data['keywordDefinitions'] = {
    "бизнес": {"description": "Финансовый мотив Cross Industries", "triggersEvent": "business_revealed", "unlocksLocations": ["cross_tower"]},
    "деньги": {"description": "Финансовая выгода", "triggersEvent": "money_trail_found", "unlocksLocations": ["loc_7"]},
    "контроль": {"description": "Желание скрыть правду", "triggersEvent": "control_exposed"},
    "свидетель": {"description": "Майя — свидетель", "triggersEvent": "witness_identified"},
    "фотограф": {"description": "Майя фотографировала", "unlocksLocations": ["rainier_lab"]},
    "правда": {"description": "Раскрытие истины", "triggersEvent": "truth_revealed"},
    "сообщник": {"description": "Помощник преступника", "unlocksLocations": ["reed_garage"]},
    "подкуп": {"description": "Финансовое вознаграждение", "triggersEvent": "bribe_exposed"},
    "угрозы": {"description": "Запугивание", "triggersEvent": "threats_found"},
    "отмывание": {"description": "Легализация доходов", "unlocksLocations": ["loc_7", "cross_tower"]},
    "похищение": {"description": "Незаконное лишение свободы", "unlocksLocations": ["abandoned_warehouse"]}
}

# 5. NEWS FEED
data['newsFeed'] = [
    {"id": "news_01", "headline": "Подросток пропал в Сиэтле", "summary": "Майя Беннетт не вернулась домой", "source": "Seattle Times", "timestamp": "20:45", "impact": "opening", "relatedCharacters": ["maya", "elena"]},
    {"id": "news_02", "headline": "Свидетели видели подозрительный фургон", "summary": "Серый фургон возле школы", "source": "KING 5 News", "timestamp": "21:15", "impact": "clue", "relatedCharacters": ["marcus"], "relatedClues": ["clue_03_van"]},
    {"id": "news_03", "headline": "Cross Industries под подозрением", "summary": "Полиция интересуется компанией", "source": "Seattle Ledger", "timestamp": "22:00", "impact": "suspicion", "relatedCharacters": ["victor"]},
    {"id": "news_04", "headline": "Найден телефон пропавшей", "summary": "Телефон обнаружен дома", "source": "KIRO 7", "timestamp": "22:30", "impact": "clue", "relatedCharacters": ["maya", "elena"], "relatedClues": ["clue_01_phone"]},
    {"id": "news_05", "headline": "Журналистка получила анонимные материалы", "summary": "Компрометирующие документы", "source": "Seattle Ledger", "timestamp": "23:00", "impact": "breakthrough", "relatedCharacters": ["leah"], "relatedClues": ["clue_10_news"]},
    {"id": "news_06", "headline": "Арест в деле о похищении", "summary": "Задержан владелец автомастерской", "source": "Seattle Times", "timestamp": "01:30", "impact": "arrest", "relatedCharacters": ["sam"], "relatedClues": ["clue_18_confession"]},
    {"id": "news_07", "headline": "Майя Беннетт найдена живой", "summary": "Пропавшая школьница обнаружена", "source": "KING 5 News", "timestamp": "03:00", "impact": "resolution", "relatedCharacters": ["maya", "victor"], "relatedClues": ["clue_23_final", "clue_24_location"]}
]

# Save
with open(scenario_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("=== DONE ===")
print(f"Locations: {len(data['locations'])}")
print(f"Characters: {len(data['characters'])}")
print(f"Clues: {len(data['clues'])} ({len([c for c in data['clues'] if c.get('isRedHerring')])} red herrings)")
print(f"News Feed: {len(data['newsFeed'])}")
print(f"Keywords: {len(data['keywordDefinitions'])}")
