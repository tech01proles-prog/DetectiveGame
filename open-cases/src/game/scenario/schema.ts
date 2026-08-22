/**
 * OPEN CASES - Scenario Schema Definition
 * 
 * This file defines the TypeScript interfaces for the JSON scenario format.
 * Use this as a reference when creating new detective scenarios.
 * 
 * A complete scenario consists of:
 * 1. A JSON file following this schema
 * 2. Image assets referenced by ID (stored in /public/scenarios/{scenario-id}/)
 */

export interface Scenario {
  /** Unique identifier for the scenario (e.g., "case-001") */
  id: string;
  /** Display title of the scenario */
  title: string;
  /** City/setting where the scenario takes place */
  city: string;
  /** Year the scenario is set in */
  year: number;
  /** Estimated playtime (e.g., "90–120 минут") */
  duration: string;
  /** Number of players (e.g., "1–6 игроков") */
  players: string;
  /** Difficulty level (e.g., "Лёгкая", "Средняя", "Сложная") */
  difficulty: string;
  /** Brief premise describing the case */
  premise: string;
  /** Opening narrative text shown at the start */
  opening: string;
}

export interface Character {
  /** Unique character ID (e.g., "maya", "elena") */
  id: string;
  /** Full name */
  name: string;
  /** Age in years */
  age: number;
  /** Role in the story (e.g., "ученица Lincoln High School") */
  role: string;
  /** Relationship to the main case (e.g., "Пропавшая", "Мать пропавшей") */
  relation: string;
  /** Brief summary of the character's background */
  summary: string;
  /** A characteristic quote from the character */
  quote: string;
  /** Portrait image ID (references an image in the scenario's image folder) */
  portrait: string;
  /** Optional: Location ID where this character can be found */
  locationId?: string;
  /** Character status in the investigation */
  status: 'missing' | 'witness' | 'suspect' | 'cleared';
  /** Optional: Character's alibi statement */
  alibi?: string;
  /** Optional: Potential motive */
  motive?: string;
  /** Optional: Hidden secret */
  secret?: string;
  /** Optional: Initial suspicion level (0-100) */
  suspectLevel?: number;
  /** Optional: Base trust level for this character (0-100) */
  baseTrust?: number;
  /** Optional: Dialogue nodes available only with high trust */
  highTrustDialogueIds?: string[];
  /** Optional: Characters this person is connected to */
  connections?: string[];
}

export interface Clue {
  /** Unique clue ID (e.g., "clue_phone", "clue_photo") */
  id: string;
  /** Title of the clue */
  title: string;
  /** Type of clue (e.g., "предмет", "фотография", "документ", "сообщения", "видео", "наблюдение", "карта", "показание") */
  type: string;
  /** Brief description visible in the clue list */
  description: string;
  /** Detailed information revealed when examining the clue */
  detail: string;
  /** Location ID where this clue is found */
  locationId: string;
  /** Importance level affecting scoring and progression */
  importance: 'critical' | 'important' | 'context';
  /** Array of character IDs related to this clue */
  relatedCharacters: string[];
  /** Array of clue IDs that this clue connects to */
  relatedClues: string[];
  /** Context describing when/how this clue was found */
  foundWhen: string;
  /** Optional: If true, this clue is a false lead (red herring) that does not contribute to solving the case */
  isRedHerring?: boolean;
  /** Optional: If true, this is a forged/fake document */
  isFalseDocument?: boolean;
  /** Optional: Document texture type for visual styling */
  documentTexture?: 'old_paper' | 'new_paper' | 'photo' | 'receipt' | 'official';
  /** Optional: Text for document stamp (e.g., "CONFIDENTIAL", "FAKE") */
  stampText?: string;
  /** Optional: Color of the stamp (e.g., "#dc2626" for red) */
  stampColor?: string;
  /** Optional: Time window when this clue is available (start time in minutes from game start) */
  availableFrom?: number;
  /** Optional: Time window when this clue expires (end time in minutes from game start) */
  expiresAt?: number;
  /** Optional: Deductions this clue can be used in */
  usedInDeductions?: string[];
}

export interface LocationAction {
  /** Unique action ID within this location (e.g., "home_room", "school_records") */
  id: string;
  /** Display label for the action button */
  label: string;
  /** Description of what this action does */
  description: string;
  /** Array of clue IDs that will be discovered by performing this action */
  clueIds: string[];
  /** Optional: Character ID involved in this action (triggers dialogue) */
  characterId?: string;
  /** Optional: Array of clue IDs required before this action can be performed */
  requiresClueIds?: string[];
  /** Optional: If true, action can only be performed once */
  once?: boolean;
  /** Optional: Event flag triggered by this action (for branching logic) */
  event?: string;
  /** Optional: Keywords that must be present in player notes to unlock alternative outcomes */
  requiresKeywords?: string[];
  /** Optional: Alternative action ID if keywords match (for branching) */
  alternateOutcome?: string;
}

