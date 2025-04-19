
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
      adjustedX >= obj.x - obj.width / 2 && 
      adjustedX <= obj.x + obj.width / 2 &&
      adjustedY >= obj.y - obj.height / 2 && 
      adjustedY <= obj.y + obj.height / 2
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
    categoryIcons,
    poiWidth,
    setPoiWidth,
    poiHeight,
    setPoiHeight
  ) => {
    // Function to handle POI tool activation
    const handlePoiTool = () => {
      setTool("poi");
      setShowPoiForm(false);
    };
    
    // Modified to include width and height
    const handleCreatePoi = () => {
      if (!poiName || !poiCategory) {
        alert("Veuillez remplir tous les champs.");
        return;
      }
  
      if (!pendingPoi) {
        alert("Aucune position sélectionnée pour le POI.");
        return;
      }
      
      // Use the provided width and height or default to 50
      const width = poiWidth || 50;
      const height = poiHeight || 50;
  
      const newObj = {
        id: Date.now(),
        x: pendingPoi.x,
        y: pendingPoi.y,
        width: width,
        height: height,
        type: "poi",
        color: "#fff",
        name: poiName,
        category: poiCategory,
        icon: categoryIcons[poiCategory] || categoryIcons.default,
      };
  
      setPois(prevPois => [...(prevPois || []), newObj]);
      setShowPoiForm(false);
      setPendingPoi(null);
      setPoiName("");
      setPoiCategory("");
      setPoiWidth(50); // Reset to default
      setPoiHeight(50); // Reset to default
    };
  
    return {
      handlePoiTool,
      handleCreatePoi,
    };
  };
  

  export const drawPOIs = (ctx, pois, selectedItem, preloadedIcons, scale) => {
    pois.forEach((obj) => {
      const icon = preloadedIcons[obj.category] || preloadedIcons["default"];
  
      // Draw the icon to fill the entire POI rectangle
      if (icon.complete) {
        ctx.drawImage(
          icon,
          obj.x - obj.width / 2,
          obj.y - obj.height / 2,
          obj.width,
          obj.height
        );
      } else {
        icon.onload = () => {
          ctx.drawImage(
            icon,
            obj.x - obj.width / 2,
            obj.y - obj.height / 2,
            obj.width,
            obj.height
          );
        };
      }
  
      // Draw the POI name below the icon
      ctx.font = `${14 / scale}px Arial`;
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.fillText(obj.name, obj.x, obj.y + obj.height / 2 + 20 / scale);
  
      // Highlight selected POI
      if (selectedItem && selectedItem.type === "poi" && selectedItem.id === obj.id) {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 2 / scale;
        ctx.strokeRect(
          obj.x - obj.width / 2,
          obj.y - obj.height / 2,
          obj.width,
          obj.height
        );
  
        // Draw resize handles
        const handleSize = 8 / scale;
        ctx.fillStyle = "#ff0000";
        // Corner resize handles
        [
          { x: obj.x - obj.width / 2, y: obj.y - obj.height / 2 }, // Top-left
          { x: obj.x + obj.width / 2, y: obj.y - obj.height / 2 }, // Top-right
          { x: obj.x - obj.width / 2, y: obj.y + obj.height / 2 }, // Bottom-left
          { x: obj.x + obj.width / 2, y: obj.y + obj.height / 2 } // Bottom-right
        ].forEach(point => {
          ctx.fillRect(
            point.x - handleSize / 2,
            point.y - handleSize / 2,
            handleSize,
            handleSize
          );
        });
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
    

    export const POIEditForm = ({ selectedPOI, newPoiName, setNewPoiName, updatePOIName, deletePOI, setSelectedPOI, newPoiWidth, setNewPoiWidth, newPoiHeight, setNewPoiHeight }) => {
      return (
        <div className="absolute top-10 left-10 bg-white p-4 shadow-lg border rounded">
          <h2 className="text-lg font-bold">Modifier / Supprimer le POI</h2>
          
          <label className="block mt-2 text-sm font-medium">Nom du POI :</label>
          <input 
            type="text" 
            value={newPoiName} 
            onChange={(e) => setNewPoiName(e.target.value)} 
            className="w-full border p-2 rounded mt-1"
          />
    
          <div className="flex gap-2 mt-2">
            <div className="w-1/2">
              <label className="block text-sm font-medium">Largeur :</label>
              <input 
                type="number" 
                value={newPoiWidth} 
                onChange={(e) => setNewPoiWidth(Number(e.target.value))} 
                className="w-full border p-2 rounded mt-1"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium">Hauteur :</label>
              <input 
                type="number" 
                value={newPoiHeight} 
                onChange={(e) => setNewPoiHeight(Number(e.target.value))} 
                className="w-full border p-2 rounded mt-1"
              />
            </div>
          </div>
    
          <p className="text-sm text-gray-600 mt-2">
            <strong>Catégorie:</strong> {selectedPOI.category}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Coordonnées:</strong> (X: {Math.round(selectedPOI.x)}, Y: {Math.round(selectedPOI.y)})
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
      );
    };
    
    export const updatePOIProperties = (pois, selectedPOI, newPoiName, newPoiWidth, newPoiHeight) => {
      return pois.map(obj =>
        obj.id === selectedPOI.id 
          ? { 
              ...obj, 
              name: newPoiName,
              width: newPoiWidth || obj.width,
              height: newPoiHeight || obj.height
            } 
          : obj
      );
    };