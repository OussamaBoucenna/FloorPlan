import { useEffect, useRef, useState } from "react";
import { PIXELS_PER_METER,ORIGIN_X,ORIGIN_Y, pixelsToMeters, metersToPixels } from "../lib/qSvg";
export const useZones = (tool) => {
  const [zones, setZones] = useState([]);
  const [zoneDrawingMode, setDrawingZoneMode] = useState(null);
  const [currentZonePoints, setCurrentZonePoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const previewRef = useRef(null);
  const [showCoordinateForm, setShowCoordinateForm] = useState(null);
  //const [manualCoordinates, setManualCoordinates] = useState([]);
  const [isFinishingPolygon, setIsFinishingPolygon] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [resizingHandle, setResizingHandle] = useState(null);
  const [isMovingZone, setIsMovingZone] = useState(false);
  const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 });
  const [closePolygonThreshold, setClosePolygonThreshold] = useState(10);
  const [coordinatesInMeters,setCoordinatesInMeters]=useState({})
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [zoneToDelete,setZoneToDelete]=useState(null);

  useEffect(()=>{
    if(selectedZone){
    if(selectedZone.type == "rectangle"){
      setCoordinatesInMeters({
        x: pixelsToMeters(selectedZone.left),
        y: pixelsToMeters(selectedZone.top),
        width: pixelsToMeters(selectedZone.width),
        height: pixelsToMeters(selectedZone.height)
      });
    }else if (selectedZone.type === 'circle') {
      setCoordinatesInMeters({
        centerX: pixelsToMeters(selectedZone.centerX),
        centerY: pixelsToMeters(selectedZone.centerY),
        radius: pixelsToMeters(selectedZone.radius)
      });
    }else if (selectedZone.type === 'polygon') {
      setCoordinatesInMeters({
        points: selectedZone.points.map(point => ({
          x: pixelsToMeters(point.x),
          y: pixelsToMeters(point.y)
        }))
      });
    }}
  },[selectedZone])

  const initiateZoneDelete = (zoneId) => {
    const zone = zones.find(zone => zone.id === zoneId);
    if (zone) {
      setZoneToDelete(zone);
      setShowDeleteConfirmation(true);
    }
  };
  

  const updateCoordinates=(field,value)=>{
    setCoordinatesInMeters((prev)=>({
      ...prev,
      [field]:value
    }))
  }
  const [predefinedZoneTypes, setPredefinedZoneTypes] = useState([
    "default",
    "zone de travail",
    "zone de danger",
    "zone de circulation",
    "zone de stockage",
  ]);



  // Show zone properties panel state
  const [showZoneProperties, setShowZoneProperties] = useState(false);

  // Replace your current updateZoneProperties function with this one:
const updateZoneProperties = (updatedZone) => {
  // Ensure fill color has opacity
  const fill = ensureColorOpacity(updatedZone.fill);
  if(updatedZone.type=="rectangle"){
    updatedZone={
      ...updatedZone,
      left : metersToPixels(coordinatesInMeters.x),
      top:metersToPixels(coordinatesInMeters.y),
      width : metersToPixels(coordinatesInMeters.width),
      height: metersToPixels(coordinatesInMeters.height)
    }
  }else if(updatedZone.type=="circle"){
    updatedZone = {
      ...updatedZone,
      centerX: metersToPixels(coordinatesInMeters.centerX),
      centerY: metersToPixels(coordinatesInMeters.centerY),
      radius: metersToPixels(coordinatesInMeters.radius)
    };
  }else if (selectedZone.type === 'polygon') {
    updatedZone = {
      ...updatedZone,
      points: coordinatesInMeters.points.map(point => ({
        x: metersToPixels(point.x),
        y: metersToPixels(point.y)
      }))
    };
  }
  setZones(prev => 
    prev.map(zone => 
      zone.id === updatedZone.id ? { ...updatedZone, fill } : zone
    )
  );
};

