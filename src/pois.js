
import { findClickedObject} from './canvasUtils';

export const updatePOIPosition = (pois, draggingId, offsetX, offsetY, offset) => {
    return pois.map(obj =>
      obj.id === draggingId
        ? { ...obj, x: offsetX - offset.x, y: offsetY - offset.y }
        : obj
    );
  };
  
  export const findPOIAt = (pois, pos) => {
    return pois.find(obj =>
      pos.x >= obj.x && pos.x <= obj.x + obj.width &&
      pos.y >= obj.y && pos.y <= obj.y + obj.height
    );
  };

  export const updatePOIName = (pois, selectedPOI, newPoiName) => {
    return pois.map(obj =>
      obj.id === selectedPOI.id ? { ...obj, name: newPoiName } : obj
    );
  };
  

  export const deletePOI = (pois, selectedPOI) => {
    return pois.filter(obj => obj.id !== selectedPOI.id);
  };

  export const movePOI = (pois, draggingId, offsetX, offsetY, offset, scale) => {
    if (!pois || draggingId === null) return pois;
  
    return pois.map(obj =>
      obj.id === draggingId
        ? { 
            ...obj, 
            x: (offsetX - offset.x) / scale, 
            y: (offsetY - offset.y) / scale 
          }
        : obj
    );
  };
  
  export const updatePOIPositionOnDrag = (pois, isDragging, dragStart, e) => {
    if (!isDragging) return pois;
  
    return pois.map(obj => ({
      ...obj,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  };
  
  export const stopDraggingPOI = () => null; // Réinitialiser draggingId
  

  export const zoomPOI = (scale, offset, e, getMousePos, canvas) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const mousePos = getMousePos(canvas, e, offset, scale);
  
    const newScale = scale * delta;
    if (newScale >= 0.1 && newScale <= 10) {
      return {
        newScale,
        newOffset: {
          x: offset.x - (mousePos.x * scale - mousePos.x * newScale),
          y: offset.y - (mousePos.y * scale - mousePos.y * newScale)
        }
      };
    }
    
    return { newScale: scale, newOffset: offset };
  };
  
  export const findClickedPOI = (pois, offsetX, offsetY, offset, scale) => {
    const adjustedX = (offsetX - offset.x) / scale;
    const adjustedY = (offsetY - offset.y) / scale;
    
    return pois.find(obj =>
      adjustedX >= obj.x - 15 && adjustedX <= obj.x + 15 &&
      adjustedY >= obj.y - 15 && adjustedY <= obj.y + 15
    );
  };
  
  export const getCanvasClickPosition = (canvas, e) => {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };
  
  export const handPoi = (
    tool,
    setTool,
    setShowPoiForm,
    poiName,
    setPoiName,
    poiCategory,
    setPoiCategory,
    pendingPoi,
    setPendingPoi,
    setPois,
    pois,
    categoryIcons
  ) => {
    // Function to handle POI tool activation
    const handlePoiTool = () => {
      setTool("poi");
      setShowPoiForm(false);
    };
     // In the handPoi function, modify handleCreatePoi
    const handleCreatePoi = () => {
      if (!poiName || !poiCategory) {
        alert("Veuillez remplir tous les champs.");
        return;
      }

      if (!pendingPoi) {
        alert("Aucune position sélectionnée pour le POI.");
        return;
      }

      const newObj = {
        id: Date.now(),
        x: pendingPoi.x, // This should already be correctly adjusted if handlePOI was updated
        y: pendingPoi.y, // This should already be correctly adjusted if handlePOI was updated
        width: 50,
        height: 50,
        type: "rectangle",
        color: "#ff9966",
        name: poiName,
        category: poiCategory,
        icon: categoryIcons[poiCategory] || categoryIcons.default,
      };

      setPois(prevPois => [...(prevPois || []), newObj]);
      setShowPoiForm(false);
      setPendingPoi(null);
      setPoiName("");
      setPoiCategory("");
    };
  
    return {
      handlePoiTool,
      handleCreatePoi,
    };
  };

  export const drawPOIs = (ctx, pois, selectedItem, preloadedIcons, scale) => {
    const iconSize = 30;
  
    pois.forEach((obj) => {
      const icon = preloadedIcons[obj.category] || preloadedIcons["default"];
  
      if (icon.complete) {
        ctx.drawImage(icon, obj.x - iconSize / 2, obj.y - iconSize / 2, iconSize, iconSize);
      } else {
        icon.onload = () => {
          ctx.drawImage(icon, obj.x - iconSize / 2, obj.y - iconSize / 2, iconSize, iconSize);
        };
      }
  
      ctx.font = `${14 / scale}px Arial`;
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
  
      if (selectedItem && selectedItem.type === "poi" && selectedItem.id === obj.id) {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x - iconSize / 2, obj.y - iconSize / 2, iconSize, iconSize);
      }
    });
  };
  

    export const handlePoiSelection = (offsetX, offsetY, pois, setDraggingId, setOffset) => {
        const clickedObject = findClickedObject(pois, offsetX, offsetY);
        if (clickedObject) {
            setDraggingId(clickedObject.id);
            setOffset({ x: offsetX - clickedObject.x, y: offsetY - clickedObject.y });
        }
    };

    export const handlePoiCreation = (canvas, e, setPendingPoi, setShowPoiForm) => {
        const position = getCanvasClickPosition(canvas, e);
        if (!position) return;
        setPendingPoi(position);
        setShowPoiForm(true);
    };

    export const handlePOI = (e, canvasRef, setPendingPoi, setShowPoiForm, offset = { x: 0, y: 0 }, scale = 1) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
    
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / scale;
      const y = (e.clientY - rect.top - offset.y) / scale;
    
      setPendingPoi({ x, y });
      setShowPoiForm(true);
    };
    
    export const handleObjectDrag = (e, pois, setDraggingId, setOffset, offset, scale) => {
      const { offsetX, offsetY } = e.nativeEvent;
      
      const adjustedX = (offsetX - offset.x) / scale;
      const adjustedY = (offsetY - offset.y) / scale;
    
      const clickedObject = pois.find(obj =>
        adjustedX >= obj.x - 15 && adjustedX <= obj.x + 15 &&
        adjustedY >= obj.y - 15 && adjustedY <= obj.y + 15
      );
    
      if (clickedObject) {
        setDraggingId(clickedObject.id);
      }
    };
    
    