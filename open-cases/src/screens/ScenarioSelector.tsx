/**
 * OPEN CASES - Scenario Selector Screen
 * 
 * Allows players to choose which detective scenario to play.
 * Auto-discovers all scenarios from /public/scenarios/{case-id}/scenario.json
 */

import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Users, Clock, MapPin, Shield, ChevronRight, Edit3 } from 'lucide-react';
import type { ScenarioData } from '@/game/scenario/schema';
import { fetchScenario } from '@/game/scenario/loader';
import ScenarioEditor from './ScenarioEditor.tsx';

interface ScenarioMeta {
  id: string;
  title: string;
  city: string;
  duration: string;
  players: string;
  difficulty: string;
  premise: string;
}

/**
 * Список известных сценариев для загрузки
 * Автообнаружение невозможно в браузере без бэкенда,
 * поэтому используем manifest-файл или сканируем известные ID
 */
const KNOWN_SCENARIO_IDS = [
  'case-001',
  'case-002',
  // Добавляйте новые ID сюда при создании дел
];

/**
 * Автообнаружение всех сценариев в папке /public/scenarios/
 * Проверяет наличие scenario.json для каждого известного ID
 */
async function discoverScenarios(): Promise<ScenarioMeta[]> {
  const scenarios: ScenarioMeta[] = [];
  
  // Пытаемся загрузить manifest файл (если есть)
  try {
    const manifestResponse = await fetch('/scenarios/index.json');
    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      if (manifest.scenarios && Array.isArray(manifest.scenarios)) {
        KNOWN_SCENARIO_IDS.push(...manifest.scenarios.map((s: any) => s.id).filter((id: string) => !KNOWN_SCENARIO_IDS.includes(id)));
      }
    }
  } catch (e) {
    // index.json нет, используем KNOWN_SCENARIO_IDS
    console.log('index.json не найден, используем встроенный список');
  }
  
  // Для каждого известного ID пытаемся загрузить scenario.json
  for (const scenarioId of KNOWN_SCENARIO_IDS) {
    try {
      const result = await fetchScenario(scenarioId);
      if (result.success && result.data) {
        scenarios.push({
          id: result.data.scenario.id,
          title: result.data.scenario.title,
          city: result.data.scenario.city,
          duration: result.data.scenario.duration,
          players: result.data.scenario.players,
          difficulty: result.data.scenario.difficulty,
          premise: result.data.scenario.premise,
        });
      } else {
        console.warn(`Сценарий ${scenarioId} не загружен:`, result.errors);
      }
    } catch (e) {
      console.warn(`Ошибка загрузки сценария ${scenarioId}:`, e);
    }
  }
  
  return scenarios;
}

export default function ScenarioSelector({ 
  onSelect, 
  onBack 
}: { 
  onSelect: (scenarioId: string, data: ScenarioData) => void;
  onBack: () => void;
}) {
  const [scenarios, setScenarios] = useState<ScenarioMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingScenario, setEditingScenario] = useState<{id: string, data: ScenarioData} | null>(null);

  useEffect(() => {
    // Автообнаружение всех сценариев
    discoverScenarios()
      .then((loaded) => {
        setScenarios(loaded);
        setLoading(false);
        if (loaded.length === 0) {
          setError('Не найдено ни одного корректного сценария в /public/scenarios/');
        }
      })
      .catch((err) => {
        console.error(err);
        setError(`Ошибка загрузки: ${(err as Error).message}`);
        setLoading(false);
      });
  }, []);

  // Handle saving edited scenario
  const handleSaveEditedScenario = (newScenarioId: string, newData: ScenarioData) => {
    // Create downloadable JSON file
    const blob = new Blob([JSON.stringify(newData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${newScenarioId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    alert(`Сценарий сохранен как ${newScenarioId}.json\n\nФайл будет загружен в папку /public/scenarios/${newScenarioId}/\nНе забудьте также скопировать ресурсы (изображения) из оригинального сценария.`);
    
    setEditingScenario(null);
  };

  if (editingScenario) {
    return (
      <ScenarioEditor
        scenarioData={editingScenario.data}
        scenarioId={editingScenario.id}
        onSave={handleSaveEditedScenario}
        onCancel={() => setEditingScenario(null)}
      />
    );
  }

  if (loading) {
    return (
      <main className="title-screen">
        <div className="title-content">
          <h2>Загрузка сценариев...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="title-screen">
      <div className="title-noise" />
      <div className="title-content">
        <div className="eyebrow">
          <FolderOpen size={14} /> ВЫБОР ДЕЛА
        </div>
        <h1>Открытые<br /><em>сценарии</em></h1>
        <p className="lead">Выберите детективную историю для расследования.</p>
        
        <div className="scenario-list">
          {scenarios.map(scenario => (
            <div key={scenario.id} className="relative">
              <button 
                className="scenario-card w-full text-left"
                onClick={() => {
                  fetchScenario(scenario.id).then(result => {
                    if (result.success && result.data) {
                      onSelect(scenario.id, result.data);
                    }
                  });
                }}
              >
                <div className="scenario-header">
                  <Shield size={16} />
                  <span>CASE FILE / {scenario.id.toUpperCase()}</span>
                </div>
                <h3>{scenario.title}</h3>
                <div className="scenario-meta">
                  <span><MapPin size={14} /> {scenario.city}</span>
                  <span><Clock size={14} /> {scenario.duration}</span>
                  <span><Users size={14} /> {scenario.players}</span>
                </div>
                <div className="scenario-difficulty">
                  <span className={`difficulty-badge difficulty-${scenario.difficulty.toLowerCase()}`}>
                    {scenario.difficulty}
                  </span>
                </div>
                <p className="scenario-premise">{scenario.premise}</p>
                <div className="scenario-action">
                  Начать расследование <ChevronRight size={18} />
                </div>
              </button>
              
              {/* Edit button */}
              <button
                className="absolute top-2 right-2 p-2 bg-[#1e293b] hover:bg-[#2d3748] rounded-md transition-colors"
                title="Редактировать сценарий"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchScenario(scenario.id).then(result => {
                    if (result.success && result.data) {
                      setEditingScenario({ id: scenario.id, data: result.data });
                    }
                  });
                }}
              >
                <Edit3 size={16} className="text-gray-400 hover:text-[#e7c776]" />
              </button>
            </div>
          ))}
          
          {scenarios.length === 0 && (
            <div className="empty-scenarios">
              <p>Нет доступных сценариев.</p>
              <p className="tiny">Добавьте JSON файлы в /public/scenarios/</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button className="btn ghost flex-1" onClick={onBack}>
            ← Назад к титульному экрану
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            <p>Ошибка загрузки сценариев:</p>
            <pre>{error}</pre>
          </div>
        )}
      </div>
    </main>
  );
}
