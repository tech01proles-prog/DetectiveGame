/**
 * OPEN CASES - Modular Scenario Loader
 * 
 * Loads scenario data from modular JSON files.
 * Supports base modules (characters, locations) and scenario modules (clues, dialogues, events).
 */

import type { ScenarioData, Character, Clue, Location, TimelineEvent, DialogueNode } from './schema';

/**
 * Merges multiple module files into a complete scenario
 */
export async function loadModularScenario(scenarioId: string): Promise<{ success: boolean; data?: ScenarioData; errors?: string[] }> {
  try {
    // Load base module (characters and locations)
    const baseResponse = await fetch(`/scenarios/${scenarioId}/modules/base/characters_locations.json`);
    if (!baseResponse.ok) {
      return { success: false, errors: [`Base module not found for scenario: ${scenarioId}`] };
    }
    const baseData = await baseResponse.json();

    // Load scenario module (clues, dialogues, events)
    const scenarioResponse = await fetch(`/scenarios/${scenarioId}/modules/scenario/case_003_scenario.json`);
    if (!scenarioResponse.ok) {
      return { success: false, errors: [`Scenario module not found for scenario: ${scenarioId}`] };
    }
    const scenarioData = await scenarioResponse.json();

    // Merge modules into complete scenario
    const mergedScenario = mergeModules(baseData, scenarioData);

    // Validate merged scenario
    const validation = validateScenario(mergedScenario);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    return { success: true, data: mergedScenario as ScenarioData };
  } catch (e) {
    return {
      success: false,
      errors: [`Failed to load modular scenario: ${(e as Error).message}`]
    };
  }
}

/**
 * Merges base and scenario modules
 */
function mergeModules(base: any, scenario: any): any {
  return {
    ...base,
    ...scenario,
    // Ensure arrays are properly merged
    characters: base.characters || [],
    locations: base.locations || [],
    clues: scenario.clues || [],
    timeline: scenario.timeline || [],
    dialogueNodes: scenario.dialogueNodes || {},
    // Merge initial character locations from scenario module
    initialCharacterLocations: scenario.initialCharacterLocations || {},
    // Include movement schedule from scenario module
    characterMovementSchedule: scenario.characterMovementSchedule || [],
    // Include solution from scenario module
    solution: scenario.solution || {}
  };
}

/**
 * Validates that a loaded scenario has all required fields
 */
export function validateScenario(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.scenario) errors.push('Missing "scenario" object');
  if (!data.characters || !Array.isArray(data.characters)) errors.push('Missing "characters" array');
  if (data.clues === undefined || !Array.isArray(data.clues)) errors.push('Missing "clues" array');
  if (!data.locations || !Array.isArray(data.locations)) errors.push('Missing "locations" array');
  if (data.timeline === undefined || !Array.isArray(data.timeline)) errors.push('Missing "timeline" array');
  if (!data.dialogueNodes || typeof data.dialogueNodes !== 'object') errors.push('Missing "dialogueNodes" object');

  // Validate scenario fields
  if (data.scenario) {
    const requiredScenarioFields = ['id', 'title', 'city', 'year', 'duration', 'players', 'difficulty'];
    for (const field of requiredScenarioFields) {
      if (!(field in data.scenario)) {
        errors.push(`Missing scenario.${field}`);
      }
    }
  }

  // Validate character IDs are unique
  if (data.characters) {
    const charIds = new Set<string>();
    for (const c of data.characters) {
      if (!c.id) errors.push('Character missing "id"');
      if (charIds.has(c.id)) errors.push(`Duplicate character ID: ${c.id}`);
      charIds.add(c.id);
    }
  }

  // Validate clue IDs are unique
  if (data.clues) {
    const clueIds = new Set<string>();
    for (const c of data.clues) {
      if (!c.id) errors.push('Clue missing "id"');
      if (clueIds.has(c.id)) errors.push(`Duplicate clue ID: ${c.id}`);
      clueIds.add(c.id);
    }
  }

  // Validate location IDs are unique
  if (data.locations) {
    const locIds = new Set<string>();
    for (const l of data.locations) {
      if (!l.id) errors.push('Location missing "id"');
      if (locIds.has(l.id)) errors.push(`Duplicate location ID: ${l.id}`);
      locIds.add(l.id);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets character location at a specific game time
 */
export function getCharacterLocationAtTime(
  characterId: string,
  gameTime: number,
  initialLocations: Record<string, string>,
  movementSchedule: any[]
): string {
  const initialLocation = initialLocations[characterId];
  if (!initialLocation) return 'unknown';

  // Find movements for this character
  const characterMovements = movementSchedule.find(m => m.characterId === characterId);
  if (!characterMovements || !characterMovements.movements) {
    return initialLocation;
  }

  // Check each movement to see where character should be
  for (const movement of characterMovements.movements) {
    const startTime = movement.time;
    const endTime = startTime + (movement.duration || 60);
    
    if (gameTime >= startTime && gameTime < endTime) {
      return movement.locationId;
    }
  }

  return initialLocation;
}

/**
 * Creates initial game state for a modular scenario
 */
export function createInitialGameState(data: ScenarioData, initialCharacterLocations?: Record<string, string>) {
  const initialLocations = data.locations.filter(l => l.initial).map(l => l.id);
  
  // Apply initial character locations from scenario module
  const characterLocationMap: Record<string, string> = {};
  if (initialCharacterLocations) {
    Object.entries(initialCharacterLocations).forEach(([charId, locId]) => {
      characterLocationMap[charId] = locId;
    });
  }

  return {
    started: false,
    introRead: false,
    finished: false,
    won: false,
    discoveredLocationIds: initialLocations,
    foundClueIds: [] as string[],
    questionedCharacterIds: [] as string[],
    completedActionIds: [] as string[],
    timelineEventIds: [] as string[],
    notes: '',
    selectedTab: 'case' as const,
    selectedLocationId: initialLocations[0] || null,
    mapMode: 'satellite' as const,
    scenarioId: data.scenario.id,
    dialogueFlags: [] as string[],
    triggeredEvents: [] as string[],
    unlockedKeywords: [] as string[],
    characterTrust: {} as Record<string, number>,
    gameTime: 480, // Start at 8:00 AM (480 minutes from midnight)
    initialCharacterLocations: characterLocationMap,
  };
}
