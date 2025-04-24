
const displayMeasurements = (ctx, startPoint, endPoint) => {
    // Calcul de la distance réelle en mètres (supposons que 1 unité = 1 cm)
    const pixelDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + 
      Math.pow(endPoint.y - startPoint.y, 2)
    );

    const meterToPixel = 100;
    const meterDistance = (pixelDistance / meterToPixel).toFixed(2);
    
    // Position pour l'affichage (milieu du mur)
    const midX = (startPoint.x + endPoint.x) / 2;
    const midY = (startPoint.y + endPoint.y) / 2;
    
    // Affichage de la mesure
    ctx.save();
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = `${meterDistance} m`;
    ctx.strokeText(text, midX, midY - 10);
    ctx.fillText(text, midX, midY - 10);
    ctx.restore();
  };
  


  const drawGrid = (ctx ,offset,scale , canvasSize) => {
    const gridSize = 50;
    const gridColor = '#e0e0e0';
    
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    
    const startX = Math.floor(-offset.x / scale / gridSize) * gridSize;
    const startY = Math.floor(-offset.y / scale / gridSize) * gridSize;
    const endX = startX + canvasSize.width / scale + gridSize * 2;
    const endY = startY + canvasSize.height / scale + gridSize * 2;
    
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  };




  export {displayMeasurements, drawGrid}