export interface Location {
  /** Unique location ID (e.g., "bennett_home", "lincoln_school") */
  id: string;
  /** Display title */
  title: string;
  /** Subtitle or tagline */
  subtitle: string;
  /** Full description of the location */
  description: string;
  /** Latitude coordinate on the map (precise, meaningful placement) */
  lat: number;
  /** Longitude coordinate on the map (precise, meaningful placement) */
  lng: number;
  /** Address text for display */
  address: string;
  /** Background image ID for this location */
  image: string;
  /** Category (e.g., "Жильё", "Образование", "Бизнес", "Торговля", "Сервис", "Медиа", "Склад") */
  category: string;
  /** If true, location is available from the start */
  initial: boolean;
  /** If true, location is currently discoverable/accessible */
  discovered: boolean;
  /** Optional: Reason why location is locked (shown to player) */
  lockedReason?: string;
  /** Array of clue IDs initially available at this location */
  clueIds: string[];
  /** Array of character IDs present at this location */
  characterIds: string[];
  /** Array of actions available at this location */
  actions: LocationAction[];
  /** Optional: Custom coordinates for stylized map (x, y as percentages 0-100 from top-left). 
   * Used when scenario has a custom background image. If not provided, auto-generated based on template. */
  coordinates?: { x: number; y: number };
}

export interface TimelineEvent {
  /** Unique event ID (e.g., "t1", "t2") */
  id: string;
  /** Time string (e.g., "18:02", "Вечером") */
  time: string;
  /** Event title */
  title: string;
  /** Event description */
  text: string;
  /** Source of this information (e.g., "Журнал доступа", "Камера Reed Auto") */
  source: string;
  // New fields for interactive timeline
  /** Whether this event has been revealed to the player */
  revealed?: boolean;
  /** Whether this event contradicts other evidence */
  contradictory?: boolean;
  /** Related timeline event IDs */
  relatedEventIds?: string[];
}

export interface DialogueChoice {
  /** Unique choice ID within this dialogue node */
  id: string;
  /** Display text for the choice button */
  label: string;
  /** Optional: Result text shown after selecting this choice */
  text?: string;
  /** Optional: Array of clue IDs discovered through this choice */
  clueIds?: string[];
  /** Optional: Next dialogue node ID to transition to */
  nextId?: string | null;
  /** Optional: Additional note or context */
  note?: string;
  /** Optional: Keywords that must be present in player notes to show this choice */
  requiresKeywords?: string[];
  /** Optional: If true, this choice is only available if the keyword is NOT in notes */
  hideIfHasKeyword?: string | null;
  /** Optional: Tone/mood of the dialogue choice affecting NPC response */
  tone?: 'friendly' | 'aggressive' | 'cunning' | 'neutral';
  /** Optional: Clue IDs required to unlock this dialogue choice */
  requiresClueIds?: string[];
  /** Optional: Trust change caused by this dialogue choice (-50 to +50) */
  trustChange?: number;
  /** Optional: Minimum trust level required to see this choice (0-100) */
  minTrust?: number;
  /** Optional: Time cost in minutes for this dialogue choice */
  timeCost?: number;
}

export interface DialogueNode {
  /** Unique dialogue node ID (e.g., "home_mother_1", "school_daniel_1") */
  id: string;
  /** Character ID who is speaking */
  characterId: string;
  /** Title of this dialogue exchange */
  title: string;
  /** Eyebrow text (e.g., "ПЕРВИЧНОЕ ПОКАЗАНИЕ", "СВИДЕТЕЛЬ") */
  eyebrow: string;
  /** Introductory narrative text */
  intro: string;
  /** Array of dialogue lines spoken by the character */
  lines: string[];
  /** Array of choices available to the player */
  choices: DialogueChoice[];
  /** Optional: Keywords that must be present in player notes to unlock this dialogue node.
   * Empty array [] means always available. This enables multiple dialogue nodes for the same character
   * with different availability based on game progress. */
  requiresKeywords?: string[];
  /** Optional: If true, this dialogue node is hidden after being viewed once */
  hideAfterViewed?: boolean;
  /** Optional: Event flag triggered when this dialogue is viewed */
  triggersEvent?: string;
  /** Optional: If set, this dialogue node is hidden if the keyword exists in player notes */
  hideIfHasKeyword?: string | null;
  /** Optional: Minimum trust level required to access this dialogue (0-100) */
  minTrust?: number;
  /** Optional: Time cost in minutes for this dialogue interaction */
  timeCost?: number;
  /** Optional: NPC mood during this dialogue node */
  npcMood?: 'friendly' | 'neutral' | 'hostile' | 'suspicious';
}

