import {useMemo,useState,useEffect} from 'react';
import {BookOpen,ChevronRight,FileText,MessageSquare,NotebookPen,Search,Users,Clock3,Lock,Check,PanelRightClose,PanelRightOpen,Send,MapPin,Radio,Eye,Camera,FileSearch,CircleAlert,Repeat,StickyNote} from 'lucide-react';
import MapView from '@/game/MapView';
import {calculateScore,discoverFromClues,performAction,getDynamicDialogueNode,saveGame} from '@/game/engine';
import {resolveImageUrl} from '@/game/scenario/loader';
import type {DialogueNode,GameState,Tab,Location,Character,Clue,TimelineEvent,DialogueChoice,BoardNode,BoardConnection} from '@/game/types';
import type {ScenarioData} from '@/game/scenario/schema';

const tabs:{id:Tab|'board';label:string;icon:any}[]=[{id:'case',label:'Дело',icon:BookOpen},{id:'people',label:'Люди',icon:Users},{id:'board',label:'Доска',icon:StickyNote},{id:'clues',label:'Улики',icon:Search},{id:'notes',label:'Заметки',icon:NotebookPen},{id:'timeline',label:'Хронология',icon:Clock3}];

// Helper to get dialogue node ID for an action
const getActionDialogueId = (actionId: string, scenario: ScenarioData): string | undefined => {
  // Check if action ID maps to a dialogue node by convention (e.g., "home_mother" -> "home_mother_1")
  const potentialId = `${actionId}_1`;
  if (scenario.dialogueNodes[potentialId]) {
    return potentialId;
  }
  // Check character-based mapping
  for (const loc of scenario.locations) {
    const actions = loc.actions || [];
    for (const action of actions) {
      if (action.id === actionId && action.characterId) {
        // Look for dialogue nodes matching pattern: {locationId}_{characterId}_1
        const nodeId = `${loc.id}_${action.characterId}_1`;
        if (scenario.dialogueNodes[nodeId]) {
          return nodeId;
        }
      }
    }
  }
  return undefined;
};

// Helper to get icon for an action
const getActionIcon = (actionId: string, action: any): any => {
  if (action.characterId) return MessageSquare;
  if (action.clueIds?.length > 0) {
    const clueType = action.clueIds[0].includes('photo') ? Camera : 
                     action.clueIds[0].includes('record') || action.clueIds[0].includes('log') ? FileSearch :
                     action.clueIds[0].includes('video') ? Camera : Eye;
    return clueType;
  }
  return Search;
};

