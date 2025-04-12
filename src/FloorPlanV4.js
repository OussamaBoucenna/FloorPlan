import React, { useState, useRef, useEffect } from "react";

import GeoJsonManipulation from "./GeoJsonManipulation";
import {
  getMousePos,
  isNearPoint,
  isInsidePolygon,
  getCellsOnLine,
  calculateDoorPosition,
  createGrid,
} from "./Utils";
import { displayMeasurements, drawGrid } from "./Draw";

const FloorPlanV4 = () => {
  // Icons for different categories
  const categoryIcons = {
    furniture: "./hh.svg",
    electronics: "./hh.svg",
    plant: "./hh.svg",
    default: "./hh.svg",
  };
  // États pour les zones
  const [zones, setZones] = useState([]);
  const [currentZone, setCurrentZone] = useState(null);
  const [zoneShapeType, setZoneShapeType] = useState("rectangle"); // rectangle, circle, polygon
  const [zoneType, setZoneType] = useState("circulation"); //zone de circulation,zone de travail,zone de danger,zone de service..
  const [currentPolygonPoints, setCurrentPolygonPoints] = useState([]);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");

  const [showPoiForm, setShowPoiForm] = useState(false);
  const [poiName, setPoiName] = useState("");
  const [poiCategory, setPoiCategory] = useState("");
  const [pendingPoi, setPendingPoi] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [newPoiName, setNewPoiName] = useState(""); // Pour stocker le nouveau nom

  const handleCreatePoi = () => {
    if (!poiName || !poiCategory) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    const newObj = {
      id: Date.now(),
      x: pendingPoi.x,
      y: pendingPoi.y,
      width: 50,
      height: 50,
      type: "rectangle",
      color: "#ff9966",
      name: poiName,
      category: poiCategory,
      icon: categoryIcons[poiCategory] || categoryIcons.default,
    };

    setPois([...pois, newObj]);
    setShowPoiForm(false);
    setPoiName("");
    setPoiCategory("");
    setPendingPoi(null);
  };

  // When clicking "Objet", activate tool and wait for position
  const handlePoiTool = () => {
    setTool("poi");
    setShowPoiForm(false);
  };

  const [tool, setTool] = useState("wall");
  const [walls, setWalls] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [pois, setPois] = useState([]);
  const [doors, setDoors] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWall, setCurrentWall] = useState(null);
  const [currentRoom, setCurrentRoom] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [jsonData, setJsonData] = useState("");
  const [pathPoints, setPathPoints] = useState({ start: null, end: null });
  const [currentPath, setCurrentPath] = useState([]);
  const [windows, setWindows] = useState([]);
  const [currentWindow, setCurrentWindow] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);

  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const updateCanvasSize = () => {
    if (canvasContainerRef.current) {
      const { width, height } =
        canvasContainerRef.current.getBoundingClientRect();
      setCanvasSize({ width, height });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pois.forEach((obj) => {
      const iconSize = 30;
      const img = new Image();
      img.src = obj.icon; // Use category-based icon

      img.onload = () => {
        ctx.drawImage(
          img,
          obj.x - iconSize / 2,
          obj.y - iconSize / 2,
          iconSize,
          iconSize
        );
      };

      // Draw text
      ctx.font = "14px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.fillText(obj.name, obj.x, obj.y - iconSize / 2 - 5);
      ctx.fillText(`[${obj.category}]`, obj.x, obj.y - iconSize / 2 - 20);
    });
  }, [pois]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    drawGrid(ctx, offset, scale, canvasSize);

    // Preload icons to prevent flickering
    const preloadedIcons = {};
    Object.keys(categoryIcons).forEach((category) => {
      preloadedIcons[category] = new Image();
      preloadedIcons[category].src = categoryIcons[category];
    });

    // Drawing walls
    ctx.lineWidth = 20;
    ctx.strokeStyle = "#333";
    walls.forEach((wall) => {
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.stroke();

      if (
        selectedItem &&
        selectedItem.type === "wall" &&
        selectedItem.id === wall.id
      ) {
        ctx.strokeStyle = "#0066ff";
        ctx.lineWidth = 22;
        ctx.stroke();
        ctx.lineWidth = 20;
        ctx.strokeStyle = "#333";
      }
      displayMeasurements(ctx, wall.start, wall.end);
    });

    // Drawing doors
    doors.forEach((door) => {
      ctx.strokeStyle = "#8B4513";
      ctx.beginPath();
      ctx.moveTo(door.start.x, door.start.y);
      ctx.lineTo(door.end.x, door.end.y);
      ctx.stroke();

      if (
        selectedItem &&
        selectedItem.type === "door" &&
        selectedItem.id === door.id
      ) {
        ctx.strokeStyle = "#0066ff";
        ctx.lineWidth = 22;
        ctx.stroke();
      }
    });

    // Drawing windows
    windows.forEach((window) => {
      ctx.strokeStyle = "#4682B4";
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(window.start.x, window.start.y);
      ctx.lineTo(window.end.x, window.end.y);
      ctx.stroke();

      if (
        selectedItem &&
        selectedItem.type === "window" &&
        selectedItem.id === window.id
      ) {
        ctx.strokeStyle = "#0066ff";
        ctx.lineWidth = 22;
        ctx.beginPath();
        ctx.moveTo(window.start.x, window.start.y);
        ctx.lineTo(window.end.x, window.end.y);
        ctx.stroke();
      }
    });

    // Drawing rooms
    rooms.forEach((room) => {
      ctx.fillStyle = "rgba(200, 200, 255, 0.3)";
      ctx.strokeStyle = "#0066ff";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(room.points[0].x, room.points[0].y);
      room.points.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (
        selectedItem &&
        selectedItem.type === "room" &&
        selectedItem.id === room.id
      ) {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });

    // Drawing POIs
    pois.forEach((obj) => {
      const iconSize = 30;
      const icon = preloadedIcons[obj.category] || preloadedIcons["default"];

      // Ensure the image is loaded before drawing
      if (icon.complete) {
        ctx.drawImage(
          icon,
          obj.x - iconSize / 2,
          obj.y - iconSize / 2,
          iconSize,
          iconSize
        );
      } else {
        icon.onload = () => {
          ctx.drawImage(
            icon,
            obj.x - iconSize / 2,
            obj.y - iconSize / 2,
            iconSize,
            iconSize
          );
        };
      }

      // Draw poi name and category
      ctx.font = `${14 / scale}px Arial`;
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";

      // Highlight selected poi
      if (
        selectedItem &&
        selectedItem.type === "poi" &&
        selectedItem.id === obj.id
      ) {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          obj.x - iconSize / 2,
          obj.y - iconSize / 2,
          iconSize,
          iconSize
        );
      }
    });

    // Drawing zones
    zones.forEach((zone) => {
      ctx.fillStyle = "rgba(255, 220, 100, 0.3)";
      ctx.strokeStyle = "#FF8800";
      ctx.lineWidth = 2;

      if (zone.shapeType === "rectangle") {
        ctx.beginPath();
        ctx.rect(zone.x, zone.y, zone.width, zone.height);
        ctx.fill();
        ctx.stroke();

        // Draw zone name
        ctx.font = `${14 / scale}px Arial`;
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.fillText(
          zone.name,
          zone.x + zone.width / 2,
          zone.y + zone.height / 2
        );
      } else if (zone.shapeType === "circle") {
        ctx.beginPath();
        ctx.arc(zone.center.x, zone.center.y, zone.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw zone name
        ctx.font = `${14 / scale}px Arial`;
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.fillText(zone.name, zone.center.x, zone.center.y);
      } else if (zone.shapeType === "polygon") {
        ctx.beginPath();
        ctx.moveTo(zone.points[0].x, zone.points[0].y);
        zone.points.slice(1).forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Calculate center of polygon for text
        let centerX = 0,
          centerY = 0;
        zone.points.forEach((point) => {
          centerX += point.x;
          centerY += point.y;
        });
        centerX /= zone.points.length;
        centerY /= zone.points.length;

        // Draw zone name
        ctx.font = `${14 / scale}px Arial`;
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.fillText(zone.name, centerX, centerY);
      }

      // Highlight selected zone
      if (
        selectedItem &&
        selectedItem.type === "zone" &&
        selectedItem.id === zone.id
      ) {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 3;
        if (zone.shapeType === "rectangle") {
          ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        } else if (zone.shapeType === "circle") {
          ctx.beginPath();
          ctx.arc(zone.center.x, zone.center.y, zone.radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (zone.shapeType === "polygon") {
          ctx.beginPath();
          ctx.moveTo(zone.points[0].x, zone.points[0].y);
          zone.points.slice(1).forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.closePath();
          ctx.stroke();
        }
      }
    });

    // Drawing current zone being created
    if (isDrawing && currentZone) {
      ctx.fillStyle = "rgba(255, 220, 100, 0.3)";
      ctx.strokeStyle = "#FF8800";
      ctx.lineWidth = 2;

      if (currentZone.shapeType === "rectangle") {
        const x = Math.min(currentZone.start.x, currentZone.end.x);
        const y = Math.min(currentZone.start.y, currentZone.end.y);
        const width = Math.abs(currentZone.end.x - currentZone.start.x);
        const height = Math.abs(currentZone.end.y - currentZone.start.y);

        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.fill();
        ctx.stroke();
      } else if (currentZone.shapeType === "circle") {
        const dx = currentZone.end.x - currentZone.start.x;
        const dy = currentZone.end.y - currentZone.start.y;
        const radius = Math.sqrt(dx * dx + dy * dy);

        ctx.beginPath();
        ctx.arc(
          currentZone.start.x,
          currentZone.start.y,
          radius,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
      }
    }

    // Drawing polygon in progress
    if (
      tool === "zone" &&
      zoneShapeType === "polygon" &&
      currentPolygonPoints.length > 0
    ) {
      ctx.strokeStyle = "#FF8800";
      ctx.lineWidth = 2;
      ctx.fillStyle = "rgba(255, 220, 100, 0.3)";

      ctx.beginPath();
      ctx.moveTo(currentPolygonPoints[0].x, currentPolygonPoints[0].y);
      currentPolygonPoints.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });

      if (currentPolygonPoints.length > 2) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      // Draw points
      currentPolygonPoints.forEach((point) => {
        ctx.fillStyle = "#FF8800";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 / scale, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Drawing current zone
    if (isDrawing && currentZone) {
      const x = Math.min(currentZone.start.x, currentZone.end.x);
      const y = Math.min(currentZone.start.y, currentZone.end.y);
      const width = Math.abs(currentZone.end.x - currentZone.start.x);
      const height = Math.abs(currentZone.end.y - currentZone.start.y);

      ctx.fillStyle = "rgba(255, 220, 100, 0.3)";
      ctx.strokeStyle = "#FF8800";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.fill();
      ctx.stroke();
    }

    // Drawing navigation points
    if (pathPoints.start) {
      ctx.fillStyle = "#00ff00";
      ctx.beginPath();
      ctx.arc(pathPoints.start.x, pathPoints.start.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (pathPoints.end) {
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(pathPoints.end.x, pathPoints.end.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Drawing calculated path
    if (currentPath.length > 1) {
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }

    // Drawing current wall
    if (isDrawing && currentWall) {
      ctx.lineWidth = 20;
      ctx.strokeStyle = "#333";
      ctx.beginPath();
      ctx.moveTo(currentWall.start.x, currentWall.start.y);
      ctx.lineTo(currentWall.end.x, currentWall.end.y);
      ctx.stroke();
    }

    // Drawing current window
    if (isDrawing && currentWindow) {
      ctx.lineWidth = 20;
      ctx.strokeStyle = "#4682B4";
      ctx.beginPath();
      ctx.moveTo(currentWindow.start.x, currentWindow.start.y);
      ctx.lineTo(currentWindow.end.x, currentWindow.end.y);
      ctx.stroke();

      displayMeasurements(ctx, currentWindow.start, currentWindow.end);
    }

    // Drawing current room
    if (tool === "room" && currentRoom.length > 0) {
      ctx.strokeStyle = "#0066ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentRoom[0].x, currentRoom[0].y);
      currentRoom.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      if (isDrawing) {
        const lastPoint = currentRoom[currentRoom.length - 1];
        ctx.lineTo(lastPoint.x, lastPoint.y);
      } else {
        ctx.closePath();
      }
      ctx.stroke();
    }

    ctx.restore();
  }, [
    walls,
    rooms,
    pois,
    zones,
    doors,
    windows,
    currentWall,
    currentWindow,
    currentRoom,
    isDrawing,
    scale,
    offset,
    selectedItem,
    pathPoints,
    currentPath,
    drawGrid,
    tool,
  ]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        tool === "select" &&
        (event.key === "Delete" || event.key === "Backspace")
      ) {
        if (!selectedItem) return;

        if (selectedItem.type === "wall") {
          setWalls(walls.filter((w) => w.id !== selectedItem.id));
          setDoors(doors.filter((d) => d.wallId !== selectedItem.id));
        } else if (selectedItem.type === "room") {
          setRooms(rooms.filter((r) => r.id !== selectedItem.id));
        } else if (selectedItem.type === "poi") {
          setPois(pois.filter((o) => o.id !== selectedItem.id));
        } else if (selectedItem.type === "door") {
          setDoors(doors.filter((d) => d.id !== selectedItem.id));
        } else if (selectedItem && selectedItem.type === "zone") {
          setZones(zones.filter((z) => z.id !== selectedItem.id));
          console.log("Zone supprimée :", selectedItem.id);
        }

        setSelectedItem(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [tool, selectedItem, walls, doors, rooms, pois, zones]);

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const mousePos = getMousePos(canvas, e, offset, scale);
    const { offsetX, offsetY } = e.nativeEvent;

    // Check if the click is on an object
    const clickedObject = pois.find(
      (obj) =>
        offsetX >= obj.x - 15 &&
        offsetX <= obj.x + 15 &&
        offsetY >= obj.y - 15 &&
        offsetY <= obj.y + 15
    );

    if (clickedObject) {
      setDraggingId(clickedObject.id);
      setOffset({ x: offsetX - clickedObject.x, y: offsetY - clickedObject.y });
    }

    // Middle mouse button or pan tool for panning
    if (e.button === 1 || (e.button === 0 && tool === "pan")) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      return;
    }

    // Path tool logic
    if (tool === "path") {
      if (!pathPoints.start) {
        setPathPoints({ ...pathPoints, start: mousePos });
      } else if (!pathPoints.end) {
        setPathPoints({ ...pathPoints, end: mousePos });
        calculatePath(pathPoints.start, mousePos);
      } else {
        setPathPoints({ start: mousePos, end: null });
        setCurrentPath([]);
      }
      return;
    }

    // Select tool logic
    if (tool === "select") {
      const item = findItemAt(mousePos);
      setSelectedItem(item);
      return;
    }

    // Door placement on selected wall
    if (tool === "door" && selectedItem?.type === "wall") {
      const wall = walls.find((w) => w.id === selectedItem.id);
      if (wall) {
        const doorPosition = calculateDoorPosition(mousePos, wall);
        if (doorPosition) {
          const newDoor = {
            id: Date.now(),
            start: doorPosition.start,
            end: doorPosition.end,
            wallId: wall.id,
          };
          setDoors([...doors, newDoor]);
        }
      }
      return;
    }

    // Start drawing mode
    setIsDrawing(true);

    // Different drawing tools
    if (tool === "window") {
      setCurrentWindow({
        id: Date.now(),
        start: { x: mousePos.x, y: mousePos.y },
        end: { x: mousePos.x, y: mousePos.y },
      });
    } else if (tool === "wall") {
      setCurrentWall({
        id: Date.now(),
        start: { x: mousePos.x, y: mousePos.y },
        end: { x: mousePos.x, y: mousePos.y },
      });
    } else if (tool === "room") {
      if (currentRoom.length === 0 || !isNearPoint(mousePos, currentRoom[0])) {
        setCurrentRoom([...currentRoom, { x: mousePos.x, y: mousePos.y }]);
      } else {
        if (currentRoom.length >= 3) {
          setRooms([
            ...rooms,
            {
              id: Date.now(),
              points: [...currentRoom],
              area: calculatePolygonArea(currentRoom),
            },
          ]);
        }
        setCurrentRoom([]);
        setIsDrawing(false);
      }
    } else if (tool === "poi") {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setPendingPoi({ x, y }); // Store position
      setShowPoiForm(true);
    } else if (tool === "zone") {
      const mousePos = getMousePos(canvas, e, offset, scale);

      if (zoneShapeType === "rectangle" || zoneShapeType === "circle") {
        setCurrentZone({
          id: Date.now(),
          shapeType: zoneShapeType,
          start: { x: mousePos.x, y: mousePos.y },
          end: { x: mousePos.x, y: mousePos.y },
          name: "Nouvelle zone",
        });
        setIsDrawing(true);
      } else if (zoneShapeType === "polygon") {
        // Pour le polygone, on ajoute des points à chaque clic
        if (
          currentPolygonPoints.length === 0 ||
          !isNearPoint(mousePos, currentPolygonPoints[0])
        ) {
          setCurrentPolygonPoints([
            ...currentPolygonPoints,
            { x: mousePos.x, y: mousePos.y },
          ]);
        } else {
          // Si on clique près du premier point, on termine le polygone
          if (currentPolygonPoints.length >= 3) {
            const newZone = {
              id: Date.now(),
              shapeType: "polygon",
              points: [...currentPolygonPoints],
              name: "Nouvelle zone",
            };
            setZones([...zones, newZone]);
            setCurrentPolygonPoints([]);
            setShowZoneForm(true);
            setNewZoneName("");
          }
        }
      }
    } else if (tool === "erase" && selectedItem) {
      // Erase logic for different item types
      if (selectedItem.type === "wall") {
        setWalls(walls.filter((w) => w.id !== selectedItem.id));
        setDoors(doors.filter((d) => d.wallId !== selectedItem.id));
      } else if (selectedItem.type === "room") {
        setRooms(rooms.filter((r) => r.id !== selectedItem.id));
      } else if (selectedItem.type === "poi") {
        setPois(pois.filter((o) => o.id !== selectedItem.id));
      } else if (selectedItem.type === "door") {
        setDoors(doors.filter((d) => d.id !== selectedItem.id));
      } else if (selectedItem.type === "zone") {
        setZones(zones.filter((z) => z.id !== selectedItem.id));
      }
      setSelectedItem(null);
    }
  };

  const calculatePath = (start, end) => {
    if (!start || !end) {
      console.warn(
        "Les points de départ ou d'arrivée sont invalides :",
        start,
        end
      );
      return;
    }

    // Définir la taille des cellules de la grille (à ajuster selon vos besoins)
    const cellSize = 10; // Par exemple, 20 pixels par cellule

    // Récupérer les dimensions de votre espace
    const width = 1500; // À remplacer par la largeur de votre plan
    const height = 1500; // À remplacer par la hauteur de votre plan

    // Créer la grille
    const grid = createGrid(width, height, cellSize, walls, doors);
    console.log(
      "Grid created with dimensions:",
      grid.length,
      "rows ×",
      grid[0].length,
      "columns"
    );

    // Trouver le chemin entre les points de départ et d'arrivée
    const path = findPath(start.x, start.y, end.x, end.y, grid, cellSize);
    console.log("Path found:", path);

    if (path && path.length > 0) {
      // Lisser le chemin si nécessaire
      // const smoothPath = smoothPathPoints(path,grid,cellSize);
      // console.log("Smoothed path: ----------->>>>>>>", smoothPath);
      setCurrentPath(path);
    } else {
      console.warn("Aucun chemin trouvé entre les points :", start, end);
      setCurrentPath([]);
    }
  };

  // Fonction de recherche de chemin adaptée à la grille
  const findPath = (startX, startY, endX, endY, grid, cellSize) => {
    console.log(
      "Calcul du chemin de (x,y)={",
      startX,
      ",",
      startY,
      "} à (x,y)= {",
      endX,
      ",",
      endY,
      "}"
    );
    console.log("Taille de cellule:", cellSize);
    // Convertir coordonnées réelles en indices de cellule
    const startCol = Math.floor(startX / cellSize);
    const startRow = Math.floor(startY / cellSize);
    const endCol = Math.floor(endX / cellSize);
    const endRow = Math.floor(endY / cellSize);

    // Vérifier si les points de départ et d'arrivée sont dans des zones traversables
    if (
      startRow < 0 ||
      startCol < 0 ||
      startRow >= grid.length ||
      startCol >= grid[0].length ||
      endRow < 0 ||
      endCol < 0 ||
      endRow >= grid.length ||
      endCol >= grid[0].length ||
      !grid[startRow][startCol].walkable ||
      !grid[endRow][endCol].walkable
    ) {
      console.warn(
        "Points de départ ou d'arrivée dans une zone non traversable"
      );
      return [];
    }

    // Initialiser les structures pour A*
    const openSet = [{ row: startRow, col: startCol, f: 0, g: 0, h: 0 }];
    const closedSet = [];
    const cameFrom = {};

    while (openSet.length > 0) {
      // Trouver le nœud avec le score F le plus bas
      let currentIndex = 0;
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }

      const current = openSet[currentIndex];

      // Si on a atteint la destination
      if (current.row === endRow && current.col === endCol) {
        const path = [];
        let curr = current;

        // Reconstruire le chemin
        while (cameFrom[`${curr.row},${curr.col}`]) {
          // Ajouter le point actuel au chemin
          path.push({
            x: curr.col * cellSize + cellSize / 2,
            y: curr.row * cellSize + cellSize / 2,
          });
          // Passer au point précédent
          curr = cameFrom[`${curr.row},${curr.col}`];
        }

        // Ajouter le point de départ
        path.push({
          x: startCol * cellSize + cellSize / 2,
          y: startRow * cellSize + cellSize / 2,
        });

        return path.reverse();
      }

      // Retirer le nœud courant de openSet et l'ajouter à closedSet
      openSet.splice(currentIndex, 1);
      closedSet.push(current);

      // Vérifier les voisins (4 directions - Nord, Sud, Est, Ouest)
      const directions = [
        { row: -1, col: 0 }, // Nord
        { row: 1, col: 0 }, // Sud
        { row: 0, col: -1 }, // Ouest
        { row: 0, col: 1 }, // Est
        // Décommentez pour permettre les mouvements en diagonale
        { row: -1, col: -1 }, // Nord-Ouest
        { row: -1, col: 1 }, // Nord-Est
        { row: 1, col: -1 }, // Sud-Ouest
        { row: 1, col: 1 }, // Sud-Est
      ];

      for (const dir of directions) {
        const neighborRow = current.row + dir.row;
        const neighborCol = current.col + dir.col;
        const key = `${neighborRow},${neighborCol}`;

        // Vérifier si la cellule voisine est valide
        if (
          neighborRow < 0 ||
          neighborCol < 0 ||
          neighborRow >= grid.length ||
          neighborCol >= grid[0].length ||
          !grid[neighborRow][neighborCol].walkable ||
          closedSet.some((n) => n.row === neighborRow && n.col === neighborCol)
        ) {
          continue;
        }

        // Calculer le nouveau score G
        const gScore = current.g + 1;

        // Vérifier si le voisin est déjà dans openSet
        const openNeighbor = openSet.find(
          (n) => n.row === neighborRow && n.col === neighborCol
        );

        if (!openNeighbor || gScore < openNeighbor.g) {
          // Calculer les scores
          const h =
            Math.abs(neighborRow - endRow) + Math.abs(neighborCol - endCol);
          const f = gScore + h;

          if (!openNeighbor) {
            openSet.push({
              row: neighborRow,
              col: neighborCol,
              f,
              g: gScore,
              h,
            });
          } else {
            openNeighbor.f = f;
            openNeighbor.g = gScore;
            openNeighbor.h = h;
          }

          cameFrom[key] = current;
        }
      }
    }

    // Aucun chemin trouvé
    return [];
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const mousePos = getMousePos(canvas, e, offset, scale);
    if (draggingId !== null) {
      const { offsetX, offsetY } = e.nativeEvent;

      setPois((prevObjects) =>
        prevObjects.map((obj) =>
          obj.id === draggingId
            ? { ...obj, x: offsetX - offset.x, y: offsetY - offset.y }
            : obj
        )
      );
    }

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    if (!isDrawing) return;

    if (tool === "wall" && currentWall) {
      setCurrentWall({
        ...currentWall,
        end: { x: mousePos.x, y: mousePos.y },
      });

      const ctx = canvas.getContext("2d");
      // Redessiner pour effacer l'ancien texte (vous pouvez appeler votre fonction de rendu ici)
      // ...

      // Afficher la dimension du mur en cours de dessin
      displayMeasurements(ctx, currentWall.start, {
        x: mousePos.x,
        y: mousePos.y,
      });
    }

    if (isDrawing && tool === "zone" && currentZone) {
      const mousePos = getMousePos(canvas, e, offset, scale);

      if (
        currentZone.shapeType === "rectangle" ||
        currentZone.shapeType === "circle"
      ) {
        setCurrentZone({
          ...currentZone,
          end: { x: mousePos.x, y: mousePos.y },
        });
      }
    }

    if (tool === "window" && currentWindow) {
      setCurrentWindow({
        ...currentWindow,
        end: { x: mousePos.x, y: mousePos.y },
      });
      // Si vous souhaitez afficher les dimensions comme pour les murs
      const ctx = canvas.getContext("2d");
      displayMeasurements(ctx, currentWindow.start, {
        x: mousePos.x,
        y: mousePos.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    if (isDragging) {
      setIsDragging(false);
      return;
    }

    if (!isDrawing) return;

    if (tool === "wall" && currentWall) {
      const dx = currentWall.end.x - currentWall.start.x;
      const dy = currentWall.end.y - currentWall.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 10) {
        setWalls([...walls, { ...currentWall }]);
      }

      setCurrentWall(null);
    } else if (tool === "window" && currentWindow) {
      const dx = currentWindow.end.x - currentWindow.start.x;
      const dy = currentWindow.end.y - currentWindow.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 10) {
        // Vérifier que la fenêtre a une taille minimale
        setWindows([
          ...windows,
          {
            ...currentWindow,
            // Vous pouvez ajouter d'autres propriétés ici
            type: "window",
          },
        ]);
      }

      setCurrentWindow(null);
    } else if (isDrawing && tool === "zone") {
      if (
        currentZone &&
        (currentZone.shapeType === "rectangle" ||
          currentZone.shapeType === "circle")
      ) {
        const dx = currentZone.end.x - currentZone.start.x;
        const dy = currentZone.end.y - currentZone.start.y;

        if (
          currentZone.shapeType === "rectangle" &&
          Math.abs(dx) > 10 &&
          Math.abs(dy) > 10
        ) {
          const newZone = {
            ...currentZone,
            x: Math.min(currentZone.start.x, currentZone.end.x),
            y: Math.min(currentZone.start.y, currentZone.end.y),
            width: Math.abs(dx),
            height: Math.abs(dy),
          };
          setZones([...zones, newZone]);
          setShowZoneForm(true);
          setNewZoneName("");
        } else if (
          currentZone.shapeType === "circle" &&
          Math.sqrt(dx * dx + dy * dy) > 10
        ) {
          const centerX = currentZone.start.x;
          const centerY = currentZone.start.y;
          const radius = Math.sqrt(dx * dx + dy * dy);

          const newZone = {
            ...currentZone,
            center: { x: centerX, y: centerY },
            radius: radius,
          };
          setZones([...zones, newZone]);
          setShowZoneForm(true);
          setNewZoneName("");
        }

        setCurrentZone(null);
      }
      setIsDrawing(false);
    }

    setIsDrawing(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const canvas = canvasRef.current;
    const mousePos = getMousePos(canvas, e, offset, scale);

    const newScale = scale * delta;
    if (newScale >= 0.1 && newScale <= 10) {
      const newOffset = {
        x: offset.x - (mousePos.x * scale - mousePos.x * newScale),
        y: offset.y - (mousePos.y * scale - mousePos.y * newScale),
      };

      setScale(newScale);
      setOffset(newOffset);
    }
  };

  const findItemAt = (pos) => {
    for (const door of doors) {
      if (isNearLine(pos, door.start, door.end)) {
        return { type: "door", id: door.id };
      }
    }

    for (const obj of pois) {
      if (
        pos.x >= obj.x &&
        pos.x <= obj.x + obj.width &&
        pos.y >= obj.y &&
        pos.y <= obj.y + obj.height
      ) {
        return { type: "poi", id: obj.id };
      }
    }
    // Ajoutez ceci dans la fonction findItemAt
    for (const zone of zones) {
      if (zone.shapeType === "rectangle") {
        if (
          pos.x >= zone.x &&
          pos.x <= zone.x + zone.width &&
          pos.y >= zone.y &&
          pos.y <= zone.y + zone.height
        ) {
          return { type: "zone", id: zone.id };
        }
      } else if (zone.shapeType === "circle") {
        const dx = pos.x - zone.center.x;
        const dy = pos.y - zone.center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= zone.radius) {
          return { type: "zone", id: zone.id };
        }
      } else if (zone.shapeType === "polygon") {
        if (isInsidePolygon(pos, zone.points)) {
          return { type: "zone", id: zone.id };
        }
      }
    }

    for (const wall of walls) {
      if (isNearLine(pos, wall.start, wall.end)) {
        return { type: "wall", id: wall.id };
      }
    }

    for (const room of rooms) {
      if (isInsidePolygon(pos, room.points)) {
        return { type: "room", id: room.id };
      }
    }

    return null;
  };

  const isNearLine = (point, lineStart, lineEnd) => {
    const distance = distanceToLine(point, lineStart, lineEnd);
    return distance < 15;
  };

  const distanceToLine = (point, lineStart, lineEnd) => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  };

  const calculatePolygonArea = (points) => {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
  };

  const handleGeoJSONUploadModel = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const success = await GeoJsonManipulation.loadFloorPlanFromFileModel(
        file,
        setWalls,
        setRooms,
        setDoors,
        setWindows,
        setJsonData,
        setImageInfo,
        setScale,
        setOffset,
        canvasSize
      );
      if (success) {
        console.log("Plan d'étage chargé avec succès");
        // Réinitialiser le chemin actuel et les points de navigation
        setPathPoints({ start: null, end: null });
        setCurrentPath([]);
        setSelectedItem(null);
      } else {
        console.error("Échec du chargement du plan d'étage");
      }
    }
  };

  const handleGeoJSONUploadSystem = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const success = await GeoJsonManipulation.loadFloorPlanFromFileSysteme(
        file,
        setWalls,
        setPois,
        setDoors,
        setWindows,
        setJsonData,
        setImageInfo,
        setScale,
        setOffset,
        canvasSize
      );
      if (success) {
        console.log("Plan d'étage chargé avec succès");
        // Réinitialiser le chemin actuel et les points de navigation
        setPathPoints({ start: null, end: null });
        setCurrentPath([]);
        setSelectedItem(null);
      } else {
        console.error("Échec du chargement du plan d'étage");
      }
    }
  };

  const handleNameChange = (e) => {
    setNewPoiName(e.target.value);
  };

  const updatePOIName = () => {
    setPois((prevObjects) =>
      prevObjects.map((obj) =>
        obj.id === selectedPOI.id ? { ...obj, name: newPoiName } : obj
      )
    );
    setSelectedPOI(null); // Fermer la modification après sauvegarde
  };

  const deletePOI = () => {
    setPois((prevObjects) =>
      prevObjects.filter((obj) => obj.id !== selectedPOI.id)
    );
    setSelectedPOI(null); // Fermer l'interface après suppression
  };

  const handleCanvasClick = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;

    const clickedPOI = pois.find(
      (obj) =>
        offsetX >= obj.x - 15 &&
        offsetX <= obj.x + 15 &&
        offsetY >= obj.y - 15 &&
        offsetY <= obj.y + 15
    );
    console.log("====click");
    if (clickedPOI) {
      setSelectedPOI(clickedPOI);
      setNewPoiName(clickedPOI.name); // Pré-remplit avec l'ancien nom
    }
    if (tool === "poi") {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setPendingPoi({ x, y }); // Store position
      setShowPoiForm(true);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-gray-100 p-4 border-b flex items-center gap-2">
        <h1 className="text-xl font-bold">Dessinateur de Plan d'Intérieur</h1>
        <div className="flex ml-auto gap-2">
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              // eslint-disable-next-line no-restricted-globals
              if (
                window.confirm(
                  "Voulez-vous créer un nouveau projet? Toutes les modifications non sauvegardées seront perdues."
                )
              ) {
                setWalls([]);
                setRooms([]);
                setPois([]);
                setDoors([]);
                setWindows([]);
                setCurrentRoom([]);
                setCurrentWall(null);
                setSelectedItem(null);
                setPathPoints({ start: null, end: null });
                setCurrentPath([]);
              }
            }}
          >
            Nouveau
          </button>
          <button
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={() =>
              GeoJsonManipulation.exportToGeoJSON(walls, pois, doors, windows)
            }
          >
            Exporter
          </button>
          <input
            type="file"
            id="fileInputModel"
            accept=".geojson"
            className="hidden"
            onChange={handleGeoJSONUploadModel}
          />
          <button
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={() => document.getElementById("fileInputModel").click()}
          >
            Importer from modele
          </button>
          <input
            type="file"
            id="fileInputSysteme"
            accept=".geojson"
            className="hidden"
            onChange={handleGeoJSONUploadSystem}
          />
          <button
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={() => document.getElementById("fileInputSysteme").click()}
          >
            Importer from System
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-48 bg-gray-50 p-4 border-r flex flex-col">
          <h2 className="font-bold mb-2">Outils</h2>
          <div className="space-y-2 mb-4">
            <button
              className={`w-full px-3 py-2 rounded ${
                tool === "wall" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
              onClick={() => setTool("wall")}
            >
              Mur
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${
                tool === "zone" ? "bg-orange-600 text-white" : "bg-gray-200"
              }`}
              onClick={() => setTool("zone")}
            >
              Zone
            </button>

            {/* Sous-menu pour les types de zones, visible uniquement quand l'outil zone est sélectionné */}
            {tool === "zone" && (
              <div className="pl-4 space-y-1 mt-1">
                <button
                  className={`w-full px-2 py-1 text-sm rounded ${
                    zoneShapeType === "rectangle"
                      ? "bg-blue-300 text-white"
                      : "bg-gray-100"
                  }`}
                  onClick={() => setZoneShapeType("rectangle")}
                >
                  Rectangle
                </button>
                <button
                  className={`w-full px-2 py-1 text-sm rounded ${
                    zoneShapeType === "circle"
                      ? "bg-blue-300 text-white"
                      : "bg-gray-100"
                  }`}
                  onClick={() => setZoneShapeType("circle")}
                >
                  Cercle
                </button>
                <button
                  className={`w-full px-2 py-1 text-sm rounded ${
                    zoneShapeType === "polygon"
                      ? "bg-blue-300 text-white"
                      : "bg-gray-100"
                  }`}
                  onClick={() => setZoneShapeType("polygon")}
                >
                  Polygone
                </button>
              </div>
            )}
            <button
              className={`w-full px-3 py-2 rounded ${
                tool === "door" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
              onClick={() => setTool("door")}
            >
              Porte
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${
                tool === "room" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
              onClick={() => setTool("room")}
            >
              Pièce
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${
                tool === "poi" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
              onClick={handlePoiTool}
            >
              POI
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${
                tool === "window" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
              onClick={() => setTool("window")}
            >
              Fenêtre
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${
                tool === "path" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
              onClick={() => {
                setTool("path");
                setPathPoints({ start: null, end: null });
                setCurrentPath([]);
              }}
            >
              Navigation
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${
                tool === "select" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
              onClick={() => setTool("select")}
            >
              Sélectionner
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${
                tool === "erase" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
              onClick={() => setTool("erase")}
            >
              Effacer
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${
                tool === "pan" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
              onClick={() => setTool("pan")}
            >
              Déplacer
            </button>
          </div>

          <h2 className="font-bold mb-2">Zoom</h2>
          <div className="flex justify-between mb-4">
            <button
              className="px-3 py-1 bg-gray-200 rounded"
              onClick={() => setScale(Math.max(0.1, scale / 1.2))}
            >
              -
            </button>
            <span className="px-2">{Math.round(scale * 100)}%</span>
            <button
              className="px-3 py-1 bg-gray-200 rounded"
              onClick={() => setScale(Math.min(10, scale * 1.2))}
            >
              +
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div
            ref={canvasContainerRef}
            className="flex-1 overflow-hidden relative"
            onWheel={handleWheel}
            onClick={handleCanvasClick}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>

          <div className="h-48 bg-gray-100 border-t p-4 overflow-auto"></div>
        </div>
      </div>
      {showPoiForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-2">Ajouter un Objet</h2>
            <input
              type="text"
              placeholder="Nom de l'objet"
              value={poiName}
              onChange={(e) => setPoiName(e.target.value)}
              className="border p-2 rounded w-full mb-2"
            />
            <select
              value={poiCategory}
              onChange={(e) => setPoiCategory(e.target.value)}
              className="border p-2 rounded w-full mb-2"
            >
              <option value="">Sélectionner une catégorie</option>
              <option value="furniture">Mobilier</option>
              <option value="electronics">Électronique</option>
              <option value="plant">Plante</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 bg-gray-400 text-white rounded"
                onClick={() => setShowPoiForm(false)}
              >
                Annuler
              </button>
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded"
                onClick={handleCreatePoi}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedPOI && (
        <div className="absolute top-10 left-10 bg-white p-4 shadow-lg border rounded">
          <h2 className="text-lg font-bold">Modifier / Supprimer le POI</h2>

          <label className="block mt-2 text-sm font-medium">Nom du POI :</label>
          <input
            type="text"
            value={newPoiName}
            onChange={handleNameChange}
            className="w-full border p-2 rounded mt-1"
          />

          <p className="text-sm text-gray-600 mt-2">
            <strong>Catégorie:</strong> {selectedPOI.category}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Coordonnées:</strong> (X: {selectedPOI.x}, Y:{" "}
            {selectedPOI.y})
          </p>

          <div className="mt-4 flex space-x-2">
            <button
              onClick={updatePOIName}
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Sauvegarder
            </button>
            <button
              onClick={deletePOI}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Supprimer
            </button>
            <button
              onClick={() => setSelectedPOI(null)}
              className="px-3 py-1 bg-gray-500 text-white rounded"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      {showZoneForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-2">Nommer la zone</h2>
            <input
              type="text"
              placeholder="Nom de la zone"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              className="border p-2 rounded w-full mb-2"
            />
            <div className="mb-3">
              <label
                htmlFor="zone-type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Type de zone:
              </label>
              <select
                id="zone-type"
                className="border p-2 rounded w-full"
                value={zoneType}
                onChange={(e) => setZoneType(e.target.value)}
              >
                <option value="circulation">Zone de circulation</option>
                <option value="danger">Zone de danger</option>
                <option value="work">Zone de travail</option>
                <option value="service">Zone de service</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 bg-gray-400 text-white rounded"
                onClick={() => {
                  setShowZoneForm(false);
                  setZones(zones.slice(0, -1)); // Supprimer la dernière zone
                }}
              >
                Annuler
              </button>
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded"
                onClick={() => {
                  setZones(
                    zones.map((zone, i) =>
                      i === zones.length - 1
                        ? { ...zone, name: newZoneName || "Zone sans nom" }
                        : zone
                    )
                  );
                  setShowZoneForm(false);
                  setNewZoneName("");
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorPlanV4;
