import React, { useState } from 'react';
import { MapContainer, TileLayer, LayersControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GameMapProps {
  center?: [number, number];
  zoom?: number;
  children: React.ReactNode;
}

const BaseLayerTracker = () => {
  useMapEvents({
    baselayerchange: (e) => {
      localStorage.setItem("nl_quiz_basemap", e.name);
    }
  });
  return null;
};

export const GameMap: React.FC<GameMapProps> = ({
  center = [52.1326, 5.2913],
  zoom = 8,
  children
}) => {
  const [activeLayer, _] = useState<string>(() => {
    return localStorage.getItem("nl_quiz_basemap") || "Light";
  });

  return (
    <div className="h-full w-full rounded-lg overflow-hidden shadow-lg border-2 border-gray-200 z-0 relative">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        renderer={L.canvas()}
        scrollWheelZoom={true}
        zoomSnap={0.1}
        preferCanvas={true}
        doubleClickZoom={false}
        zoomControl={false}
      >
        <BaseLayerTracker />
        <LayersControl position="topleft">

          <LayersControl.BaseLayer checked={activeLayer === "Light"} name="Light">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer checked={activeLayer === "Dark"} name="Dark">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer checked={activeLayer === "Satellite"} name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer checked={activeLayer === "Names"} name="Names">
            <TileLayer
              url="tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

        </LayersControl>
        {children}
      </MapContainer>
    </div>
  );
};
