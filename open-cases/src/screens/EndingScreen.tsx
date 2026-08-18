import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import type { GameState } from '@/game/types';
import type { ScenarioData } from '@/game/scenario/schema';
import { getCharacterById } from '@/game/scenario/loader';

export default function EndingScreen({ 
  state, 
  onRestart,
  scenario 
}: { 
  state: GameState; 
  onRestart: () => void;
  scenario: ScenarioData | null;
}) {
  const score = state.score || 0;
  const good = score >= 70;
  
  // Get culprit info from scenario
  const culprit = scenario?.solution?.culpritCharacterId 
    ? getCharacterById(scenario, scenario.solution.culpritCharacterId)
    : null;
  
  const correctPerson = state.finalAnswers?.person === scenario?.solution?.culpritCharacterId;
  const correctMotive = scenario?.solution.motiveKeywords.includes(state.finalAnswers?.motive);
  const correctMethod = scenario?.solution.methodKeywords.includes(state.finalAnswers?.method);
  const correctLocation = state.finalAnswers?.location === scenario?.solution.keyLocationId;

  return (
    <main className="ending">
      <div className="ending-inner">
        <div className="eyebrow">ДЕЛО ЗАКРЫТО</div>
        <div className={`score-ring ${good ? 'good' : ''}`}>
          <strong>{score}</strong>
          <span>из 100</span>
        </div>
        <h1>
          {good 
            ? 'Вы восстановили цепочку событий.' 
            : 'Расследование осталось неполным.'}
        </h1>
        <p>
          {good
            ? scenario?.scenario.opening || 'Вы раскрыли преступление.'
            : 'Вашей команде не хватило нескольких ключевых связей. Можно начать заново и проверить другие направления.'}
        </p>
        
        {scenario && (
          <div className="answer-grid">
            <div>
              <span>Организатор</span>
              <b>{culprit?.name || 'Неизвестно'}</b>
              {correctPerson ? <CheckCircle2 /> : <XCircle />}
            </div>
            <div>
              <span>Мотив</span>
              <b>{scenario.solution.motiveKeywords.join(', ')}</b>
              {correctMotive ? <CheckCircle2 /> : <XCircle />}
            </div>
            <div>
              <span>Способ</span>
              <b>{scenario.solution.methodKeywords.join(', ')}</b>
              {correctMethod ? <CheckCircle2 /> : <XCircle />}
            </div>
            <div>
              <span>Ключевая точка</span>
              <b>{scenario.locations.find(l => l.id === scenario.solution.keyLocationId)?.title || 'Неизвестно'}</b>
              {correctLocation ? <CheckCircle2 /> : <XCircle />}
            </div>
          </div>
        )}
        
        <button className="btn primary" onClick={onRestart}>
          <RotateCcw size={18} /> Новое расследование
        </button>
      </div>
    </main>
  );
}