export interface MapTemplate {
  /** Template ID (e.g., "seattle_downtown", "small_town", "industrial_zone", "suburban") */
  id: string;
  /** Display name */
  name: string;
  /** Description of when to use this template */
  description: string;
  /** Minimum zoom level for the map */
  minZoom: number;
  /** Maximum zoom level for the map */
  maxZoom: number;
  /** Map bounds as [[southWestLat, southWestLng], [northEastLat, northEastLng]] */
  bounds: [[number, number], [number, number]];
  /** Center point [lat, lng] for initial view */
  center: [number, number];
  /** Default zoom level */
  defaultZoom: number;
}

/**
 * Complete Scenario Data Structure
 * This is what gets loaded from the JSON file
 */
export interface ScenarioData {
  /** Scenario metadata */
  scenario: Scenario;
  /** Characters involved in the case */
  characters: Character[];
  /** Clues/evidence that can be discovered */
  clues: Clue[];
  /** Locations on the map */
  locations: Location[];
  /** Timeline of events */
  timeline: TimelineEvent[];
  /** Dialogue nodes for character interactions */
  dialogueNodes: Record<string, DialogueNode>;
  /** Map template ID to use (references a predefined template) */
  mapTemplateId: string;
  /** Optional: Custom map overrides if not using a template */
  customMap?: {
    minZoom: number;
    maxZoom: number;
    bounds: [[number, number], [number, number]];
    center: [number, number];
    defaultZoom: number;
  };
  /** Optional: Solution/answers for scoring */
  solution: {
    /** ID of the main culprit/organizer */
    culpritCharacterId: string;
    /** Key motive keyword(s) */
    motiveKeywords: string[];
    /** Key method keyword(s) */
    methodKeywords: string[];
    /** Critical location ID */
    keyLocationId: string;
    /** Minimum clues required to form final theory */
    minimumCluesRequired: number;
  };
  /** Optional: Keyword definitions for branching logic */
  keywordDefinitions?: {
    /** Keywords that trigger specific game states */
    [keyword: string]: {
      description: string;
      triggersEvent?: string;
      unlocksLocations?: string[];
      unlocksDialogue?: string[];
    };
  };
  /** Optional: Predefined deductions for the scenario */
  deductions?: Array<{
    id: string;
    title: string;
    description: string;
    requiredClueIds: string[];
    resultText: string;
    relatedCharacterIds?: string[];
    isCorrect: boolean;
  }>;
  /** Optional: Time pressure settings */
  timePressure?: {
    enabled: boolean;
    totalTime: number; // Total game time in minutes
    criticalEvents: Array<{ time: number; eventId: string; description: string }>;
  };
  /** Optional: Atmospheric effects settings for immersive gameplay */
  atmosphere?: {
    enabled: boolean;
    weatherEffects: Array<{
      type: 'rain' | 'fog' | 'snow' | 'wind' | 'storm';
      intensity: number; // 0-1
      startTime?: number; // Game time in minutes when effect starts
      endTime?: number; // Game time in minutes when effect ends
      description?: string;
    }>;
    lightingChanges: Array<{
      timeRange: [number, number]; // Start and end time in minutes
      brightness: number; // 0-1
      colorFilter?: string; // CSS color filter (e.g., "sepia(0.3)", "hue-rotate(45deg)")
      description?: string;
    }>;
    ambientSounds?: Array<{
      id: string;
      type: 'city' | 'nature' | 'industrial' | 'interior' | 'weather';
      volume: number; // 0-1
      conditions?: string[]; // Location IDs or time ranges when sound plays
    }>;
  };
  /** Optional: Dynamic news feed settings for reactive media coverage */
  newsFeed?: {
    enabled: boolean;
    articles: Array<{
      id: string;
      headline: string;
      summary: string;
      fullText: string;
      triggerEventId?: string; // Event that triggers this article
      triggerClueIds?: string[]; // Clues that trigger this article
      publishedAtTime?: number; // Game time in minutes when article is published
      source: string;
      tone: 'positive' | 'neutral' | 'negative' | 'sensational';
      relatedCharacterIds?: string[];
      relatedClueIds?: string[];
      impactOnReputation?: number; // -20 to +20
      unlocksLocations?: string[];
      unlocksDialogue?: string[];
    }>;
  };
}
