export const handleWindowDrawing = (mousePos, setCurrentWindow) => {
    setCurrentWindow({
        id: Date.now(),
        start: { x: mousePos.x, y: mousePos.y },
        end: { x: mousePos.x, y: mousePos.y }
    });
};


export const drawWindows = (ctx, windows, selectedItem, displayMeasurements) => {
    ctx.strokeStyle = "#4682B4";
    ctx.lineWidth = 20;
  
    windows.forEach((window) => {
      ctx.beginPath();
      ctx.moveTo(window.start.x, window.start.y);
      ctx.lineTo(window.end.x, window.end.y);
      ctx.stroke();
  
      if (selectedItem && selectedItem.type === "window" && selectedItem.id === window.id) {
        ctx.strokeStyle = "#0066ff";
        ctx.lineWidth = 22;
        ctx.stroke();
      }
      displayMeasurements(ctx, window.start, window.end);
    });
  };
  