import {useEffect,useRef,useState} from 'react';
import type {Location,MapMode} from './types';
import type {GameMapTemplate} from './maps/templates';
import StylizedMap from './maps/components/StylizedMap';
import {getStylizedTemplate, getMapBackgroundImage, getLocationCoordinates} from './maps/templates';

declare global{interface Window{L:any}}

const MAP_BOUNDS:[[number,number],[number,number]]=[[47.589,-122.340],[47.623,-122.296]];
const MIN_ZOOM=13;
const MAX_ZOOM=16;

export default function MapView({locations,discovered,selectedId,mode,onSelect,mapTemplateId}:{locations:Location[];discovered:string[];selectedId:string|null;mode:MapMode;onSelect:(id:string)=>void;mapTemplateId?:string}){
  const ref=useRef<HTMLDivElement>(null), mapRef=useRef<any>(null), layers=useRef<any[]>([]);
  const [stylizedLocations, setStylizedLocations] = useState<Array<{id:string;name:string;x:number;y:number;icon?:string}>>([]);
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(undefined);
  const [locationCoords, setLocationCoords] = useState<Record<string, { x: number; y: number }> | undefined>(undefined);
  
  // Convert real locations to stylized map coordinates
  useEffect(() => {
    if (locations.length > 0 && mapTemplateId) {
      // Get background image for custom maps
      const bgImg = getMapBackgroundImage(mapTemplateId);
      if (bgImg) {
        setBackgroundImage(`/scenarios/case-001/${bgImg}`);
      }
      
      // Get location coordinates - prioritize from scenario data, then from template
      const coords: Record<string, { x: number; y: number }> = {};
      
      locations.forEach((loc) => {
        // First check if location has coordinates in scenario data (as percentages)
        if ((loc as any).coordinates) {
          const pctCoords = (loc as any).coordinates as { x: number; y: number };
          // Convert percentages to pixels (assuming 800x400 base SVG size)
          coords[loc.id] = {
            x: (pctCoords.x / 100) * 800,
            y: (pctCoords.y / 100) * 400
          };
        } else {
          // Fall back to template-defined coordinates
          const customCoords = getLocationCoordinates(mapTemplateId, loc.id);
          if (customCoords) {
            coords[loc.id] = customCoords;
          }
        }
      });
      
      const template = getStylizedTemplate(mapTemplateId || 'small_town');
      
      // Generate stylized coordinates based on location index and template
      const stylized = locations.map((loc, idx) => {
        // Check if we have coordinates (from scenario or template)
        const coord = coords[loc.id];
        if (coord) {
          return {
            id: loc.id,
            name: loc.title,
            x: coord.x,
            y: coord.y,
            icon: loc.category === 'crime_scene' ? '🚨' : 
                  loc.category === 'residence' ? '🏠' : 
                  loc.category === 'business' ? '🏢' : 
                  loc.category === 'public' ? '🏛️' : '📍'
          };
        }
        
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
  }, [locations, mapTemplateId]);
  
  // Render stylized map when mode is 'scheme'
  if (mode === 'scheme') {
    return (
      <div className="absolute inset-0">
        <StylizedMap
          template={getStylizedTemplate(mapTemplateId || 'small_town')}
          locations={stylizedLocations}
          activeLocationId={selectedId || undefined}
          onLocationClick={(loc) => onSelect(loc.id)}
          visitedLocationIds={discovered}
          backgroundImage={backgroundImage}
          locationCoordinates={locationCoords}
        />
      </div>
    );
  }
  
  // Render real Leaflet map when mode is 'satellite'
  useEffect(()=>{
    if(!ref.current||!window.L)return;
    const L=window.L;
    const map=L.map(ref.current,{zoomControl:false,attributionControl:true,maxBounds:MAP_BOUNDS,maxBoundsViscosity:1,minZoom:MIN_ZOOM,maxZoom:MAX_ZOOM,zoomSnap:.5,zoomDelta:.5,keyboard:true}).fitBounds(MAP_BOUNDS,{padding:[8,8],animate:false});
    L.control.zoom({position:'bottomright'}).addTo(map);
    map.setView([47.6088,-122.313],14.2);
    mapRef.current=map;
    return()=>{map.remove();mapRef.current=null}
  },[]);
  useEffect(()=>{
    const map=mapRef.current;if(!map||!window.L)return;const L=window.L;
    map.eachLayer((layer:any)=>{if(layer._url)map.removeLayer(layer)});
    const url=mode==='satellite'?'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}':'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    L.tileLayer(url,{minZoom:MIN_ZOOM,maxZoom:MAX_ZOOM,attribution:mode==='satellite'?'Tiles © Esri':'© OpenStreetMap contributors',noWrap:true}).addTo(map);
    map.setMaxBounds(MAP_BOUNDS);
  },[mode]);
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
