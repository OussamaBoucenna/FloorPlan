import { getMousePos } from './Utils';
import { movePOI, stopDraggingPOI } from './pois';
import { displayMeasurements } from './Draw';
import { handleDrawingEnd } from './handlers/handleErase';

export const handleMouseMove = (
  e,
  canvasRef,
  offset,
  scale,
  draggingId,
  setPois,
  isDragging,
  setOffset,
  dragStart,
  isDrawing,
  tool,
  currentWall,
  setCurrentWall,
  currentWindow,
  setCurrentWindow
) => {
  const canvas = canvasRef.current;
  const mousePos = getMousePos(canvas, e, offset, scale);

  if (draggingId !== null) {
    const { offsetX, offsetY } = e.nativeEvent;
    setPois(prevObjects => movePOI(prevObjects, draggingId, offsetX, offsetY, offset));
  }

  if (isDragging) {
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
    return;
  }

  if (!isDrawing) return;

  const ctx = canvas.getContext('2d');

  if (tool === 'wall' && currentWall) {
    setCurrentWall({ ...currentWall, end: { x: mousePos.x, y: mousePos.y } });
    displayMeasurements(ctx, currentWall.start, { x: mousePos.x, y: mousePos.y });
  }

  if (tool === 'window' && currentWindow) {
    setCurrentWindow({ ...currentWindow, end: { x: mousePos.x, y: mousePos.y } });
    displayMeasurements(ctx, currentWindow.start, { x: mousePos.x, y: mousePos.y });
  }
};

export const handleMouseUp = (
    e,
    canvasRef,
    offset,
    scale,
    tool,
    currentWall,
    setWalls,
    currentWindow,
    setWindows,
    currentRoom,
    setRooms,
    calculatePolygonArea,
    setCurrentRoom,
    isDrawing,  // <-- Add this
    setIsDrawing,
    isNearPoint,
    isDragging,
    setIsDragging,
    walls,
    setCurrentWall,
    windows,
    setCurrentWindow,
    setDraggingId
  ) => {
    if (!isDrawing) return; // <-- Now it recognizes isDrawing
  
    const mousePos = getMousePos(canvasRef.current, e, offset, scale);
    handleDrawingEnd(tool, mousePos, currentWall, setWalls, currentWindow, setWindows, currentRoom, setRooms, calculatePolygonArea, setCurrentRoom, setIsDrawing, isNearPoint);
  
    setIsDrawing(false);
    setDraggingId(stopDraggingPOI());
  
    if (isDragging) {
      setIsDragging(false);
      return;
    }
  
    const finalizeElement = (element, setElements, elementsArray, setElement, type = null) => {
      const dx = element.end.x - element.start.x;
      const dy = element.end.y - element.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
  
      if (length > 10) {
        setElements([...elementsArray, { ...element, ...(type ? { type } : {}) }]);
      }
  
      setElement(null);
    };
  
    if (tool === 'wall' && currentWall) {
      finalizeElement(currentWall, setWalls, walls, setCurrentWall);
    } else if (tool === 'window' && currentWindow) {
      finalizeElement(currentWindow, setWindows, windows, setCurrentWindow, 'window');
    }
  };
  