export default function GameScreen({state,setState,onFinish,onRestart,scenario}:{state:GameState | null;setState:React.Dispatch<React.SetStateAction<GameState | null>>;onFinish:(won:boolean)=>void;onRestart:()=>void;scenario:ScenarioData}){
  if (!state) return null;
  const [finalOpen,setFinalOpen]=useState(false);
  const [detailClue,setDetailClue]=useState<string|null>(null);
  const [sidebar,setSidebar]=useState(true);
  const [dialogue,setDialogue]=useState<DialogueNode|null>(null);
  const [eventNotice,setEventNotice]=useState<{title:string;text:string;clues:string[]}|null>(null);
  const [dialogueNodeId,setDialogueNodeId]=useState<string|null>(null);
  const locations = scenario.locations;
  const characters = scenario.characters;
  const clues = scenario.clues;
  const timeline = scenario.timeline;
  const dialogueNodes = scenario.dialogueNodes;
  const loc = locations.find(l=>l.id===state.selectedLocationId)||locations[0];
  const discovered=state.discoveredLocationIds;
  const found=useMemo(()=>clues.filter(c=>state.foundClueIds.includes(c.id)),[state.foundClueIds]);
  const totalClues=clues.length;
  const progress=Math.round(Math.min(100,(found.length/totalClues)*100));
  const mapTemplateId = scenario.mapTemplateId;

  // Helper to get character by ID
  const getCharacter = (id: string) => characters.find(c => c.id === id);

  const select=(id:string)=>setState(s=>s?({...s,selectedLocationId:id,selectedTab:'case'}):null);
  const action=(id:string)=>{
    if(!state) return;
    const before=new Set(state.foundClueIds);
    const next=performAction(state, scenario, loc.id,id);
    setState(next);
    const added=next.foundClueIds.filter(x=>!before.has(x));
    
    // Get the action definition to check if it's a dialogue action
    const actionDef=loc.actions.find(a=>a.id===id);
    
    // For dialogue actions: use dynamic dialogue based on game state
    if (actionDef?.characterId) {
      const dynamicNode = getDynamicDialogueNode(state, scenario, actionDef.characterId, loc.id, id);
      if (dynamicNode) {
        setDialogue(dynamicNode);
        setDialogueNodeId(dynamicNode.id);
        // Mark this dialogue node as viewed for future filtering
        setState(s => s ? ({...s, dialogueFlags: [...(s.dialogueFlags||[]), `viewed_${dynamicNode.id}`], viewedDialogueNodeIds: [...(s.viewedDialogueNodeIds||[]), dynamicNode.id]}): null);
        return;
      }
    }
    
    // Legacy fallback: try to get static dialogue ID
    const dialogueId=getActionDialogueId(id, scenario);
    if(dialogueId){setDialogue(scenario.dialogueNodes[dialogueId]);setDialogueNodeId(dialogueId);setState(s => s ? ({...s, viewedDialogueNodeIds: [...(s.viewedDialogueNodeIds||[]), dialogueId]}): null);return;}
    
    // Non-dialogue action: show event notice
    if(actionDef){
      const clueNames=added.map(x=>clues.find(c=>c.id===x)?.title||'').filter(Boolean);
      setEventNotice({title:actionDef.label,text:actionDef.description,clues:clueNames});
    }
  };
  const setTab=(tab:Tab)=>setState(s=>s?({...s,selectedTab:tab}):null);
  const note=(v:string)=>setState(s=>s?({...s,notes:v}):null);

  const chooseDialogue=(choice:{id:string;clueIds?:string[];nextId?:string;text?:string;note?:string})=>{
    const nextState=discoverFromClues({...state,foundClueIds:[...new Set([...state.foundClueIds,...(choice.clueIds||[])])],dialogueFlags:[...(state.dialogueFlags||[]),choice.id]}, scenario);
    setState(nextState);
    if(choice.nextId&&dialogueNodes[choice.nextId]){
      setDialogue(dialogueNodes[choice.nextId]);
      setDialogueNodeId(choice.nextId);
      // Mark the next dialogue node as viewed
      setState(s => s ? ({...s, viewedDialogueNodeIds: [...(s.viewedDialogueNodeIds||[]), choice.nextId!]}): null);
      return
    }
    const added=(choice.clueIds||[]).map(id=>clues.find(c=>c.id===id)?.title).filter(Boolean) as string[];
    setDialogue(null);setDialogueNodeId(null);
    if(added.length||choice.text){setEventNotice({title:'Разговор записан',text:choice.text||'Показание добавлено в материалы дела.',clues:added});}
  };

  const canFinal=state.foundClueIds.length>=10;
  
  // Auto-save game state periodically
  useEffect(() => {
    saveGame(state);
  }, [state]);
  
  return <div className="game-shell">
    <header className="game-top"><div className="brand"><span className="brand-mark">OC</span><div><b>OPEN CASES</b><small>Дело №001 · Тишина на Мэдисон</small></div></div><div className="top-status"><span><span className="live-dot"/> СИСТЕМА АКТИВНА</span><span>{found.length} / {totalClues} улик</span><button onClick={onRestart} className="top-link">Сбросить</button></div></header>
    <div className="game-body">
      <aside className={`left-rail ${sidebar?'':'collapsed'}`}>{sidebar&&<><div className="rail-head"><div><span className="eyebrow">РАССЛЕДОВАНИЕ</span><strong>Тишина на Мэдисон</strong></div><button onClick={()=>setSidebar(false)} aria-label="Свернуть панель"><PanelRightClose size={17}/></button></div><nav>{tabs.map(t=>{const Icon=t.icon;return <button key={t.id} className={state.selectedTab===t.id?'active':''} onClick={()=>setState(s=>s?({...s,selectedTab:t.id as Tab}):null)}><Icon size={17}/><span>{t.label}</span>{t.id==='clues'&&found.length>0&&<em>{found.length}</em>}</button>})}</nav><div className="rail-progress"><div><span>Материалы дела</span><b>{progress}%</b></div><div className="progress"><i style={{width:`${progress}%`}}/></div><small>Открыто {discovered.length} из {locations.length} точек</small></div></>}{!sidebar&&<button className="expand-rail" onClick={()=>setSidebar(true)} aria-label="Развернуть панель"><PanelRightOpen size={18}/></button>}</aside>
      <section className="map-panel"><MapView locations={locations} discovered={discovered} selectedId={state.selectedLocationId} mode={state.mapMode} onSelect={select} mapTemplateId={mapTemplateId}/><div className="map-hint"><MapPin size={13}/><span>Выберите точку на карте</span></div><div className="map-legend"><span><i className="legend-dot open"/> открыта</span><span><i className="legend-dot new"/> выбрана</span><span><i className="legend-dot locked"/> неизвестна</span></div><div className="case-stamp">SEATTLE<br/><b>CASE 001</b></div></section>
      <aside className="right-panel"><div className="panel-scroll">{state.selectedTab==='case'&&<CaseTab loc={loc} state={state} action={action} setFinalOpen={setFinalOpen} canFinal={canFinal} scenario={scenario}/>} {state.selectedTab==='people'&&<PeopleTab state={state} select={select} scenario={scenario}/>} {state.selectedTab==='board'&&<BoardTab state={state} setState={setState} scenario={scenario}/>} {state.selectedTab==='clues'&&<CluesTab found={found} onOpen={setDetailClue}/>} {state.selectedTab==='notes'&&<NotesTab value={state.notes} onChange={note}/>} {state.selectedTab==='timeline'&&<TimelineTab state={state} scenario={scenario}/>}</div></aside>
    </div>
    {detailClue&&<ClueModal clue={clues.find(c=>c.id===detailClue)!} onClose={()=>setDetailClue(null)}/>} 
    {eventNotice&&<EventModal notice={eventNotice} onClose={()=>setEventNotice(null)}/>} 
    {dialogue&&<DialogueModal node={dialogue} scenario={scenario} state={state} onClose={()=>{setDialogue(null);setDialogueNodeId(null)}} onChoose={chooseDialogue}/>}
    {finalOpen&&<FinalModal state={state} scenario={scenario} onClose={()=>setFinalOpen(false)} onSubmit={(answers)=>{const score=calculateScore(state,answers,scenario);setState(s=>s?({...s,finalAnswers:answers,score,finished:true,won:score>=70,started:s.started}):null);setFinalOpen(false);onFinish(score>=70)}}/>}
  </div>
}

