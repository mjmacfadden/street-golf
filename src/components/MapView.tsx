import { Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Hole } from '../types';
import { useEffect, useRef, Fragment } from 'react';

function MapHandler({ holes, currentHoleIndex }: { holes: Hole[], currentHoleIndex: number | null }) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const courseLinesRef = useRef<google.maps.Polyline[]>([]);

  // Draw course lines
  useEffect(() => {
    if (!map || !mapsLib || holes.length === 0) return;

    // Clear old lines
    courseLinesRef.current.forEach(line => line.setMap(null));
    courseLinesRef.current = [];

    // 1. Draw individual fairway lines (Tee to Pin)
    holes.forEach((hole, idx) => {
      const fairwayLine = new google.maps.Polyline({
        path: [hole.teeLocation, hole.pinLocation],
        geodesic: true,
        strokeColor: '#BFFF00', // lime
        strokeOpacity: currentHoleIndex === idx ? 0.9 : 0.3,
        strokeWeight: currentHoleIndex === idx ? 6 : 2,
        map: map
      });
      courseLinesRef.current.push(fairwayLine);
    });

    // 2. Draw the 'Course Walk' (Pin to next Tee)
    const walkPaths = holes.slice(0, -1).map((hole, idx) => ({
      path: [hole.pinLocation, holes[idx + 1].teeLocation]
    }));

    walkPaths.forEach(walk => {
      const walkLine = new google.maps.Polyline({
        path: walk.path,
        geodesic: true,
        strokeColor: '#FFFFFF', 
        strokeOpacity: 0.2, // Very subtle walk path
        strokeWeight: 1,
        icons: [{
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 },
          offset: '0',
          repeat: '10px'
        }],
        map: map
      });
      courseLinesRef.current.push(walkLine);
    });

    return () => {
      courseLinesRef.current.forEach(line => line.setMap(null));
    };
  }, [map, mapsLib, holes, currentHoleIndex]);

  // Center on current hole or whole course
  useEffect(() => {
    if (!map || holes.length === 0) return;

    if (currentHoleIndex !== null) {
      // Calculate center and zoom for the hole
      const tee = holes[currentHoleIndex].teeLocation;
      const pin = holes[currentHoleIndex].pinLocation;
      const centerLat = (tee.lat + pin.lat) / 2;
      const centerLng = (tee.lng + pin.lng) / 2;
      
      // Pan to center with smooth animation
      map.panTo({ lat: centerLat, lng: centerLng });
      // Zoom in with intermediary step to avoid fade effect
      map.setZoom(19);
      setTimeout(() => {
        map.setZoom(20);
      }, 500);
    } else {
      // Default view: Show full course at zoom level 15
      map.setCenter(holes[0].teeLocation);
      map.setZoom(18);
    }
  }, [map, holes, currentHoleIndex]);

  return null;
}

interface MapViewProps {
  holes: Hole[];
  currentHoleIndex: number | null;
  onMarkerClick: (index: number) => void;
}

export default function MapView({ holes, currentHoleIndex, onMarkerClick }: MapViewProps) {
  return (
    <div className="relative w-full h-full">
      <Map
        defaultCenter={holes[0]?.teeLocation || { lat: 42.12060, lng: -87.78430 }}
        defaultZoom={16}
        mapId="DEMO_MAP_ID"
        mapTypeId="satellite"
        disableDefaultUI={true}
        gestureHandling="greedy"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
        onClick={(e) => {
          if (e.detail.latLng) {
            console.log(`STREET GOLF COORDS: { lat: ${e.detail.latLng.lat.toFixed(6)}, lng: ${e.detail.latLng.lng.toFixed(6)} }`);
          }
        }}
      >
        <MapHandler holes={holes} currentHoleIndex={currentHoleIndex} />
        {holes.map((hole, idx) => (
          <Fragment key={hole.number}>
            {/* Tee Marker */}
            <AdvancedMarker
              position={hole.teeLocation}
              onClick={() => onMarkerClick(idx)}
              zIndex={currentHoleIndex === idx ? 10 : 1}
            >
              <div className={`p-1.5 rounded-sm border-2 ${currentHoleIndex === idx ? 'bg-white border-lime scale-110 shadow-[0_0_15px_rgba(191,255,0,0.5)]' : 'bg-dark border-white/20 opacity-40'} transition-all`}>
                <p className={`text-[10px] font-black leading-none italic ${currentHoleIndex === idx ? 'text-dark' : 'text-white'}`}>T{hole.number}</p>
              </div>
            </AdvancedMarker>

            {/* Pin Marker */}
            <AdvancedMarker
              position={hole.pinLocation}
              onClick={() => onMarkerClick(idx)}
              zIndex={currentHoleIndex === idx ? 20 : 5}
            >
              <Pin
                background={currentHoleIndex === idx ? '#BFFF00' : '#1e293b'}
                glyphColor={currentHoleIndex === idx ? '#010409' : '#fff'}
                borderColor={'#fff'}
                glyph={hole.number.toString()}
                scale={currentHoleIndex === idx ? 1.2 : 0.8}
              />
            </AdvancedMarker>
          </Fragment>
        ))}
      </Map>
    </div>
  );
}
