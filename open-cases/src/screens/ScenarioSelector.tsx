/**
 * OPEN CASES - Scenario Selector Screen
 * 
 * Allows players to choose which detective scenario to play.
 * Auto-discovers all scenarios from /public/scenarios/{case-id}/scenario.json
 */

import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Users, Clock, MapPin, Shield, ChevronRight, Edit3, Play, FileText } from 'lucide-react';
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

interface CaseFolderProps {
  scenario: ScenarioMeta;
  onSelect: (scenarioId: string, data: ScenarioData) => void;
  onEdit: (scenarioId: string, data: ScenarioData) => void;
}

/**
 * Компонент папки с делом - анимированное открытие досье
 */
const CaseFolder: React.FC<CaseFolderProps> = ({ scenario, onSelect, onEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scenarioData, setScenarioData] = useState<ScenarioData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleOpen = () => {
    if (!isOpen && !isLoaded) {
      setIsOpen(true);
      // Загружаем данные сценария при открытии
      fetchScenario(scenario.id).then(result => {
        if (result.success && result.data) {
          setScenarioData(result.data);
          setIsLoaded(true);
        }
      });
    }
  };

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scenarioData) {
      onSelect(scenario.id, scenarioData);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scenarioData) {
      onEdit(scenario.id, scenarioData);
    }
  };

  return (
    <div 
      className="case-folder-wrapper"
      onClick={handleOpen}
    >
      <div className={`case-folder ${isOpen ? 'open' : ''}`}>
        {/* Задняя часть папки */}
        <div className="folder-back">
          <div className="folder-tab"></div>
        </div>

        {/* Внутреннее содержание (досье) */}
        <div className="folder-content">
          <div className="dossier-paper">
            <div className="dossier-header">
              <h2 className="dossier-title">{scenario.title}</h2>
              <div className="stamp-classified">СЕКРЕТНО</div>
            </div>
            
            <div className="dossier-grid">
              <div className="dossier-field">
                <FileText size={16} className="dossier-icon" />
                <span>Дело № {scenario.id.toUpperCase()}</span>
              </div>
              <div className="dossier-field">
                <Users size={16} className="dossier-icon" />
                <span>{scenario.players}</span>
              </div>
              <div className="dossier-field">
                <Clock size={16} className="dossier-icon" />
                <span>{scenario.duration}</span>
              </div>
              <div className="dossier-field">
                <MapPin size={16} className="dossier-icon" />
                <span>{scenario.city}</span>
              </div>
            </div>

            <div className="dossier-description">
              <h3>ОПИСАНИЕ ПРЕСТУПЛЕНИЯ:</h3>
              <p>{scenario.premise}</p>
            </div>

            {isLoaded && scenarioData && (
              <div className="dossier-footer">
                <div className="flex gap-2">
                  <button className="btn-start-case flex-1" onClick={handleStart}>
                    <Play size={18} />
                    НАЧАТЬ РАССЛЕДОВАНИЕ
                  </button>
                  <button className="btn-edit-case" onClick={handleEdit} title="Редактировать сценарий">
                    <Edit3 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Передняя обложка папки */}
        <div className="folder-front">
          <div className="folder-label">
            <span className="label-text">ДЕЛО № {scenario.id.toUpperCase()}</span>
          </div>
          <div className="folder-overlay">
            <h3 className="folder-title">{scenario.title}</h3>
            <div className="folder-status">
              {scenario.difficulty === 'hard' ? '★ ОСОБО ВАЖНОЕ' : 'Стандартное расследование'}
            </div>
            <div className="folder-preview">
              <p className="folder-premise">{scenario.premise.substring(0, 100)}...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
            <CaseFolder 
              key={scenario.id} 
              scenario={scenario} 
              onSelect={onSelect} 
              onEdit={(id, data) => setEditingScenario({ id, data })}
            />
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
