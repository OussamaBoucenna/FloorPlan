export const handlePan = (e, setIsDragging, setDragStart, offset, tool) => {
  if (e.button === 1 || (e.button === 0 && tool === 'pan')) {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }
};
