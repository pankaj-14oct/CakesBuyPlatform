import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Heart, Circle, Square } from 'lucide-react';

interface PhotoPreviewProps {
  shape: 'circle' | 'heart' | 'square';
  backgroundImage?: string;
  onImageUpload?: (file: File) => void;
  uploadedImage?: string;
  className?: string;
}

export function PhotoPreview({ 
  shape, 
  backgroundImage, 
  onImageUpload, 
  uploadedImage, 
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

  const renderHeartShape = () => (
    <div className="relative w-48 h-48 mx-auto">
      {/* Heart shape using CSS */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: uploadedImage ? `url(${uploadedImage})` : 'none',
          clipPath: 'polygon(50% 85%, 20% 50%, 20% 35%, 30% 20%, 50% 35%, 70% 20%, 80% 35%, 80% 50%)',
        }}
      />
      {!uploadedImage && (
        <div 
          className="absolute inset-0 flex items-center justify-center text-gray-400"
          style={{
            clipPath: 'polygon(50% 85%, 20% 50%, 20% 35%, 30% 20%, 50% 35%, 70% 20%, 80% 35%, 80% 50%)',
            backgroundColor: '#f3f4f6'
          }}
        >
          <Heart className="w-12 h-12" />
        </div>
      )}
    </div>
  );

  return (
    <Card className={`relative ${className}`}>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Photo Preview</h3>
          <p className="text-sm text-gray-600">
            Your uploaded photo will appear in {shape} shape
          </p>
          
          {/* Background Image */}
          {backgroundImage && (
            <div className="relative">
              <img 
                src={backgroundImage} 
                alt="Background" 
                className="w-full h-64 object-cover rounded-lg opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Photo Preview based on shape */}
                {shape === 'heart' ? (
                  renderHeartShape()
                ) : (
                  <div 
                    className={`w-48 h-48 ${getShapeClasses()} bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden`}
                  >
                    {uploadedImage ? (
                      <img 
                        src={uploadedImage} 
                        alt="Uploaded photo" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
                        {getShapeIcon()}
                        <p className="text-sm mt-2">Your photo here</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Without Background Image */}
          {!backgroundImage && (
            <div className="flex items-center justify-center">
              {shape === 'heart' ? (
                renderHeartShape()
              ) : (
                <div 
                  className={`w-48 h-48 ${getShapeClasses()} bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden`}
                >
                  {uploadedImage ? (
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded photo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      {getShapeIcon()}
                      <p className="text-sm mt-2">Your photo here</p>
                    </div>
                  )}
                </div>
              )}
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