import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import type { GameState } from '@/game/types';
import type { ScenarioData } from '@/game/scenario/schema';
import { loadGame, saveGame, clearSave, createInitialState } from '@/game/engine';
import { SAVE_KEY_PREFIX } from '@/game/engine';
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

  // Load existing save on mount - check for any scenario save
  useEffect(() => {
    // Helper to check if a save has meaningful progress
    const hasMeaningfulProgress = (parsed: any) => {
      if (!parsed) return false;
      // If game is finished, don't offer continue (should restart)
      if (parsed.finished) return false;
      // If started flag is true, definitely has progress
      if (parsed.started) return true;
      // Otherwise check for any meaningful progress
      return (
        parsed.introRead ||
        (parsed.discoveredLocationIds && parsed.discoveredLocationIds.length > 0) ||
        (parsed.foundClueIds && parsed.foundClueIds.length > 0) ||
        (parsed.questionedCharacterIds && parsed.questionedCharacterIds.length > 0) ||
        (parsed.completedActionIds && parsed.completedActionIds.length > 0)
      );
    };

    // First try to find any saved scenario by checking common keys
    let foundSave: GameState | null = null;
    let foundScenarioId: string | undefined = undefined;
    
    // Try to load from default key first (backward compatibility)
    const defaultSave = localStorage.getItem('free-detective-case-001-v1');
    if (defaultSave) {
      try {
        const parsed = JSON.parse(defaultSave);
        if (hasMeaningfulProgress(parsed)) {
          foundSave = parsed;
          foundScenarioId = parsed.scenarioId;
        }
      } catch {}
    }
    
    // If no default save, try to find scenario-specific saves
    if (!foundSave) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SAVE_KEY_PREFIX)) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || '');
            if (hasMeaningfulProgress(parsed)) {
              foundSave = parsed;
              foundScenarioId = parsed.scenarioId;
              break;
            }
          } catch {}
        }
      }
    }
    
    if (foundSave && foundScenarioId) {
      setHasSave(true);
      // Try to load the scenario data
      import('@/game/scenario/loader').then(({ fetchScenario }) => {
        fetchScenario(foundScenarioId!).then(result => {
          if (result.success && result.data) {
            setCurrentScenario(result.data);
            setState(foundSave);
          }
        });
      });
    } else {
      setHasSave(false);
    }
  }, []);

  // Auto-save when state changes (debounced in engine)
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
    // Helper to check if a save has meaningful progress
    const hasMeaningfulProgress = (parsed: any) => {
      if (!parsed) return false;
      // If game is finished, don't offer continue (should restart)
      if (parsed.finished) return false;
      // If started flag is true, definitely has progress
      if (parsed.started) return true;
      // Otherwise check for any meaningful progress
      return (
        parsed.introRead ||
        (parsed.discoveredLocationIds && parsed.discoveredLocationIds.length > 0) ||
        (parsed.foundClueIds && parsed.foundClueIds.length > 0) ||
        (parsed.questionedCharacterIds && parsed.questionedCharacterIds.length > 0) ||
        (parsed.completedActionIds && parsed.completedActionIds.length > 0)
      );
    };

    // Find any saved scenario
    let foundSave: GameState | null = null;
    let foundScenarioId: string | undefined = undefined;
    
    // Try default key first
    const defaultSave = localStorage.getItem('free-detective-case-001-v1');
    if (defaultSave) {
      try {
        const parsed = JSON.parse(defaultSave);
        if (hasMeaningfulProgress(parsed)) {
          foundSave = parsed;
          foundScenarioId = parsed.scenarioId;
        }
      } catch {}
    }
    
    // If no default save, search for scenario-specific saves
    if (!foundSave) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SAVE_KEY_PREFIX)) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || '');
            if (hasMeaningfulProgress(parsed)) {
              foundSave = parsed;
              foundScenarioId = parsed.scenarioId;
              break;
            }
          } catch {}
        }
      }
    }
    
    if (foundSave && foundScenarioId) {
      import('@/game/scenario/loader').then(({ fetchScenario }) => {
        fetchScenario(foundScenarioId!).then(result => {
          if (result.success && result.data) {
            setCurrentScenario(result.data);
            setState(foundSave);
            setScreen('game');
          } else {
            console.error('Failed to load scenario data');
            alert('Не удалось загрузить сценарий. Возможно, файл был удален.');
          }
        });
      }).catch(err => {
        console.error('Failed to load scenario module:', err);
        alert('Ошибка загрузки модуля сценария.');
      });
    } else {
      console.warn('No valid save found');
      alert('Сохранение не найдено или повреждено.');
      setHasSave(false);
    }
  };

  const doneIntro = () => {
    setState(s => s ? ({ ...s, introRead: true }) : null);
    setScreen('game');
  };

  const finishGame = (won: boolean) => {
    setState(s => {
      if (!s) return null;
      const newState = { ...s, finished: true, won };
      // Save immediately on game finish
      saveGame(newState, true);
      return newState;
    });
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
