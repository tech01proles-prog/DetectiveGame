import { ArrowRight, Clock, MapPinned, Users } from 'lucide-react';
import type { ScenarioData } from '@/game/scenario/schema';

export default function IntroScreen({ onDone, scenario }: { onDone: () => void; scenario: ScenarioData }) {
  return (
    <main className="intro">
      <div className="intro-inner">
        <div className="eyebrow">
          ДЕЛО №{scenario.scenario.id.toUpperCase()} · ПЕРВИЧНЫЙ БРИФИНГ
        </div>
        <h1>{scenario.scenario.title}</h1>
        <div className="intro-grid">
          <div>
            <p className="intro-lead">{scenario.scenario.premise}</p>
            <p>{scenario.scenario.opening}</p>
            <p>Ваша задача — восстановить маршрут, понять мотивы и установить, кто организовал преступление.</p>
          </div>
          <aside className="brief-card">
            <div>
              <Clock />
              <span>
                <b>{scenario.scenario.duration}</b>
                <small>среднее расследование</small>
              </span>
            </div>
            <div>
              <MapPinned />
              <span>
                <b>{scenario.scenario.city}</b>
                <small>реальная география</small>
              </span>
            </div>
            <div>
              <Users />
              <span>
                <b>{scenario.scenario.players}</b>
                <small>общая команда</small>
              </span>
            </div>
          </aside>
        </div>
        <div className="rules">
          <b>Правило расследования</b>
          <span>
            Игра не подсказывает единственный маршрут. Если у вас появилась зацепка — ищите, где ещё она может работать. 
            Ложные следы существуют, но каждая важная улика имеет логическое подтверждение.
          </span>
        </div>
        <button className="btn primary" onClick={onDone}>
          Открыть карту дела <ArrowRight size={18} />
        </button>
      </div>
    </main>
  );
}
