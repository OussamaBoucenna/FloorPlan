import { useState } from "react";
import {DeleteButton} from "./deletionBtn"
// Add this component inside your FloorPlanV4 component
export const ZonePropertiesPanel = ({ 
    selectedZone, 
    onUpdate, 
    onClose,
    predefinedZoneTypes,
    onAddCustomType,
    coordinatesInMeters,
    updateCoordinate,
    initiateZoneDelete
  }) => {
    const [name, setName] = useState(selectedZone?.name || '');
    const [zoneType, setZoneType] = useState(selectedZone?.zoneType || 'default');
    const [customType, setCustomType] = useState('');
    const [color, setColor] = useState(selectedZone?.fill || 'rgba(75, 156, 211, 0.3)');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const handleSubmit = (e) => {
      e.preventDefault();
      onUpdate({
        ...selectedZone,
        name,
        zoneType,
        fill: color
      });
      onClose();
    };
    
    const handleAddCustomZoneType = () => {
      if (customType.trim()) {
        onAddCustomType(customType.trim());
        setZoneType(customType.trim());
        setCustomType('');
      }
    };
    
    return (
      <div className="absolute top-20 right-5 bg-white p-4 shadow-lg border rounded z-10 w-80">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Zone Properties</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Zone Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded py-1 px-2"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Zone Type</label>
            <select
              value={zoneType}
              onChange={(e) => setZoneType(e.target.value)}
              className="w-full border rounded py-1 px-2"
            >
              {predefinedZoneTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4 flex">
            <input
              type="text"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              className="flex-1 border rounded-l py-1 px-2"
              placeholder="Add custom type"
            />
            <button
              type="button"
              onClick={handleAddCustomZoneType}
              className="bg-blue-500 text-white px-2 rounded-r"
            >
              Add
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Background Color</label>
            <div className="flex items-center">
              <div 
                className="w-8 h-8 border cursor-pointer mr-2" 
                style={{ backgroundColor: color }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              ></div>
              <span className="text-sm">{color}</span>
            </div>
            
            {showColorPicker && (
              <div className="absolute mt-2 z-10">
                <div className="fixed inset-0" onClick={() => setShowColorPicker(false)}></div>
                <div className="relative">
                  <div className="color-picker-container p-3 bg-white border rounded shadow-lg">
                    {/* Here you'd add your preferred color picker component */}
                    <div className="grid grid-cols-5 gap-2">
  {[
    'rgba(255, 82, 82, 0.4)', 'rgba(255, 64, 129, 0.4)', 'rgba(224, 64, 251, 0.4)', 
    'rgba(124, 77, 255, 0.4)', 'rgba(83, 109, 254, 0.4)', 'rgba(68, 138, 255, 0.4)', 
    'rgba(64, 196, 255, 0.4)', 'rgba(24, 255, 255, 0.4)', 'rgba(100, 255, 218, 0.4)', 
    'rgba(105, 240, 174, 0.4)', 'rgba(178, 255, 89, 0.4)', 'rgba(238, 255, 65, 0.4)', 
    'rgba(255, 255, 0, 0.4)', 'rgba(255, 215, 64, 0.4)', 'rgba(255, 171, 64, 0.4)',
    'rgba(75, 156, 211, 0.3)', 'rgba(255, 99, 71, 0.3)', 'rgba(50, 205, 50, 0.3)', 
    'rgba(255, 215, 0, 0.3)', 'rgba(138, 43, 226, 0.3)'
  ].map(colorOption => (
    <div 
      key={colorOption} 
      className="w-6 h-6 border cursor-pointer"
      style={{ backgroundColor: colorOption }}
      onClick={() => {
        setColor(colorOption);
        setShowColorPicker(false);
      }}
    ></div>
  ))}
</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t pt-3 mt-3">
  <h4 className="font-medium text-sm mb-2">Precise Coordinates (meters)</h4>
  
  {selectedZone.type === 'rectangle' && (
    <>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-xs">X Position</label>
          <input
            type="number"
            value={coordinatesInMeters.x}
            onChange={(e) => updateCoordinate('x', e.target.value)}
            className="w-full border rounded py-1 px-2 text-sm"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-xs">Y Position</label>
          <input
            type="number"
            value={coordinatesInMeters.y}
            onChange={(e) => updateCoordinate('y', e.target.value)}
            className="w-full border rounded py-1 px-2 text-sm"
            step="0.01"
          />
        </div>
        </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs">Width</label>
          <input
            type="number"
            value={coordinatesInMeters.width}
            onChange={(e) => updateCoordinate('width', e.target.value)}
            className="w-full border rounded py-1 px-2 text-sm"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-xs">Height</label>
          <input
            type="number"
            value={coordinatesInMeters.height}
            onChange={(e) => updateCoordinate('height', e.target.value)}
            className="w-full border rounded py-1 px-2 text-sm"
            step="0.01"
          />
        </div>
      </div>
    </>
  )}
  {selectedZone.type === 'circle' && (
    <>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-xs">Center X</label>
          <input
            type="number"
            value={coordinatesInMeters.centerX}
            onChange={(e) => updateCoordinate('centerX', e.target.value)}
            className="w-full border rounded py-1 px-2 text-sm"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-xs">Center Y</label>
          <input
            type="number"
            value={coordinatesInMeters.centerY}
            onChange={(e) => updateCoordinate('centerY', e.target.value)}
            className="w-full border rounded py-1 px-2 text-sm"
            step="0.01"
          />
        </div>
      </div>
      <div>
      <label className="block text-xs">Radius</label>
        <input
          type="number"
          value={coordinatesInMeters.radius}
          onChange={(e) => updateCoordinate('radius', e.target.value)}
          className="w-full border rounded py-1 px-2 text-sm"
          step="0.01"
        />
      </div>
    </>
  )}
  {selectedZone.type === 'polygon' && (
    <div className="max-h-40 overflow-y-auto border rounded p-2">
      {coordinatesInMeters.points?.map((point, index) => (
        <div key={index} className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs">Point {index+1} X</label>
            <input
              type="number"
              value={point.x}
              onChange={(e) => {
                const newPoints = [...coordinatesInMeters.points];
                newPoints[index] = {...newPoints[index], x: e.target.value};
                updateCoordinate('points', newPoints);
              }}
              className="w-full border rounded py-1 px-2 text-sm"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-xs">Point {index+1} Y</label>
            <input
              type="number"
              value={point.y}
              onChange={(e) => {
                const newPoints = [...coordinatesInMeters.points];
                newPoints[index] = {...newPoints[index], y: e.target.value};
                updateCoordinate('points', newPoints);
              }}
              className="w-full border rounded py-1 px-2 text-sm"
              step="0.01"
            />
          </div>
          </div>
      ))}
    </div>
  )}
  </div>
  <div className="flex justify-end">
            <button 
              type="button"
              onClick={onClose} 
              className="px-3 py-1 bg-gray-200 rounded mr-2"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Save
            </button>
            <DeleteButton 
    selectedZone={selectedZone} 
    onDelete={initiateZoneDelete} 
  />
          </div>
        </form>
      </div>
    );
  };