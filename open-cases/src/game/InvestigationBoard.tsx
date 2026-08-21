import {useState,useRef,useEffect} from 'react';
import {StickyNote,Repeat,X} from 'lucide-react';
import type {GameState,BoardNode,BoardConnection} from '@/game/types';
import type {ScenarioData} from '@/game/scenario/schema';

interface InvestigationBoardProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState | null>>;
  scenario: ScenarioData;
}

export default function InvestigationBoard({state,setState,scenario}:InvestigationBoardProps) {
  const board = state.investigationBoard || { nodes: [], connections: [], selectedTool: 'select' };
  const foundClues = scenario.clues.filter(c => state.foundClueIds.includes(c.id));
  const questionedChars = scenario.characters.filter(c => state.questionedCharacterIds.includes(c.id));
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState<string>('#fef3c7'); // Default sticky note color

  // Add clue to board with selected color
  const addClueToBoard = (clueId: string) => {
    const clue = foundClues.find(c => c.id === clueId);
    if (!clue || board.nodes.some(n => n.id === `clue-${clue.id}`)) return;
    
    const newNode: BoardNode = {
      id: `clue-${clue.id}`,
      type: 'clue',
      title: clue.title,
      content: clue.description,
      x: 100 + Math.random() * (containerRef.current?.clientWidth || 600) - 100,
      y: 100 + Math.random() * (containerRef.current?.clientHeight || 400) - 100,
      color: selectedColor, // Use selected color instead of importance-based color
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
  
  // Update node position with smooth dragging
  const updateNodePosition = (nodeId: string, x: number, y: number) => {
    setState(s => s ? ({
      ...s,
      investigationBoard: {
        ...board,
        nodes: board.nodes.map(n => n.id === nodeId ? { ...n, x, y } : n)
      }
    }) : null);
  };
  
  // Add connection between nodes with smart validation
  const addConnection = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const existing = board.connections.find(c => 
      (c.fromNodeId === fromId && c.toNodeId === toId) ||
      (c.fromNodeId === toId && c.toNodeId === fromId)
    );
    if (existing) return;
    
    // Smart connection validation - check if nodes are related
    const fromNode = board.nodes.find(n => n.id === fromId);
    const toNode = board.nodes.find(n => n.id === toId);
    
    let connectionLabel: string | undefined;
    let isValidConnection = true;
    
    // Check for logical connections based on relatedIds
    const fromRelatedId = fromNode?.relatedIds?.find(id => 
      id === toNode?.id.replace('clue-', '').replace('char-', '')
    );
    const toRelatedId = toNode?.relatedIds?.find(id => 
      id === fromNode?.id.replace('clue-', '').replace('char-', '')
    );
    if (fromRelatedId || toRelatedId) {
      connectionLabel = 'Связано';
    }
    
    // Validate character-to-character connections
    if (fromNode?.type === 'character' && toNode?.type === 'character') {
      isValidConnection = false; // Characters shouldn't be directly connected
    }
    
    if (!isValidConnection) {
      // Show warning or prevent connection
      console.log('Предупреждение: нелогичная связь между уликами');
    }
    
    const newConn: BoardConnection = {
      id: `conn-${fromId}-${toId}`,
      fromNodeId: fromId,
      toNodeId: toId,
      label: connectionLabel,
      color: isValidConnection ? '#dc2626' : '#6b7280' // Gray for invalid connections
    };
    
    setState(s => s ? ({
      ...s,
      investigationBoard: {
        ...board,
        connections: [...board.connections, newConn]
      }
    }) : null);
  };
  
  // Remove node
  const removeNode = (nodeId: string) => {
    setState(s => s ? ({
      ...s,
      investigationBoard: {
        ...board,
        nodes: board.nodes.filter(n => n.id !== nodeId),
        connections: board.connections.filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId)
      }
    }) : null);
  };
  
  // Handle mouse wheel for zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(z => Math.max(0.5, Math.min(2, z + delta)));
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);
  
  // Handle panning with middle mouse button or space+drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggingNodeId) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const newX = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x;
        const newY = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y;
        updateNodePosition(draggingNodeId, newX, newY);
      }
    }
  };
  
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };
  
  const handleNodeMouseDown = (e: React.MouseEvent, node: BoardNode) => {
    if (board.selectedTool === 'connect') {
      if (connectingFrom) {
        addConnection(connectingFrom, node.id);
        setConnectingFrom(null);
      } else {
        setConnectingFrom(node.id);
      }
      e.stopPropagation();
    } else if (board.selectedTool === 'select') {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setDraggingNodeId(node.id);
      e.stopPropagation();
    }
  };

  return (
    <div className="investigation-board-full">
      {/* Toolbar */}
      <div className="board-toolbar-full">
        <div className="toolbar-group">
          <button 
            className={`tool-btn ${board.selectedTool === 'select' ? 'active' : ''}`}
            onClick={() => setState(s => s ? ({...s, investigationBoard: {...board, selectedTool: 'select'}}) : null)}
            title="Выбор и перемещение (V)"
          >
            <StickyNote size={16}/> Выбор
          </button>
          <button 
            className={`tool-btn ${board.selectedTool === 'connect' ? 'active' : ''}`}
            onClick={() => setState(s => s ? ({...s, investigationBoard: {...board, selectedTool: 'connect'}}) : null)}
            title="Связать улики нитью (C)"
          >
            <Repeat size={16}/> Связать
          </button>
        </div>
        
        <div className="toolbar-group">
          <span className="section-label" style={{marginRight: '8px'}}>Цвет:</span>
          {['#fef3c7', '#fecaca', '#bbf7d0', '#bfdbfe', '#fde68a', '#e9d5ff'].map(color => (
            <button
              key={color}
              className={`color-btn ${selectedColor === color ? 'active' : ''}`}
              onClick={() => setSelectedColor(color)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                background: color,
                border: selectedColor === color ? '2px solid #fff' : '2px solid rgba(255,255,255,0.3)',
                marginRight: '4px'
              }}
              title={`Выбрать цвет: ${color}`}
            />
          ))}
        </div>
        
        <div className="toolbar-group">
          <button 
            className="tool-btn"
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            title="Уменьшить"
          >
            −
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button 
            className="tool-btn"
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            title="Увеличить"
          >
            +
          </button>
          <button 
            className="tool-btn"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            title="Сбросить масштаб и позицию"
          >
            ⟲
          </button>
        </div>
        
        <div className="toolbar-hint">
          <small>Колесо мыши: зум | Alt+drag: панорамирование</small>
        </div>
      </div>
      
      {/* Clue palette */}
      <div className="board-palette-full">
        <div className="palette-section">
          <span className="section-label">Улики</span>
          <div className="palette-scroll">
            {foundClues.map(clue => (
              <button 
                key={clue.id} 
                className={`palette-item ${board.nodes.some(n => n.id === `clue-${clue.id}`) ? 'added' : ''}`}
                onClick={() => addClueToBoard(clue.id)}
                title={clue.description}
              >
                {clue.title}
              </button>
            ))}
          </div>
        </div>
        
        <div className="palette-section">
          <span className="section-label">Персонажи</span>
          <div className="palette-scroll">
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
                    x: 200 + Math.random() * 400,
                    y: 150 + Math.random() * 200,
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
                title={char.role}
              >
                {char.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Board canvas */}
      <div 
        ref={containerRef}
        className="board-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: isPanning ? 'grabbing' : board.selectedTool === 'connect' ? 'crosshair' : 'default'
        }}
      >
        <div 
          className="board-content"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%'
          }}
        >
          {/* SVG layer for connections */}
          <svg className="board-connections" style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
            {board.connections.map(conn => {
              const fromNode = board.nodes.find(n => n.id === conn.fromNodeId);
              const toNode = board.nodes.find(n => n.id === conn.toNodeId);
              if (!fromNode || !toNode) return null;
              return (
                <g key={conn.id}>
                  <line
                    x1={fromNode.x + 75}
                    y1={fromNode.y + 50}
                    x2={toNode.x + 75}
                    y2={toNode.y + 50}
                    stroke={conn.color || '#dc2626'}
                    strokeWidth="3"
                    strokeDasharray="6,4"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                  {/* Animated thread effect */}
                  <line
                    x1={fromNode.x + 75}
                    y1={fromNode.y + 50}
                    x2={toNode.x + 75}
                    y2={toNode.y + 50}
                    stroke={conn.color || '#dc2626'}
                    strokeWidth="1"
                    strokeDasharray="2,8"
                    strokeLinecap="round"
                    opacity="0.6"
                    className="thread-animation"
                  />
                </g>
              );
            })}
            
            {/* Connection preview line */}
            {connectingFrom && (
              <line
                x1={board.nodes.find(n => n.id === connectingFrom)?.x! + 75}
                y1={board.nodes.find(n => n.id === connectingFrom)?.y! + 50}
                x2={board.nodes.find(n => n.id === connectingFrom)?.x! + 75}
                y2={board.nodes.find(n => n.id === connectingFrom)?.y! + 50}
                stroke="#dc2626"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.5"
              />
            )}
          </svg>
          
          {/* Nodes */}
          {board.nodes.map(node => (
            <div
              key={node.id}
              className="board-node-sticky"
              style={{
                position: 'absolute',
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: '150px',
                minHeight: '100px',
                background: node.color || '#fef3c7',
                borderRadius: '4px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                border: connectingFrom === node.id ? '3px solid #dc2626' : '2px solid rgba(0,0,0,0.1)',
                transform: draggingNodeId === node.id ? 'scale(1.05)' : 'scale(1)',
                transition: draggingNodeId === node.id ? 'none' : 'transform 0.15s ease',
                zIndex: draggingNodeId === node.id ? 1000 : 1
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
            >
              <div className="node-header">
                <span className="node-title">{node.title}</span>
                {board.selectedTool === 'select' && (
                  <button 
                    className="node-remove"
                    onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}
                    title="Удалить с доски"
                  >
                    <X size={14}/>
                  </button>
                )}
              </div>
              <div className="node-content">{node.content}</div>
              {node.type === 'clue' && (
                <div className="node-type-indicator">
                  {scenario.clues.find(c => c.id === node.id.replace('clue-', ''))?.importance === 'critical' && (
                    <span className="importance-badge critical">★</span>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {board.nodes.length === 0 && (
            <div className="board-empty-state">
              <StickyNote size={64} style={{margin: '0 auto 24px', opacity: 0.3}}/>
              <h3>Доска пуста</h3>
              <p>Добавьте улики и персонажей из панели слева</p>
              <p className="empty-hint">Перетаскивайте стикеры мышкой и связывайте их красной нитью</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Status bar */}
      <div className="board-status-bar">
        <span>Улики на доске: {board.nodes.filter(n => n.type === 'clue').length}</span>
        <span>Персонажи: {board.nodes.filter(n => n.type === 'character').length}</span>
        <span>Связей: {board.connections.length}</span>
        {connectingFrom && <span className="connecting-mode">🔗 Выберите вторую точку для связи</span>}
      </div>
    </div>
  );
}
