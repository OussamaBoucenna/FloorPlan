export const handleWall = (mousePos, walls, setCurrentWall) => {
  let snapPoint = findNearestWallEnd(mousePos, walls, 10); // Cherche un point proche (tolérance de 10px)
  
  setCurrentWall({
      id: Date.now(),
      start: snapPoint || { x: mousePos.x, y: mousePos.y },
      end: { x: mousePos.x, y: mousePos.y }
  });
};

// Fonction pour trouver un point proche des autres murs
const findNearestWallEnd = (mousePos, walls, threshold) => {
  for (const wall of walls) {
      if (distance(mousePos, wall.end) < threshold) {
          return wall.end;
      }
      if (distance(mousePos, wall.start) < threshold) {
          return wall.start;
      }
  }
  return null;
};

// Fonction pour calculer la distance entre deux points
const distance = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);


export const drawWalls = (ctx, walls, selectedItem, displayMeasurements) => {
    walls.forEach((wall) => {
        const startX = Math.round(wall.start.x);
        const startY = Math.round(wall.start.y);
        const endX = Math.round(wall.end.x);
        const endY = Math.round(wall.end.y);

        ctx.beginPath();
        ctx.lineWidth = selectedItem?.id === wall.id ? 24 : 20;
        ctx.strokeStyle = selectedItem?.id === wall.id ? "#0066ff" : "#333";

        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        displayMeasurements(ctx, { x: startX, y: startY }, { x: endX, y: endY });
    });
};


