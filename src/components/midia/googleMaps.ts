let loader: Promise<any> | null = null;
export function loadGoogleMaps(): Promise<any> {
  const w = window as any;
  if (w.google?.maps?.Map) return Promise.resolve(w.google);
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    w.__pattyMapsReady = () => resolve(w.google);
    const env = import.meta.env as Record<string, string | undefined>;
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY']}&loading=async&callback=__pattyMapsReady&language=pt-BR&region=BR&channel=${env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID']}`;
    s.async = true; s.onerror = () => { loader = null; reject(new Error('Não foi possível carregar o mapa')); };
    document.head.appendChild(s);
  });
  return loader;
}
