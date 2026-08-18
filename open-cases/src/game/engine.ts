/**
 * OPEN CASES - Game Engine
 * 
 * Core game logic for scenario-based detective gameplay.
 * Supports multiple scenarios loaded from JSON files.
 */

import type { GameState, DialogueNode } from './types';
import type { ScenarioData, Location, Clue, Character } from './scenario/schema';
import { getLocationById, getClueById, getCharacterById } from './scenario/loader';

const SAVE_KEY_PREFIX = 'open-cases-scenario-';

/**
 * Gets the save key for a specific scenario
 */
function getSaveKey(scenarioId: string) {
  return `${SAVE_KEY_PREFIX}${scenarioId}-v1`;
}

/**
 * Creates initial game state for a scenario
 */
export function createInitialState(scenario: ScenarioData): GameState {
  const initialLocations = scenario.locations.filter(l => l.initial).map(l => l.id);
  
  return {
    started: false,
    introRead: false,
    finished: false,
    won: false,
    discoveredLocationIds: initialLocations,
    foundClueIds: [],
    questionedCharacterIds: [],
    completedActionIds: [],
    timelineEventIds: [],
    notes: '',
    selectedTab: 'case',
    selectedLocationId: initialLocations[0] || null,
    mapMode: 'satellite',
    scenarioId: scenario.scenario.id,
    dialogueFlags: [],
    triggeredEvents: [],
    unlockedKeywords: [],
  };
}

/**
 * Loads game state for a specific scenario
 */
export function loadGame(scenarioId?: string): GameState | null {
  try {
    const key = scenarioId ? getSaveKey(scenarioId) : 'free-detective-case-001-v1';
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as GameState : null;
  } catch {
    return null;
  }
}

/**
 * Saves game state for a specific scenario
 */
export function saveGame(state: GameState) {
  try {
    const key = state.scenarioId ? getSaveKey(state.scenarioId) : 'free-detective-case-001-v1';
    localStorage.setItem(key, JSON.stringify(state));
  } catch {}
}

/**
 * Clears save for a specific scenario
 */
export function clearSave(scenarioId?: string) {
  try {
    const key = scenarioId ? getSaveKey(scenarioId) : 'free-detective-case-001-v1';
    localStorage.removeItem(key);
  } catch {}
}

/**
 * Discovers new locations based on collected clues
 */
export function discoverFromClues(state: GameState, scenario: ScenarioData): GameState {
  const next = { ...state, discoveredLocationIds: [...state.discoveredLocationIds] };
  const found = new Set(next.foundClueIds);
  
  // Check each location's requirements
  for (const location of scenario.locations) {
    if (next.discoveredLocationIds.includes(location.id)) continue;
    
    // Check if location has clue requirements
    const requiresClueIds = location.clueIds || [];
    if (requiresClueIds.length > 0 && requiresClueIds.every(id => found.has(id))) {
      next.discoveredLocationIds.push(location.id);
    }
  }
  
  return next;
}

/**
 * Performs an action at a location
 */
export function performAction(
  state: GameState, 
  scenario: ScenarioData,
  locationId: string, 
  actionId: string
): GameState {
  const location = getLocationById(scenario, locationId);
  const action = location?.actions.find(a => a.id === actionId);
  
  if (!location || !action) return state;
  if (action.once && state.completedActionIds.includes(actionId)) return state;
  if (action.requiresClueIds?.some(id => !state.foundClueIds.includes(id))) return state;
  
  const next: GameState = {
    ...state,
    foundClueIds: [...new Set([...state.foundClueIds, ...action.clueIds])],
    completedActionIds: action.once 
      ? [...state.completedActionIds, actionId] 
      : state.completedActionIds,
    questionedCharacterIds: action.characterId && !state.questionedCharacterIds.includes(action.characterId)
      ? [...state.questionedCharacterIds, action.characterId]
      : state.questionedCharacterIds,
  };
  
  return discoverFromClues(next, scenario);
}

/**
 * Calculates score based on collected clues and final answers
 */
export function calculateScore(state: GameState, answers: any, scenario: ScenarioData): number {
  if (!answers || !scenario.solution) return 0;
  
  let score = 0;
  
  // Person accusation (35 points)
  if (answers.person === scenario.solution.culpritCharacterId) {
    score += 35;
  }
  
  // Motive (25 points)
  if (answers.motive && scenario.solution.motiveKeywords.includes(answers.motive)) {
    score += 25;
  }
  
  // Method (20 points)
  if (answers.method && scenario.solution.methodKeywords.includes(answers.method)) {
    score += 20;
  }
  
  // Location (20 points)
  if (answers.location === scenario.solution.keyLocationId) {
    score += 20;
  }
  
  // Bonus for critical clues found (up to 10 points)
  const criticalClues = scenario.clues.filter(c => c.importance === 'critical');
  const foundCritical = state.foundClueIds.filter(id => 
    criticalClues.some(c => c.id === id)
  ).length;
  
  score += Math.min(10, foundCritical * 1.5);
  
  return Math.min(100, Math.round(score));
}

/**
 * Checks if an action is available
 */
export function isActionAvailable(
  state: GameState,
  scenario: ScenarioData,
  locationId: string,
  actionId: string
): boolean {
  const location = getLocationById(scenario, locationId);
  const action = location?.actions.find(a => a.id === actionId);
  
  if (!action) return false;
  if (action.once && state.completedActionIds.includes(actionId)) return false;
  if (action.requiresClueIds?.some(id => !state.foundClueIds.includes(id))) return false;
  
  return true;
}

/**
 * Gets all available characters at a location
 */
export function getCharactersAtLocation(scenario: ScenarioData, locationId: string): Character[] {
  const location = getLocationById(scenario, locationId);
  if (!location) return [];
  
  return location.characterIds
    .map(id => getCharacterById(scenario, id))
    .filter((c): c is Character => c !== undefined);
}

/**
 * Gets all found clues
 */
export function getFoundClues(state: GameState, scenario: ScenarioData): Clue[] {
  return state.foundClueIds
    .map(id => getClueById(scenario, id))
    .filter((c): c is Clue => c !== undefined);
}
