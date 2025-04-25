import React, { useState, useRef, useEffect } from 'react';
import { movePOI, stopDraggingPOI, zoomPOI , findClickedPOI ,handPoi ,drawPOIs,handlePOI,handleObjectDrag } from './pois';
import {updateCanvasSize} from './canvasUtils'
import GeoJsonManipulation  from './GeoJsonManipulation';
import { getMousePos, calculateDoorPosition,calculatePolygonArea} from './Utils';
import { drawGrid} from './Draw';
import {WallLengthPopup} from "./components/WallLengthPop"
import {ConfirmationDialog} from "./components/confirmationDialog"
import {handleDoor} from './handlers/handleDoors'
import {ZonePropertiesPanel} from "./components/ZonePropertiesPanel"
import {handleRoomDrawing,drawCurrentRoom} from './handlers/handleRooms'
import {handlePan} from './handlers/handlePan';
import {handlePath ,drawPath} from './handlers/handlNavigation';
import {handleSelect} from './handlers/handleSelect';
import {handleErase,handleDrawingEnd,isNearPoint } from './handlers/handleErase';
import {useFloorPlanZones} from "./hooks/useZonesEditor"
import { useZones } from './hooks/useZones';
import  {DeleteWallButton} from "./components/deleteWallBtn"
const FloorPlanV4 = () => {

  // Icons for different categories
  const categoryIcons = {
    furniture: "./bur.svg",
    electronics: "./hh.svg",
    plant: "./stair.svg",
    default: "./logo.svg",
  };


  
  const [showPoiForm, setShowPoiForm] = useState(false);
  const [poiName, setPoiName] = useState('');
  const [poiCategory, setPoiCategory] = useState('');
  const [pendingPoi, setPendingPoi] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [newPoiName, setNewPoiName] = useState(""); // Pour stocker le nouveau nom
  const [tool, setTool] = useState('wall');
  const [pois, setPois] = useState([]);
  const [doors, setDoors] = useState([]);
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
    setPois, pois, categoryIcons
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

  // import useZoneEditor Hook
  const {
    drawRooms,
    drawWalls,
    handleSelectDoorType,
    drawWallPreview,
    setCurrentPoint,
    setWalls,
    handleMouseDown : mouseDown,
    handleMouseMove:mouseMove,
    handleMouseUp:mouseUp,
    setRooms,
    cancelWallLengthPopup,
    currentPoint,
    startPoint,
    selectedVertex,
    wallThickness,
    wallLengthPopup,
    selectedWallId,
    deleteWall,
    applyWallLength,
    mode,
    placedObjects,
    action,
    hoverVertex,
    getCanvasPoint,
    selectedRoom,
    binderRef,
    binderVersion,
    nearNodePoint,
    walls,
    rooms,
    isPreview,
  }= useFloorPlanZones(canvasRef,tool,onChangeTool)

  const {
    zones,
    zoneDrawingMode,
    startRectangleDrawing,
    startCircleDrawing,
    startPolygonDrawing,
    drawAllZones,
    openCoordinateForm,
    drawZonePreview,
    selectedZone,
    isDrawing,
    zoneToDelete,
    cancelZoneDeletion,
    setIsDrawing,
    currentZonePoints,
    setCurrentZonePoints,
    deleteZone,
    initiateZoneDelete,
    showDeleteConfirmation,
    predefinedZoneTypes,
    addCustomZoneType,
    updateZoneProperties,
    handlePolygonClick,
    showZoneProperties,
    setShowZoneProperties,
    handleZoneMouseDown,
    finishPolygonZone,
    handleZoneMouseMove,
    handleZoneMouseUp,
    finishRectangleZone,
    finishCircleZone,
    setDrawingZoneMode,
    updateCoordinates,
    coordinatesInMeters
  } = useZones(tool);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && zoneDrawingMode === 'polygon') {
        setDrawingZoneMode(null);
        setCurrentZonePoints([]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoneDrawingMode, setDrawingZoneMode, setCurrentZonePoints]);

  const handleDoubleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;
    
    handleZoneMouseDown(x, y, true);
  };

  const handleZoneToolClick = (zoneTool) => {
    setTool(null);
    if (zoneTool === 'rectangle') {
      startRectangleDrawing();
    } else if (zoneTool === 'circle') {
      startCircleDrawing();
    } else if (zoneTool === 'polygon') {
      startPolygonDrawing();
    } else if (zoneTool === 'coordinates') {
      openCoordinateForm();
    }
  };

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
    
    drawRooms(ctx);
    drawWalls(ctx);
      if(placedObjects && placedObjects.length){
        placedObjects.forEach(object => {
          object.draw(ctxRef.current)
        })
      }

      if (typeof drawAllZones === 'function') {
        drawAllZones(ctx);
      }
      //console.log("dkhalllllllll",zoneDrawingMode,currentZonePoints,currentPoint)
      if (zoneDrawingMode && currentZonePoints.length && currentPoint) {
        drawZonePreview(ctx, currentZonePoints[0], currentPoint);
      }
    if ((tool === 'wall' || tool === 'partition') && action === 1 && startPoint && currentPoint) {
      drawWallPreview(ctx, startPoint, currentPoint, 
        mode === 'wall' ? wallThickness : 10);
    }
    if (nearNodePoint && tool != "select") {
      const point = nearNodePoint.point
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
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
    //drawZones(ctx,scale,zones,isDrawing,selectedItem,currentZone,currentPolygonPoints,zoneShapeType)
    ctx.restore();
  }, [walls, rooms,currentZonePoints,zoneDrawingMode, pois, doors,zones, windows, currentWall, currentWindow, currentRoom, isDrawing, scale, offset, selectedItem, pathPoints, currentPath, tool,action,startPoint,currentPoint,nearNodePoint,binderRef,binderVersion,isPreview,placedObjects]);
  
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
        }*/
        setSelectedItem(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [tool, selectedItem, walls, doors, zones, rooms, pois]);
 

  const handleMouseDown = (e) => {
    const mousePos = getCanvasPoint(e)
      if (zoneDrawingMode === 'polygon') {
        handlePolygonClick(mousePos.x, mousePos.y);
        setCurrentPoint(mousePos); // Track the current mouse position for preview
        return;
      }else if (zoneDrawingMode === 'rectangle' || zoneDrawingMode === 'circle') {
      setIsDrawing(true);
      setCurrentZonePoints([{ x:mousePos.x, y:mousePos.y }]);
      return;
    }
    handleObjectDrag(e, pois, setDraggingId, setOffset, offset, scale);
    handlePan(e, setIsDragging, setDragStart, offset, tool);
    const selectedZone = handleZoneMouseDown(mousePos.x, mousePos.y, false);
    if(selectedZone) return;
    mouseDown(e,tool)
    switch (tool) {
      case 'path':
        handlePath(mousePos, pathPoints, setPathPoints, setCurrentPath, walls, doors);
        break;
      case 'select':
        handleSelect(mousePos, setSelectedItem,doors, pois,walls,rooms);
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
       /*   default:
        handleDrawingStart(tool, mousePos, setCurrentWall, setCurrentWindow, setCurrentRoom, currentRoom, isNearPoint);
        setIsDrawing(true); */ 
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const mousePos = getMousePos(canvas, e, offset, scale);
    //console.log("Mouse Move Event Triggered",zoneDrawingMode,isDrawing);
    if (isDrawing && zoneDrawingMode) {
      setCurrentPoint(mousePos); // Track the current mouse position for preview
      return;
    }
   // console.log("dkhalll ",mousePos)
    handleZoneMouseMove(mousePos.x,mousePos.y)
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
   /* if (isDrawing && tool === "zone" && currentZone) {
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
    }*/
  };
  
  const handleMouseUp = (e) => {
    const mousePos = getMousePos(canvasRef.current, e, offset, scale);
    if (isDrawing && zoneDrawingMode) {
      if (zoneDrawingMode === 'rectangle') {
        finishRectangleZone(currentZonePoints[0], mousePos);
      } else if (zoneDrawingMode === 'circle') {
        finishCircleZone(currentZonePoints[0], mousePos);
      }
      setTool("select")
      return;
    }
    handleDrawingEnd(tool,mousePos,currentWall, setWalls,currentWindow, setWindows,currentRoom, setRooms,calculatePolygonArea,setCurrentRoom, setIsDrawing,isNearPoint );
    setDraggingId(stopDraggingPOI());
    handleZoneMouseUp()
    mouseUp(e,tool)
    if (isDragging) {
      setIsDragging(false);
      return;
    }
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
    setPois(prevObjects =>
      prevObjects.map(obj =>
        obj.id === selectedPOI.id ? { ...obj, name: newPoiName } : obj
      )
    );
    setSelectedPOI(null); // Fermer la modification après sauvegarde
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
    }

    if (tool === "poi") {
      handlePOI(e, canvasRef, setPendingPoi, setShowPoiForm, offset, scale);
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
      <div className="zone-tools">
        <button onClick={() => handleZoneToolClick('rectangle')}>Rectangle Zone</button>
        <button onClick={() => handleZoneToolClick('circle')}>Circle Zone</button>
        <button onClick={() => handleZoneToolClick('polygon')}>Polygon Zone</button>
        <button onClick={() => handleZoneToolClick('coordinates')}>Manual Coordinates</button>
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
              onDoubleClick={handleDoubleClick}
              onContextMenu={(e) => {
                e.preventDefault();
                if (zoneDrawingMode === 'polygon' && currentZonePoints.length >= 3) {
                  finishPolygonZone();
                }
              }}
              className="border border-red-700"
              style={{ 
                pointerEvents:"auto",
                cursor: 
                  nearNodePoint ? 'grab' : 
                  (mode === 'line' || mode === 'partition') ? 'crosshair' : 'default' 
              }}
            />


{showZoneProperties && selectedZone && (
  <ZonePropertiesPanel
    selectedZone={selectedZone}
    onUpdate={updateZoneProperties}
    onClose={() => setShowZoneProperties(false)}
    predefinedZoneTypes={predefinedZoneTypes}
    onAddCustomType={addCustomZoneType}
    coordinatesInMeters={coordinatesInMeters}
    updateCoordinate={updateCoordinates}
    initiateZoneDelete={initiateZoneDelete}
  />
)}
{showDeleteConfirmation && (
  <ConfirmationDialog
    message={`Are you sure you want to delete the zone "${zoneToDelete?.name}"?`}
    onConfirm={deleteZone}
    onCancel={cancelZoneDeletion}
  />
)}
{zoneDrawingMode === 'polygon' && currentZonePoints.length >= 3 && (
  <button
    className="px-2 py-1 bg-green-500 text-white text-sm rounded absolute bottom-4 right-4 z-10"
    onClick={() => finishPolygonZone()}
  >
    Finish Polygon
  </button>
)}

{selectedWallId !== null && tool === 'select' && (
  <DeleteWallButton wallId={selectedWallId} onDelete={deleteWall} />
)}

<WallLengthPopup
      visible={wallLengthPopup.visible}
      x={wallLengthPopup.x}
      y={wallLengthPopup.y}
      initialValue={wallLengthPopup.inputValue}
      onApply={(value) => applyWallLength(value)}
      onCancel={() => cancelWallLengthPopup()}
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
          <strong>Coordonnées:</strong> (X: {selectedPOI.x}, Y: {selectedPOI.y})
        </p>

        <div className="mt-4 flex space-x-2">
          <button onClick={updatePOIName} className="px-3 py-1 bg-blue-500 text-white rounded">
            Sauvegarder
          </button>
          <button onClick={deletePOI} className="px-3 py-1 bg-red-500 text-white rounded">
            Supprimer
          </button>
          <button onClick={() => setSelectedPOI(null)} className="px-3 py-1 bg-gray-500 text-white rounded">
            Annuler
          </button>
        </div>
      </div>
    )}
    </div>
  );
};

export default FloorPlanV4;