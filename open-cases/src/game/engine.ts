/**
 * OPEN CASES - Game Engine
 * 
 * Core game logic for scenario-based detective gameplay.
 * Supports multiple scenarios loaded from JSON files.
 */

import type { GameState, DialogueNode } from './types';
import type { ScenarioData, Location, Clue, Character } from './scenario/schema';
import { getLocationById, getClueById, getCharacterById, getDialogueNode } from './scenario/loader';

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
    mapMode: 'scheme',
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
  
  // Block if required clues are not found
  if (action.requiresClueIds?.some(id => !state.foundClueIds.includes(id))) return state;
  
  // For dialogue actions: always allow re-interrogation, but only add character to questioned list once
  const isDialogueAction = action.characterId !== undefined;
  
  const next: GameState = {
    ...state,
    foundClueIds: [...new Set([...state.foundClueIds, ...action.clueIds])],
    // Only mark as completed if action.once is true AND it's not a dialogue action
    completedActionIds: (action.once && !isDialogueAction)
      ? [...new Set([...state.completedActionIds, actionId])] 
      : state.completedActionIds,
    questionedCharacterIds: action.characterId && !state.questionedCharacterIds.includes(action.characterId)
      ? [...new Set([...state.questionedCharacterIds, action.characterId])]
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
 * Checks if an action is available (allowing re-interrogation)
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
  // Only block if action.once is true AND already completed
  if (action.once && state.completedActionIds.includes(actionId)) return false;
  // Block if required clues are not found
  if (action.requiresClueIds?.some(id => !state.foundClueIds.includes(id))) return false;
  
  return true;
}

/**
 * Gets dialogue node based on game state and character interaction history
 * Supports dynamic dialogue that changes based on progress, keywords, and previous interactions
 */
export function getDynamicDialogueNode(
  state: GameState,
  scenario: ScenarioData,
  characterId: string,
  locationId: string,
  actionId?: string
): DialogueNode | null {
  // First try to find a specific dialogue node for this action
  if (actionId) {
    const pattern = `${locationId}_${characterId}_`;
    const allNodesForChar = Object.entries(scenario.dialogueNodes)
      .filter(([, node]) => node.characterId === characterId)
      .map(([, node]) => node);
    
    // Find nodes that match the action pattern
    let matchingNodes = allNodesForChar.filter(node => {
      const nodeId = node.id;
      return nodeId.startsWith(pattern) || nodeId === actionId || nodeId.startsWith(`${actionId}_`);
    });
    
    // If no exact match, find any node for this character at this location
    if (matchingNodes.length === 0) {
      matchingNodes = allNodesForChar.filter(node => {
        const nodeId = node.id;
        return nodeId.startsWith(`${locationId}_${characterId}_`);
      });
    }
    
    if (matchingNodes.length === 0) return null;
    
    // Sort by node number (e.g., _1, _2, _3)
    matchingNodes.sort((a, b) => {
      const aNum = parseInt(a.id.split('_').pop() || '0');
      const bNum = parseInt(b.id.split('_').pop() || '0');
      return aNum - bNum;
    });
    
    // Filter by keyword requirements
    const playerNotes = state.notes || '';
    const availableNodes = matchingNodes.filter((node: DialogueNode) => {
      if (!node.requiresKeywords || node.requiresKeywords.length === 0) return true;
      return node.requiresKeywords.every((kw: string) => 
        playerNotes.toLowerCase().includes(kw.toLowerCase())
      );
    });
    
    // Filter out nodes already viewed if hideAfterViewed is set
    const viewedNodeIds = state.dialogueFlags?.filter(f => f.startsWith('viewed_')) || [];
    const notYetViewed = availableNodes.filter(node => {
      if (node.hideAfterViewed && viewedNodeIds.includes(`viewed_${node.id}`)) {
        return false;
      }
      return true;
    });
    
    // Return the first available node, or fall back to the last one
    return (notYetViewed.length > 0 ? notYetViewed : availableNodes)[0] || matchingNodes[matchingNodes.length - 1];
  }
  
  // Legacy behavior: find by location and character
  const pattern = `${locationId}_${characterId}_`;
  const matchingNodes = Object.entries(scenario.dialogueNodes)
    .filter(([id]) => id.startsWith(pattern))
    .map(([, node]) => node);
  
  if (matchingNodes.length === 0) return null;
  
  // Sort by node number
  matchingNodes.sort((a, b) => {
    const aNum = parseInt(a.id.split('_').pop() || '0');
    const bNum = parseInt(b.id.split('_').pop() || '0');
    return aNum - bNum;
  });
  
  // Check if player has asked about specific topics (via dialogueFlags)
  const askedTopics = state.dialogueFlags || [];
  
  // Filter by keyword requirements
  const playerNotes = state.notes || '';
  const availableNodes = matchingNodes.filter((node: DialogueNode) => {
    if (!node.requiresKeywords || node.requiresKeywords.length === 0) return true;
    return node.requiresKeywords.every((kw: string) => 
      playerNotes.toLowerCase().includes(kw.toLowerCase())
    );
  });
  
  // Return the first unasked node, or the last one if all have been asked
  const nextNode = availableNodes.find(node => {
    const nodeId = node.id;
    return !askedTopics.some(flag => flag.includes(nodeId));
  });
  
  return nextNode || matchingNodes[matchingNodes.length - 1];
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