function CaseTab({loc,state,action,setFinalOpen,canFinal,scenario}:{loc:any;state:GameState;action:(id:string)=>void;setFinalOpen:(v:boolean)=>void;canFinal:boolean;scenario:ScenarioData}){
  const open=state.discoveredLocationIds.includes(loc.id);
  const getCharacter = (id: string) => scenario.characters.find(c => c.id === id);
  const scenarioId = scenario.scenario.id;
  const locImage = resolveImageUrl(scenarioId, loc.image);
  
  return <><div className="panel-title selected-location-heading"><span className="eyebrow"><MapPin size={12}/> ВЫБРАННАЯ ТОЧКА</span><h2>{loc.title}</h2><p>{loc.address}</p></div>
  <div className="location-hero">
    {locImage ? <img src={locImage} alt={loc.title}/> : <div className="hero-placeholder"><FileSearch size={48}/><span>Нет изображения</span></div>}
    <span>{loc.category}</span>
    <div className="hero-badge">{open?'ДОСТУПНО':'НЕ ИССЛЕДОВАНО'}</div>
  </div>
  <div className="panel-copy"><p>{loc.description}</p></div>
  {!open?<div className="locked-card"><Lock size={18}/><b>Локация пока закрыта</b><span>{loc.lockedReason}</span></div>:<div className="actions"><span className="section-label">Доступные действия</span>{loc.actions.map((a:any)=>{const done=state.completedActionIds.includes(a.id),blocked=a.requiresClueIds?.some((id:string)=>!state.foundClueIds.includes(id));const Icon=getActionIcon(a.id,a);return <button key={a.id} disabled={done||blocked} onClick={()=>action(a.id)} className="action-card"><div className="action-icon">{done?<Check size={17}/>:<Icon size={17}/>}</div><div><b>{a.label}</b><span>{done?'Завершено':blocked?'Сначала найдите нужную зацепку.':a.description}</span></div><ChevronRight size={17}/></button>})}</div>}
  <div className="location-people">
    {(loc.characterIds && loc.characterIds.length > 0) && <><span className="section-label">Персонажи в точке</span>
    {loc.characterIds.map((id:string)=>{const c=getCharacter(id)!;const portraitUrl=resolveImageUrl(scenarioId, c.portrait);return <div className="mini-person" key={id}>
      {portraitUrl ? <img src={portraitUrl} alt={c.name}/> : <div className="avatar-placeholder"><Users size={24}/></div>}
      <div><b>{c.name}</b><span>{c.relation}</span></div>
    </div>})}</>
  }</div>
  <button className={`final-btn ${canFinal?'ready':''}`} disabled={!canFinal} onClick={()=>setFinalOpen(true)}><FileText size={18}/>{canFinal?'Сформировать версию расследования':'Соберите минимум 10 улик'}</button></>
}
function PeopleTab({state,select,scenario}:{state:GameState;select:(id:string)=>void;scenario:ScenarioData}){
  const characters = scenario.characters;
  const scenarioId = scenario.scenario.id;
  // Only show characters the player has interacted with (questioned)
  const interactedCharacters = characters.filter(c => state.questionedCharacterIds.includes(c.id));
  
  return <><div className="panel-title"><span className="eyebrow">ДОСЬЕ</span><h2>Люди</h2><p>{interactedCharacters.length} фигур в деле</p></div>
  <div className="people-list">
    {interactedCharacters.map((c:any)=>{
      const portraitUrl = resolveImageUrl(scenarioId, c.portrait);
      return <button key={c.id} className="person-card" onClick={()=>c.locationId&&select(c.locationId)}>
        {portraitUrl ? <img src={portraitUrl} alt={c.name}/> : <div className="avatar-placeholder"><Users size={32}/></div>}
        <div><b>{c.name}</b><span>{c.age} · {c.role}</span><small>{state.questionedCharacterIds.includes(c.id)?'Опрошен':'Не опрошен'}</small></div>
        <ChevronRight size={16}/>
      </button>
    })}
    {interactedCharacters.length === 0 && <div className="empty">Пока нет данных о персонажах. Начните расследование и опрашивайте свидетелей.</div>}
  </div></>
}
function CluesTab({found,onOpen}:{found:any[];onOpen:(id:string)=>void}){return <><div className="panel-title"><span className="eyebrow">ДОКАЗАТЕЛЬСТВА</span><h2>Улики <em>{found.length}</em></h2><p>Нажимайте на материалы и сопоставляйте детали.</p></div><div className="clue-list">{found.map(c=><button className={`clue-card ${c.importance}`} key={c.id} onClick={()=>onOpen(c.id)}><div className="clue-type">{c.type}</div><b>{c.title}</b><span>{c.description}</span><small>{c.foundWhen}</small></button>)}{found.length===0&&<div className="empty">Пока ничего. Начните с дома Беннеттов и школы.</div>}</div></>}
function NotesTab({value,onChange}:{value:string;onChange:(v:string)=>void}){return <><div className="panel-title"><span className="eyebrow">РАБОЧИЙ БЛОКНОТ</span><h2>Заметки</h2><p>Пишите собственные версии. Игра не проверяет текст заметок.</p></div><textarea className="notes" value={value} onChange={e=>onChange(e.target.value)} placeholder={'Например:\n20:07 — Майя официально покинула школу.\n20:19 — фургон у мастерской.\nПочему Дэниел говорит 20:14?'} /><div className="note-tip"><NotebookPen size={16}/><span>Хорошая привычка: рядом с каждой гипотезой записывайте, какая улика её подтверждает.</span></div></>}
function TimelineTab({state,scenario}:{state:GameState;scenario:ScenarioData}){const events=scenario.timeline.filter(t=>!t.id||state.timelineEventIds.length===0||state.timelineEventIds.includes(t.id)||['t1','t2','t3'].includes(t.id));return <><div className="panel-title"><span className="eyebrow">ВРЕМЕННАЯ ЛИНИЯ</span><h2>Хронология</h2><p>Факты, подтверждённые в ходе расследования.</p></div><div className="timeline">{events.map(t=><div className="timeline-row" key={t.id}><time>{t.time}</time><div><b>{t.title}</b><span>{t.text}</span><small>{t.source}</small></div></div>)}</div></>}
function ClueModal({clue,onClose}:{clue:any;onClose:()=>void}){return <div className="modal-backdrop" onClick={onClose}><div className="modal clue-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">{clue.type} · {clue.importance==='critical'?'КЛЮЧЕВАЯ':clue.importance==='important'?'ВАЖНАЯ':'КОНТЕКСТ'}</span><h2>{clue.title}</h2></div><button onClick={onClose}>×</button></div><p>{clue.description}</p><div className="evidence-detail"><MessageSquare size={18}/><span>{clue.detail}</span></div><div className="related"><b>Связи</b><span>{clue.relatedClues.length} связанных улик · {clue.relatedCharacters.length} персонажей</span></div></div></div>}
function EventModal({notice,onClose}:{notice:{title:string;text:string;clues:string[]};onClose:()=>void}){return <div className="event-layer"><div className="event-card"><div className="event-accent"/><div className="event-kicker"><CircleAlert size={14}/> ОПЕРАТИВНАЯ ЗАПИСЬ</div><h3>{notice.title}</h3><p>{notice.text}</p>{notice.clues.length>0&&<div className="event-discoveries"><span>Добавлено в дело</span>{notice.clues.map(c=><b key={c}>+ {c}</b>)}</div>}<button className="btn primary full" onClick={onClose}>Продолжить</button></div></div>}
function DialogueModal({node,scenario,onClose,onChoose,state}:{node:DialogueNode;scenario:ScenarioData;onClose:()=>void;onChoose:(c:any)=>void;state:GameState}){
  const character = scenario.characters.find(c => c.id === node.characterId);
  const scenarioId = scenario.scenario.id;
  const portraitUrl = character ? resolveImageUrl(scenarioId, character.portrait) : '';
  
  return <div className="modal-backdrop dialogue-backdrop">
    <div className="modal dialogue-modal" onClick={e=>e.stopPropagation()}>
      <div className="dialogue-top">
        <div><span className="eyebrow">{node.eyebrow}</span><h2>{node.title}</h2></div>
        <button onClick={onClose}>×</button>
      </div>
      <div className="speaker">
        {portraitUrl ? <img src={portraitUrl} alt={character?.name}/> : <div className="avatar-placeholder"><Users size={40}/></div>}
        <div><b>{character?.name||'Неизвестный'}</b><span>{character?.role||''}</span></div>
      </div>
      <div className="dialogue-lines">{node.lines.map((line,i)=><p key={i}>{line}</p>)}</div>
      <div className="choice-list">
        <span className="section-label">Что спросить дальше</span>
        {node.choices.map(c=>{
          const isViewed = state.dialogueFlags?.includes(c.id);
          return <button className="dialogue-choice" key={c.id} disabled={isViewed} onClick={()=>onChoose(c)} style={{opacity:isViewed?0.5:1,cursor:isViewed?'not-allowed':'pointer'}}>
            <div><b>{c.label}</b><span>{isViewed?'Уже известно':(c.text||'Продолжить разговор и проверить показания.')}</span></div>
            {isViewed?<Check size={17}/>:<ChevronRight size={17}/>}
          </button>
        })}
      </div>
      <div className="dialogue-foot">{node.intro}</div>
    </div>
  </div>
}
function FinalModal({state,scenario,onClose,onSubmit}:{state:GameState;scenario:ScenarioData;onClose:()=>void;onSubmit:(a:any)=>void}){const [person,setPerson]=useState('');const [motive,setMotive]=useState('');const [method,setMethod]=useState('');const [location,setLocation]=useState('');return <div className="modal-backdrop"><div className="modal final-modal"><div className="modal-head"><div><span className="eyebrow">ФИНАЛЬНАЯ ВЕРСИЯ</span><h2>Что произошло?</h2></div><button onClick={onClose}>×</button></div><p>Сформируйте свою версию только из того, что удалось подтвердить. Ошибка не закрывает дело автоматически.</p><Select label="Кто организовал исчезновение?" value={person} set={setPerson} opts={[['leah','Лия Моррис'],['daniel','Дэниел Кроу'],['nora','Нора Вэйл'],['sam','Сэмюэл Рид']]}/><Select label="Какой был мотив?" value={motive} set={setMotive} opts={[['exposure','Скрыть схему подмены серийных номеров'],['money','Получить выкуп'],['revenge','Личная месть'],['escape','Помочь Майе скрыться']]}/><Select label="Как Майю заманили?" value={method} set={setMethod} opts={[['lured','Сообщением о встрече и фотографиях'],['force','Сразу силой у школы'],['fake','Поддельным звонком от матери'],['random','Случайно возле магазина']]}/><Select label="Где ключевая точка?" value={location} set={setLocation} opts={[['northline_storage','Northline Storage'],['lincoln_school','Lincoln High School'],['reed_garage','Reed Auto'],['city_news','Seattle Ledger']]}/><button className="btn primary full" disabled={!person||!motive||!method||!location} onClick={()=>onSubmit({person,motive,method,location})}>Закрыть дело <Send size={17}/></button></div></div>}

