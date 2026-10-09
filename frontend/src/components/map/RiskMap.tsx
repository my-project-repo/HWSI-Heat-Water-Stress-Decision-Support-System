import { useMemo, useCallback, useState, useEffect } from 'react';
import ReactMap, { Source, Layer, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_DEFAULTS } from '@/lib/constants';
import type { BlockRisk } from '@/lib/types';

interface RiskMapProps {
  activeLayer: string;
  riskData: BlockRisk[] | undefined;
  selectedBlockId: string | null;
  onBlockSelect: (id: string | null) => void;
}

export function RiskMap({ activeLayer, riskData, selectedBlockId, onBlockSelect }: RiskMapProps) {
  const [geojsonData, setGeojsonData] = useState<any>(null);

  useEffect(() => {
    fetch('/blocks.geojson')
      .then(res => res.json())
      .then(data => setGeojsonData(data))
      .catch(err => console.error("Could not load geojson", err));
  }, []);

  const mergedGeoJson = useMemo(() => {
    if (!geojsonData || !riskData) return geojsonData;
    
    const riskMap: Record<string, BlockRisk> = Object.fromEntries(
      riskData.map(d => [d.block_id, d])
    );
    
    return {
      ...geojsonData,
      features: geojsonData.features.map((f: any) => {
        const risk = riskMap[f.properties.block_id];
        return {
          ...f,
          properties: {
            ...f.properties,
            hwsi: risk?.hwsi || 0,
            heat_hazard: risk?.heat_hazard || 0,
            water_stress: risk?.water_stress || 0,
            h_score: risk?.h_score || 0,
            e_score: risk?.e_score || 0,
            v_score: risk?.v_score || 0,
          }
        };
      })
    };
  }, [geojsonData, riskData]);

  const paintProps = useMemo(() => {
    return {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', activeLayer],
        0, '#22c55e',
        0.33, '#eab308',
        0.66, '#f97316',
        1, '#ef4444'
      ],
      'fill-opacity': 0.7
    };
  }, [activeLayer]);

  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      if (feature.properties && feature.properties.block_id) {
        setHoveredBlockId(feature.properties.block_id);
        return;
      }
    }
    setHoveredBlockId(null);
  }, []);

  const onMouseLeave = useCallback(() => {
    setHoveredBlockId(null);
  }, []);

  const onMapClick = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      if (feature.properties && feature.properties.block_id) {
        onBlockSelect(feature.properties.block_id);
      }
    } else {
      onBlockSelect(null);
    }
  }, [onBlockSelect]);

  return (
    <div className="w-full h-full relative">
      <ReactMap
        mapLib={maplibregl}
        initialViewState={{
          longitude: MAP_DEFAULTS.center.longitude,
          latitude: MAP_DEFAULTS.center.latitude,
          zoom: MAP_DEFAULTS.zoom
        }}
        mapStyle="https://demotiles.maplibre.org/style.json"
        interactiveLayerIds={['blocks-fill']}
        cursor={hoveredBlockId ? 'pointer' : ''}
        onClick={onMapClick}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        {mergedGeoJson && (
          <Source type="geojson" data={mergedGeoJson}>
            {/* Base Heatmap Fill */}
            <Layer 
              id="blocks-fill" 
              type="fill" 
              paint={paintProps as any} 
            />

            {/* Standard Block Borders */}
            <Layer 
              id="blocks-line" 
              type="line" 
              paint={{
                'line-color': '#ffffff',
                'line-width': 1,
                'line-opacity': 0.75
              }} 
            />

            {/* Subtle Hover Outline */}
            <Layer 
              id="blocks-hover-stroke" 
              type="line" 
              paint={{
                'line-color': '#ffffff',
                'line-width': [
                  'case', 
                  ['all', ['==', ['get', 'block_id'], hoveredBlockId || ''], ['!=', ['get', 'block_id'], selectedBlockId || '']], 
                  2, 
                  0
                ],
                'line-opacity': 0.95
              }} 
            />

            {/* Selected Block: Luminous Surface Lift */}
            <Layer 
              id="blocks-selected-fill" 
              type="fill" 
              paint={{
                'fill-color': '#ffffff',
                'fill-opacity': ['case', ['==', ['get', 'block_id'], selectedBlockId || ''], 0.16, 0]
              }} 
            />

            {/* Selected Block: Soft Ambient Glow */}
            <Layer 
              id="blocks-selected-glow" 
              type="line" 
              paint={{
                'line-color': '#2563eb',
                'line-width': ['case', ['==', ['get', 'block_id'], selectedBlockId || ''], 6, 0],
                'line-blur': 3,
                'line-opacity': 0.45
              }} 
            />

            {/* Selected Block: Vibrant Accent Border */}
            <Layer 
              id="blocks-selected-stroke" 
              type="line" 
              paint={{
                'line-color': '#1d4ed8',
                'line-width': ['case', ['==', ['get', 'block_id'], selectedBlockId || ''], 2.5, 0],
                'line-opacity': 1
              }} 
            />

            {/* Selected Block: Crisp Luminous Inner Highlight */}
            <Layer 
              id="blocks-selected-inner" 
              type="line" 
              paint={{
                'line-color': '#ffffff',
                'line-width': ['case', ['==', ['get', 'block_id'], selectedBlockId || ''], 1, 0],
                'line-opacity': 0.9
              }} 
            />
          </Source>
        )}
      </ReactMap>
    </div>
  );
}
