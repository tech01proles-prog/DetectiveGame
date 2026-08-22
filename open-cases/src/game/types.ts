export type Screen = 'title' | 'selector' | 'intro' | 'game' | 'ending';
export type MapMode = 'satellite' | 'scheme';
export type Tab = 'case' | 'people' | 'board' | 'clues' | 'notes' | 'timeline';
export type Importance = 'critical' | 'important' | 'context';

// Map location for stylized map
export interface MapLocation {
  id: string;
  name: string;
  x: number; // X coordinate on stylized map (0-800)
  y: number; // Y coordinate on stylized map (0-400)
  icon?: string;
}

// Map template types for stylized maps
export type GameMapTemplate = 'small_town' | 'city_district' | 'industrial_zone' | 'countryside';

export interface Character { 
  id:string; 
  name:string; 
  age:number; 
  role:string; 
  relation:string; 
  summary:string; 
  quote:string; 
  portrait:string; 
  locationId?:string; 
  status:'missing'|'witness'|'suspect'|'cleared';
  // New fields for suspect profile
  alibi?: string; // Character's alibi statement
  motive?: string; // Potential motive
  secret?: string; // Hidden secret
  suspectLevel?: number; // 0-100 suspicion level
}
export interface Clue { 
  id:string; 
  title:string; 
  type:string; 
  description:string; 
  detail:string; 
  locationId:string; 
  importance:Importance; 
  relatedCharacters:string[]; 
  relatedClues:string[]; 
  foundWhen:string;
  isRedHerring?: boolean; // Whether this clue is a false lead (red herring)
  isFalseDocument?: boolean; // Whether this is a forged/fake document
  documentTexture?: 'old_paper' | 'new_paper' | 'photo' | 'receipt' | 'official'; // Document texture type for visual styling
  stampText?: string; // Text for document stamp (e.g., "CONFIDENTIAL", "FAKE")
  stampColor?: string; // Color of the stamp (e.g., "#dc2626" for red)
}
export interface LocationAction { id:string; label:string; description:string; clueIds:string[]; characterId?:string; requiresClueIds?:string[]; once?:boolean; event?:string; }
export interface Location { 
  id:string; 
  title:string; 
  subtitle:string; 
  description:string; 
  lat:number; 
  lng:number; 
  address:string; 
  image:string; 
  category:string; 
  initial:boolean; 
  discovered:boolean; 
  lockedReason?:string; 
  clueIds:string[]; 
  characterIds:string[]; 
  actions:LocationAction[]; 
  coordinates?:{x:number;y:number};
  // New fields for dynamic locations
  hidden?: boolean; // Whether location is hidden until certain conditions are met
  unlockClueIds?: string[]; // Clue IDs required to unlock/reveal this location
  stateChanges?: { clueId: string; newState: string }[]; // State changes triggered by clues
}
export interface TimelineEvent { 
  id:string; 
  time:string; 
  title:string; 
  text:string; 
  source:string;
  // New fields for interactive timeline
  revealed?: boolean; // Whether this event has been revealed to the player
  contradictory?: boolean; // Whether this event contradicts other evidence
  relatedEventIds?: string[]; // Related timeline events
}
export interface DialogueChoice { 
  id:string; 
  label:string; 
  text?:string; 
  clueIds?:string[]; 
  nextId?:string|null; 
  note?:string; 
  requiresKeywords?:string[]; 
  hideIfHasKeyword?:string|null;
  tone?: 'friendly' | 'aggressive' | 'cunning' | 'neutral'; // Tone/mood of the dialogue choice
  requiresClueIds?: string[]; // Clue IDs required to unlock this dialogue choice
}
export interface DialogueNode { 
  id:string; 
  characterId:string; 
  title:string; 
  eyebrow:string; 
  intro:string; 
  lines:string[]; 
  choices:DialogueChoice[]; 
  requiredFlags?:string[]; 
  requiresKeywords?:string[]; 
  hideAfterViewed?:boolean; 
  triggersEvent?:string; 
  hideIfHasKeyword?:string|null;
  npcMood?: 'friendly' | 'neutral' | 'hostile' | 'suspicious'; // Current NPC mood state
}
export interface GameState { 
  started:boolean;
  introRead:boolean;
  finished:boolean;
  won:boolean;
  discoveredLocationIds:string[];
  foundClueIds:string[];
  questionedCharacterIds:string[];
  completedActionIds:string[];
  timelineEventIds:string[];
  notes:string;
  selectedTab:Tab;
  selectedLocationId:string|null;
  mapMode:MapMode;
  scenarioId?: string;
  finalAnswers?:{person:string;motive:string;method:string;location:string};
  score?:number;
  dialogueFlags?:string[];
  triggeredEvents?: string[];
  unlockedKeywords?: string[];
  viewedDialogueNodeIds?: string[]; // Track viewed dialogue nodes to mark them as inactive
  investigationBoard?: InvestigationBoard; // Board state for clues board tab
  npcMoods?: Record<string, 'friendly' | 'neutral' | 'hostile' | 'suspicious'>; // Track NPC moods by character ID
  // New fields for enhanced gameplay
  characterTrust?: Record<string, number>; // Trust level (0-100) for each character
  gameTime?: number; // Current game time in minutes from start
  deductions?: Deduction[]; // Player-made deductions connecting clues
  revealedTimelineEvents?: string[]; // Timeline events revealed through deduction
  characterProfiles?: CharacterProfile[]; // Auto-updating character dossiers
  // Atmospheric effects state
  activeWeatherEffects?: Array<{type: string; intensity: number; active: boolean}>;
  currentLighting?: {brightness: number; colorFilter?: string};
}

