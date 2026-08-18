/**
 * OPEN CASES - Scenario Selector Screen
 * 
 * Allows players to choose which detective scenario to play.
 * Lists all available scenarios from /public/scenarios/
 */

import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Users, Clock, MapPin, Shield, ChevronRight } from 'lucide-react';
import type { ScenarioData } from '@/game/scenario/schema';
import { fetchScenario } from '@/game/scenario/loader';

interface ScenarioMeta {
  id: string;
  title: string;
  city: string;
  duration: string;
  players: string;
  difficulty: string;
  premise: string;
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

  useEffect(() => {
    // Загружаем список сценариев из public/scenarios/index.json
    fetch('/scenarios/index.json')
      .then((res) => {
        if (!res.ok) throw new Error('Не удалось загрузить index.json');
        return res.json();
      })
      .then((manifest) => {
        const scenarioList = manifest.scenarios || [];
        
        // Try to load each scenario's metadata
        async function loadScenarios() {
          const loaded: ScenarioMeta[] = [];
          const errors: string[] = [];

          for (const scenario of scenarioList) {
            try {
              const result = await fetchScenario(scenario.id);
              if (result.success && result.data) {
                loaded.push({
                  id: result.data.scenario.id,
                  title: result.data.scenario.title,
                  city: result.data.scenario.city,
                  duration: result.data.scenario.duration,
                  players: result.data.scenario.players,
                  difficulty: result.data.scenario.difficulty,
                  premise: result.data.scenario.premise,
                });
              } else {
                errors.push(`Failed to load ${scenario.id}: ${result.errors?.join(', ')}`);
              }
            } catch (e) {
              errors.push(`Error loading ${scenario.id}: ${(e as Error).message}`);
            }
          }

          setScenarios(loaded);
          setLoading(false);
          if (errors.length > 0 && loaded.length === 0) {
            setError(errors.join('\n'));
          }
        }

        loadScenarios();
      })
      .catch((err) => {
        console.error(err);
        // Фоллбэк на хардкод, если index.json нет
        const scenarioList = [
          { id: 'case-001', title: 'Тишина на Мэдисон' },
        ];
        
        async function loadScenarios() {
          const loaded: ScenarioMeta[] = [];
          for (const scenario of scenarioList) {
            try {
              const result = await fetchScenario(scenario.id);
              if (result.success && result.data) {
                loaded.push({
                  id: result.data.scenario.id,
                  title: result.data.scenario.title,
                  city: result.data.scenario.city,
                  duration: result.data.scenario.duration,
                  players: result.data.scenario.players,
                  difficulty: result.data.scenario.difficulty,
                  premise: result.data.scenario.premise,
                });
              }
            } catch (e) {
              console.error(`Error loading ${scenario.id}:`, e);
            }
          }
          setScenarios(loaded);
          setLoading(false);
        }
        
        loadScenarios();
      });
  }, []);

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
            <button 
              key={scenario.id} 
              className="scenario-card"
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
          ))}
          
          {scenarios.length === 0 && (
            <div className="empty-scenarios">
              <p>Нет доступных сценариев.</p>
              <p className="tiny">Добавьте JSON файлы в /public/scenarios/</p>
            </div>
          )}
        </div>

        <button className="btn ghost" onClick={onBack}>
          ← Назад к титульному экрану
        </button>
        
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
