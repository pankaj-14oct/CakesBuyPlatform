import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Upload, Heart, Circle, Square, Download } from 'lucide-react';

interface PhotoPreviewProps {
  shape: 'circle' | 'heart' | 'square';
  backgroundImage?: string;
  onImageUpload?: (file: File) => void;
  uploadedImage?: string;
  customText?: string;
  imageSize?: number;
  onImageSizeChange?: (size: number) => void;
  className?: string;
  showDownload?: boolean;
}

export function PhotoPreview({ 
  shape, 
  backgroundImage, 
  onImageUpload, 
  uploadedImage,
  customText,
  imageSize = 70,
  onImageSizeChange,
  className = "",
  showDownload = false
}: PhotoPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const downloadCustomizedImage = async () => {
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
      // Create clipping path for heart shape
      ctx.save();
      
      if (shape === 'heart') {
        // Heart shape path
        const centerX = size / 2;
        const centerY = size / 2;
        const heartSize = size * 0.4;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + heartSize * 0.3);
        
        // Left curve
        ctx.bezierCurveTo(
          centerX - heartSize * 0.5, centerY - heartSize * 0.3,
          centerX - heartSize, centerY + heartSize * 0.1,
          centerX, centerY + heartSize * 0.7
        );
        
        // Right curve  
        ctx.bezierCurveTo(
          centerX + heartSize, centerY + heartSize * 0.1,
          centerX + heartSize * 0.5, centerY - heartSize * 0.3,
          centerX, centerY + heartSize * 0.3
        );
        
        ctx.closePath();
        ctx.clip();
      } else if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size * 0.4, 0, 2 * Math.PI);
        ctx.clip();
      } else if (shape === 'square') {
        const squareSize = size * 0.8;
        const x = (size - squareSize) / 2;
        const y = (size - squareSize) / 2;
        ctx.beginPath();
        ctx.rect(x, y, squareSize, squareSize);
        ctx.clip();
      }

      // Draw image
      const imgSize = size * 0.8;
      const imgX = (size - imgSize) / 2;
      const imgY = (size - imgSize) / 2;
      ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
      
      ctx.restore();

      // Add text if present
      if (customText) {
        ctx.fillStyle = '#DC2626'; // Red color like in your example
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        
        // Add "Happy" text
        ctx.fillText('Happy', size / 2, size - 80);
        
        // Add "Birthday" text  
        ctx.fillStyle = '#DC2626';
        ctx.font = 'bold 36px Arial';
        ctx.fillText('Birthday', size / 2, size - 40);
        
        // Add custom name text
        ctx.fillStyle = '#555';
        ctx.font = '18px Arial';
        ctx.fillText(customText, size / 2, size - 10);
      }

      // Add heart outline
      if (shape === 'heart') {
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 4;
        
        const centerX = size / 2;
        const centerY = size / 2;
        const heartSize = size * 0.4;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + heartSize * 0.3);
        
        // Left curve
        ctx.bezierCurveTo(
          centerX - heartSize * 0.5, centerY - heartSize * 0.3,
          centerX - heartSize, centerY + heartSize * 0.1,
          centerX, centerY + heartSize * 0.7
        );
        
        // Right curve  
        ctx.bezierCurveTo(
          centerX + heartSize, centerY + heartSize * 0.1,
          centerX + heartSize * 0.5, centerY - heartSize * 0.3,
          centerX, centerY + heartSize * 0.3
        );
        
        ctx.closePath();
        ctx.stroke();
      }

      // Download the image
      const link = document.createElement('a');
      link.download = `customized-${shape}-cake.png`;
      link.href = canvas.toDataURL();
      link.click();
    };

    img.src = uploadedImage;
  };

  const renderPreviewWithOverlay = () => {
    const fixedSize = 280; // Fixed circle/shape size
    
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          {/* Main photo with shape */}
          {uploadedImage ? (
            <div 
              className="border-4 border-gray-200 shadow-xl overflow-hidden bg-white relative"
              style={{
                width: `${fixedSize}px`,
                height: `${fixedSize}px`,
                clipPath: shape === 'heart' 
                  ? 'polygon(50% 100%, 20% 60%, 20% 40%, 30% 30%, 40% 30%, 50% 40%, 60% 30%, 70% 30%, 80% 40%, 80% 60%)'
                  : shape === 'circle' 
                    ? 'circle(50%)'
                    : 'none',
                borderRadius: shape === 'square' ? '16px' : '0'
              }}
            >
              {/* Image with zoom functionality - keeps circle fixed, zooms image within */}
              <img 
                src={uploadedImage} 
                alt="Uploaded photo" 
                className="absolute top-1/2 left-1/2 object-cover"
                style={{
                  width: `${imageSize}%`,
                  height: `${imageSize}%`,
                  transform: 'translate(-50%, -50%)',
                  minWidth: '100%',
                  minHeight: '100%'
                }}
              />
            </div>
          ) : (
            <div 
              className="border-4 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
              style={{
                width: `${fixedSize}px`,
                height: `${fixedSize}px`,
                clipPath: shape === 'heart' 
                  ? 'polygon(50% 100%, 20% 60%, 20% 40%, 30% 30%, 40% 30%, 50% 40%, 60% 30%, 70% 30%, 80% 40%, 80% 60%)'
                  : shape === 'circle' 
                    ? 'circle(50%)'
                    : 'none',
                borderRadius: shape === 'square' ? '16px' : '0'
              }}
            >
              <div className="text-gray-400 text-center">
                {getShapeIcon()}
                <p className="text-sm mt-2 font-medium">Photo</p>
              </div>
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
          

          

          
          {uploadedImage && (
            <div className="space-y-2">
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
              
              {showDownload && (
                <div className="space-x-2">
                  <Button 
                    onClick={downloadCustomizedImage}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Customized Image
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </CardContent>
    </Card>
  );
}