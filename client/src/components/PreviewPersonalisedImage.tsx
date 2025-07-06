import { X, Move } from 'lucide-react';
import { useState, useRef } from 'react';

interface PreviewPersonalisedImageProps {
  uploadedImage: string;
  shape: 'circle' | 'heart' | 'square';
  onRemove: () => void;
  onImagePositionChange?: (position: { x: number; y: number }) => void;
  imagePosition?: { x: number; y: number };
}

export function PreviewPersonalisedImage({ 
  uploadedImage, 
  shape,
  onRemove,
  onImagePositionChange,
  imagePosition = { x: 50, y: 50 }
}: PreviewPersonalisedImageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onImagePositionChange) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDragOffset({
        x: x - (imagePosition.x * rect.width / 100),
        y: y - (imagePosition.y * rect.height / 100)
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !onImagePositionChange) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      
      // Convert to percentage and constrain within bounds
      const newX = Math.max(20, Math.min(80, (x / rect.width) * 100));
      const newY = Math.max(20, Math.min(80, (y / rect.height) * 100));
      
      onImagePositionChange({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getShapeClasses = () => {
    switch (shape) {
      case 'circle':
        return 'rounded-full';
      case 'heart':
        return 'rounded-full';
      case 'square':
        return 'rounded-lg';
      default:
        return 'rounded-full';
    }
  };

  const getShapeStyle = () => {
    if (shape === 'heart') {
      return {
        clipPath: 'polygon(50% 100%, 20% 60%, 20% 40%, 30% 30%, 40% 30%, 50% 40%, 60% 30%, 70% 30%, 80% 40%, 80% 60%)'
      };
    }
    if (shape === 'circle') {
      return {
        clipPath: 'circle(50%)'
      };
    }
    return {};
  };

  return (
    <div className="border-2 border-red-200 rounded-xl p-4 bg-red-50 relative">
      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center z-10"
      >
        <X className="w-4 h-4 text-gray-600" />
      </button>

      <div className="flex items-center gap-4">
        {/* Enhanced Shape Preview with Drag */}
        <div 
          ref={containerRef}
          className="relative"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            className={`w-16 h-16 border-2 border-red-300 overflow-hidden bg-white relative ${getShapeClasses()}`}
            style={getShapeStyle()}
          >
            <img 
              src={uploadedImage} 
              alt="Preview" 
              className="absolute object-contain select-none high-quality-image image-drag-smooth"
              style={{
                width: '140%',
                height: '140%',
                left: `${imagePosition.x}%`,
                top: `${imagePosition.y}%`,
                transform: 'translate(-50%, -50%)',
                cursor: onImagePositionChange ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
              onMouseDown={handleMouseDown}
              draggable={false}
            />
          </div>
          
          {/* Drag indicator */}
          {onImagePositionChange && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <Move className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1">
          <h4 className="text-red-700 font-medium underline cursor-pointer hover:text-red-800">
            Preview Personalised Image
          </h4>
          {onImagePositionChange && (
            <p className="text-xs text-gray-600 mt-1">
              💡 Drag the image to reposition it within the {shape}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}