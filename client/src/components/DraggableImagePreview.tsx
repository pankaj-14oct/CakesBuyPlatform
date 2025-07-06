import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Download, RotateCcw } from 'lucide-react';

interface DraggableImagePreviewProps {
  uploadedImage: string;
  shape: 'circle' | 'heart' | 'square';
  onImagePositionChange?: (position: { x: number; y: number }) => void;
  onImageSizeChange?: (size: number) => void;
  imageSize?: number;
  initialPosition?: { x: number; y: number };
  className?: string;
}

export function DraggableImagePreview({
  uploadedImage,
  shape,
  onImagePositionChange,
  onImageSizeChange,
  imageSize = 100,
  initialPosition = { x: 50, y: 50 },
  className = ''
}: DraggableImagePreviewProps) {
  const [imagePosition, setImagePosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
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
    if (!isDragging) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      
      // Convert to percentage and constrain within bounds
      const newX = Math.max(15, Math.min(85, (x / rect.width) * 100));
      const newY = Math.max(15, Math.min(85, (y / rect.height) * 100));
      
      const newPosition = { x: newX, y: newY };
      setImagePosition(newPosition);
      
      if (onImagePositionChange) {
        onImagePositionChange(newPosition);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetPosition = () => {
    const defaultPosition = { x: 50, y: 50 };
    setImagePosition(defaultPosition);
    if (onImagePositionChange) {
      onImagePositionChange(defaultPosition);
    }
  };

  const getShapeClipPath = () => {
    switch (shape) {
      case 'circle':
        return 'circle(50%)';
      case 'heart':
        return 'path("M140,45 C140,25 115,5 85,5 C55,5 30,25 30,55 C30,85 55,110 140,190 C225,110 250,85 250,55 C250,25 225,5 195,5 C165,5 140,25 140,45 Z")';
      case 'square':
        return 'none';
      default:
        return 'circle(50%)';
    }
  };

  const downloadImage = async () => {
    if (!uploadedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = 500;
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Create image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Save context
      ctx.save();
      
      // Create clipping path based on shape
      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size * 0.45, 0, 2 * Math.PI);
        ctx.clip();
      } else if (shape === 'heart') {
        // Heart shape path
        const centerX = size / 2;
        const centerY = size / 2;
        const heartSize = size * 0.4;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - heartSize * 0.1);
        
        ctx.bezierCurveTo(
          centerX - heartSize * 0.3, centerY - heartSize * 0.7,
          centerX - heartSize * 0.8, centerY - heartSize * 0.4,
          centerX - heartSize * 0.6, centerY - heartSize * 0.1
        );
        
        ctx.bezierCurveTo(
          centerX - heartSize * 0.5, centerY + heartSize * 0.2,
          centerX - heartSize * 0.2, centerY + heartSize * 0.6,
          centerX, centerY + heartSize * 0.8
        );
        
        ctx.bezierCurveTo(
          centerX + heartSize * 0.2, centerY + heartSize * 0.6,
          centerX + heartSize * 0.5, centerY + heartSize * 0.2,
          centerX + heartSize * 0.6, centerY - heartSize * 0.1
        );
        
        ctx.bezierCurveTo(
          centerX + heartSize * 0.8, centerY - heartSize * 0.4,
          centerX + heartSize * 0.3, centerY - heartSize * 0.7,
          centerX, centerY - heartSize * 0.1
        );
        
        ctx.closePath();
        ctx.clip();
      } else if (shape === 'square') {
        const squareSize = size * 0.8;
        const x = (size - squareSize) / 2;
        const y = (size - squareSize) / 2;
        ctx.beginPath();
        ctx.rect(x, y, squareSize, squareSize);
        ctx.clip();
      }

      // Calculate image position and size
      const imgSize = (imageSize / 100) * size;
      const imgX = (imagePosition.x / 100) * size - imgSize / 2;
      const imgY = (imagePosition.y / 100) * size - imgSize / 2;
      
      // Draw image
      ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
      
      ctx.restore();

      // Download the image
      const link = document.createElement('a');
      link.download = `customized-${shape}-image.png`;
      link.href = canvas.toDataURL();
      link.click();
    };

    img.src = uploadedImage;
  };

  return (
    <Card className={`relative ${className}`}>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Position Your Image</h3>
          <p className="text-sm text-gray-600">
            Drag the image to position it within the {shape} shape
          </p>
          
          {/* Main Preview */}
          <div className="flex items-center justify-center h-96">
            <div 
              ref={containerRef}
              className="relative cursor-move"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div 
                className="border-4 border-gray-200 shadow-xl overflow-hidden bg-white relative"
                style={{
                  width: '280px',
                  height: '280px',
                  clipPath: getShapeClipPath(),
                  borderRadius: shape === 'square' ? '16px' : '0'
                }}
              >
                {/* Draggable Image */}
                <img 
                  src={uploadedImage} 
                  alt="Uploaded photo" 
                  className="absolute object-cover select-none"
                  style={{
                    width: `${imageSize}%`,
                    height: `${imageSize}%`,
                    left: `${imagePosition.x}%`,
                    top: `${imagePosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                    minWidth: '100%',
                    minHeight: '100%',
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={handleMouseDown}
                  draggable={false}
                />
                
                {/* Drag overlay hint */}
                {!isDragging && (
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="text-white text-sm font-bold bg-black bg-opacity-60 px-3 py-1 rounded">
                      Drag to reposition
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="space-y-4">
            {/* Image Size Control */}
            {onImageSizeChange && (
              <div className="px-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Size: {imageSize}%
                </label>
                <Slider
                  value={[imageSize]}
                  onValueChange={(value) => onImageSizeChange(value[0])}
                  min={50}
                  max={200}
                  step={5}
                  className="w-full"
                />
              </div>
            )}
            
            {/* Control Buttons */}
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={resetPosition}
                size="sm"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Position
              </Button>
              
              <Button 
                onClick={downloadImage}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
        
        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </CardContent>
    </Card>
  );
}