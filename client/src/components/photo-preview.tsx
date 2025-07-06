import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Upload, Heart, Circle, Square } from 'lucide-react';

interface PhotoPreviewProps {
  shape: 'circle' | 'heart' | 'square';
  backgroundImage?: string;
  onImageUpload?: (file: File) => void;
  uploadedImage?: string;
  customText?: string;
  imageSize?: number;
  onImageSizeChange?: (size: number) => void;
  className?: string;
}

export function PhotoPreview({ 
  shape, 
  backgroundImage, 
  onImageUpload, 
  uploadedImage,
  customText,
  imageSize = 70,
  onImageSizeChange,
  className = "" 
}: PhotoPreviewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/') && onImageUpload) {
      onImageUpload(file);
    }
  };

  const getShapeClasses = () => {
    switch (shape) {
      case 'circle':
        return 'rounded-full';
      case 'heart':
        return 'rounded-t-full rounded-b-full transform rotate-45';
      case 'square':
        return 'rounded-lg';
      default:
        return 'rounded-full';
    }
  };

  const getShapeIcon = () => {
    switch (shape) {
      case 'circle':
        return <Circle className="w-8 h-8" />;
      case 'heart':
        return <Heart className="w-8 h-8" />;
      case 'square':
        return <Square className="w-8 h-8" />;
      default:
        return <Circle className="w-8 h-8" />;
    }
  };

  const renderPreviewWithOverlay = () => {
    const baseSize = 320; // Larger base size
    const actualSize = (imageSize / 100) * baseSize;
    
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          {/* Main photo with shape */}
          {uploadedImage ? (
            <div className="relative">
              {shape === 'heart' ? (
                // CSS-based heart shape
                <div
                  className="relative bg-white border-4 border-gray-200 shadow-xl"
                  style={{
                    width: `${actualSize}px`,
                    height: `${actualSize * 0.85}px`,
                    transform: 'rotate(-45deg)',
                    borderRadius: '50px 50px 0 50px'
                  }}
                >
                  <div
                    className="absolute bg-white border-4 border-gray-200"
                    style={{
                      width: `${actualSize}px`,
                      height: `${actualSize * 0.85}px`,
                      top: `-${actualSize * 0.425}px`,
                      left: 0,
                      borderRadius: '50px 50px 50px 0',
                      transform: 'rotate(-90deg)',
                      transformOrigin: 'center bottom'
                    }}
                  />
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded photo" 
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      transform: 'rotate(45deg) scale(1.4)',
                      transformOrigin: 'center center'
                    }}
                  />
                </div>
              ) : (
                <div 
                  className="border-4 border-gray-200 shadow-xl overflow-hidden bg-white"
                  style={{
                    width: `${actualSize}px`,
                    height: `${actualSize}px`,
                    clipPath: shape === 'circle' ? 'circle(50%)' : 'none',
                    borderRadius: shape === 'square' ? '16px' : '0'
                  }}
                >
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded photo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              {shape === 'heart' ? (
                // CSS-based heart placeholder
                <div
                  className="relative bg-gray-50 border-4 border-dashed border-gray-300 flex items-center justify-center"
                  style={{
                    width: `${baseSize * 0.8}px`,
                    height: `${baseSize * 0.8 * 0.85}px`,
                    transform: 'rotate(-45deg)',
                    borderRadius: '50px 50px 0 50px'
                  }}
                >
                  <div
                    className="absolute bg-gray-50 border-4 border-dashed border-gray-300"
                    style={{
                      width: `${baseSize * 0.8}px`,
                      height: `${baseSize * 0.8 * 0.85}px`,
                      top: `-${baseSize * 0.8 * 0.425}px`,
                      left: 0,
                      borderRadius: '50px 50px 50px 0',
                      transform: 'rotate(-90deg)',
                      transformOrigin: 'center bottom'
                    }}
                  />
                  <div 
                    className="absolute inset-0 flex items-center justify-center text-gray-400"
                    style={{
                      transform: 'rotate(45deg)',
                      transformOrigin: 'center center'
                    }}
                  >
                    <div className="text-center">
                      {getShapeIcon()}
                      <p className="text-sm mt-2 font-medium">Photo</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="border-4 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
                  style={{
                    width: `${baseSize * 0.8}px`,
                    height: `${baseSize * 0.8}px`,
                    clipPath: shape === 'circle' ? 'circle(50%)' : 'none',
                    borderRadius: shape === 'square' ? '16px' : '0'
                  }}
                >
                  <div className="text-gray-400 text-center">
                    {getShapeIcon()}
                    <p className="text-sm mt-2 font-medium">Photo</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Text overlay */}
          {customText && (
            <div 
              className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-95 px-4 py-2 rounded-lg shadow-lg border"
            >
              <p className="text-center font-semibold text-gray-800 text-sm whitespace-nowrap">
                {customText}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={`relative ${className}`}>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Photo Preview</h3>
          <p className="text-sm text-gray-600">
            Your uploaded photo will appear in {shape} shape
          </p>
          
          {/* Main Preview */}
          {renderPreviewWithOverlay()}
          
          {/* Resize Slider */}
          {uploadedImage && onImageSizeChange && (
            <div className="space-y-2 px-4">
              <p className="text-sm text-gray-600">Drag the slider to adjust image size</p>
              <Slider
                value={[imageSize]}
                onValueChange={(value) => onImageSizeChange(value[0])}
                max={100}
                min={40}
                step={2}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>
          )}
          
          {/* Upload Section */}
          <div 
            className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
              isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-center space-y-2">
              <Upload className="w-8 h-8 mx-auto text-gray-400" />
              <p className="text-sm text-gray-600">
                Drag & drop your photo here or click to select
              </p>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="mt-2"
              >
                Choose Photo
              </Button>
            </div>
          </div>
          
          {uploadedImage && (
            <Button 
              variant="outline" 
              onClick={() => {
                if (onImageUpload) {
                  // Call with null to indicate image removal
                  onImageUpload(null as any);
                }
              }}
              className="text-red-600 hover:text-red-700"
            >
              Remove Photo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}