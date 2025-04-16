import { isNearPoint,isNearLine } from "../Utils";

export const drawZones = (ctx,scale,zones,isDrawing,selectedItem,currentZone,currentPolygonPoints,zoneShapeType)=>{
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
          }  else if (zone.shapeType === "polygon") {
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

}

export const handleZoneDrawing = (mousePos,zoneShapeType,zones,setCurrentZone,setIsDrawing,currentPolygonPoints,setCurrentPolygonPoints,setZones,setShowZoneForm,setNewZoneName)=>{
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
}}