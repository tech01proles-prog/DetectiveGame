export type Screen = 'title' | 'selector' | 'intro' | 'game' | 'ending';
export type MapMode = 'satellite' | 'scheme';
export type Tab = 'case' | 'people' | 'clues' | 'notes' | 'timeline';
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

export interface Character { id:string; name:string; age:number; role:string; relation:string; summary:string; quote:string; portrait:string; locationId?:string; status:'missing'|'witness'|'suspect'|'cleared'; }
export interface Clue { id:string; title:string; type:string; description:string; detail:string; locationId:string; importance:Importance; relatedCharacters:string[]; relatedClues:string[]; foundWhen:string; }
export interface LocationAction { id:string; label:string; description:string; clueIds:string[]; characterId?:string; requiresClueIds?:string[]; once?:boolean; event?:string; }
export interface Location { id:string; title:string; subtitle:string; description:string; lat:number; lng:number; address:string; image:string; category:string; initial:boolean; discovered:boolean; lockedReason?:string; clueIds:string[]; characterIds:string[]; actions:LocationAction[]; coordinates?:{x:number;y:number}; }
export interface TimelineEvent { id:string; time:string; title:string; text:string; source:string; }
export interface DialogueChoice { id:string; label:string; text?:string; clueIds?:string[]; nextId?:string|null; note?:string; requiresKeywords?:string[]; hideIfHasKeyword?:string|null; }
export interface DialogueNode { id:string; characterId:string; title:string; eyebrow:string; intro:string; lines:string[]; choices:DialogueChoice[]; requiredFlags?:string[]; requiresKeywords?:string[]; hideAfterViewed?:boolean; triggersEvent?:string; hideIfHasKeyword?:string|null; }
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

export type GameStateWithNull = GameState | null;