// Investigation Board Tab Component - Interactive clues board with drag-and-drop nodes and connections
function BoardTab({state,setState,scenario}:{state:GameState;setState:React.Dispatch<React.SetStateAction<GameState|null>>;scenario:ScenarioData}){
  const board = state.investigationBoard || { nodes: [], connections: [], selectedTool: 'select' };
  const foundClues = scenario.clues.filter(c => state.foundClueIds.includes(c.id));
  const questionedChars = scenario.characters.filter(c => state.questionedCharacterIds.includes(c.id));
  
  // Add clue to board
  const addClueToBoard = (clueId: string) => {
    const clue = foundClues.find(c => c.id === clueId);
    if (!clue || board.nodes.some(n => n.id === `clue-${clue.id}`)) return;
    
    const newNode: BoardNode = {
      id: `clue-${clue.id}`,
      type: 'clue',
      title: clue.title,
      content: clue.description,
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 150,
      color: clue.importance === 'critical' ? '#ef4444' : clue.importance === 'important' ? '#f59e0b' : '#3b82f6',
      relatedIds: [...clue.relatedClues, ...clue.relatedCharacters]
    };
    
    setState(s => s ? ({
      ...s,
      investigationBoard: {
        ...board,
        nodes: [...board.nodes, newNode]
      }
    }) : null);
  };
  
  // Update node position
  const updateNodePosition = (nodeId: string, x: number, y: number) => {
    setState(s => s ? ({
      ...s,
      investigationBoard: {
        ...board,
        nodes: board.nodes.map(n => n.id === nodeId ? { ...n, x, y } : n)
      }
    }) : null);
  };
  
  // Add connection between nodes
  const addConnection = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const existing = board.connections.find(c => 
      (c.fromNodeId === fromId && c.toNodeId === toId) ||
      (c.fromNodeId === toId && c.toNodeId === fromId)
    );
    if (existing) return;
    
    const newConn: BoardConnection = {
      id: `conn-${fromId}-${toId}`,
      fromNodeId: fromId,
      toNodeId: toId,
      color: '#dc2626'
    };
    
    setState(s => s ? ({
      ...s,
      investigationBoard: {
        ...board,
        connections: [...board.connections, newConn]
      }
    }) : null);
  };
  
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  
  return (
    <>
      <div className="panel-title">
        <span className="eyebrow">РАССЛЕДОВАНИЕ</span>
        <h2>Доска улик</h2>
        <p>Перетаскивайте стикеры и связывайте их красной нитью</p>
      </div>
      
      <div className="board-toolbar">
        <button 
          className={`tool-btn ${board.selectedTool === 'select' ? 'active' : ''}`}
          onClick={() => setState(s => s ? ({...s, investigationBoard: {...board, selectedTool: 'select'}}) : null)}
        >
          <MessageSquare size={16}/> Выбор
        </button>
        <button 
          className={`tool-btn ${board.selectedTool === 'connect' ? 'active' : ''}`}
          onClick={() => setState(s => s ? ({...s, investigationBoard: {...board, selectedTool: 'connect'}}) : null)}
        >
          <Repeat size={16}/> Связать
        </button>
      </div>
      
      <div className="board-clue-palette">
        <span className="section-label">Добавить на доску</span>
        <div className="palette-list">
          {foundClues.map(clue => (
            <button 
              key={clue.id} 
              className={`palette-item ${board.nodes.some(n => n.id === `clue-${clue.id}`) ? 'added' : ''}`}
              onClick={() => addClueToBoard(clue.id)}
            >
              {clue.title}
            </button>
          ))}
          {questionedChars.map(char => (
            <button 
              key={char.id} 
              className={`palette-item ${board.nodes.some(n => n.id === `char-${char.id}`) ? 'added' : ''}`}
              onClick={() => {
                if (board.nodes.some(n => n.id === `char-${char.id}`)) return;
                const newNode: BoardNode = {
                  id: `char-${char.id}`,
                  type: 'character',
                  title: char.name,
                  content: char.role,
                  x: 300 + Math.random() * 200,
                  y: 100 + Math.random() * 150,
                  color: '#8b5cf6'
                };
                setState(s => s ? ({
                  ...s,
                  investigationBoard: {
                    ...board,
                    nodes: [...board.nodes, newNode]
                  }
                }) : null);
              }}
            >
              {char.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="investigation-board" style={{position: 'relative', height: '400px', overflow: 'hidden', background: '#fef3c7', borderRadius: '8px', border: '2px solid #d4a574'}}>
        {/* SVG layer for connections */}
        <svg style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
          {board.connections.map(conn => {
            const fromNode = board.nodes.find(n => n.id === conn.fromNodeId);
            const toNode = board.nodes.find(n => n.id === conn.toNodeId);
            if (!fromNode || !toNode) return null;
            return (
              <line
                key={conn.id}
                x1={fromNode.x + 60}
                y1={fromNode.y + 40}
                x2={toNode.x + 60}
                y2={toNode.y + 40}
                stroke={conn.color || '#dc2626'}
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            );
          })}
        </svg>
        
        {/* Nodes */}
        {board.nodes.map(node => (
          <div
            key={node.id}
            className="board-node"
            style={{
              position: 'absolute',
              left: `${node.x}px`,
              top: `${node.y}px`,
              width: '120px',
              minHeight: '80px',
              background: node.color || '#fff',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              cursor: board.selectedTool === 'select' ? 'move' : 'pointer',
              border: connectingFrom === node.id ? '3px solid #dc2626' : '2px solid transparent'
            }}
            onMouseDown={(e) => {
              if (board.selectedTool === 'connect') {
                if (connectingFrom) {
                  addConnection(connectingFrom, node.id);
                  setConnectingFrom(null);
                } else {
                  setConnectingFrom(node.id);
                }
                e.stopPropagation();
              } else {
                setDraggingNodeId(node.id);
              }
            }}
            onMouseMove={(e) => {
              if (draggingNodeId === node.id) {
                const rect = (e.target as HTMLElement).parentElement?.getBoundingClientRect();
                if (rect) {
                  updateNodePosition(node.id, e.clientX - rect.left - 60, e.clientY - rect.top - 40);
                }
              }
            }}
            onMouseUp={() => setDraggingNodeId(null)}
            onMouseLeave={() => setDraggingNodeId(null)}
          >
            <div style={{fontWeight: 'bold', fontSize: '12px', marginBottom: '4px'}}>{node.title}</div>
            <div style={{fontSize: '10px', opacity: 0.8}}>{node.content}</div>
          </div>
        ))}
        
        {board.nodes.length === 0 && (
          <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#92400e'}}>
            <StickyNote size={48} style={{margin: '0 auto 16px', opacity: 0.5}}/>
            <p>Добавьте улики из панели слева</p>
          </div>
        )}
      </div>
      
      <div className="board-hint">
        <small>💡 Совет: Используйте инструмент "Связать" чтобы протянуть красную нить между связанными уликами</small>
      </div>
    </>
  );
}

function Select({label,value,set,opts}:{label:string;value:string;set:(v:string)=>void;opts:string[][]}){return <label className="select-wrap"><span>{label}</span><select value={value} onChange={e=>set(e.target.value)}><option value="">Выберите ответ…</option>{opts.map(([v,t])=><option value={v} key={v}>{t}</option>)}</select></label>}
