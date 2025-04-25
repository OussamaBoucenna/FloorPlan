const exportToGeoJSON = (walls, pois, doors, windows, zones, rooms,scale,offset,canvasSize) => {
  const geoJSONData = {
    "type": "FeatureCollection",
    "features": []
  };
  
 // Exporter les murs
 if (walls && walls.length > 0) {
  walls.forEach((wall, index) => {
    // Extraire les points de départ et d'arrivée en gérant le cas où start contient une référence wall
    const start = wall.start && wall.start.wall ? 
      { x: wall.start.x, y: wall.start.y } : wall.start;
    
    const wallFeature = {
      "type": "Feature",
      "id": index + 1,
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [start.x, start.y],
          [wall.end.x, wall.end.y]
        ]
      },
      "properties": {
        "class_name": "wall",
        "thickness": wall.thickness || 12,
        "wallId": wall.wallId !== undefined ? wall.wallId : index,
        "length": Math.sqrt(
          Math.pow(wall.end.x - start.x, 2) + 
          Math.pow(wall.end.y - start.y, 2)
        )
      }
    };
    
    geoJSONData.features.push(wallFeature);
  });
}
  
  // Exporter les POI
  if (pois && pois.length > 0) {
    pois.forEach((poi, index) => {
      const poiFeature = {
        "type": "Feature",
        "id": `poi-${index + 1}`,
        "geometry": {
          "type": "Point",
          "coordinates": [poi.x, poi.y]
        },
        "properties": {
          "class_name": "poi",
          "name": poi.name || `POI ${index + 1}`,
          "type": poi.category || "default",
          "description": poi.description || "",
          "icon": poi.icon || null,
          "width": poi.width || 50,
          "height": poi.height || 50,
          "original_id": poi.id
        }
      };
      
      geoJSONData.features.push(poiFeature);
    });
  }
  
  // // Exporter les portes
  // if (doors && doors.length > 0) {
  //   doors.forEach((door, index) => {
  //     const doorFeature = {
  //       "type": "Feature",
  //       "id": `door-${index + 1}`,
  //       "geometry": {
  //         "type": "LineString",
  //         "coordinates": [
  //           [door.start.x, door.start.y],
  //           [door.end.x, door.end.y]
  //         ]
  //       },
  //       "properties": {
  //         "class_name": "door",
  //         "width": door.width || 1,
  //         "original_id": door.id,
  //         "doorType": door.doorType || "standard"
  //       }
  //     };
      
  //     geoJSONData.features.push(doorFeature);
  //   });
  // }
  
  // // Exporter les fenêtres
  // if (windows && windows.length > 0) {
  //   windows.forEach((window, index) => {
  //     const windowFeature = {
  //       "type": "Feature",
  //       "id": `window-${index + 1}`,
  //       "geometry": {
  //         "type": "LineString",
  //         "coordinates": [
  //           [window.start.x, window.start.y],
  //           [window.end.x, window.end.y]
  //         ]
  //       },
  //       "properties": {
  //         "class_name": "window",
  //         "width": window.width || 1,
  //         "original_id": window.id
  //       }
  //     };
      
  //     geoJSONData.features.push(windowFeature);
  //   });
  // }
  
  // // Exporter les zones
  // if (zones && zones.length > 0) {
  //   zones.forEach((zone, index) => {
  //     let geometry;
      
  //     if (zone.shapeType === "rectangle") {
  //       geometry = {
  //         "type": "Polygon",
  //         "coordinates": [[
  //           [zone.x, zone.y],
  //           [zone.x + zone.width, zone.y],
  //           [zone.x + zone.width, zone.y + zone.height],
  //           [zone.x, zone.y + zone.height],
  //           [zone.x, zone.y] // Fermeture du polygone
  //         ]]
  //       };
  //     } else if (zone.shapeType === "circle") {
  //       // Pour les cercles, on crée un polygone avec 36 points
  //       const points = [];
  //       for (let i = 0; i <= 36; i++) {
  //         const angle = (i / 36) * Math.PI * 2;
  //         const x = zone.x + zone.radius * Math.cos(angle);
  //         const y = zone.y + zone.radius * Math.sin(angle);
  //         points.push([x, y]);
  //       }
  //       geometry = {
  //         "type": "Polygon",
  //         "coordinates": [points]
  //       };
  //     } else if (zone.shapeType === "polygon" && zone.points && zone.points.length > 0) {
  //       // Assurez-vous que le polygone est fermé (premier et dernier points identiques)
  //       const points = [...zone.points];
  //       if (points[0][0] !== points[points.length - 1][0] || 
  //           points[0][1] !== points[points.length - 1][1]) {
  //         points.push([points[0][0], points[0][1]]);
  //       }
  //       geometry = {
  //         "type": "Polygon",
  //         "coordinates": [points]
  //       };
  //     }
      
  //     if (geometry) {
  //       const zoneFeature = {
  //         "type": "Feature",
  //         "id": `zone-${index + 1}`,
  //         "geometry": geometry,
  //         "properties": {
  //           "class_name": "zone",
  //           "name": zone.name || `Zone ${index + 1}`,
  //           "type": zone.type || "circulation",
  //           "original_id": zone.id
  //         }
  //       };
        
  //       geoJSONData.features.push(zoneFeature);
  //     }
  //   });
  // }

  // // Exporter les pièces (si disponibles)
  // if (rooms && rooms.length > 0) {
  //   rooms.forEach((room, index) => {
  //     if (room.points && room.points.length > 2) {
  //       // Assurez-vous que le polygone est fermé
  //       const pointsCopy = [...room.points];
  //       if (pointsCopy[0].x !== pointsCopy[pointsCopy.length - 1].x || 
  //           pointsCopy[0].y !== pointsCopy[pointsCopy.length - 1].y) {
  //         pointsCopy.push(pointsCopy[0]);
  //       }
        
  //       // Convertir en format GeoJSON
  //       const coordinates = pointsCopy.map(p => [p.x, p.y]);
        
  //       const roomFeature = {
  //         "type": "Feature",
  //         "id": `room-${index + 1}`,
  //         "geometry": {
  //           "type": "Polygon",
  //           "coordinates": [coordinates]
  //         },
  //         "properties": {
  //           "class_name": "room",
  //           "name": room.name || `Room ${index + 1}`,
  //           "original_id": room.id
  //         }
  //       };
        
  //       geoJSONData.features.push(roomFeature);
  //     }
  //   });
  // }
  
  // Métadonnées (échelle, décalage, etc.)
  geoJSONData.metadata = {
    "scale": scale || 1,
    "offset": offset || { x: 0, y: 0 },
    "canvasSize": canvasSize || { width: 800, height: 600 }
    
  };
  
   // Créer et télécharger le fichier GeoJSON
   const jsonStr = JSON.stringify(geoJSONData, null, 2);
   const blob = new Blob([jsonStr], { type: 'application/geo+json' });
   const url = URL.createObjectURL(blob);
       
   const a = document.createElement('a');
   a.href = url;
   a.download = 'indoor_mapping.geojson';
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   URL.revokeObjectURL(url);
       
   console.log("Floor plan exported successfully");
   return jsonStr
};



