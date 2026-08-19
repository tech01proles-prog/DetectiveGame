import React, { useEffect, useRef, useState } from 'react';
import type { MapLocation, GameMapTemplate } from '../../types';

interface StylizedMapProps {
  template: GameMapTemplate;
  locations: MapLocation[];
  activeLocationId?: string;
  onLocationClick: (location: MapLocation) => void;
  visitedLocationIds?: string[];
  /** Optional: Custom background image URL */
  backgroundImage?: string;
  /** Optional: Pre-calculated coordinates for locations */
  locationCoordinates?: Record<string, { x: number; y: number }>;
}

interface Point {
  x: number;
  y: number;
}

interface RiverPath {
  d: string;
  width: number;
}

interface RoadPath {
  d: string;
  type: 'main' | 'secondary';
}

const StylizedMap: React.FC<StylizedMapProps> = ({
  template,
  locations,
  activeLocationId,
  onLocationClick,
  visitedLocationIds = [],
  backgroundImage,
  locationCoordinates,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  // Get coordinates for a location - use provided coordinates or auto-generate
  const getLocationCoords = (locationId: string, index: number): { x: number; y: number } => {
    if (locationCoordinates?.[locationId]) {
      return locationCoordinates[locationId];
    }
    
    // Fallback to auto-generation based on template
    let x: number, y: number;
    
    switch (template) {
      case 'small_town':
        x = 200 + (index % 3) * 200;
        y = 200 + (Math.floor(index / 3) % 2) * 150;
        break;
      case 'city_district':
        x = 150 + (index % 4) * 175;
        y = 180 + (Math.floor(index / 4) % 2) * 100;
        break;
      case 'industrial_zone':
        x = 100 + (index % 5) * 140;
        y = 150 + (index % 2) * 150;
        break;
      case 'countryside':
        x = 150 + (index % 4) * 180 + (index % 2) * 30;
        y = 150 + (Math.floor(index / 4) % 2) * 180 + (index % 3) * 40;
        break;
      default:
        x = 200 + (index % 3) * 200;
        y = 200 + (Math.floor(index / 3) % 2) * 150;
    }
    
    return {
      x: Math.max(50, Math.min(750, x)),
      y: Math.max(50, Math.min(350, y)),
    };
  };

  // Генерация путей рек в зависимости от шаблона
  const getRiverPaths = (): RiverPath[] => {
    switch (template) {
      case 'small_town':
        return [
          { d: 'M -50,150 C 100,120 200,180 400,150 S 700,100 850,130', width: 25 },
          { d: 'M 200,-50 L 220,400', width: 15 },
        ];
      case 'city_district':
        return [
          { d: 'M -50,200 C 150,180 300,220 500,190 S 800,150 850,170', width: 30 },
        ];
      case 'industrial_zone':
        return [
          { d: 'M -50,250 L 850,230', width: 35 },
          { d: 'M 400,-50 L 380,400', width: 20 },
        ];
      case 'countryside':
        return [
          { d: 'M 100,-50 C 120,100 80,200 150,400', width: 18 },
          { d: 'M -50,180 C 200,160 400,200 850,170', width: 22 },
        ];
      default:
        return [];
    }
  };

  // Генерация дорог
  const getRoadPaths = (): RoadPath[] => {
    switch (template) {
      case 'small_town':
        return [
          { d: 'M 0,200 L 800,200', type: 'main' },
          { d: 'M 200,0 L 200,400', type: 'main' },
          { d: 'M 500,0 L 500,400', type: 'secondary' },
          { d: 'M 100,350 L 400,350', type: 'secondary' },
        ];
      case 'city_district':
        return [
          { d: 'M 0,180 L 800,180', type: 'main' },
          { d: 'M 0,280 L 800,280', type: 'main' },
          { d: 'M 150,0 L 150,400', type: 'main' },
          { d: 'M 400,0 L 400,400', type: 'main' },
          { d: 'M 650,0 L 650,400', type: 'secondary' },
        ];
      case 'industrial_zone':
        return [
          { d: 'M 0,150 L 800,150', type: 'main' },
          { d: 'M 0,300 L 800,300', type: 'main' },
          { d: 'M 100,0 L 100,400', type: 'secondary' },
          { d: 'M 350,0 L 350,400', type: 'secondary' },
          { d: 'M 600,0 L 600,400', type: 'secondary' },
        ];
      case 'countryside':
        return [
          { d: 'M 0,200 C 200,180 400,220 800,200', type: 'main' },
          { d: 'M 200,0 C 180,150 220,250 200,400', type: 'secondary' },
          { d: 'M 500,0 C 480,150 520,250 500,400', type: 'secondary' },
          { d: 'M 100,100 L 400,100', type: 'secondary' },
        ];
      default:
        return [];
    }
  };

  // Получение парков/зеленых зон
  const getParks = () => {
    switch (template) {
      case 'small_town':
        return [
          { cx: 120, cy: 100, rx: 60, ry: 40 },
          { cx: 550, cy: 320, rx: 80, ry: 50 },
        ];
      case 'city_district':
        return [
          { cx: 300, cy: 100, rx: 70, ry: 60 },
          { cx: 600, cy: 350, rx: 90, ry: 40 },
        ];
      case 'industrial_zone':
        return [
          { cx: 700, cy: 80, rx: 50, ry: 35 },
        ];
      case 'countryside':
        return [
          { cx: 350, cy: 150, rx: 100, ry: 80 },
          { cx: 650, cy: 300, rx: 80, ry: 60 },
          { cx: 150, cy: 320, rx: 70, ry: 50 },
        ];
      default:
        return [];
    }
  };

  // Специальные объекты (кладбище, мосты и т.д.)
  const getSpecialObjects = () => {
    const objects: JSX.Element[] = [];
    
    if (template === 'small_town' || template === 'countryside') {
      // Кладбище
      objects.push(
        <g key="cemetery" transform="translate(680, 80)">
          <ellipse cx="0" cy="0" rx="50" ry="35" fill="#4a5568" opacity="0.3" />
          <rect x="-30" y="-20" width="8" height="15" fill="#718096" />
          <rect x="-10" y="-25" width="8" height="20" fill="#718096" />
          <rect x="10" y="-18" width="8" height="13" fill="#718096" />
          <text x="0" y="15" textAnchor="middle" fontSize="10" fill="#a0aec0">⚰</text>
        </g>
      );
    }

    if (template === 'industrial_zone') {
      // Заводские трубы
      objects.push(
        <g key="factory" transform="translate(150, 100)">
          <rect x="-40" y="-30" width="80" height="50" fill="#4a5568" opacity="0.4" />
          <rect x="-25" y="-50" width="12" height="25" fill="#2d3748" />
          <rect x="15" y="-45" width="10" height="20" fill="#2d3748" />
          <circle cx="-19" cy="-55" r="8" fill="#a0aec0" opacity="0.5" />
          <circle cx="20" cy="-50" r="6" fill="#a0aec0" opacity="0.4" />
        </g>
      );
    }

    // Мосты через реки
    const riverPaths = getRiverPaths();
    const roadPaths = getRoadPaths();
    
    roadPaths.forEach((road, idx) => {
      riverPaths.forEach((river, rIdx) => {
        // Упрощенная проверка пересечения для демонстрации
        if (road.type === 'main' && rIdx === 0) {
          const bridgeX = template === 'small_town' ? 200 : template === 'city_district' ? 400 : 400;
          const bridgeY = template === 'small_town' ? 200 : template === 'city_district' ? 180 : 150;
          
          objects.push(
            <g key={`bridge-${idx}-${rIdx}`} transform={`translate(${bridgeX}, ${bridgeY})`}>
              <rect x="-25" y="-8" width="50" height="16" fill="#d69e2e" rx="2" />
              <line x1="-25" y1="-5" x2="50" y2="-5" stroke="#b7791f" strokeWidth="1" />
              <line x1="-25" y1="5" x2="50" y2="5" stroke="#b7791f" strokeWidth="1" />
            </g>
          );
        }
      });
    });

    return objects;
  };

  const riverPaths = getRiverPaths();
  const roadPaths = getRoadPaths();
  const parks = getParks();
  const specialObjects = getSpecialObjects();

  return (
    <div className="relative w-full h-full bg-[#f5f5f4] rounded-lg overflow-hidden shadow-inner">
      {/* Custom background image if provided */}
      {backgroundImage && (
        <img 
          src={backgroundImage} 
          alt="Map background" 
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />
      )}
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full relative"
        style={{ background: backgroundImage ? 'transparent' : '#f5f5f4', zIndex: 1 }}
      >
        {/* Определение паттернов и градиентов */}
        <defs>
          <pattern id="grassPattern" patternUnits="userSpaceOnUse" width="20" height="20">
            <rect width="20" height="20" fill="#e8f5e9" />
            <circle cx="5" cy="5" r="1.5" fill="#c8e6c9" />
            <circle cx="15" cy="10" r="1" fill="#c8e6c9" />
            <circle cx="8" cy="16" r="1.2" fill="#c8e6c9" />
          </pattern>
          
          <pattern id="waterPattern" patternUnits="userSpaceOnUse" width="30" height="30">
            <rect width="30" height="30" fill="#bbdefb" />
            <path d="M0,10 Q7,5 15,10 T30,10" stroke="#90caf9" strokeWidth="1" fill="none" />
            <path d="M0,20 Q7,15 15,20 T30,20" stroke="#90caf9" strokeWidth="1" fill="none" />
          </pattern>
          
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
          
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Фон с травой */}
        <rect width="800" height="400" fill="url(#grassPattern)" />

        {/* Реки */}
        {riverPaths.map((river, idx) => (
          <path
            key={`river-${idx}`}
            d={river.d}
            stroke="url(#waterPattern)"
            strokeWidth={river.width}
            fill="none"
            strokeLinecap="round"
            opacity="0.8"
          />
        ))}

        {/* Парки */}
        {parks.map((park, idx) => (
          <ellipse
            key={`park-${idx}`}
            cx={park.cx}
            cy={park.cy}
            rx={park.rx}
            ry={park.ry}
            fill="#c8e6c9"
            opacity="0.6"
            stroke="#81c784"
            strokeWidth="2"
            strokeDasharray="4,2"
          />
        ))}

        {/* Дороги */}
        {roadPaths.map((road, idx) => (
          <g key={`road-${idx}`}>
            {/* Основа дороги */}
            <path
              d={road.d}
              stroke={road.type === 'main' ? '#9ca3af' : '#d1d5db'}
              strokeWidth={road.type === 'main' ? 18 : 10}
              fill="none"
              strokeLinecap="round"
            />
            {/* Разметка */}
            {road.type === 'main' && (
              <path
                d={road.d}
                stroke="#fbbf24"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="15,10"
                opacity="0.6"
              />
            )}
          </g>
        ))}

        {/* Специальные объекты */}
        {specialObjects}

        {/* Локации */}
        {locations.map((location, idx) => {
          const isActive = location.id === activeLocationId;
          const isVisited = visitedLocationIds.includes(location.id);
          const isHovered = hoveredLocation === location.id;
          
          // Use provided coordinates or calculate from template
          const coords = getLocationCoords(location.id, idx);

          return (
            <g
              key={location.id}
              transform={`translate(${coords.x}, ${coords.y})`}
              onClick={() => onLocationClick(location)}
              onMouseEnter={() => setHoveredLocation(location.id)}
              onMouseLeave={() => setHoveredLocation(null)}
              style={{ cursor: 'pointer' }}
              filter={isActive ? 'url(#glow)' : undefined}
            >
              {/* Маркер локации */}
              <circle
                cx="0"
                cy="0"
                r={isActive ? 18 : isHovered ? 16 : 14}
                fill={isActive ? '#f59e0b' : isVisited ? '#10b981' : '#6b7280'}
                stroke="#fff"
                strokeWidth="3"
                filter="url(#shadow)"
                className="transition-all duration-200"
              />

              {/* Иконка внутри маркера */}
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fontSize="16"
                fill="#fff"
                fontWeight="bold"
              >
                {location.icon || '📍'}
              </text>

              {/* Подпись локации */}
              {(isHovered || isActive) && (
                <g transform="translate(0, 30)">
                  <rect
                    x="-60"
                    y="-12"
                    width="120"
                    height="24"
                    rx="4"
                    fill="#1f2937"
                    opacity="0.9"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#fff"
                    fontWeight="500"
                  >
                    {location.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Легенда карты */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-xs">
        <h4 className="font-semibold mb-2 text-gray-700">Легенда:</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-gray-600">Не посещено</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Посещено</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-gray-600">Текущая локация</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-200 border border-green-400 border-dashed"></div>
            <span className="text-gray-600">Парк/Зона</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StylizedMap;
