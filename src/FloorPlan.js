import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

const FloorPlan = () => {
  useEffect(() => {
    // Initialiser la carte
    const map = L.map("map").setView([0, 0], 2);

    // Ajouter un fond de carte (modifiable)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Groupe pour stocker les dessins
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Ajouter les contrôles de dessin
    const drawControl = new L.Control.Draw({
      edit: { featureGroup: drawnItems },
      draw: { polygon: true, rectangle: false, circle: false, marker: false, polyline: false },
    });
    map.addControl(drawControl);

    // Ajouter une zone dessinée
    map.on(L.Draw.Event.CREATED, (event) => {
      drawnItems.addLayer(event.layer);
    });

    // Fonction d'exportation en GeoJSON
    const exportToGeoJSON = () => {
      const geojson = drawnItems.toGeoJSON();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojson, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "zones.geojson");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      document.body.removeChild(downloadAnchorNode);
    };

    // Ajouter un bouton pour exporter
    const button = document.getElementById("exportButton");
    button.addEventListener("click", exportToGeoJSON);

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div id="map" className="w-full h-[500px] border rounded-lg shadow-md"></div>
      <button
        id="exportButton"
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Exporter en GeoJSON
      </button>
    </div>
  );
};

export default FloorPlan;