// Add this helper function to enforce transparency
const ensureColorOpacity = (color, minOpacity = 0.3) => {
  // If it's already an rgba color
  if (color.startsWith('rgba')) {
    // Extract the components
    const match = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
    if (match) {
      const [_, r, g, b, a] = match;
      // If opacity is too high, reduce it to our max (1 - minOpacity)
      const opacity = Math.min(parseFloat(a), 0.7); // Max 70% opacity
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }
  
  // If it's a hex color (#RRGGBB)
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${minOpacity})`;
  }
  
  // If it's an rgb color
  if (color.startsWith('rgb(')) {
    // Convert to rgba
    return color.replace('rgb(', 'rgba(').replace(')', `, ${minOpacity})`);
  }
  
  // For named colors or other formats, default to the original with opacity
  return `${color.split(')')[0]})`.replace('rgb(', 'rgba(').replace(')', `, ${minOpacity})`);
};

  // Add a function to add custom zone types
  const addCustomZoneType = (newType) => {
    if (!predefinedZoneTypes.includes(newType)) {
      setPredefinedZoneTypes((prev) => [...prev, newType]);
    }
  };

  const isPointInZone = (x, y, zone) => {
    if (zone.type === "rectangle") {
      return (
        x >= zone.left &&
        x <= zone.left + zone.width &&
        y >= zone.top &&
        y <= zone.top + zone.height
      );
    } else if (zone.type === "circle") {
      const distance = Math.sqrt(
        Math.pow(x - zone.centerX, 2) + Math.pow(y - zone.centerY, 2)
      );
      return distance <= zone.radius;
    }else if(zone.type === "polygon") {
      // Point-in-polygon algorithm (ray casting)
    let inside = false;
    const points = zone.points;
    
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;
      
      const intersect = ((yi > y) !== (yj > y)) && 
                         (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
    }
    return false;
  };

  // handle polygon points collection
  const handlePolygonClick = (x, y) => {
    if (currentZonePoints.length > 0) {
      // Check if clicking near the first point to close the polygon
      const firstPoint = currentZonePoints[0];
      const distance = Math.sqrt(
        Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2)
      );
      
      if (distance < closePolygonThreshold && currentZonePoints.length >= 3) {
        // Close the polygon and finish drawing
        finishPolygonZone();
        return;
      }
    }
    
    // Add point to current points
    setCurrentZonePoints(prev => [...prev, { x, y }]);
  };

  const findZoneAt = (x, y) => {
    console.log("FIND ZONE AT", x, y,zones);
    for (let i = zones.length - 1; i >= 0; i--) {
      if (isPointInZone(x, y, zones[i])) {
        return zones[i];
      }
    }
    return null;
  };

  const getResizeHandleAt = (x, y) => {
    if (!selectedZone) return null;

    const handleSize = 8; // Size of resize handles

    if (selectedZone.type === "rectangle") {
      const handles = {
        "top-left": { x: selectedZone.left, y: selectedZone.top },
        "top-right": {
          x: selectedZone.left + selectedZone.width,
          y: selectedZone.top,
        },
        "bottom-left": {
          x: selectedZone.left,
          y: selectedZone.top + selectedZone.height,
        },
        "bottom-right": {
          x: selectedZone.left + selectedZone.width,
          y: selectedZone.top + selectedZone.height,
        },
        top: {
          x: selectedZone.left + selectedZone.width / 2,
          y: selectedZone.top,
        },
        right: {
          x: selectedZone.left + selectedZone.width,
          y: selectedZone.top + selectedZone.height / 2,
        },
        bottom: {
          x: selectedZone.left + selectedZone.width / 2,
          y: selectedZone.top + selectedZone.height,
        },
        left: {
          x: selectedZone.left,
          y: selectedZone.top + selectedZone.height / 2,
        },
      };

      for (const [handle, point] of Object.entries(handles)) {
        if (
          Math.abs(x - point.x) <= handleSize &&
          Math.abs(y - point.y) <= handleSize
        ) {
          return handle;
        }
      }
    } else if (selectedZone.type === "circle") {
      // For circles, we can have handles at cardinal points
      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]; // 0, 90, 180, 270 degrees
      const handleNames = ["right", "bottom", "left", "top"];

      for (let i = 0; i < angles.length; i++) {
        const handleX =
          selectedZone.centerX + Math.cos(angles[i]) * selectedZone.radius;
        const handleY =
          selectedZone.centerY + Math.sin(angles[i]) * selectedZone.radius;

        if (
          Math.abs(x - handleX) <= handleSize &&
          Math.abs(y - handleY) <= handleSize
        ) {
          return handleNames[i];
        }
      }
    }else if (selectedZone.type === "polygon") {
      // Check each vertex
      for (let i = 0; i < selectedZone.points.length; i++) {
        const point = selectedZone.points[i];
        if (Math.abs(x - point.x) <= handleSize && Math.abs(y - point.y) <= handleSize) {
          return `vertex-${i}`;
        }
      }
    }
    

    return null;
  };
  // Drawing mode functions
  const startRectangleDrawing = () => {
    setDrawingZoneMode("rectangle");
    console.log("Rectangle drawing mode activated");
    setIsDrawing(false);
    setCurrentZonePoints([]);
    previewRef.current = null;
  };

  const startCircleDrawing = () => {
    setDrawingZoneMode("circle");
    setIsDrawing(false);
    setCurrentZonePoints([]);
    previewRef.current = null;
  };

  const startPolygonDrawing = () => {
    setDrawingZoneMode("polygon");
    setIsDrawing(false);
    setCurrentZonePoints([]);
    setIsFinishingPolygon(false); // New state to track if we're closing the polygon
  previewRef.current = null;
  };

  const drawZonePreview = (ctx, start, end) => {
    if (!zoneDrawingMode || !start || !end) return;
    console.log("Drawing polygon preview", currentZonePoints);
    if (zoneDrawingMode === "rectangle") {
      const left = Math.min(start.x, end.x);
      const top = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);

      ctx.fillStyle = "rgba(75, 156, 211, 0.3)";
      ctx.strokeStyle = "#4B9CD3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(left, top, width, height);
      ctx.fill();
      ctx.stroke();

      previewRef.current = { type: "rectangle", left, top, width, height };
    } else if (zoneDrawingMode === "circle") {
      const radius = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );

      ctx.fillStyle = "rgba(75, 156, 211, 0.3)";
      ctx.strokeStyle = "#4B9CD3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      previewRef.current = {
        type: "circle",
        centerX: start.x,
        centerY: start.y,
        radius,
      };
    }else if (zoneDrawingMode === "polygon") {

      if (currentZonePoints.length === 0) return;
      console.log("Drawing polygon preview", currentZonePoints);
      // Draw lines between points
      ctx.fillStyle = "rgba(75, 156, 211, 0.3)";
      ctx.strokeStyle = "#4B9CD3";
      ctx.lineWidth = 2;
      
      // Draw filled polygon for existing points
      if (currentZonePoints.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(currentZonePoints[0].x, currentZonePoints[0].y);
        
        for (let i = 1; i < currentZonePoints.length; i++) {
          ctx.lineTo(currentZonePoints[i].x, currentZonePoints[i].y);
        }
        
        // Add the current mouse position to preview
        if (end) {
          ctx.lineTo(end.x, end.y);
        }
        ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Just draw lines if we don't have enough points for a polygon
      ctx.beginPath();
      ctx.moveTo(currentZonePoints[0].x, currentZonePoints[0].y);
      
      for (let i = 1; i < currentZonePoints.length; i++) {
        ctx.lineTo(currentZonePoints[i].x, currentZonePoints[i].y);
      }
      
      // Draw line to current mouse position
      if (end) {
        ctx.lineTo(end.x, end.y);
      }
      
      ctx.stroke();
    }
    
    // Draw points at each vertex
    currentZonePoints.forEach((point, index) => {
      ctx.fillStyle = index === 0 ? "#FF4081" : "#4B9CD3";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    // Show closing indicator when near first point
    if (end && currentZonePoints.length >= 3) {
      const firstPoint = currentZonePoints[0];
      const distance = Math.sqrt(
        Math.pow(end.x - firstPoint.x, 2) + Math.pow(end.y - firstPoint.y, 2)
      );
      
      if (distance < closePolygonThreshold) {
        ctx.fillStyle = "#FF4081";
        ctx.beginPath();
        ctx.arc(firstPoint.x, firstPoint.y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw "close" text
        ctx.fillStyle = "#333";
        ctx.font = "12px Arial";
        ctx.fillText("Click to close", firstPoint.x + 10, firstPoint.y - 10);
        
        setIsFinishingPolygon(true);
      } else {
        setIsFinishingPolygon(false);
      }
    }
  }
  };

  console.log("CURRENT ZONE POINTS",currentZonePoints)

  const finishPolygonZone = () => {
    if (currentZonePoints.length < 3) {
      //console.warn("Cannot create polygon with less than 3 points");
      return;
    }
    
    const newZone = {
      id: `zone_${Date.now()}`,
      name: `Zone ${zones.length + 1}`,
      type: "polygon",
      zoneType: "default",
      points: [...currentZonePoints], // Deep copy of points
      fill: "rgba(75, 156, 211, 0.3)",
      stroke: "#4B9CD3",
      strokeWidth: 2
    };
    
    setZones(prev => [...prev, newZone]);
    setSelectedZone(newZone); // Select the new polygon
    setDrawingZoneMode(null);
    setIsDrawing(false);
    setCurrentZonePoints([]);
    setIsFinishingPolygon(false);
    previewRef.current = null;
  };

  // Create final zone
  const finishRectangleZone = (start, end) => {
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    const newZone = {
      id: `zone_${Date.now()}`,
      name: `Zone ${zones.length + 1}`,
      type: "rectangle",
      zoneType: "default",
      left,
      top,
      width,
      height,
      fill: "rgba(75, 156, 211, 0.3)",
      stroke: "#4B9CD3",
      strokeWidth: 2,
    };

    setZones((prev) => [...prev, newZone]);
    // Set this new zone as selected immediately
    setSelectedZone(newZone);
    setDrawingZoneMode(null);
    setIsDrawing(false);
    setCurrentZonePoints([]);
    previewRef.current = null;
  };

  const finishCircleZone = (center, radiusPoint) => {
    const radius = Math.sqrt(
      Math.pow(radiusPoint.x - center.x, 2) +
        Math.pow(radiusPoint.y - center.y, 2)
    );

    const newZone = {
      id: `zone_${Date.now()}`,
      name: `Zone ${zones.length + 1}`,
      type: "circle",
      centerX: center.x,
      zoneType: "default",
      centerY: center.y,
      radius,
      fill: "rgba(75, 156, 211, 0.3)",
      stroke: "#4B9CD3",
      strokeWidth: 2,
    };

    setZones((prev) => [...prev, newZone]);
    setSelectedZone(newZone);
    setDrawingZoneMode(null);
    setIsDrawing(false);
    setCurrentZonePoints([]);
    previewRef.current = null;
  };

  // Modify your drawAllZones function to include selection handles
  const drawAllZones = (ctx) => {
    zones.forEach((zone) => {
      // Draw the zone as before...
      if (zone.type === "rectangle") {
        ctx.fillStyle = zone.fill;
        ctx.strokeStyle = zone.stroke;
        ctx.lineWidth = zone.strokeWidth;
        ctx.beginPath();
        ctx.rect(zone.left, zone.top, zone.width, zone.height);
        ctx.fill();
        ctx.stroke();

        // Draw zone name
        ctx.fillStyle = "#333";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          zone.name,
          zone.left + zone.width / 2,
          zone.top + zone.height / 2
        );
        // Add zone type below name
        if (zone.zoneType && zone.zoneType !== "default") {
          ctx.font = "12px Arial";
          ctx.fillText(
            zone.zoneType,
            zone.left + zone.width / 2,
            zone.top + zone.height / 2 + 8
          );
        }
      } else if (zone.type === "circle") {
        ctx.fillStyle = zone.fill;
        ctx.strokeStyle = zone.stroke;
        ctx.lineWidth = zone.strokeWidth;
        ctx.beginPath();
        ctx.arc(zone.centerX, zone.centerY, zone.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw zone name in center
        ctx.fillStyle = "#333";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(zone.name, zone.centerX, zone.centerY);
        if (zone.zoneType && zone.zoneType !== "default") {
          ctx.font = "12px Arial";
          ctx.fillText(zone.zoneType, zone.centerX, zone.centerY + 8);
        }
      }else if(zone.type === "polygon") {
        // Draw the polygon
      ctx.fillStyle = zone.fill;
      ctx.strokeStyle = zone.stroke;
      ctx.lineWidth = zone.strokeWidth;
      
      ctx.beginPath();
      ctx.moveTo(zone.points[0].x, zone.points[0].y);
      
      for (let i = 1; i < zone.points.length; i++) {
        ctx.lineTo(zone.points[i].x, zone.points[i].y);
      }
      
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Find center point for label (average of all points)
      let centerX = 0;
      let centerY = 0;
      zone.points.forEach(point => {
        centerX += point.x;
        centerY += point.y;
      });
      centerX /= zone.points.length;
      centerY /= zone.points.length;
       // Draw zone name
       ctx.fillStyle = '#333';
       ctx.font = '14px Arial';
       ctx.textAlign = 'center';
       ctx.fillText(zone.name, centerX, centerY - 8);
       
       // Add zone type below name
       if (zone.zoneType && zone.zoneType !== 'default') {
         ctx.font = '12px Arial';
         ctx.fillText(zone.zoneType, centerX, centerY + 8);
       }
      }

      // Draw selection handles if this zone is selected
      if (selectedZone && zone.id === selectedZone.id) {
        ctx.strokeStyle = "#4285F4";
        ctx.lineWidth = 2;

        if (zone.type === "rectangle") {
          // Draw selection outline
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
            zone.left - 2,
            zone.top - 2,
            zone.width + 4,
            zone.height + 4
          );
          ctx.setLineDash([]);

          // Draw resize handles
          const handles = [
            { x: zone.left, y: zone.top }, // top-left
            { x: zone.left + zone.width, y: zone.top }, // top-right
            { x: zone.left, y: zone.top + zone.height }, // bottom-left
            { x: zone.left + zone.width, y: zone.top + zone.height }, // bottom-right
            { x: zone.left + zone.width / 2, y: zone.top }, // top-middle
            { x: zone.left + zone.width, y: zone.top + zone.height / 2 }, // middle-right
            { x: zone.left + zone.width / 2, y: zone.top + zone.height }, // bottom-middle
            { x: zone.left, y: zone.top + zone.height / 2 }, // middle-left
          ];

          handles.forEach((handle) => {
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#4285F4";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(handle.x, handle.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });
        } else if (zone.type === "circle") {
          // Draw selection outline
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(zone.centerX, zone.centerY, zone.radius + 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw resize handles at cardinal points
          const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
          angles.forEach((angle) => {
            const handleX = zone.centerX + Math.cos(angle) * zone.radius;
            const handleY = zone.centerY + Math.sin(angle) * zone.radius;

            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#4285F4";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(handleX, handleY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });
        }
      }
    });
  };

  // Add these mouse handling functions

  const handleZoneMouseDown = (x, y, isDoubleClick = false) => {
    console.log("Mouse down at", x, y);  
    const handle = getResizeHandleAt(x, y);
      if (handle) {
        setResizingHandle(handle);
        return true; // Event handled
      }
      console.log("HANDLE", handle);  
      const zone = findZoneAt(x, y);
      console.log("ZONE", zone);  
      if (zone) {
        setSelectedZone(zone);
        if (isDoubleClick) {
          setShowZoneProperties(true);
          return true;
        }
        // Calculate offset for dragging
        if (zone.type === "rectangle") {
          setMoveOffset({
            x: x - zone.left,
            y: y - zone.top,
          });
        } else if (zone.type === "circle") {
          setMoveOffset({
            x: x - zone.centerX,
            y: y - zone.centerY,
          });
        }

        setIsMovingZone(true);
        return true; // Event handled
      } else {
        // Clicked outside any zone, deselect
        setSelectedZone(null);
      }

      return false; // Event not handled
  };

  const handleZoneMouseMove = (x, y) => {
    if (!selectedZone) return false;

    if (resizingHandle) {
      // Resize the selected zone
      const updatedZones = zones.map((zone) => {
        if (zone.id !== selectedZone.id) return zone;

        if (zone.type === "rectangle") {
          let newZone = { ...zone };

          // Handle different resize handles
          switch (resizingHandle) {
            case "top-left":
              newZone.width = newZone.left + newZone.width - x;
              newZone.height = newZone.top + newZone.height - y;
              newZone.left = x;
              newZone.top = y;
              break;
            case "top-right":
              newZone.width = x - newZone.left;
              newZone.height = newZone.top + newZone.height - y;
              newZone.top = y;
              break;
            case "bottom-left":
              newZone.width = newZone.left + newZone.width - x;
              newZone.height = y - newZone.top;
              newZone.left = x;
              break;
            case "bottom-right":
              newZone.width = x - newZone.left;
              newZone.height = y - newZone.top;
              break;
            case "top":
              newZone.height = newZone.top + newZone.height - y;
              newZone.top = y;
              break;
            case "right":
              newZone.width = x - newZone.left;
              break;
            case "bottom":
              newZone.height = y - newZone.top;
              break;
            case "left":
              newZone.width = newZone.left + newZone.width - x;
              newZone.left = x;
              break;
          }

          // Ensure width and height are positive
          if (newZone.width < 10) {
            newZone.width = 10;
          }
          if (newZone.height < 10) {
            newZone.height = 10;
          }

          return newZone;
        } else if (zone.type === "circle") {
          // For circle, adjust radius based on distance
          const dx = x - zone.centerX;
          const dy = y - zone.centerY;
          const newRadius = Math.max(10, Math.sqrt(dx * dx + dy * dy));

          return {
            ...zone,
            radius: newRadius,
          };
        }else if (zone.type === 'polygon' && resizingHandle.startsWith('vertex-')) {
          // Get vertex index from handle name
          const vertexIndex = parseInt(resizingHandle.split('-')[1]);
          
          // Create a new array with the updated point
          const updatedPoints = [...zone.points];
          updatedPoints[vertexIndex] = { x, y };
          
          return {
            ...zone,
            points: updatedPoints
          };
        }
        return zone;
      });

      setZones(updatedZones);
      // Also update selected zone reference
      setSelectedZone(updatedZones.find((z) => z.id === selectedZone.id));
      return true; // Event handled
    } else if (isMovingZone) {
      // Move the selected zone
      const updatedZones = zones.map((zone) => {
        if (zone.id !== selectedZone.id) return zone;

        if (zone.type === "rectangle") {
          return {
            ...zone,
            left: x - moveOffset.x,
            top: y - moveOffset.y,
          };
        } else if (zone.type === "circle") {
          return {
            ...zone,
            centerX: x - moveOffset.x,
            centerY: y - moveOffset.y,
          };
        }else if (zone.type === 'polygon') {
          // Move all points by the same delta
          const dx = x - (selectedZone.points[0].x + moveOffset.x);
          const dy = y - (selectedZone.points[0].y + moveOffset.y);
          
          return {
            ...zone,
            points: zone.points.map(point => ({
              x: point.x + dx,
              y: point.y + dy
            }))
          };
        }
        return zone;
      });

      setZones(updatedZones);
      // Also update selected zone reference
      setSelectedZone(updatedZones.find((z) => z.id === selectedZone.id));
      return true; // Event handled
    }

    return false; // Event not handled
  };

  const handleZoneMouseUp = () => {
    setIsMovingZone(false);
    setResizingHandle(null);
    return !!selectedZone; // Return true if we have a selected zone
  };

  /*const createZoneFromCoordinates = (name, type) => {
    if (manualCoordinates.length < 3 && type === 'polygon') {
      alert('Polygon requires at least 3 points');
      return;
    }
    
    const canvas = fabricCanvasRef.current;
    let fabricObject;
    let newZone;
    
    if (type === 'polygon') {
      fabricObject = new fabric.Polygon(
        manualCoordinates.map(p => ({ x: p.x, y: p.y })),
        {
          fill: 'rgba(75, 156, 211, 0.3)',
          stroke: '#4B9CD3',
          strokeWidth: 2,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          name: name || `zone_${zones.length + 1}`
        }
      );
      newZone = {
        id: `zone_${Date.now()}`,
        name: name || `Zone ${zones.length + 1}`,
        type: 'polygon',
        fabricObject,
        points: [...manualCoordinates]
      };
    } else if (type === 'rectangle' && manualCoordinates.length >= 2) {
      const point1 = manualCoordinates[0];
      const point2 = manualCoordinates[1];
      
      fabricObject = new fabric.Rect({
        left: Math.min(point1.x, point2.x),
        top: Math.min(point1.y, point2.y),
        width: Math.abs(point2.x - point1.x),
        height: Math.abs(point2.y - point1.y),
        fill: 'rgba(75, 156, 211, 0.3)',
        stroke: '#4B9CD3',
        strokeWidth: 2,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        name: name || `zone_${zones.length + 1}`
      });
      newZone = {
        id: `zone_${Date.now()}`,
        name: name || `Zone ${zones.length + 1}`,
        type: 'rectangle',
        fabricObject,
        coordinates: [point1, point2]
      };
    }
    
    if (fabricObject && newZone) {
      canvas.add(fabricObject);
      setZones(prev => [...prev, newZone]);
      setManualCoordinates([]);
      setShowCoordinateForm(false);
      canvas.renderAll();
    }
  };*/

  // Zone management functions
  const renameZone = (zoneId, newName) => {
    setZones((prev) =>
      prev.map((zone) =>
        zone.id === zoneId ? { ...zone, name: newName } : zone
      )
    );
  };

  const deleteZone = () => {
    if (!zoneToDelete) return;
  
    setZones(prev => prev.filter(zone => zone.id !== zoneToDelete.id));
    
    // Reset state
    setZoneToDelete(null);
    setShowDeleteConfirmation(false);
    setSelectedZone(null);
  };

  const cancelZoneDeletion = () => {
    setZoneToDelete(null);
    setShowDeleteConfirmation(false);
  };
  


  return {
    zones,
    zoneDrawingMode,
    selectedZone,
    zoneToDelete,
    showDeleteConfirmation,
    startRectangleDrawing,
    startCircleDrawing,
    startPolygonDrawing,
    drawZonePreview,
    initiateZoneDelete,
    deleteZone,
    cancelZoneDeletion,
    currentZonePoints,
    setCurrentZonePoints,
    showCoordinateForm,
    finishRectangleZone,
    drawAllZones,
    isDrawing: isDrawing && zoneDrawingMode,
    setIsDrawing,
    coordinatesInMeters,
    finishCircleZone,
    renameZone,
    setDrawingZoneMode,
    deleteZone,
    handleZoneMouseDown,
    handleZoneMouseMove,
    updateCoordinates,
    handleZoneMouseUp,
    predefinedZoneTypes,
    addCustomZoneType,
    updateZoneProperties,
    showZoneProperties,
    finishPolygonZone,
    handlePolygonClick,
    setShowZoneProperties,
  };
};
