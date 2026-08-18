/**
 * OPEN CASES - Deduction Engine
 * 
 * Handles the deduction system: connecting clues, presenting evidence to characters,
 * keyword detection, branching logic, and consequence tracking.
 */

import type { ScenarioData, Clue, Character, Location, DialogueNode } from './schema';
import { getCharacterById, getClueById, getLocationById, getDialogueNode, hasKeyword, findKeywords } from './loader';

/**
 * Represents a connection between two game elements
 */
export interface Connection {
  type: 'clue-character' | 'clue-clue' | 'character-location' | 'clue-location';
  sourceId: string;
  targetId: string;
  strength: number; // 0-1, how strong the connection is
  discovered: boolean;
}

/**
 * Player's current theory/hypothesis
 */
export interface Theory {
  id: string;
  title: string;
  connections: Connection[];
  confidence: number; // 0-1
  createdAt: number;
  lastModified: number;
}

/**
 * Result of presenting evidence to a character
 */
export interface EvidenceResult {
  success: boolean;
  newClues: string[];
  newDialogue?: DialogueNode;
  characterReaction: string;
  unlocksLocation?: string;
  triggersEvent?: string;
}

/**
 * Checks if two clues are related based on scenario data
 */
export function areCluesRelated(data: ScenarioData, clueId1: string, clueId2: string): boolean {
  const clue1 = getClueById(data, clueId1);
  const clue2 = getClueById(data, clueId2);
  
  if (!clue1 || !clue2) return false;
  
  // Check if they share related characters
  const sharedCharacters = clue1.relatedCharacters.filter(c => 
    clue2.relatedCharacters.includes(c)
  );
  if (sharedCharacters.length > 0) return true;
  
  // Check if they're explicitly linked
  if (clue1.relatedClues.includes(clueId2)) return true;
  if (clue2.relatedClues.includes(clueId1)) return true;
  
  // Check if they're from the same location
  if (clue1.locationId === clue2.locationId) return true;
  
  return false;
}

/**
 * Gets all connections for a specific clue
 */
export function getClueConnections(data: ScenarioData, clueId: string): Connection[] {
  const clue = getClueById(data, clueId);
  if (!clue) return [];
  
  const connections: Connection[] = [];
  
  // Connect to related characters
  for (const charId of clue.relatedCharacters) {
    connections.push({
      type: 'clue-character',
      sourceId: clueId,
      targetId: charId,
      strength: 0.8,
      discovered: true,
    });
  }
  
  // Connect to related clues
  for (const relatedClueId of clue.relatedClues) {
    connections.push({
      type: 'clue-clue',
      sourceId: clueId,
      targetId: relatedClueId,
      strength: 0.9,
      discovered: true,
    });
  }
  
  // Connect to location
  connections.push({
    type: 'clue-location',
    sourceId: clueId,
    targetId: clue.locationId,
    strength: 0.7,
    discovered: true,
  });
  
  return connections;
}

/**
 * Presents evidence to a character and returns the result
 */
export function presentEvidence(
  data: ScenarioData,
  characterId: string,
  clueId: string,
  playerNotes: string
): EvidenceResult {
  const character = getCharacterById(data, characterId);
  const clue = getClueById(data, clueId);
  
  if (!character || !clue) {
    return {
      success: false,
      newClues: [],
      characterReaction: 'Неверные данные.',
    };
  }
  
  // Check if this clue is related to the character
  const isRelated = clue.relatedCharacters.includes(characterId);
  
  // Check for keywords in notes that might unlock special responses
  const relevantKeywords: string[] = [];
  if (data.keywordDefinitions) {
    for (const [keyword, def] of Object.entries(data.keywordDefinitions)) {
      if (hasKeyword(playerNotes, keyword)) {
        relevantKeywords.push(keyword);
      }
    }
  }
  
  // Determine reaction based on relationship
  let reaction: string;
  let newClues: string[] = [];
  let unlocksLocation: string | undefined;
  let triggersEvent: string | undefined;
  let newDialogue: DialogueNode | undefined;
  
  if (isRelated) {
    // Character is connected to this clue - they should react strongly
    if (relevantKeywords.length > 0) {
      // Player has done their homework - get better response
      reaction = `Вы показываете ${clue.title}. ${character.name} явно нервничает - видно, что вы нашли что-то важное.`;
      
      // Grant access to additional clues
      const location = data.locations.find(l => l.characterIds.includes(characterId));
      if (location) {
        newClues = location.clueIds.filter(id => !newClues.includes(id));
      }
      
      // Maybe unlock a special dialogue
      const dialogueKey = `${characterId}_confronted_${clueId}`;
      newDialogue = getDialogueNode(data, dialogueKey);
      
      triggersEvent = `${characterId}_confronted`;
    } else {
      // Basic confrontation without preparation
      reaction = `Вы показываете ${clue.title}. ${character.name} отвечает уклончиво, но вы видите напряжение в их глазах.`;
    }
  } else {
    // Character not directly connected - might still get useful info
    reaction = `${character.name} изучает улику. "Интересно... Я не уверен, как это связано со мной."`;
    
    // Small chance to discover something new
    if (Math.random() > 0.7) {
      newClues = [clueId]; // Already known, but confirms connection
    }
  }
  
  return {
    success: isRelated,
    newClues,
    characterReaction: reaction,
    newDialogue,
    unlocksLocation,
    triggersEvent,
  };
}

