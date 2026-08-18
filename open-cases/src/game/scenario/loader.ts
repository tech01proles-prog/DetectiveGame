/**
 * OPEN CASES - Scenario Loader
 * 
 * Loads and validates scenario JSON files.
 * Provides functions to parse, validate, and access scenario data.
 */

import type { ScenarioData, Character, Clue, Location, TimelineEvent, DialogueNode } from './schema';
import { getMapTemplate } from '../maps/templates';

/**
 * Validates that a loaded scenario has all required fields
 */
export function validateScenario(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.scenario) errors.push('Missing "scenario" object');
  if (!data.characters || !Array.isArray(data.characters)) errors.push('Missing "characters" array');
  if (!data.clues || !Array.isArray(data.clues)) errors.push('Missing "clues" array');
  if (!data.locations || !Array.isArray(data.locations)) errors.push('Missing "locations" array');
  if (!data.timeline || !Array.isArray(data.timeline)) errors.push('Missing "timeline" array');
  if (!data.dialogueNodes || typeof data.dialogueNodes !== 'object') errors.push('Missing "dialogueNodes" object');
  if (!data.mapTemplateId) errors.push('Missing "mapTemplateId"');

  // Validate scenario fields
  if (data.scenario) {
    const requiredScenarioFields = ['id', 'title', 'city', 'year', 'duration', 'players', 'difficulty', 'premise', 'opening'];
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

  // Validate clue IDs are unique and locationIds exist
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

  // Validate map template exists
  if (data.mapTemplateId && !getMapTemplate(data.mapTemplateId)) {
    errors.push(`Unknown map template: ${data.mapTemplateId}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Loads a scenario from JSON string
 */
export function loadScenarioFromJson(jsonString: string): { success: boolean; data?: ScenarioData; errors?: string[] } {
  try {
    const parsed = JSON.parse(jsonString);
    const validation = validateScenario(parsed);
    
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    return { success: true, data: parsed as ScenarioData };
  } catch (e) {
    return { 
      success: false, 
      errors: [`Failed to parse JSON: ${(e as Error).message}`] 
    };
  }
}

/**
 * Fetches a scenario from the public folder
 */
export async function fetchScenario(scenarioId: string): Promise<{ success: boolean; data?: ScenarioData; errors?: string[] }> {
  try {
    const response = await fetch(`/scenarios/${scenarioId}/scenario.json`);
    if (!response.ok) {
      return { success: false, errors: [`Scenario not found: ${scenarioId}`] };
    }
    const json = await response.json();
    return loadScenarioFromJson(JSON.stringify(json));
  } catch (e) {
    return { 
      success: false, 
      errors: [`Failed to load scenario: ${(e as Error).message}`] 
    };
  }
}

/**
 * Gets a character by ID from scenario data
 */
export function getCharacterById(data: ScenarioData, id: string): Character | undefined {
  return data.characters.find(c => c.id === id);
}

/**
 * Gets a clue by ID from scenario data
 */
export function getClueById(data: ScenarioData, id: string): Clue | undefined {
  return data.clues.find(c => c.id === id);
}

/**
 * Gets a location by ID from scenario data
 */
export function getLocationById(data: ScenarioData, id: string): Location | undefined {
  return data.locations.find(l => l.id === id);
}

/**
 * Gets a dialogue node by ID from scenario data
 */
export function getDialogueNode(data: ScenarioData, id: string): DialogueNode | undefined {
  return data.dialogueNodes[id];
}

/**
 * Checks if a keyword is present in player notes
 */
export function hasKeyword(notes: string, keyword: string): boolean {
  const normalizedNotes = notes.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  return normalizedNotes.includes(normalizedKeyword);
}

/**
 * Finds all keywords from a list that are present in notes
 */
export function findKeywords(notes: string, keywords: string[]): string[] {
  return keywords.filter(kw => hasKeyword(notes, kw));
}

/**
 * Resolves image URL for a scenario asset
 */
export function resolveImageUrl(scenarioId: string, imageId: string): string {
  // Image ID can be either a full URL or a relative path
  if (imageId.startsWith('http')) {
    return imageId;
  }
  return `/scenarios/${scenarioId}/${imageId}`;
}

/**
 * Creates initial game state for a scenario
 */
export function createInitialGameState(data: ScenarioData) {
  const initialLocations = data.locations.filter(l => l.initial).map(l => l.id);
  
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
  };
}
