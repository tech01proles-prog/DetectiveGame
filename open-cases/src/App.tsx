import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import type { GameState } from '@/game/types';
import type { ScenarioData } from '@/game/scenario/schema';
import { loadGame, saveGame, clearSave, createInitialState } from '@/game/engine';
import TitleScreen from '@/screens/TitleScreen';
import IntroScreen from '@/screens/IntroScreen';
import GameScreen from '@/screens/GameScreen';
import EndingScreen from '@/screens/EndingScreen';
import ScenarioSelector from '@/screens/ScenarioSelector';

type Screen = 'title' | 'selector' | 'intro' | 'game' | 'ending';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [currentScenario, setCurrentScenario] = useState<ScenarioData | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [hasSave, setHasSave] = useState(false);

  // Load existing save on mount
  useEffect(() => {
    const s = loadGame();
    setHasSave(!!s && s.started && !s.finished);
    if (s && s.scenarioId) {
      // Try to load the scenario data
      import('@/game/scenario/loader').then(({ fetchScenario }) => {
        fetchScenario(s.scenarioId!).then(result => {
          if (result.success && result.data) {
            setCurrentScenario(result.data);
            setState(s);
          }
        });
      });
    }
  }, []);

  // Auto-save when state changes
  useEffect(() => {
    if (state?.started) {
      saveGame(state);
    }
  }, [state]);

  const startNew = () => {
    setScreen('selector');
  };

  const selectScenario = (scenarioId: string, data: ScenarioData) => {
    clearSave(scenarioId);
    const initialState = createInitialState(data);
    setCurrentScenario(data);
    setState(initialState);
    setScreen('intro');
  };

  const continueGame = () => {
    const s = loadGame();
    if (s && s.scenarioId) {
      import('@/game/scenario/loader').then(({ fetchScenario }) => {
        fetchScenario(s.scenarioId!).then(result => {
          if (result.success && result.data) {
            setCurrentScenario(result.data);
            setState(s);
            setScreen('game');
          }
        });
      });
    }
  };

  const doneIntro = () => {
    setState(s => s ? ({ ...s, introRead: true }) : null);
    setScreen('game');
  };

  const finishGame = (won: boolean) => {
    setState(s => s ? ({ ...s, finished: true, won }) : null);
    setScreen('ending');
  };

  const restart = () => {
    if (currentScenario?.scenario.id) {
      clearSave(currentScenario.scenario.id);
    }
    setCurrentScenario(null);
    setState(null);
    setHasSave(false);
    setScreen('title');
  };

  const backToTitle = () => {
    setScreen('title');
  };

  return (
    <>
      <div className="app-root">
        {screen === 'title' && (
          <TitleScreen 
            onNew={startNew} 
            onContinue={continueGame} 
            hasSave={hasSave}
          />
        )}
        {screen === 'selector' && (
          <ScenarioSelector 
            onSelect={selectScenario}
            onBack={backToTitle}
          />
        )}
        {screen === 'intro' && currentScenario && (
          <IntroScreen onDone={doneIntro} scenario={currentScenario} />
        )}
        {screen === 'game' && currentScenario && state && (
          <GameScreen 
            state={state} 
            setState={setState} 
            onFinish={finishGame} 
            onRestart={restart}
            scenario={currentScenario}
          />
        )}
        {screen === 'ending' && state && (
          <EndingScreen 
            state={state} 
            onRestart={restart}
            scenario={currentScenario}
          />
        )}
      </div>
      <Toaster position="top-center" />
    </>
  );
}