/**
 * Calculates theory confidence based on collected evidence
 */
export function calculateTheoryConfidence(
  data: ScenarioData,
  foundClueIds: string[],
  theory: {
    person?: string;
    motive?: string;
    method?: string;
    location?: string;
  }
): number {
  let confidence = 0;
  const maxScore = 100;
  
  // Check person accusation (35 points)
  if (theory.person && theory.person === data.solution.culpritCharacterId) {
    confidence += 35;
  }
  
  // Check motive (25 points)
  if (theory.motive && data.solution.motiveKeywords.includes(theory.motive)) {
    confidence += 25;
  }
  
  // Check method (20 points)
  if (theory.method && data.solution.methodKeywords.includes(theory.method)) {
    confidence += 20;
  }
  
  // Check location (20 points)
  if (theory.location && theory.location === data.solution.keyLocationId) {
    confidence += 20;
  }
  
  return Math.min(100, confidence);
}

/**
 * Checks if player can form a final theory
 */
export function canFormTheory(data: ScenarioData, foundClueIds: string[]): boolean {
  return foundClueIds.length >= data.solution.minimumCluesRequired;
}

/**
 * Evaluates keyword-based branching for an action
 */
export function evaluateActionBranching(
  data: ScenarioData,
  locationId: string,
  actionId: string,
  playerNotes: string
): { actionId: string; modified: boolean } {
  const location = getLocationById(data, locationId);
  if (!location) return { actionId, modified: false };
  
  const action = location.actions.find(a => a.id === actionId);
  if (!action) return { actionId, modified: false };
  
  // Check if action has keyword requirements
  if (action.requiresKeywords && action.requiresKeywords.length > 0) {
    const matchedKeywords = findKeywords(playerNotes, action.requiresKeywords);
    
    if (matchedKeywords.length === action.requiresKeywords.length) {
      // All keywords present - use alternate outcome if available
      if (action.alternateOutcome) {
        return { actionId: action.alternateOutcome, modified: true };
      }
    }
  }
  
  return { actionId, modified: false };
}

/**
 * Creates a new theory/connection board entry
 */
export function createTheory(
  title: string,
  connections: Connection[]
): Theory {
  const now = Date.now();
  return {
    id: `theory_${now}`,
    title,
    connections,
    confidence: 0,
    createdAt: now,
    lastModified: now,
  };
}

/**
 * Updates theory confidence based on newly discovered clues
 */
export function updateTheoryConfidence(
  theory: Theory,
  newClueIds: string[],
  allFoundClueIds: string[]
): Theory {
  // Recalculate based on how many connected clues have been found
  const totalConnections = theory.connections.length;
  const discoveredConnections = theory.connections.filter(c => 
    allFoundClueIds.includes(c.sourceId) || allFoundClueIds.includes(c.targetId)
  ).length;
  
  const newConfidence = totalConnections > 0 
    ? (discoveredConnections / totalConnections) * 0.8 
    : 0;
  
  return {
    ...theory,
    confidence: Math.min(1, newConfidence),
    lastModified: Date.now(),
  };
}