// Investigation board types for interactive clues board
export interface BoardNode {
  id: string;
  type: 'clue' | 'photo' | 'note' | 'character';
  title: string;
  content: string;
  x: number;
  y: number;
  color?: string;
  relatedIds?: string[];
}

export interface BoardConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
  color?: string;
}

export interface InvestigationBoard {
  nodes: BoardNode[];
  connections: BoardConnection[];
  selectedTool: 'select' | 'connect' | 'add';
}

// New types for enhanced gameplay features

// Deduction system - connecting clues to form new facts
export interface Deduction {
  id: string;
  title: string;
  description: string;
  requiredClueIds: string[]; // Clues needed to make this deduction
  resultText: string; // New fact discovered through deduction
  relatedCharacterIds?: string[]; // Characters involved in this deduction
  isCorrect?: boolean; // Whether this deduction is correct (for scoring)
  discoveredAt?: number; // Game time when deduction was made
}

// Character profile with auto-updating information
export interface CharacterProfile {
  characterId: string;
  photo: string;
  basicInfo: {
    name: string;
    age: number;
    role: string;
  };
  alibi?: string; // Character's stated alibi
  alibiVerified?: boolean; // Whether alibi has been confirmed
  motive?: string; // Potential motive discovered
  secrets?: string[]; // Discovered secrets
  connections: string[]; // Other character IDs this person is connected to
  suspicionLevel: number; // 0-100 based on evidence
  statusHistory: Array<{
    time: number;
    status: 'witness' | 'suspect' | 'cleared' | 'missing';
    reason: string;
  }>;
  trustLevel: number; // 0-100, affects dialogue options
  lastInteraction?: number; // Game time of last interaction
}

// Dynamic time system
export interface GameTime {
  minutes: number; // Minutes elapsed since game start
  displayTime: string; // Formatted time string (e.g., "20:45")
  timePressure?: boolean; // Whether time pressure is active
  eventsByTime: Record<number, string[]>; // Events triggered at specific times
}

// Trust system for character relationships
export interface TrustChange {
  characterId: string;
  change: number; // Positive or negative trust change
  reason: string;
  timestamp: number;
}

export type GameStateWithNull = GameState | null;
