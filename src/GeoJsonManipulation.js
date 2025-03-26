// const exportToGeoJSON = (walls, rooms, doors, windows, imageInfo) => {
//     const geoJSONData = {
//         "type": "FeatureCollection",
//         "features": []
//       };
    
//       // Exporter chaque mur comme une feature LineString
//       walls.forEach((wall, index) => {
//         const wallFeature = {
//           "type": "Feature",
//           "id": index + 1, // ID unique pour chaque mur
//           "geometry": {
//             "type": "LineString",
//             "coordinates": [
//               [wall.start.x, wall.start.y],
//               [wall.end.x, wall.end.y]
//             ]
//           },
//           "properties": {
//             "class_name": "wall",
//             "width": wall.width || 1, // Largeur par défaut si non spécifiée
//             "length": Math.sqrt(
//               Math.pow(wall.end.x - wall.start.x, 2) + 
//               Math.pow(wall.end.y - wall.start.y, 2)
//             ),
//             "orientation": Math.atan2(
//               wall.end.y - wall.start.y, 
//               wall.end.x - wall.start.x
//             ) * (180 / Math.PI), // Angle en degrés
//             "original_id": wall.id // Conserver l'ID original si existant
//           }
//         };
    
//         geoJSONData.features.push(wallFeature);
//       });
    
//       // Créer et télécharger le fichier GeoJSON
//       const jsonStr = JSON.stringify(geoJSONData, null, 2);
//       const blob = new Blob([jsonStr], { type: 'application/geo+json' });
//       const url = URL.createObjectURL(blob);
      
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = 'walls.geojson';
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);
      
//       console.log("Walls exported to GeoJSON successfully");
//       return true;
//   };

const exportToGeoJSON = (walls, pois, doors, windows, imageInfo) => {
    const geoJSONData = {
      "type": "FeatureCollection",
      "features": []
    };
  
    // Exporter les murs
    walls.forEach((wall, index) => {
      const wallFeature = {
        "type": "Feature",
        "id": index + 1,
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [wall.start.x, wall.start.y],
            [wall.end.x, wall.end.y]
          ]
        },
        "properties": {
          "class_name": "wall",
          "width": wall.width || 1,
          "length": Math.sqrt(
            Math.pow(wall.end.x - wall.start.x, 2) + 
            Math.pow(wall.end.y - wall.start.y, 2)
          ),
          "original_id": wall.id
        }
      };
  
      geoJSONData.features.push(wallFeature);
    });
  
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
            "type": poi.type || "default",
            "description": poi.description || "",
            "icon": poi.icon || null,
            "original_id": poi.id
          }
        };
  
        geoJSONData.features.push(poiFeature);
      });
    }
  
    // Créer et télécharger le fichier GeoJSON
    const jsonStr = JSON.stringify(geoJSONData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floor_plan_with_pois.geojson';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("Floor plan with POIs exported successfully");
    return true;
  };


//   const initializeFloorFromGeoJSONSystem= (geoJSONData) => {
//     // Vérifier la validité du GeoJSON
//     if (!geoJSONData || !geoJSONData.features) {
//       console.error('Format GeoJSON invalide');
//       return null;
//     }
  
//     // Tableaux pour stocker les éléments
//     const newWalls = [];
//     const newPOIs = [];
  
//     // Parcourir toutes les features
//     geoJSONData.features.forEach(feature => {
//       // Filtrer uniquement les murs (class_name: "wall")
//       if (feature.properties.class_name === "wall" && 
//           feature.geometry.type === "LineString") {
        
//         // Extraire les coordonnées du début et de la fin
//         const [start, end] = feature.geometry.coordinates;
        
//         // Créer l'objet mur
//         const wall = {
//           // Utiliser l'ID original si disponible, sinon générer un nouvel ID
//           id: feature.properties.original_id || `wall-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
          
//           // Coordonnées de début et de fin
//           start: { 
//             x: start[0], 
//             y: start[1] 
//           },
//           end: { 
//             x: end[0], 
//             y: end[1] 
//           },
          
//           // Largeur du mur (utiliser la propriété width ou une valeur par défaut)
//           width: feature.properties.width || 1,
          