const importFromGeoJSON = (jsonData,setWalls,
  setPois,
  setDoors,
  setWindows,
  setZones,
  setRooms,
  setScale,
  setOffset,
  setCanvasSize) => {


  try {
    // Conversion de la chaîne JSON en objet si nécessaire
    const geoJSONData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    
    // Vérification de la validité du GeoJSON
    if (!geoJSONData || !geoJSONData.features || !Array.isArray(geoJSONData.features)) {
      console.error('Format GeoJSON invalide');
      return false;
    }

    // Initialisation des collections
    const newWalls = [];
    const newPOIs = [];
    const newDoors = [];
    const newWindows = [];
    const newZones = [];
    const newRooms = [];
    
    // Traitement des features
    geoJSONData.features.forEach(feature => {
      try {
        // Validation commune pour tous les éléments
        if (!feature.properties || !feature.geometry) {
          console.warn('Feature invalide : propriétés ou géométrie manquantes', feature);
          return;
        }

        const className = feature.properties.class_name;
        
        // Traitement des murs
        if (className === "wall" && feature.geometry.type === "LineString") {
          const coords = feature.geometry.coordinates;
          
          // Validation des coordonnées
          if (!coords || coords.length < 2) {
            console.warn('Coordonnées de mur invalides', feature);
            return;
          }
          
          const [start, end] = coords;
          const wall = {
            start: { x: start[0], y: start[1] },
            end: { x: end[0], y: end[1] },
            thickness: feature.properties.thickness || 12,
            wallId: feature.properties.wallId || newWalls.length
          };

          
          newWalls.push(wall);
        } 
        // Traitement des POIs
        else if (className === "poi" && feature.geometry.type === "Point") {
          const coords = feature.geometry.coordinates;
          
          // Validation des coordonnées
          if (!coords || coords.length < 2) {
            console.warn('Coordonnées de POI invalides', feature);
            return;
          }
          
          const [x, y] = coords;
          const poi = {
            id: feature.properties.original_id || `poi-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
            x: x,
            y: y,
            name: feature.properties.name || `POI ${newPOIs.length + 1}`,
            category: feature.properties.type || "default",
            description: feature.properties.description || "",
            icon: feature.properties.icon || null,
            width: feature.properties.width || 50,
            height: feature.properties.height || 50
          };
          
          newPOIs.push(poi);
        }
        // // Traitement des portes
        // else if (className === "door" && feature.geometry.type === "LineString") {
        //   const coords = feature.geometry.coordinates;
          
        //   if (!coords || coords.length < 2) {
        //     console.warn('Coordonnées de porte invalides', feature);
        //     return;
        //   }
          
        //   const [start, end] = coords;
        //   const door = {
        //     id: feature.properties.original_id || `door-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
        //     start: { x: start[0], y: start[1] },
        //     end: { x: end[0], y: end[1] },
        //     width: feature.properties.width || 1,
        //     doorType: feature.properties.doorType || "standard"
        //   };
          
        //   newDoors.push(door);
        // }
        // // Traitement des fenêtres
        // else if (className === "window" && feature.geometry.type === "LineString") {
        //   const coords = feature.geometry.coordinates;
          
        //   if (!coords || coords.length < 2) {
        //     console.warn('Coordonnées de fenêtre invalides', feature);
        //     return;
        //   }
          
        //   const [start, end] = coords;
        //   const window = {
        //     id: feature.properties.original_id || `window-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
        //     start: { x: start[0], y: start[1] },
        //     end: { x: end[0], y: end[1] },
        //     width: feature.properties.width || 1
        //   };
          
        //   newWindows.push(window);
        // }
        // // Traitement des zones
        // else if (className === "zone" && feature.geometry.type === "Polygon") {
        //   const coords = feature.geometry.coordinates[0]; // Première et seule boucle pour un polygon simple
          
        //   if (!coords || coords.length < 3) {
        //     console.warn('Coordonnées de zone invalides', feature);
        //     return;
        //   }
          
        //   const zone = {
        //     id: feature.properties.original_id || `zone-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
        //     name: feature.properties.name || `Zone ${newZones.length + 1}`,
        //     type: feature.properties.type || "circulation"
        //   };

        //   // Détecter le type de forme
        //   const isRectangle = coords.length === 5 && 
        //                       coords[0][0] === coords[4][0] && coords[0][1] === coords[4][1] &&
        //                       coords[0][0] === coords[3][0] && coords[1][1] === coords[2][1] &&
        //                       coords[0][1] === coords[1][1] && coords[2][0] === coords[3][0];
          
        //   if (isRectangle) {
        //     zone.shapeType = "rectangle";
        //     zone.x = coords[0][0];
        //     zone.y = coords[0][1];
        //     zone.width = coords[1][0] - coords[0][0];
        //     zone.height = coords[2][1] - coords[1][1];
        //   } else {
        //     // Vérifier si c'est un cercle approximatif ou un polygone
        //     const isCircleLike = coords.length >= 30; // Approximation pour détecter un cercle
            
        //     if (isCircleLike) {
        //       // Calculer le centre moyen
        //       let sumX = 0, sumY = 0;
        //       coords.forEach(point => {
        //         sumX += point[0];
        //         sumY += point[1];
        //       });
        //       const centerX = sumX / coords.length;
        //       const centerY = sumY / coords.length;
              
        //       // Calculer le rayon moyen
        //       let sumRadius = 0;
        //       coords.forEach(point => {
        //         sumRadius += Math.sqrt(
        //           Math.pow(point[0] - centerX, 2) + 
        //           Math.pow(point[1] - centerY, 2)
        //         );
        //       });
        //       const avgRadius = sumRadius / coords.length;
              
        //       zone.shapeType = "circle";
        //       zone.x = centerX;
        //       zone.y = centerY;
        //       zone.radius = avgRadius;
        //     } else {
        //       // C'est un polygone ordinaire
        //       zone.shapeType = "polygon";
        //       zone.points = coords;
        //     }
        //   }
          
        //   newZones.push(zone);
        // }
        // Traitement des pièces
        // else if (className === "room" && feature.geometry.type === "Polygon") {
        //   const coords = feature.geometry.coordinates[0];
          
        //   if (!coords || coords.length < 3) {
        //     console.warn('Coordonnées de pièce invalides', feature);
        //     return;
        //   }
          
        //   const points = coords.map(([x, y]) => ({ x, y }));
          
        //   const room = {
        //     id: feature.properties.original_id || `room-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
        //     name: feature.properties.name || `Room ${newRooms.length + 1}`,
        //     points: points
        //   };
          
        //   newRooms.push(room);
        // }
      } catch (error) {
        console.error('Erreur lors du traitement d\'une feature:', error, feature);
      }
    });
    
    // Récupérer les métadonnées
    if (geoJSONData.metadata) {
      if (geoJSONData.metadata.scale && setScale) {
        setScale(geoJSONData.metadata.scale);
      }
      
      if (geoJSONData.metadata.offset && setOffset) {
        setOffset(geoJSONData.metadata.offset);
      }
      
      if (geoJSONData.metadata.canvasSize && setCanvasSize) {
        setCanvasSize(geoJSONData.metadata.canvasSize);
      }
    }
    
    // Mise à jour de l'état de l'application
    console.log("Mise à jour des murs, POIs, portes, fenêtres, zones et pièces");
    console.log("Nouveaux murs:", newWalls);
    if (setWalls) setWalls(newWalls);
    if (setPois) setPois(newPOIs);
    if (setDoors) setDoors(newDoors);
    if (setWindows) setWindows(newWindows);
    if (setZones) setZones(newZones);
    if (setRooms) setRooms(newRooms);
    
    console.log("Import GeoJSON réussi");
    return true;
  } catch (error) {
    console.error("Erreur lors de l'importation du GeoJSON:", error);
    return false;
  }
};






// const initializeFloorFromGeoJSONSystem = (geoJSONData) => {
//     // Validation initiale du GeoJSON
//     if (!geoJSONData || !geoJSONData.features || !Array.isArray(geoJSONData.features)) {
//       console.error('Format GeoJSON invalide');
//       return { walls: [], pois: [] };
//     }
  
//     const newWalls = [];
//     const newPOIs = [];
  
//     geoJSONData.features.forEach(feature => {
//       try {
//         // Validation commune pour tous les éléments
//         if (!feature.properties || !feature.geometry) {
//           console.warn('Feature invalide : propriétés ou géométrie manquantes', feature);
//           return;
//         }
  
//         // Traitement des murs
//         if (feature.properties.class_name === "wall" && feature.geometry.type === "LineString") {
//           const coords = feature.geometry.coordinates;
          
//           // Validation des coordonnées
//           if (!coords || coords.length < 2 || 
//               !Array.isArray(coords[0]) || !Array.isArray(coords[1]) ||
//               coords[0].length < 2 || coords[1].length < 2) {
//             console.warn('Coordonnées de mur invalides', feature);
//             return;
//           }
  
//           const [start, end] = coords;
//           const wall = {
//             id: feature.properties.original_id || `wall-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
//             start: { x: start[0], y: start[1] },
//             end: { x: end[0], y: end[1] },
//             width: feature.properties.width || 1,
//             length: feature.properties.length || Math.sqrt(
//               Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
//             ),
//             orientation: feature.properties.orientation,
//             properties: feature.properties || {}
//           };
  
//           newWalls.push(wall);
//         } 
//         // Traitement des POIs
//         else if (feature.properties.class_name === "poi" && feature.geometry.type === "Point") {
//           const coords = feature.geometry.coordinates;
          
//           // Validation des coordonnées
//           if (!coords || coords.length < 2 || 
//               typeof coords[0] !== 'number' || 
//               typeof coords[1] !== 'number') {
//             console.warn('Coordonnées de POI invalides', feature);
//             return;
//           }
  
//           const [x, y] = coords;
//           const poi = {
//             id: feature.properties.original_id || `poi-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
//             x: x,
//             y: y,
//             name: feature.properties.name || `POI ${newPOIs.length + 1}`,
//             category: feature.properties.type || "default",
//             description: feature.properties.description || "",
//             icon: feature.properties.icon || null,
//             properties: feature.properties || {}
//           };
  
//           newPOIs.push(poi);
//         }
//       } catch (error) {
//         console.error('Erreur lors du traitement d\'une feature:', error, feature);
//       }
//     });
  
//     // Fonction optionnelle de filtrage des doublons (à implémenter)
//     const uniqueWalls = filterDuplicateWalls ? filterDuplicateWalls(newWalls) : newWalls;
  
//     return {
//       walls: uniqueWalls,
//       pois: newPOIs
//     };
//   };


  
  
  // Fonction utilitaire pour filtrer les murs dupliqués
  const filterDuplicateWalls = (walls, tolerance = 0.01) => {
    const uniqueWalls = [];
  
    // Fonction pour vérifier si deux points sont proches
    const pointsAreClose = (p1, p2) => 
      Math.abs(p1.x - p2.x) < tolerance && 
      Math.abs(p1.y - p2.y) < tolerance;
  
    // Fonction pour vérifier si deux segments sont presque identiques
    const segmentsAreAlmostSame = (seg1, seg2) => 
      (pointsAreClose(seg1.start, seg2.start) && pointsAreClose(seg1.end, seg2.end)) ||
      (pointsAreClose(seg1.start, seg2.end) && pointsAreClose(seg1.end, seg2.start));
  
    // Filtrer les doublons
    walls.forEach(wall => {
      if (!uniqueWalls.some(existingWall => segmentsAreAlmostSame(wall, existingWall))) {
        uniqueWalls.push(wall);
      }
    });
  
    return uniqueWalls;
  };


  // Fonction pour charger le GeoJSON à partir d'un fichier
const loadFloorPlanFromFileSysteme = async (file ,setWalls, 
    setPois, 
    setDoors, 
    setWindows, 
    setJsonData,
    setImageInfo,
    setScale,
    setOffset,
    canvasSize,
    setZones,
    setRooms,
    setCanvasSize
) => {
    try {
      const jsonText = await file.text();
      const geoJSONData = JSON.parse(jsonText);
       importFromGeoJSON(geoJSONData, setWalls,
        setPois,
        setDoors,
        setWindows,
        setZones,
        setRooms,
        setScale,
        setOffset,
        setCanvasSize);
      
      setJsonData(jsonText);
      
      return true;
    } catch (error) {
      console.error("Erreur lors du chargement du fichier GeoJSON:", error);
      return false;
    }
  };
  
  
  

























































































































































  const initializeFloorPlanFromGeoJSONModel = (geoJSONData) => {
    const newWalls = [];
    const newRooms = [];
    const newDoors = [];
    const newWindows = [];
    let imageInfo = null;
    
    // Parcourir toutes les features du GeoJSON
    geoJSONData.features.forEach(feature => {
      // Si c'est une limite d'image
      if (feature.properties.type === "ImageBoundary") {
        imageInfo = {
          width: feature.properties.width,
          height: feature.properties.height,
          filename: feature.properties.filename
        };
        console.log("ImageBoundary trouvé:", feature.properties);
      }
      
      // Si c'est un mur
      else if (feature.properties.class_name === "wall") {
        if (feature.geometry.type === "Polygon") {
          const polygonCoords = feature.geometry.coordinates[0];
          
          // Si c'est un mur rectangulaire fin (comme dans votre exemple), 
          // on peut ne créer qu'un seul segment central au lieu de 4 segments
          if (polygonCoords.length === 5) { // Polygone fermé (5 points où le premier et le dernier sont identiques)
            const minX = Math.min(...polygonCoords.map(p => p[0]));
            const maxX = Math.max(...polygonCoords.map(p => p[0]));
            const minY = Math.min(...polygonCoords.map(p => p[1]));
            const maxY = Math.max(...polygonCoords.map(p => p[1]));
            
            const width = maxX - minX;
            const height = maxY - minY;
            
            // Si c'est un mur fin (une dimension beaucoup plus grande que l'autre)
            if (width / height > 5 || height / width > 5) {
              // Mur horizontal ou vertical
              const isVertical = height > width;
              
              const wall = {
                id: `wall-${feature.properties.confidence || Date.now()}`,
                start: isVertical 
                  ? { x: (minX + maxX) / 2, y: minY } 
                  : { x: minX, y: (minY + maxY) / 2 },
                end: isVertical 
                  ? { x: (minX + maxX) / 2, y: maxY } 
                  : { x: maxX, y: (minY + maxY) / 2 },
                width: isVertical ? width : height, // L'épaisseur du mur
                properties: { ...feature.properties }
              };
              newWalls.push(wall);
              return; // Sortir de cette itération pour éviter de traiter ce polygone comme segments multiples
            }
          }
          
          // Sinon, traiter normalement comme segments multiples
          for (let i = 0; i < polygonCoords.length - 1; i++) {
            const wall = {
              id: `wall-${feature.properties.confidence || Date.now()}-${i}`,
              start: { x: polygonCoords[i][0], y: polygonCoords[i][1] },
              end: { x: polygonCoords[i+1][0], y: polygonCoords[i+1][1] },
              width: 1,
              properties: { ...feature.properties }
            };
            newWalls.push(wall);
          }
        }
      }
      
      // Si c'est une porte
      else if (feature.properties.class_name === "door") {
        if (feature.geometry.type === "Polygon") {
          // Utiliser les propriétés x1, y1, x2, y2 directement
          const centerX = (feature.properties.x1 + feature.properties.x2) / 2;
          const centerY = (feature.properties.y1 + feature.properties.y2) / 2;
          const width = Math.abs(feature.properties.x2 - feature.properties.x1);
          const height = Math.abs(feature.properties.y2 - feature.properties.y1);
          
          // Déterminer si la porte est horizontale ou verticale
          const isHorizontal = width > height;
          
          const door = {
            id: `door-${feature.properties.confidence || Date.now()}`,
            position: { x: centerX, y: centerY },
            width: width,
            height: height,
            rotation: isHorizontal ? 0 : 90, // 0 pour horizontale, 90 pour verticale
            properties: { ...feature.properties }
          };
          newDoors.push(door);
        }
      }
      
      // Si c'est une fenêtre
      else if (feature.properties.class_name === "window") {
        if (feature.geometry.type === "Polygon") {
          // Utiliser les propriétés x1, y1, x2, y2 directement
          const centerX = (feature.properties.x1 + feature.properties.x2) / 2;
          const centerY = (feature.properties.y1 + feature.properties.y2) / 2;
          const width = Math.abs(feature.properties.x2 - feature.properties.x1);
          const height = Math.abs(feature.properties.y2 - feature.properties.y1);
          
          // Déterminer si la fenêtre est horizontale ou verticale
          const isHorizontal = width > height;
          
          const window = {
            id: `window-${feature.properties.confidence || Date.now()}`,
            position: { x: centerX, y: centerY },
            width: width,
            height: height,
            rotation: isHorizontal ? 0 : 90, // 0 pour horizontale, 90 pour verticale
            properties: { ...feature.properties }
          };
          newWindows.push(window);
        }
      }
      
      // Si c'est une pièce
      else if (feature.properties.class_name === "room") {
        // Extraire les coordonnées du polygone
        const polygonCoords = feature.geometry.coordinates[0];
        
        // Transformer les coordonnées pour votre format de room
        const roomPoints = polygonCoords.map(point => ({ x: point[0], y: point[1] }));
        
        const room = {
          id: `room-${feature.properties.confidence || Date.now()}`,
          points: roomPoints,
          properties: { ...feature.properties }
        };
        
        newRooms.push(room);
        
        // Générer des murs à partir des arêtes du polygone
        for (let i = 0; i < polygonCoords.length - 1; i++) {
          const wall = {
            id: `wall-room-${feature.properties.confidence || Date.now()}-${i}`,
            start: { x: polygonCoords[i][0], y: polygonCoords[i][1] },
            end: { x: polygonCoords[i+1][0], y: polygonCoords[i+1][1] },
            width: 1,
            roomId: feature.properties.confidence
          };
          newWalls.push(wall);
        }
      }
    });
    
    // Filtrer les murs pour éliminer les doublons
    const uniqueWalls = [];
    const tolerance = 1; // Tolérance en pixels pour considérer des points comme identiques
  
    // Fonction pour vérifier si deux points sont presque identiques
    const pointsAreClose = (p1, p2) => {
      return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
    };
  
    // Fonction pour vérifier si deux segments sont presque identiques (même si inversés)
    const segmentsAreAlmostSame = (seg1, seg2) => {
      return (
        (pointsAreClose(seg1.start, seg2.start) && pointsAreClose(seg1.end, seg2.end)) ||
        (pointsAreClose(seg1.start, seg2.end) && pointsAreClose(seg1.end, seg2.start))
      );
    };
  
    // Filtrer les murs pour éliminer les doublons
    newWalls.forEach(wall => {
      if (!uniqueWalls.some(existingWall => segmentsAreAlmostSame(wall, existingWall))) {
        uniqueWalls.push(wall);
      }
    });
  
    return { walls: uniqueWalls, rooms: newRooms, doors: newDoors, windows: newWindows, imageInfo };
  };

// Fonction pour charger le GeoJSON à partir d'un fichier
const loadFloorPlanFromFileModel = async (file ,setWalls, 
    setRooms, 
    setDoors, 
    setWindows, 
    setJsonData,
    setImageInfo,
    setScale,
    setOffset,
    canvasSize
) => {
    try {
      const jsonText = await file.text();
      const geoJSONData = JSON.parse(jsonText);
      const { walls, rooms, doors, imageInfo } = initializeFloorPlanFromGeoJSONModel(geoJSONData);
      
      // Mettre à jour l'état de votre application avec le plan d'étage
      setWalls(walls);
       setRooms(rooms);
      setDoors([]);
      
      // Optionnel: Mettre à jour la taille du canvas si nécessaire
      if (imageInfo) {
        // Vous pouvez décider comment vous souhaitez gérer la taille de l'image
        // Par exemple, vous pourriez vouloir adapter l'échelle
        const ratio = Math.min(
          canvasSize.width / imageInfo.width,
          canvasSize.height / imageInfo.height
        );
        setScale(ratio);
        
        // Centrer l'image
        setOffset({
          x: (canvasSize.width - imageInfo.width * ratio) / 2,
          y: (canvasSize.height - imageInfo.height * ratio) / 2
        });
      }
      
      // Mettre à jour le JSON affiché si vous le souhaitez
      setJsonData(jsonText);
      
      return true;
    } catch (error) {
      console.error("Erreur lors du chargement du fichier GeoJSON:", error);
      return false;
    }
  };
  



  export default  {exportToGeoJSON ,loadFloorPlanFromFileModel ,loadFloorPlanFromFileSysteme  };
  

