import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from './googleMaps';

export type MapPin = { id: string; lat: number; lng: number; title: string };
const BRASIL = { lat: -15.78, lng: -47.93 };

/** Mapa com marcadores; se `onPick` existir, clicar/arrastar define a posição. */
export function MapaPontos({ pins, onPick, onSelect, className }: { pins: MapPin[]; onPick?: (lat: number, lng: number) => void; onSelect?: (id: string) => void; className?: string }) {
  const el = useRef<HTMLDivElement>(null); const map = useRef<any>(null); const markers = useRef<any[]>([]);
  const [ready, setReady] = useState(false); const [erro, setErro] = useState('');
  const pickRef = useRef(onPick); pickRef.current = onPick;
  useEffect(() => { let alive = true; loadGoogleMaps().then(g => {
    if (!alive || !el.current) return;
    map.current = new g.maps.Map(el.current, { center: BRASIL, zoom: 4, clickableIcons: false, streetViewControl: false, mapTypeControl: true });
    map.current.addListener('click', (e: any) => pickRef.current?.(e.latLng.lat(), e.latLng.lng()));
    setReady(true);
  }).catch(e => setErro(e.message)); return () => { alive = false; }; }, []);
  useEffect(() => {
    if (!ready) return; const g = (window as any).google;
    markers.current.forEach(m => m.setMap(null));
    markers.current = pins.map(p => { const m = new g.maps.Marker({ position: { lat: p.lat, lng: p.lng }, map: map.current, title: p.title, draggable: !!onPick });
      if (onPick) m.addListener('dragend', (e: any) => pickRef.current?.(e.latLng.lat(), e.latLng.lng()));
      if (onSelect) m.addListener('click', () => onSelect(p.id)); return m; });
    const first = pins[0];
    if (pins.length === 1 && first) { map.current.setCenter({ lat: first.lat, lng: first.lng }); if (map.current.getZoom() < 14) map.current.setZoom(16); }
    else if (pins.length > 1) { const b = new g.maps.LatLngBounds(); pins.forEach(p => b.extend({ lat: p.lat, lng: p.lng })); map.current.fitBounds(b); }
  }, [ready, pins, onPick, onSelect]);
  return <div className={`relative overflow-hidden rounded-2xl border bg-surface-elevated ${className ?? 'h-80'}`}>
    <div ref={el} className="absolute inset-0" />
    {erro && <div className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-text-secondary">{erro}</div>}
  </div>;
}
export default MapaPontos;
