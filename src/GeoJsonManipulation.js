import { set } from "lodash";

import Obj2D from "./lib/editor"


const exportToGeoJSON = (walls, pois, doors, windows, zones, rooms, scale, offset, canvasSize,placedObject) => {
  const geoJSONData = {
    "type": "FeatureCollection",
    "features": []
  };
  
  // Exporter les murs (boundary walls et partitions)
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
          "type": wall.type || "wall", // Pour distinguer "wall" et "partition"
          "length": Math.sqrt(
            Math.pow(wall.end.x - start.x, 2) + 
            Math.pow(wall.end.y - start.y, 2)
          )
        }
      };
      
      geoJSONData.features.push(wallFeature);
    });
  }

   // Exporter les portes et fenêtres depuis placedObject
   if (placedObject && placedObject.length > 0) {
    placedObject.forEach((obj, index) => {
      // Vérifier si l'objet est une porte ou une fenêtre basé sur la classe et le type
      const isDoorWindow = obj.class === "doorWindow";
      const isDoor = isDoorWindow && obj.type && obj.type.toLowerCase().includes('door');
      const isWindow = isDoorWindow && obj.type && obj.type.toLowerCase().includes('window');
      
      if (isDoor || isWindow) {
        // Créer un point GeoJSON pour l'objet
        const feature = {
          "type": "Feature",
          "id": `${isDoor ? 'door' : 'window'}-${index + 1}`,
          "geometry": {
            "type": "Point",
            "coordinates": [obj.x, obj.y]
          },
          "properties": {
            "class_name": isDoor ? "door" : "window",
            "family": obj.family || "inWall",
            "type": obj.type || (isDoor ? "doorSingle" : "windowSingle"),
            "angle": obj.angle || 0,
            "angleSign": obj.angleSign !== undefined ? obj.angleSign : (isDoor ? 1 : 0),
            "hinge": obj.hinge || "normal",
            "size": obj.size || 60,
            "thick": obj.thick || 10,
            "width": obj.width || "1.00",
            "height": obj.height || "0.17",
            "wallId": obj.wallId !== undefined ? obj.wallId : null,
            "original_id": index
          }
        };
        
        // Si l'objet a des chemins SVG (paths), les ajouter aux propriétés
        if (obj.paths && obj.paths.length > 0) {
          feature.properties.paths = JSON.stringify(obj.paths);
        }
        
        // Si l'objet a une référence au mur, ajouter des informations sur le mur
        if (obj.wall) {
          feature.properties.wall_info = JSON.stringify({
            wallId: obj.wall.wallId,
            thickness: obj.wall.thickness,
            type: obj.wall.type
          });
        }
        
        geoJSONData.features.push(feature);
      }
    });
  }
  
  
  // Exporter les pièces (rooms)
  if (rooms) {
    if (rooms.polygons && rooms.polygons.length > 0) {
      rooms.polygons.forEach((polygon, index) => {
        // Utiliser coords si disponible, sinon utiliser points
        let coordinates = [];
        if (polygon.coords && polygon.coords.length > 0) {
          coordinates = polygon.coords.map(point => [point.x, point.y]);
        } else if (polygon.points && polygon.points.length > 0) {
          coordinates = polygon.points.map(point => [point.x, point.y]);
        }
        
        // S'assurer que le polygone est fermé (premier et dernier point identiques)
        if (coordinates.length > 0 && (
            coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
            coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
          coordinates.push(coordinates[0]);
        }
        
        const roomFeature = {
          "type": "Feature",
          "id": `room-${index + 1}`,
          "geometry": {
            "type": "Polygon",
            "coordinates": [coordinates]
          },
          "properties": {
            "class_name": "room_polygon",
            "name": polygon.name || `Room ${index + 1}`,
            "area": polygon.area || 0,
            "pixelArea": polygon.pixelArea || 0,
            "type": polygon.type || "room",
            "color": polygon.color || "#f0daaf",
            "partitionCount": polygon.partitionCount || 0,
            "regularCount": polygon.regularCount || 0,
            "edgeKeys": polygon.edgeKeys || [],
            "path": polygon.path || [],
            "center": polygon.center ? JSON.stringify(polygon.center) : JSON.stringify({x: 0, y: 0})
          }
        };
        
        geoJSONData.features.push(roomFeature);
      });
    }
    
    // Exporter les vertices des pièces
    if (rooms.vertex && rooms.vertex.length > 0) {
      rooms.vertex.forEach((vertex, index) => {
        const vertexFeature = {
          "type": "Feature",
          "id": `vertex-${index + 1}`,
          "geometry": {
            "type": "Point",
            "coordinates": [vertex.x, vertex.y]
          },
          "properties": {
            "class_name": "room_vertex",
            "bypass": vertex.bypass || 0,
            "segment": vertex.segment || [],
            "links": JSON.stringify(vertex.links || []), // Serialiser les objets complexes
            "child": JSON.stringify(vertex.child || []) // Serialiser les objets complexes
          }
        };
        
        geoJSONData.features.push(vertexFeature);
      });
    }
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
  return jsonStr;
};







// const importFromGeoJSON = (jsonData,setWalls,
//   setPois,
//   setDoors,
//   setWindows,
//   setZones,
//   setRooms,
//   setScale,
//   setOffset,
//   setCanvasSize) => {


//   try {
//     // Conversion de la chaîne JSON en objet si nécessaire
//     const geoJSONData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    
//     // Vérification de la validité du GeoJSON
//     if (!geoJSONData || !geoJSONData.features || !Array.isArray(geoJSONData.features)) {
//       console.error('Format GeoJSON invalide');
//       return false;
//     }

//     // Initialisation des collections
//     const newWalls = [];
//     const newPOIs = [];
//     const newDoors = [];
//     const newWindows = [];
//     const newZones = [];
//     const newRooms = [];
    
//     // Traitement des features
//     geoJSONData.features.forEach(feature => {
//       try {
//         // Validation commune pour tous les éléments
//         if (!feature.properties || !feature.geometry) {
//           console.warn('Feature invalide : propriétés ou géométrie manquantes', feature);
//           return;
//         }

//         const className = feature.properties.class_name;
        
//         // Traitement des murs
//         if (className === "wall" && feature.geometry.type === "LineString") {
//           const coords = feature.geometry.coordinates;
          
//           // Validation des coordonnées
//           if (!coords || coords.length < 2) {
//             console.warn('Coordonnées de mur invalides', feature);
//             return;
//           }
          
//           const [start, end] = coords;
//           const wall = {
//             start: { x: start[0], y: start[1] },
//             end: { x: end[0], y: end[1] },
//             thickness: feature.properties.thickness || 12,
//             wallId: feature.properties.wallId || newWalls.length
//           };

          
//           newWalls.push(wall);
//         } 
//         // Traitement des POIs
//         else if (className === "poi" && feature.geometry.type === "Point") {
//           const coords = feature.geometry.coordinates;
          
//           // Validation des coordonnées
//           if (!coords || coords.length < 2) {
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
//             width: feature.properties.width || 50,
//             height: feature.properties.height || 50
//           };
          
//           newPOIs.push(poi);
//         }
       
//       } catch (error) {
//         console.error('Erreur lors du traitement d\'une feature:', error, feature);
//       }
//     });
    
//     // Récupérer les métadonnées
//     if (geoJSONData.metadata) {
//       if (geoJSONData.metadata.scale && setScale) {
//         setScale(geoJSONData.metadata.scale);
//       }
      
//       if (geoJSONData.metadata.offset && setOffset) {
//         setOffset(geoJSONData.metadata.offset);
//       }
      
//       if (geoJSONData.metadata.canvasSize && setCanvasSize) {
//         setCanvasSize(geoJSONData.metadata.canvasSize);
//       }
//     }
    
//     // Mise à jour de l'état de l'application
//     console.log("Mise à jour des murs, POIs, portes, fenêtres, zones et pièces");
//     console.log("Nouveaux murs:", newWalls);
//     if (setWalls) setWalls(newWalls);
//     if (setPois) setPois(newPOIs);
//     if (setDoors) setDoors(newDoors);
//     if (setWindows) setWindows(newWindows);
//     if (setZones) setZones(newZones);
//     if (setRooms) setRooms(newRooms);
    
//     console.log("Import GeoJSON réussi");
//     return true;
//   } catch (error) {
//     console.error("Erreur lors de l'importation du GeoJSON:", error);
//     return false;
//   }
// };










const importFromGeoJSON = (jsonData, setWalls, setPois, setDoors, setWindows, setZones, setRooms, setScale, setOffset, setCanvasSize,setPlacedObjects) => {
  try {
    // Code existant...
    
    // Initialisation des collections
    const newWalls = [];
    const newPOIs = [];
    const newDoors = [];
    const newWindows = [];
    const newZones = [];
    const newPlacedObjects = [];

    const newRooms = { polygons: [], vertex: [] };
    
    // Traitement des features
    jsonData.features.forEach(feature => {
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
            wallId: feature.properties.wallId || newWalls.length,
            type: feature.properties.type || "wall"  // Pour distinguer "wall" et "partition"
          };
          
          newWalls.push(wall);
        } 
        // Traitement des vertices de room
        else if (className === "room_vertex" && feature.geometry.type === "Point") {
          const coords = feature.geometry.coordinates;
          
          if (!coords || coords.length < 2) {
            console.warn('Coordonnées de vertex invalides', feature);
            return;
          }
          
          const [x, y] = coords;
          const vertex = {
            x: x,
            y: y,
            bypass: feature.properties.bypass || 0,
            segment: feature.properties.segment || [],
            links: JSON.parse(feature.properties.links || "[]"),  // Déserialiser les objets complexes
            child: JSON.parse(feature.properties.child || "[]")   // Déserialiser les objets complexes
          };
          
          newRooms.vertex.push(vertex);
        }
        // Traitement des polygones de room
        else if (className === "room_polygon" && feature.geometry.type === "Polygon") {
          const coords = feature.geometry.coordinates[0]; // Premier anneau du polygone
          
          if (!coords || coords.length < 3) {
            console.warn('Coordonnées de pièce invalides', feature);
            return;
          }
          
          // Transformer les coordonnées en points
          const points = coords.map(coord => ({
            x: coord[0],
            y: coord[1]
          }));
          
          const polygon = {
            coords: points,
            name: feature.properties.name || `Room ${newRooms.polygons.length + 1}`,
            area: feature.properties.area || 0,
            pixelArea: feature.properties.pixelArea || 0,
            type: feature.properties.type || "room",
            color: feature.properties.color || "#f0daaf",
            partitionCount: feature.properties.partitionCount || 0,
            regularCount: feature.properties.regularCount || 0,
            edgeKeys: feature.properties.edgeKeys || [],
            path: feature.properties.path || [],
            center: feature.properties.center ? JSON.parse(feature.properties.center) : {x: 0, y: 0}
          };
          
          newRooms.polygons.push(polygon);
        }
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
        } // Traitement des portes et fenêtres (placedObjects)
        // Traitement des portes et fenêtres (placedObjects)
        else if ((className === "door" || className === "window") && feature.geometry.type === "Point") {
          const coords = feature.geometry.coordinates;
          
          // Validation des coordonnées
          if (!coords || coords.length < 2) {
            console.warn(`Coordonnées de ${className} invalides`, feature);
            return;
          }
          
          const [x, y] = coords;
          
          // Au lieu de créer un objet simple, nous devons créer une instance Obj2D
          // puisque la méthode "update" est attendue
          const family = feature.properties.family || "inWall";
          const type = feature.properties.type || (className === "door" ? "doorSingle" : "windowSingle");
          const size = feature.properties.size || 60;
          const thick = feature.properties.thick || 10;
          const angle = feature.properties.angle || 0;
          const angleSign = feature.properties.angleSign !== undefined ? feature.properties.angleSign : (className === "door" ? 1 : 0);
          const hinge = feature.properties.hinge || "normal";
          const wallId = feature.properties.wallId;
          const value = feature.properties.value || 0;
          const meter = feature.properties.meter || 60;
          
          // Créer une instance Obj2D
          const obj = new Obj2D(
            family,         // family
            "doorWindow",   // classe
            type,           // type
            wallId,         // wallId
            { x, y },       // pos
            angle,          // angle
            angleSign,      // angleSign
            size,           // size
            hinge,          // hinge
            thick,          // thick
            value,          // value
            meter           // meter
          );
          
          // Ajouter d'autres propriétés si nécessaire
          obj.width = feature.properties.width || "1.00";
          obj.height = feature.properties.height || "0.17";
          obj.limit = [];
          
          // Traitement des paths s'ils existent
          if (feature.properties.paths) {
            try {
              obj.paths = JSON.parse(feature.properties.paths);
            } catch (e) {
              console.warn(`Erreur lors du parsing des paths pour ${className}:`, e);
              obj.paths = [];
            }
          }
          
          // Traitement des informations du mur associé s'ils existent
          if (feature.properties.wall_info) {
            try {
              const wallInfo = JSON.parse(feature.properties.wall_info);
              // Trouver le mur correspondant dans newWalls
              const associatedWall = newWalls.find(w => w.wallId === wallInfo.wallId);
              obj.wall = associatedWall || {
                wallId: wallInfo.wallId,
                thickness: wallInfo.thickness || 10,
                type: wallInfo.type || "wall"
              };
            } catch (e) {
              console.warn(`Erreur lors du parsing des infos du mur pour ${className}:`, e);
            }
          }
          
          // Ajouter l'objet à la collection appropriée
          if (className === "door") {
            newDoors.push(obj);
          } else if (className === "window") {
            newWindows.push(obj);
          }
          
          // Ajouter à la collection globale de placedObjects
          newPlacedObjects.push(obj);}









      } catch (error) {
        console.error('Erreur lors du traitement d\'une feature:', error, feature);
      }
    });
    

     // Récupérer les métadonnées
     if (jsonData.metadata) {
      if (jsonData.metadata.scale && setScale) {
        setScale(jsonData.metadata.scale);
      }
      
      if (jsonData.metadata.offset && setOffset) {
        setOffset(jsonData.metadata.offset);
      }
      
      if (jsonData.metadata.canvasSize && setCanvasSize) {
        setCanvasSize(jsonData.metadata.canvasSize);
      }
    }
    
    // Mise à jour de l'état de l'application
    console.log("Mise à jour des murs, POIs, portes, fenêtres, zones et pièces");
    if (setWalls) setWalls(newWalls);
    if (setPois) setPois(newPOIs);
    if (setDoors) setDoors(newDoors);
    if (setWindows) setWindows(newWindows);
    if (setZones) setZones(newZones);
    if (setRooms) setRooms(newRooms);
    if (setPlacedObjects) setPlacedObjects(newPlacedObjects);

    console.log("Import GeoJSON réussi");
    return true;
  } catch (error) {
    console.error("Erreur lors de l'importation du GeoJSON:", error);
    return false;
  }
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
    canvasSize,
    setZones,
    setRooms,
    setCanvasSize,setPlacedObjects
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
        setCanvasSize,setPlacedObjects);
      
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
  

