import {useEffect,useRef,useState} from 'react';
import type {Location,MapMode} from './types';
import type {GameMapTemplate} from './maps/templates';
import StylizedMap from './maps/components/StylizedMap';
import {getStylizedTemplate} from './maps/templates';

declare global{interface Window{L:any}}

const DEFAULT_MAP_BOUNDS:[[number,number],[number,number]]=[[47.589,-122.340],[47.623,-122.296]];
const DEFAULT_MIN_ZOOM=13;
const DEFAULT_MAX_ZOOM=16;

export default function MapView({locations,discovered,selectedId,mode,onSelect,mapTemplateId,customMap}:{locations:Location[];discovered:string[];selectedId:string|null;mode:MapMode;onSelect:(id:string)=>void;mapTemplateId?:string;customMap?:{backgroundImage:string;bounds:[[number,number],[number,number]];center:[number,number];defaultZoom:number;minZoom?:number;maxZoom?:number}}){
  const ref=useRef<HTMLDivElement>(null), mapRef=useRef<any>(null), layers=useRef<any[]>([]);
  const [stylizedLocations, setStylizedLocations] = useState<Array<{id:string;name:string;x:number;y:number;icon?:string}>>([]);
  
  // Use custom map bounds if provided, otherwise use defaults
  const mapBounds = customMap?.bounds || DEFAULT_MAP_BOUNDS;
  const minZoom = customMap?.minZoom || DEFAULT_MIN_ZOOM;
  const maxZoom = customMap?.maxZoom || DEFAULT_MAX_ZOOM;
  const defaultCenter = customMap?.center || [47.6088, -122.313];
  const defaultZoom = customMap?.defaultZoom || 14.2;
  
  // Convert real locations to stylized map coordinates
  useEffect(() => {
    if (locations.length > 0) {
      // If using custom map with background image, calculate positions based on lat/lng
      if (customMap) {
        const [[minLat, minLng], [maxLat, maxLng]] = customMap.bounds;
        const latRange = maxLat - minLat;
        const lngRange = maxLng - minLng;
        
        const stylized = locations.map((loc) => {
          // Convert lat/lng to percentage position (0-1 range)
          const normalizedLat = (loc.lat - minLat) / latRange;
          const normalizedLng = (loc.lng - minLng) / lngRange;
          
          // Map to SVG coordinates (800x400)
          // Note: SVG Y axis goes down, so we invert the lat
          const x = 50 + normalizedLng * 700; // Leave some padding
          const y = 50 + (1 - normalizedLat) * 300; // Leave some padding, invert Y
          
          return {
            id: loc.id,
            name: loc.title,
            x: Math.max(50, Math.min(750, x)),
            y: Math.max(50, Math.min(350, y)),
            icon: loc.category === 'crime_scene' ? '🚨' : 
                  loc.category === 'residence' ? '🏠' : 
                  loc.category === 'business' ? '🏢' : 
                  loc.category === 'public' ? '🏛️' : '📍'
          };
        });
        
        setStylizedLocations(stylized);
      } else {
        // Use template-based positioning for backward compatibility
        const template = getStylizedTemplate(mapTemplateId || 'small_town');
        
        const stylized = locations.map((loc, idx) => {
          let x: number, y: number;
          
          switch (template) {
            case 'small_town':
              x = 200 + (idx % 3) * 200;
              y = 200 + (Math.floor(idx / 3) % 2) * 150;
              break;
            case 'city_district':
              x = 150 + (idx % 4) * 175;
              y = 180 + (Math.floor(idx / 4) % 2) * 100;
              break;
            case 'industrial_zone':
              x = 100 + (idx % 5) * 140;
              y = 150 + (idx % 2) * 150;
              break;
            case 'countryside':
              x = 150 + (idx % 4) * 180 + (idx % 2) * 30;
              y = 150 + (Math.floor(idx / 4) % 2) * 180 + (idx % 3) * 40;
              break;
            default:
              x = 200 + (idx % 3) * 200;
              y = 200 + (Math.floor(idx / 3) % 2) * 150;
          }
          
          return {
            id: loc.id,
            name: loc.title,
            x: Math.max(50, Math.min(750, x)),
            y: Math.max(50, Math.min(350, y)),
            icon: loc.category === 'crime_scene' ? '🚨' : 
                  loc.category === 'residence' ? '🏠' : 
                  loc.category === 'business' ? '🏢' : 
                  loc.category === 'public' ? '🏛️' : '📍'
          };
        });
        
        setStylizedLocations(stylized);
      }
    }
  }, [locations, mapTemplateId, customMap]);
  
  // Render stylized map when mode is 'scheme'
  if (mode === 'scheme') {
    return (
      <div className="relative w-full h-full bg-[#f5f5f4] rounded-lg overflow-hidden shadow-inner">
        {/* Custom map background image */}
        {customMap && (
          <img
            src={`/scenarios/${locations[0]?.id ? locations[0].id.split('-')[0] + '-' + locations[0].id.split('-')[1] : 'case-001'}/${customMap.backgroundImage}`}
            alt="Map background"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
          />
        )}
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <StylizedMap
            template={customMap ? 'small_town' : getStylizedTemplate(mapTemplateId || 'small_town')}
            locations={stylizedLocations}
            activeLocationId={selectedId || undefined}
            onLocationClick={(loc) => onSelect(loc.id)}
            visitedLocationIds={discovered}
          />
        </div>
      </div>
    );
  }
  
  // Render real Leaflet map when mode is 'satellite'
  useEffect(()=>{
    if(!ref.current||!window.L)return;
    const L=window.L;
    const map=L.map(ref.current,{zoomControl:false,attributionControl:true,maxBounds:mapBounds,maxBoundsViscosity:1,minZoom:minZoom,maxZoom:maxZoom,zoomSnap:.5,zoomDelta:.5,keyboard:true}).fitBounds(mapBounds,{padding:[8,8],animate:false});
    L.control.zoom({position:'bottomright'}).addTo(map);
    map.setView(defaultCenter,defaultZoom);
    mapRef.current=map;
    return()=>{map.remove();mapRef.current=null}
  },[mapBounds,minZoom,maxZoom,defaultCenter,defaultZoom]);
  useEffect(()=>{
    const map=mapRef.current;if(!map||!window.L)return;const L=window.L;
    map.eachLayer((layer:any)=>{if(layer._url)map.removeLayer(layer)});
    const url=mode==='satellite'?'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}':'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    L.tileLayer(url,{minZoom:minZoom,maxZoom:maxZoom,attribution:mode==='satellite'?'Tiles © Esri':'© OpenStreetMap contributors',noWrap:true}).addTo(map);
    map.setMaxBounds(mapBounds);
  },[mode,mapBounds,minZoom,maxZoom]);
  useEffect(()=>{
    const map=mapRef.current;if(!map||!window.L)return;const L=window.L;
    layers.current.forEach(l=>l.remove());layers.current=[];
    locations.forEach(loc=>{
      const open=discovered.includes(loc.id),selected=selectedId===loc.id;
      const markerColor=selected?'#e7c776':open?'#edf0ed':'#707675';
      const html=`<button aria-label="${loc.title}" class="leaflet-case-marker ${selected?'selected':''} ${open?'open':'locked'}" style="--marker:${markerColor}"><span class="marker-core">${open?'':'×'}</span><span class="marker-ring"></span></button>`;
      const icon=L.divIcon({className:'case-marker-wrap',html,iconSize:[42,42],iconAnchor:[21,21]});
      const marker=L.marker([loc.lat,loc.lng],{icon,opacity:open||selected?1:.48,keyboard:true,zIndexOffset:selected?500:open?100:0}).addTo(map);
      marker.on('click',()=>onSelect(loc.id));
      marker.bindTooltip(`<b>${loc.title}</b><br><span>${open?'Открыта для исследования':'Пока неизвестна'}</span>`,{direction:'top',offset:[0,-16],opacity:.96,sticky:true});
      layers.current.push(marker);
    });
    if(selectedId){const selected=locations.find(x=>x.id===selectedId);if(selected)map.panInside([selected.lat,selected.lng],{paddingTopLeft:[40,40],paddingBottomRight:[80,40],animate:true});}
  },[locations,discovered,selectedId,onSelect]);
  return <div ref={ref} className="absolute inset-0"/>;
}
