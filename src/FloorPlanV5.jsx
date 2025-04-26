import React, { useState, useRef, useEffect } from 'react';
import { movePOI, stopDraggingPOI, zoomPOI , findClickedPOI, getCanvasClickPosition ,handPoi ,drawPOIs,handlePOI,handleObjectDrag, updatePOIProperties, POIEditForm } from './pois';
import {updateCanvasSize} from './canvasUtils'
import GeoJsonManipulation  from './GeoJsonManipulation';
import { getMousePos, calculateDoorPosition,calculatePolygonArea, findItemAt} from './Utils';
import {displayMeasurements , drawGrid} from './Draw';
//import {drawWalls} from './handlers/handleWalls'
import {drawDoors ,handleDoor } from './handlers/handleDoors'
import {drawWindows } from './handlers/handleWindows'
import {drawRooms ,handleRoomDrawing,drawCurrentRoom} from './handlers/handleRooms'
import {handlePan} from './handlers/handlePan';
import {handlePath ,drawPath} from './handlers/handlNavigation';
import {handleSelect} from './handlers/handleSelect';
import {handleErase,handleDrawingStart,handleDrawingEnd,isNearPoint } from './handlers/handleErase';
import { drawZones, handleZoneDrawing } from './handlers/handkeZones';
import {useFloorPlanZones} from "./hooks/useZonesEditor"
const FloorPlanV4 = () => {

  // Icons for different categories
  const categoryIcons = {
    furniture: "./bur.svg",
    electronics: "./hh.svg",
    plant: "./stair.svg",
    default: "./logo.svg",
  };

  // zones states variables 
  // start 
  const [zones, setZones] = useState([]);
  const [currentZone, setCurrentZone] = useState(null);
  const [zoneShapeType, setZoneShapeType] = useState("rectangle"); // rectangle, circle, polygon
  const [zoneType, setZoneType] = useState("circulation"); //zone de circulation,zone de travail,zone de danger,zone de service..
  const [currentPolygonPoints, setCurrentPolygonPoints] = useState([]);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  // end
  
  const [showPoiForm, setShowPoiForm] = useState(false);
  const [poiName, setPoiName] = useState('');
  const [newPoiWidth, setNewPoiWidth] = useState(50);
  const [newPoiHeight, setNewPoiHeight] = useState(50);
  const [poiWidth, setPoiWidth] = useState(50);
  const [poiHeight, setPoiHeight] = useState(50);
  const [poiCategory, setPoiCategory] = useState('');
  const [pendingPoi, setPendingPoi] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [newPoiName, setNewPoiName] = useState(""); // Pour stocker le nouveau nom
  const [tool, setTool] = useState('wall');
  //const [walls, setWalls] = useState([]);
  //const [rooms, setRooms] = useState([]);
  const [pois, setPois] = useState([]);
  const [doors, setDoors] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWall, setCurrentWall] = useState(null);
  const [currentRoom, setCurrentRoom] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [jsonData, setJsonData] = useState('');
  const [pathPoints, setPathPoints] = useState({ start: null, end: null });
  const [currentPath, setCurrentPath] = useState([]);
  const [windows, setWindows] = useState([]);
  const [currentWindow, setCurrentWindow] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);
  const { handlePoiTool, handleCreatePoi } = handPoi(
    tool, setTool, setShowPoiForm, 
    poiName, setPoiName, 
    poiCategory, setPoiCategory,
    pendingPoi, setPendingPoi, 
    setPois, pois, categoryIcons,
    poiWidth, setPoiWidth,
    poiHeight, setPoiHeight
  );
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  // add ctxRef 
  const ctxRef = useRef(null)
  const onChangeTool=(tool)=>{
    setTool(tool)
  }
  const {
    drawRooms,
    drawWalls,
    handleSelectDoorType,
    drawWallPreview,
    setWalls,
    getCanvasPoint,
    handleMouseDown : mouseDown,
    handleMouseMove:mouseMove,
    handleMouseUp:mouseUp,
    setRooms,
    setAction,
    currentPoint,
    startPoint,
    selectedVertex,
    wallThickness,
    mode,
    placedObjects,
    action,
    hoverVertex,
    selectedRoom,
    binderRef,
    binderVersion,
    nearNodePoint,
    walls,
    rooms,
    isPreview,
  }= useFloorPlanZones(null,canvasRef,tool,onChangeTool)

  useEffect(() => {
    const handleResize = () => updateCanvasSize(canvasContainerRef, setCanvasSize);
    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvasContainerRef, setCanvasSize]);


  useEffect(()=>{
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    // Set initial canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    drawCanvas()
  },[])



  // drawCanvas function 
  const drawCanvas = /*useCallback(*/() => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw existing walls
    //walls.forEach(wall => {
      drawWalls(walls, ctx);
   // });
    
    drawRooms(ctx, rooms);
    /*if (selectedObject?.type === 'wall') {
      drawWall(ctx, selectedObject, true);
    }*/
      if(placedObjects && placedObjects.length){
        placedObjects.forEach(object => {
          object.draw(ctxRef.current)
        })
      }

    // Draw wall preview when in drawing mode
    if ((tool === 'wall' || tool === 'partition') && action === 1 && startPoint && currentPoint) {
      drawWallPreview(ctx, startPoint, currentPoint, 
        mode === 'wall' ? wallThickness : 10);
    }
    
    // Draw green circle indicator when near a wall node
    if (nearNodePoint && tool != "select") {
      ctx.beginPath();
      ctx.arc(nearNodePoint.x, nearNodePoint.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(92, 186, 121, 0.5)';
      ctx.fill();
      ctx.strokeStyle = '#5cba79';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (hoverVertex) {
      ctx.beginPath();
      ctx.arc(hoverVertex.x, hoverVertex.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(92, 186, 121, 0.6)';
      ctx.fill();
      ctx.strokeStyle = '#5cba79';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    if (selectedVertex) {
      ctx.beginPath();
      ctx.arc(selectedVertex.x, selectedVertex.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(92, 186, 121, 0.8)';
      ctx.fill();
      ctx.strokeStyle = '#5cba79';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
  
    drawGrid(ctx, offset, scale, canvasSize);
    
    // Preload icons
    const preloadedIcons = {};
    Object.keys(categoryIcons).forEach((category) => {
      preloadedIcons[category] = new Image();
      preloadedIcons[category].src = categoryIcons[category];
    });

    drawCanvas();
  
    // drawing objects 
    if(binderRef.current && isPreview){
      binderRef.current.draw(ctxRef.current,true)
    }
    //drawWalls(ctx, walls, selectedItem, displayMeasurements);
  //  drawDoors(ctx, doors, selectedItem);
    //drawWindows(ctx, windows, selectedItem, displayMeasurements);
   // drawRooms(ctx, rooms, selectedItem);
    drawPOIs(ctx, pois, selectedItem, preloadedIcons, scale);
    drawPath(ctx, pathPoints, currentPath);
    drawCurrentRoom(ctx, currentRoom, isDrawing);
    
    // draw zones 
    drawZones(ctx,scale,zones,isDrawing,selectedItem,currentZone,currentPolygonPoints,zoneShapeType)
    ctx.restore();
  }, [walls, rooms, pois, doors,zones, windows, currentWall, currentWindow, currentRoom, isDrawing, scale, offset, selectedItem, pathPoints, currentPath, tool,action,startPoint,currentPoint,nearNodePoint,binderRef,binderVersion,isPreview,placedObjects]);
  
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (tool === "select" && (event.key === "Delete" || event.key === "Backspace")) {
        if (!selectedItem) return; // Prevents the error when selectedItem is null
       /* if (selectedItem.type === "wall") {
          setWalls(walls.filter((w) => w.id !== selectedItem.id));
          setDoors(doors.filter((d) => d.wallId !== selectedItem.id));
        } else if (selectedItem.type === "room") {
          setRooms(rooms.filter((r) => r.id !== selectedItem.id));
        } else if (selectedItem.type === "poi") {
          setPois(pois.filter((o) => o.id !== selectedItem.id));
        } else if (selectedItem.type === "door") {
          setDoors(doors.filter((d) => d.id !== selectedItem.id));
        }else */if (selectedItem && selectedItem.type === "zone") {
          setZones(zones.filter((z) => z.id !== selectedItem.id));
          console.log("Zone supprimée :", selectedItem.id);
        }
        setSelectedItem(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [tool, selectedItem, walls, doors, zones, rooms, pois]);
 

  const handleMouseDown = (e) => {
    console.log("called ",tool)
    const canvas = canvasRef.current;
    const mousePos = getMousePos(canvas, e, offset, scale);
    handleObjectDrag(e, pois, setDraggingId, setOffset, offset, scale);
    handlePan(e, setIsDragging, setDragStart, offset, tool);
    mouseDown(e,tool)
    switch (tool) {
      case 'path':
        handlePath(mousePos, pathPoints, setPathPoints, setCurrentPath, walls, doors);
        break;
      case 'select':
        handleSelect(mousePos, setSelectedItem,doors, pois,walls,rooms);
       // const item = findItemAt(mousePos,doors,pois,zones,walls,rooms);
        //setSelectedItem(item);
        break;
      case 'door':
        handleDoor(mousePos, selectedItem, walls, calculateDoorPosition, doors, setDoors);
        break;
      case 'erase':
        handleErase(selectedItem, setWalls, setDoors, setRooms, setPois, walls, doors, rooms, pois, setSelectedItem);
        break;
      case 'poi':
        handlePOI(e, canvasRef, setPendingPoi, setShowPoiForm, offset, scale);
        break;
      case 'room':
          handleRoomDrawing(mousePos,currentRoom,setCurrentRoom,setRooms,calculatePolygonArea,setIsDrawing,isNearPoint );
          break;
      case "zone":
        handleZoneDrawing(mousePos,zoneShapeType,zones, setCurrentZone,setIsDrawing,currentPolygonPoints,setCurrentPolygonPoints,setZones,setShowZoneForm,setNewZoneName)
      break;
       /*   default:
        handleDrawingStart(tool, mousePos, setCurrentWall, setCurrentWindow, setCurrentRoom, currentRoom, isNearPoint);
        setIsDrawing(true); */ 
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const mousePos = getMousePos(canvas, e, offset, scale);
    mouseMove(e,tool)
    if (draggingId !== null) {
      const { offsetX, offsetY } = e.nativeEvent;
      setPois(prevObjects => movePOI(prevObjects, draggingId, offsetX, offsetY, offset, scale));
    }

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    if (!isDrawing) return;

    /*if (tool === 'wall' && currentWall) {
      setCurrentWall({ ...currentWall, end: { x: mousePos.x, y: mousePos.y } });

      const ctx = canvas.getContext('2d');
      displayMeasurements(ctx, currentWall.start, { x: mousePos.x, y: mousePos.y });
    }*/

    /*if (tool === 'window' && currentWindow) {
      setCurrentWindow({ ...currentWindow, end: { x: mousePos.x, y: mousePos.y } });

      const ctx = canvas.getContext('2d');
      displayMeasurements(ctx, currentWindow.start, { x: mousePos.x, y: mousePos.y });
    }*/
   
    // zone -mouse move 
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
  };
  
  const handleMouseUp = (e) => {
    const mousePos = getMousePos(canvasRef.current, e, offset, scale);
    handleDrawingEnd(tool,mousePos,currentWall, setWalls,currentWindow, setWindows,currentRoom, setRooms,calculatePolygonArea,setCurrentRoom, setIsDrawing,isNearPoint );
    setIsDrawing(false); // Stop drawing mode
    setDraggingId(stopDraggingPOI());
    mouseUp(e,tool)
    if (isDragging) {
      setIsDragging(false);
      return;
    }
    if (!isDrawing) return;
   /* if (tool === 'wall' && currentWall) {
      const dx = currentWall.end.x - currentWall.start.x;
      const dy = currentWall.end.y - currentWall.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 10) {
        setWalls([...walls, { ...currentWall }]);
      }

      setCurrentWall(null);
    } else if (tool === 'window' && currentWindow) {
      const dx = currentWindow.end.x - currentWindow.start.x;
      const dy = currentWindow.end.y - currentWindow.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 10) {
        setWindows([...windows, { ...currentWindow, type: 'window' }]);
      }

      setCurrentWindow(null);
    }else*/
    //mouseUp(e,tool)
    
    if (isDrawing && tool === "zone") {
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
    const { newScale, newOffset } = zoomPOI(scale, offset, e, getMousePos, canvasRef.current);
    setScale(newScale);
    setOffset(newOffset);
  };

  const handleGeoJSONUploadModel = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const success = await GeoJsonManipulation.loadFloorPlanFromFileModel(file,setWalls,setRooms,setDoors,setWindows,setJsonData,setImageInfo,setScale,setOffset,canvasSize);
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
      const success = await GeoJsonManipulation.loadFloorPlanFromFileSysteme(file,setWalls, setPois,setDoors,setWindows,setJsonData,setImageInfo,setScale,setOffset,canvasSize);
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
    setPois(prevObjects => updatePOIProperties(
      prevObjects, 
      selectedPOI, 
      newPoiName, 
      newPoiWidth, 
      newPoiHeight
    ));
    setSelectedPOI(null); // Close edit form after saving
  };

  const deletePOI = () => {
    setPois(prevObjects => prevObjects.filter(obj => obj.id !== selectedPOI.id));
    setSelectedPOI(null); // Fermer l'interface après suppression
  };

  const handleCanvasClick = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
  
    const clickedPOI = findClickedPOI(pois, offsetX, offsetY, offset, scale);
    if (clickedPOI) {
      setSelectedPOI(clickedPOI);
      setNewPoiName(clickedPOI.name);
      setNewPoiWidth(clickedPOI.width);
      setNewPoiHeight(clickedPOI.height);
    }
  
    if (tool === "poi") {
      handlePOI(e, canvasRef, setPendingPoi, setShowPoiForm, offset, scale);
    }
  };

  const [selectedWall, setSelectedWall] = useState(null); // Stores the selected wall
  const [isResizing, setIsResizing] = useState(false); // Tracks if resizing is active
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Stores mouse offset for dragging

  const startDraggingWall = (x, y) => {
    if (selectedWall) {
        setDragOffset({ x: x - selectedWall.x, y: y - selectedWall.y });
        setIsDragging(true);
    }
  };

  const selectWall = (x, y) => {
    const clickedWall = walls.find(wall => 
        x >= wall.x && x <= wall.x + wall.width &&
        y >= wall.y && y <= wall.y + wall.height
    );
    setSelectedWall(clickedWall || null);
  };
  
  const startResizingWall = (x, y) => {
    if (selectedWall) {
        const nearRightEdge = x >= selectedWall.x + selectedWall.width - 10;
        if (nearRightEdge) {
            setIsResizing(true);
        }
    }
  };

  const updateWallPosition = (x, y) => {
    if (isDragging && selectedWall) {
        setWalls(prevWalls => prevWalls.map(wall => 
            wall === selectedWall 
                ? { ...wall, x: x - dragOffset.x, y: y - dragOffset.y }
                : wall
        ));
    }
  };

  const updateWallSize = (x) => {
    if (isResizing && selectedWall) {
        setWalls(prevWalls => prevWalls.map(wall => 
            wall === selectedWall 
                ? { ...wall, width: Math.max(10, x - wall.x) }
                : wall
        ));
    }
  };
  const deselectWall = () => {
    setSelectedWall(null);
    setIsDragging(false);
    setIsResizing(false);
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
              if (confirm('Voulez-vous créer un nouveau projet? Toutes les modifications non sauvegardées seront perdues.')) {
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
            onClick={ ()=> GeoJsonManipulation.exportToGeoJSON(walls, pois, doors, windows)}
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
            onClick={() => document.getElementById('fileInputModel').click()}
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
            onClick={() => document.getElementById('fileInputSysteme').click()}
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
          onClick={() => setTool('select')}
          className={`w-full px-3 py-2 rounded ${tool === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Sélectionner
        </button>
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'wall' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTool('wall')}
            >
              Wall
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'partition' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTool('partition')}
            >
              Partition
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${
                tool === "zone" ? "bg-orange-600 text-white" : "bg-gray-200"
              }`}
              onClick={() => setTool("zone")}
            >
              Zone
            </button>
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
        className={`w-full px-3 py-2 rounded ${tool === 'door' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        onClick={() => setTool('door_mode')}
      >
        Porte
      </button>
            {tool === "door_mode" && (
        <div className="pl-4 space-y-1 mt-1">
          <button
            className="w-full px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
            onClick={() => handleSelectDoorType('doorSingle')}
          >
            Single Door
          </button>
          <button
            className="w-full px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
            onClick={() => handleSelectDoorType('doorDouble')}
          >
            Double Door
          </button>
          <button
            className="w-full px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
            onClick={() => handleSelectDoorType('windowSingle')}
          >
            Single Window
          </button>
          <button
            className="w-full px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
            onClick={() => handleSelectDoorType('windowDouble')}
          >
            Double Window
          </button>
        </div>
      )}
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'room' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTool('room')}
            >
              Pièce
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'poi' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={handlePoiTool}
            >
              POI
            </button>
            <button
                className={`w-full px-3 py-2 rounded ${tool === 'window' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setTool('window')}
                >
                Fenêtre
                </button>
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'path' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => {
                setTool('path');
                setPathPoints({ start: null, end: null });
                setCurrentPath([]);
              }}
            >
              Navigation
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'erase' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTool('erase')}
            >
              Effacer
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'pan' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTool('pan')}
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
              style={{ 
                cursor: 
                  nearNodePoint ? 'grab' : 
                  (mode === 'line' || mode === 'partition') ? 'crosshair' : 'default' 
              }}
            />
          </div>

          
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
      {/* Add width and height inputs */}
      <div className="flex gap-2 mb-2">
        <div className="w-1/2">
          <label className="block text-sm font-medium">Largeur :</label>
          <input
            type="number"
            placeholder="Largeur"
            value={poiWidth}
            onChange={(e) => setPoiWidth(Number(e.target.value))}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="w-1/2">
          <label className="block text-sm font-medium">Hauteur :</label>
          <input
            type="number"
            placeholder="Hauteur"
            value={poiHeight}
            onChange={(e) => setPoiHeight(Number(e.target.value))}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button className="px-3 py-1 bg-gray-400 text-white rounded" onClick={() => setShowPoiForm(false)}>
          Annuler
        </button>
        <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={handleCreatePoi}>
          Ajouter
        </button>
      </div>
    </div>
  </div>
)}
       {selectedPOI && (
  <POIEditForm
    selectedPOI={selectedPOI}
    newPoiName={newPoiName}
    setNewPoiName={setNewPoiName}
    newPoiWidth={newPoiWidth}
    setNewPoiWidth={setNewPoiWidth}
    newPoiHeight={newPoiHeight}
    setNewPoiHeight={setNewPoiHeight}
    updatePOIName={updatePOIName}
    deletePOI={deletePOI}
    setSelectedPOI={setSelectedPOI}
  />
)}
    </div>
  );
};

export default FloorPlanV4;
