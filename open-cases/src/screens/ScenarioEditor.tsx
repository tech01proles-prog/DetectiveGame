/**
 * OPEN CASES - Scenario Editor Screen
 * 
 * Visual editor for modifying scenario data including:
 * - Drag-and-drop location markers on the map
 * - Edit all text fields in the scenario
 * - Save as new scenario file with timestamp
 */

import { useState, useEffect, useRef } from 'react';
import { Save, X, MapPin, Edit3, Download, Upload, Plus, Trash2 } from 'lucide-react';
import type { ScenarioData, Location, Character, Clue, DialogueNode } from '@/game/scenario/schema';

interface ScenarioEditorProps {
  scenarioData: ScenarioData;
  scenarioId: string;
  onSave: (newScenarioId: string, newData: ScenarioData) => void;
  onCancel: () => void;
}

export default function ScenarioEditor({ 
  scenarioData, 
  scenarioId, 
  onSave, 
  onCancel 
}: ScenarioEditorProps) {
  const [editedData, setEditedData] = useState<ScenarioData>(JSON.parse(JSON.stringify(scenarioData)));
  const [activeTab, setActiveTab] = useState<'map' | 'scenario' | 'characters' | 'clues' | 'locations' | 'dialogue'>('map');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedLocationId, setDraggedLocationId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Generate timestamped scenario ID
  const generateNewScenarioId = () => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${scenarioId}_edit_${timestamp}`;
  };

  // Handle location drag on map
  const handleMouseDown = (locationId: string, e: React.MouseEvent) => {
    if (activeTab !== 'map') return;
    e.preventDefault();
    setIsDragging(true);
    setDraggedLocationId(locationId);
    setSelectedLocation(locationId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedLocationId || !svgRef.current) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 400;
    
    // Clamp to SVG bounds
    const clampedX = Math.max(50, Math.min(750, x));
    const clampedY = Math.max(50, Math.min(350, y));
    
    // Convert to percentages (0-100)
    const pctX = (clampedX / 800) * 100;
    const pctY = (clampedY / 400) * 100;
    
    setEditedData(prev => ({
      ...prev,
      locations: prev.locations.map(loc => 
        loc.id === draggedLocationId 
          ? { ...loc, coordinates: { x: Math.round(pctX * 10) / 10, y: Math.round(pctY * 10) / 10 } }
          : loc
      )
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedLocationId(null);
  };

  // Update text field
  const updateField = <T extends keyof ScenarioData>(
    section: T,
    index: number | string,
    field: string,
    value: any
  ) => {
    setEditedData(prev => {
      const newData = { ...prev };
      
      if (typeof index === 'number' && Array.isArray(newData[section])) {
        const array = newData[section] as any[];
        array[index] = { ...array[index], [field]: value };
      } else if (typeof index === 'string' && typeof newData[section] === 'object') {
        const obj = newData[section] as any;
        if (obj[index]) {
          obj[index] = { ...obj[index], [field]: value };
        }
      } else if (typeof index === 'undefined') {
        // For top-level scenario fields
        (newData[section] as any)[field] = value;
      }
      
      return newData;
    });
  };

  // Add new item
  const addItem = <T extends keyof ScenarioData>(section: T, newItem: any) => {
    setEditedData(prev => ({
      ...prev,
      [section]: [...(prev[section] as any[]), newItem]
    }));
  };

  // Delete item
  const deleteItem = <T extends keyof ScenarioData>(section: T, index: number) => {
    setEditedData(prev => ({
      ...prev,
      [section]: (prev[section] as any[]).filter((_: any, i: number) => i !== index)
    }));
  };

  // Save scenario
  const handleSave = () => {
    const newId = generateNewScenarioId();
    onSave(newId, editedData);
  };

  // Get coordinates for display
  const getLocationCoords = (location: Location, index: number) => {
    if (location.coordinates) {
      return {
        x: (location.coordinates.x / 100) * 800,
        y: (location.coordinates.y / 100) * 400
      };
    }
    // Fallback to auto-generation
    let x = 200 + (index % 3) * 200;
    let y = 200 + (Math.floor(index / 3) % 2) * 150;
    return { x: Math.max(50, Math.min(750, x)), y: Math.max(50, Math.min(350, y)) };
  };

  return (
    <main className="min-h-screen bg-[#0a0f1c] text-[#edf0ed]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f1623]/95 backdrop-blur border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Edit3 size={20} className="text-[#e7c776]" />
            <div>
              <h1 className="text-lg font-semibold">Редактор сценария</h1>
              <p className="text-xs text-gray-400">{editedData.scenario.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="btn ghost text-sm"
              onClick={onCancel}
            >
              <X size={16} /> Отмена
            </button>
            <button 
              className="btn primary text-sm"
              onClick={handleSave}
            >
              <Save size={16} /> Сохранить как новый
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 pb-2">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'map', label: 'Карта', icon: MapPin },
              { id: 'scenario', label: 'Сценарий', icon: Edit3 },
              { id: 'locations', label: 'Локации', icon: MapPin },
              { id: 'characters', label: 'Персонажи', icon: Plus },
              { id: 'clues', label: 'Улики', icon: Edit3 },
              { id: 'dialogue', label: 'Диалоги', icon: Edit3 },
            ].map(tab => (
              <button
                key={tab.id}
                className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-[#1e293b] text-[#e7c776]' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1e293b]/50'
                }`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <tab.icon size={14} className="inline mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Map Editor */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="bg-[#1e293b] rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Редактирование карты</h2>
              <p className="text-sm text-gray-400 mb-4">
                Перетаскивайте маркеры локации для изменения их координат. Координаты сохраняются в процентах (0-100) от размера карты.
              </p>
              
              <div 
                className="relative bg-[#0a0f1c] rounded-lg overflow-hidden"
                style={{ aspectRatio: '2/1' }}
              >
                <svg
                  ref={svgRef}
                  viewBox="0 0 800 400"
                  preserveAspectRatio="xMidYMid meet"
                  className="w-full h-full"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Background */}
                  <rect width="800" height="400" fill="#1a2332" />
                  
                  {/* Grid lines for reference */}
                  <defs>
                    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#2d3748" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="800" height="400" fill="url(#grid)" />
                  
                  {/* Location markers */}
                  {editedData.locations.map((location, idx) => {
                    const coords = getLocationCoords(location, idx);
                    const isSelected = selectedLocation === location.id;
                    const isDraggingNow = draggedLocationId === location.id;
                    
                    return (
                      <g
                        key={location.id}
                        transform={`translate(${coords.x}, ${coords.y})`}
                        onMouseDown={(e) => handleMouseDown(location.id, e)}
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                      >
                        <circle
                          cx="0"
                          cy="0"
                          r={isSelected || isDraggingNow ? 20 : 16}
                          fill={isSelected ? '#e7c776' : '#3b82f6'}
                          stroke="#fff"
                          strokeWidth="3"
                          opacity={isDraggingNow ? 0.8 : 1}
                        />
                        <text
                          x="0"
                          y="5"
                          textAnchor="middle"
                          fontSize="14"
                          fill="#fff"
                        >
                          📍
                        </text>
                        {isSelected && (
                          <text
                            x="0"
                            y="-25"
                            textAnchor="middle"
                            fontSize="12"
                            fill="#e7c776"
                            fontWeight="bold"
                          >
                            {location.title}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
              
              {/* Coordinates info */}
              {selectedLocation && (
                <div className="mt-4 p-3 bg-[#0a0f1c] rounded-md">
                  <p className="text-sm">
                    <strong>Выбрано:</strong> {editedData.locations.find(l => l.id === selectedLocation)?.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Координаты: X: {editedData.locations.find(l => l.id === selectedLocation)?.coordinates?.x || 'auto'}%, 
                    Y: {editedData.locations.find(l => l.id === selectedLocation)?.coordinates?.y || 'auto'}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scenario Metadata Editor */}
        {activeTab === 'scenario' && (
          <div className="space-y-4">
            <div className="bg-[#1e293b] rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Метаданные сценария</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Название</label>
                  <input
                    type="text"
                    value={editedData.scenario.title}
                    onChange={(e) => updateField('scenario', undefined as any, 'title', e.target.value)}
                    className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Город</label>
                  <input
                    type="text"
                    value={editedData.scenario.city}
                    onChange={(e) => updateField('scenario', undefined as any, 'city', e.target.value)}
                    className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Год</label>
                  <input
                    type="number"
                    value={editedData.scenario.year}
                    onChange={(e) => updateField('scenario', undefined as any, 'year', parseInt(e.target.value))}
                    className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Длительность</label>
                  <input
                    type="text"
                    value={editedData.scenario.duration}
                    onChange={(e) => updateField('scenario', undefined as any, 'duration', e.target.value)}
                    className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Игроки</label>
                  <input
                    type="text"
                    value={editedData.scenario.players}
                    onChange={(e) => updateField('scenario', undefined as any, 'players', e.target.value)}
                    className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Сложность</label>
                  <input
                    type="text"
                    value={editedData.scenario.difficulty}
                    onChange={(e) => updateField('scenario', undefined as any, 'difficulty', e.target.value)}
                    className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm text-gray-400 mb-1">Предыстория (Premise)</label>
                <textarea
                  value={editedData.scenario.premise}
                  onChange={(e) => updateField('scenario', undefined as any, 'premise', e.target.value)}
                  className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-3 py-2 h-24"
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm text-gray-400 mb-1">Вступление (Opening)</label>
                <textarea
                  value={editedData.scenario.opening}
                  onChange={(e) => updateField('scenario', undefined as any, 'opening', e.target.value)}
                  className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-3 py-2 h-32"
                />
              </div>
            </div>
          </div>
        )}

        {/* Locations Editor */}
        {activeTab === 'locations' && (
          <div className="space-y-4">
            {editedData.locations.map((location, idx) => (
              <div key={location.id} className="bg-[#1e293b] rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold">#{idx + 1} — {location.title}</h3>
                  <button 
                    className="text-red-400 hover:text-red-300"
                    onClick={() => deleteItem('locations', idx)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">ID</label>
                    <input
                      type="text"
                      value={location.id}
                      onChange={(e) => updateField('locations', idx, 'id', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Категория</label>
                    <input
                      type="text"
                      value={location.category}
                      onChange={(e) => updateField('locations', idx, 'category', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Подзаголовок</label>
                    <input
                      type="text"
                      value={location.subtitle}
                      onChange={(e) => updateField('locations', idx, 'subtitle', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Описание</label>
                    <textarea
                      value={location.description}
                      onChange={(e) => updateField('locations', idx, 'description', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm h-20"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Адрес</label>
                    <input
                      type="text"
                      value={location.address}
                      onChange={(e) => updateField('locations', idx, 'address', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Изображение</label>
                    <input
                      type="text"
                      value={location.image}
                      onChange={(e) => updateField('locations', idx, 'image', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={location.initial}
                        onChange={(e) => updateField('locations', idx, 'initial', e.target.checked)}
                      />
                      Начальная
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={location.discovered}
                        onChange={(e) => updateField('locations', idx, 'discovered', e.target.checked)}
                      />
                      Открыта
                    </label>
                  </div>
                </div>
              </div>
            ))}
            
            <button
              className="btn primary w-full"
              onClick={() => addItem('locations', {
                id: `location_${editedData.locations.length}`,
                title: 'Новая локация',
                subtitle: '',
                description: '',
                lat: 47.6,
                lng: -122.3,
                address: '',
                image: '',
                category: 'public',
                initial: false,
                discovered: false,
                clueIds: [],
                characterIds: [],
                actions: [],
                coordinates: { x: 50, y: 50 }
              })}
            >
              <Plus size={16} /> Добавить локацию
            </button>
          </div>
        )}

        {/* Characters Editor */}
        {activeTab === 'characters' && (
          <div className="space-y-4">
            {editedData.characters.map((character, idx) => (
              <div key={character.id} className="bg-[#1e293b] rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold">#{idx + 1} — {character.name}</h3>
                  <button 
                    className="text-red-400 hover:text-red-300"
                    onClick={() => deleteItem('characters', idx)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">ID</label>
                    <input
                      type="text"
                      value={character.id}
                      onChange={(e) => updateField('characters', idx, 'id', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Возраст</label>
                    <input
                      type="number"
                      value={character.age}
                      onChange={(e) => updateField('characters', idx, 'age', parseInt(e.target.value))}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Роль</label>
                    <input
                      type="text"
                      value={character.role}
                      onChange={(e) => updateField('characters', idx, 'role', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Статус</label>
                    <select
                      value={character.status}
                      onChange={(e) => updateField('characters', idx, 'status', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    >
                      <option value="missing">Пропавший</option>
                      <option value="witness">Свидетель</option>
                      <option value="suspect">Подозреваемый</option>
                      <option value="cleared">Оправдан</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Отношение к делу</label>
                    <input
                      type="text"
                      value={character.relation}
                      onChange={(e) => updateField('characters', idx, 'relation', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Краткое описание</label>
                    <textarea
                      value={character.summary}
                      onChange={(e) => updateField('characters', idx, 'summary', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm h-16"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Цитата</label>
                    <input
                      type="text"
                      value={character.quote}
                      onChange={(e) => updateField('characters', idx, 'quote', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Портрет</label>
                    <input
                      type="text"
                      value={character.portrait}
                      onChange={(e) => updateField('characters', idx, 'portrait', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Локация</label>
                    <input
                      type="text"
                      value={character.locationId || ''}
                      onChange={(e) => updateField('characters', idx, 'locationId', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                      placeholder="Не указано"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              className="btn primary w-full"
              onClick={() => addItem('characters', {
                id: `char_${editedData.characters.length}`,
                name: 'Новый персонаж',
                age: 30,
                role: '',
                relation: '',
                summary: '',
                quote: '',
                portrait: '',
                status: 'witness' as const
              })}
            >
              <Plus size={16} /> Добавить персонажа
            </button>
          </div>
        )}

        {/* Clues Editor */}
        {activeTab === 'clues' && (
          <div className="space-y-4">
            {editedData.clues.map((clue, idx) => (
              <div key={clue.id} className="bg-[#1e293b] rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold">#{idx + 1} — {clue.title}</h3>
                  <button 
                    className="text-red-400 hover:text-red-300"
                    onClick={() => deleteItem('clues', idx)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">ID</label>
                    <input
                      type="text"
                      value={clue.id}
                      onChange={(e) => updateField('clues', idx, 'id', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Тип</label>
                    <input
                      type="text"
                      value={clue.type}
                      onChange={(e) => updateField('clues', idx, 'type', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Важность</label>
                    <select
                      value={clue.importance}
                      onChange={(e) => updateField('clues', idx, 'importance', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    >
                      <option value="critical">Критичная</option>
                      <option value="important">Важная</option>
                      <option value="context">Контекст</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Локация</label>
                    <input
                      type="text"
                      value={clue.locationId}
                      onChange={(e) => updateField('clues', idx, 'locationId', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Описание</label>
                    <input
                      type="text"
                      value={clue.description}
                      onChange={(e) => updateField('clues', idx, 'description', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Детали</label>
                    <textarea
                      value={clue.detail}
                      onChange={(e) => updateField('clues', idx, 'detail', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm h-20"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Когда найдено</label>
                    <input
                      type="text"
                      value={clue.foundWhen}
                      onChange={(e) => updateField('clues', idx, 'foundWhen', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-[#2d3748] rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              className="btn primary w-full"
              onClick={() => addItem('clues', {
                id: `clue_${editedData.clues.length}`,
                title: 'Новая улика',
                type: 'предмет',
                description: '',
                detail: '',
                locationId: '',
                importance: 'context' as const,
                relatedCharacters: [],
                relatedClues: [],
                foundWhen: ''
              })}
            >
              <Plus size={16} /> Добавить улику
            </button>
          </div>
        )}

        {/* Dialogue Editor */}
        {activeTab === 'dialogue' && (
          <div className="space-y-4">
            <div className="bg-[#1e293b] rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Диалоги</h2>
              <p className="text-sm text-gray-400 mb-4">
                Для редактирования диалогов выберите узел из списка ниже.
              </p>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(editedData.dialogueNodes).map(([nodeId, node]) => (
                  <div key={nodeId} className="p-3 bg-[#0a0f1c] rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{node.title}</h4>
                        <p className="text-xs text-gray-400">ID: {nodeId}</p>
                        <p className="text-xs text-gray-400 mt-1">Персонаж: {node.characterId}</p>
                      </div>
                      <button 
                        className="text-blue-400 hover:text-blue-300 text-xs"
                        onClick={() => setActiveTab('dialogue')}
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                Полное редактирование диалогов будет доступно в следующей версии редактора.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
