import React, { useState } from 'react';

export const TemplateSelector = ({ onTemplateSelect, onDimensionsConfirm }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [dimensions, setDimensions] = useState({
    width: 5, // Default 5 meters
    height: 4, // Default 4 meters
    extension: 2, // For L-shape extension width/height
  });
  
  const templates = [
    { id: 'blank', name: 'Blank', image: '/newPlanEmpty.jpg' },
    { id: 'l-shape', name: 'L-Shape', image: '/newPlanL.jpg' },
    { id: 'rectangle', name: 'Rectangle', image: '/newPlanSquare.jpg' }
  ];
  
  const handleTemplateClick = (templateId) => {
    setSelectedTemplate(templateId);
    onTemplateSelect(templateId);
  };
  
  const handleDimensionChange = (e) => {
    const { name, value } = e.target;
    setDimensions(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onDimensionsConfirm(selectedTemplate, dimensions);
  };
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Select a Template</h2>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        {templates.map((template) => (
          <div 
            key={template.id}
            className={`border p-2 cursor-pointer ${selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            onClick={() => handleTemplateClick(template.id)}
          >
            <img src={template.image} alt={template.name} className="w-full h-32 object-contain mb-2" />
            <p className="text-center">{template.name}</p>
          </div>
        ))}
      </div>
      
      {(selectedTemplate && selectedTemplate!="blank") && (
        <form onSubmit={handleSubmit} className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3">Enter Dimensions (meters)</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Width</label>
              <input
                type="number"
                name="width"
                value={dimensions.width}
                onChange={handleDimensionChange}
                min="1"
                step="0.1"
                className="w-full border rounded px-2 py-1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Height</label>
              <input
                type="number"
                name="height"
                value={dimensions.height}
                onChange={handleDimensionChange}
                min="1"
                step="0.1"
                className="w-full border rounded px-2 py-1"
                required
              />
            </div>
          </div>
          
          {selectedTemplate === 'lshape' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Extension Size</label>
              <input
                type="number"
                name="extension"
                value={dimensions.extension}
                onChange={handleDimensionChange}
                min="1"
                step="0.1"
                className="w-full border rounded px-2 py-1"
                required
              />
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Floor Plan
            </button>
          </div>
        </form>
      )}
    </div>
  );
};