//           // Calculer la longueur si non présente
//           length: feature.properties.length || Math.sqrt(
//             Math.pow(end[0] - start[0], 2) + 
//             Math.pow(end[1] - start[1], 2)
//           ),
          
//           // Angle d'orientation (si disponible)
//           orientation: feature.properties.orientation,
          
//           // Conserver toutes les propriétés originales
//           properties: feature.properties
//         };
  
//         // Ajouter le mur à la liste
//         newWalls.push(wall);
//       }  else if (feature.properties.class_name === "poi" && 
//         feature.geometry.type === "Point") {
 
//  const [x, y] = feature.geometry.coordinates;
 
//  const poi = {
//    id: feature.properties.original_id || `poi-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
//    x: x,
//    y: y,
//    name: feature.properties.name || `POI ${newPOIs.length + 1}`,
//    type: feature.properties.type || "default",
//    description: feature.properties.description || "",
//    icon: feature.properties.icon || null,
//    properties: feature.properties
//  };

//  newPOIs.push(poi);
// }
//     });
  
//     // Fonction optionnelle pour filtrer les doublons
//     const uniqueWalls = filterDuplicateWalls(newWalls);
  
//     // Retourner les murs
//     return {
//       walls: uniqueWalls,
//       newPOIs
//     };
//   };


const initializeFloorFromGeoJSONSystem = (geoJSONData) => {
    // Validation initiale du GeoJSON
    if (!geoJSONData || !geoJSONData.features || !Array.isArray(geoJSONData.features)) {
      console.error('Format GeoJSON invalide');
      return { walls: [], pois: [] };
    }
  
    const newWalls = [];
    const newPOIs = [];
  
    geoJSONData.features.forEach(feature => {
      try {
        // Validation commune pour tous les éléments
        if (!feature.properties || !feature.geometry) {
          console.warn('Feature invalide : propriétés ou géométrie manquantes', feature);
          return;
        }
  
        // Traitement des murs
        if (feature.properties.class_name === "wall" && feature.geometry.type === "LineString") {
          const coords = feature.geometry.coordinates;
          
          // Validation des coordonnées
          if (!coords || coords.length < 2 || 
              !Array.isArray(coords[0]) || !Array.isArray(coords[1]) ||
              coords[0].length < 2 || coords[1].length < 2) {
            console.warn('Coordonnées de mur invalides', feature);
            return;
          }
  
          const [start, end] = coords;
          const wall = {
            id: feature.properties.original_id || `wall-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
            start: { x: start[0], y: start[1] },
            end: { x: end[0], y: end[1] },
            width: feature.properties.width || 1,
            length: feature.properties.length || Math.sqrt(
              Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
            ),
            orientation: feature.properties.orientation,
            properties: feature.properties || {}
          };
  
          newWalls.push(wall);
        } 
        // Traitement des POIs
        else if (feature.properties.class_name === "poi" && feature.geometry.type === "Point") {
          const coords = feature.geometry.coordinates;
          
          // Validation des coordonnées
          if (!coords || coords.length < 2 || 
              typeof coords[0] !== 'number' || 
              typeof coords[1] !== 'number') {
            console.warn('Coordonnées de POI invalides', feature);
            return;
          }
  
          const [x, y] = coords;
          const poi = {
            id: feature.properties.original_id || `poi-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
            x: x,
            y: y,
            name: feature.properties.name || `POI ${newPOIs.length + 1}`,
            type: feature.properties.type || "default",
            description: feature.properties.description || "",
            icon: feature.properties.icon || null,
            properties: feature.properties || {}
          };
  
          newPOIs.push(poi);
        }
      } catch (error) {
        console.error('Erreur lors du traitement d\'une feature:', error, feature);
      }
    });
  
    // Fonction optionnelle de filtrage des doublons (à implémenter)
    const uniqueWalls = filterDuplicateWalls ? filterDuplicateWalls(newWalls) : newWalls;
  
    return {
      walls: uniqueWalls,
      pois: newPOIs
    };
  };


  
  
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
    canvasSize
) => {
    try {
      const jsonText = await file.text();
      const geoJSONData = JSON.parse(jsonText);
      const { walls, pois, doors, imageInfo } = initializeFloorFromGeoJSONSystem(geoJSONData);
      
      // Mettre à jour l'état de votre application avec le plan d'étage
      setWalls(walls);
      setPois(pois);
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
  

