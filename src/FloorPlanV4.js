import React, { useState, useRef, useEffect } from 'react';
import { movePOI, stopDraggingPOI, zoomPOI , findClickedPOI, getCanvasClickPosition ,handPoi ,drawPOIs,handlePOI,handleObjectDrag } from './pois';
import {updateCanvasSize} from './canvasUtils'
import GeoJsonManipulation  from './GeoJsonManipulation';
import { getMousePos, calculateDoorPosition,calculatePolygonArea} from './Utils';
import {displayMeasurements , drawGrid} from './Draw';
import {drawWalls} from './handlers/handleWalls'
import {drawDoors ,handleDoor } from './handlers/handleDoors'
import {drawWindows } from './handlers/handleWindows'
import {drawRooms ,handleRoomDrawing,drawCurrentRoom} from './handlers/handleRooms'
import {handlePan} from './handlers/handlePan';
import {handlePath ,drawPath} from './handlers/handlNavigation';
import {handleSelect} from './handlers/handleSelect';
import {handleErase,handleDrawingStart,handleDrawingEnd,isNearPoint } from './handlers/handleErase';

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
  const [walls, setWalls] = useState([]);
  const [rooms, setRooms] = useState([]);
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
    setPois, pois, categoryIcons
  );
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => updateCanvasSize(canvasContainerRef, setCanvasSize);
    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvasContainerRef, setCanvasSize]);

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
  
    drawWalls(ctx, walls, selectedItem, displayMeasurements);
    drawDoors(ctx, doors, selectedItem);
    drawWindows(ctx, windows, selectedItem, displayMeasurements);
    drawRooms(ctx, rooms, selectedItem);
    drawPOIs(ctx, pois, selectedItem, preloadedIcons, scale);
    drawPath(ctx, pathPoints, currentPath);
    drawCurrentRoom(ctx, currentRoom, isDrawing);
  
    ctx.restore();
  }, [walls, rooms, pois, doors, windows, currentWall, currentWindow, currentRoom, isDrawing, scale, offset, selectedItem, pathPoints, currentPath, tool]);
  
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (tool === "select" && (event.key === "Delete" || event.key === "Backspace")) {
        if (!selectedItem) return; // Prevents the error when selectedItem is null
  
        if (selectedItem.type === "wall") {
          setWalls(walls.filter((w) => w.id !== selectedItem.id));
          setDoors(doors.filter((d) => d.wallId !== selectedItem.id));
        } else if (selectedItem.type === "room") {
          setRooms(rooms.filter((r) => r.id !== selectedItem.id));
        } else if (selectedItem.type === "poi") {
          setPois(pois.filter((o) => o.id !== selectedItem.id));
        } else if (selectedItem.type === "door") {
          setDoors(doors.filter((d) => d.id !== selectedItem.id));
        }
        setSelectedItem(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [tool, selectedItem, walls, doors, rooms, pois]);
 

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const mousePos = getMousePos(canvas, e, offset, scale);
    handleObjectDrag(e, pois, setDraggingId, setOffset, offset, scale);
    handlePan(e, setIsDragging, setDragStart, offset, tool);
    switch (tool) {
      case 'path':
        handlePath(mousePos, pathPoints, setPathPoints, setCurrentPath, walls, doors);
        break;
      case 'select':
        handleSelect(mousePos, setSelectedItem, doors, pois, walls, rooms);
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
      default:
        handleDrawingStart(tool, mousePos, setCurrentWall, setCurrentWindow, setCurrentRoom, currentRoom, isNearPoint);
        setIsDrawing(true);  
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const mousePos = getMousePos(canvas, e, offset, scale);

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

    if (tool === 'wall' && currentWall) {
      setCurrentWall({ ...currentWall, end: { x: mousePos.x, y: mousePos.y } });

      const ctx = canvas.getContext('2d');
      displayMeasurements(ctx, currentWall.start, { x: mousePos.x, y: mousePos.y });
    }

    if (tool === 'window' && currentWindow) {
      setCurrentWindow({ ...currentWindow, end: { x: mousePos.x, y: mousePos.y } });

      const ctx = canvas.getContext('2d');
      displayMeasurements(ctx, currentWindow.start, { x: mousePos.x, y: mousePos.y });
    }
  };
  
  const handleMouseUp = (e) => {
    const mousePos = getMousePos(canvasRef.current, e, offset, scale);
    handleDrawingEnd(tool,mousePos,currentWall, setWalls,currentWindow, setWindows,currentRoom, setRooms,calculatePolygonArea,setCurrentRoom, setIsDrawing,isNearPoint );
    setIsDrawing(false); // Stop drawing mode
    setDraggingId(stopDraggingPOI());
    if (isDragging) {
      setIsDragging(false);
      return;
    }
    if (!isDrawing) return;
    if (tool === 'wall' && currentWall) {
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
              className={`w-full px-3 py-2 rounded ${tool === 'wall' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTool('wall')}
            >
              Mur
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'door' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTool('door')}
            >
              Porte
            </button>
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
              className={`w-full px-3 py-2 rounded ${tool === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTool('select')}
            >
              Sélectionner
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
