import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Upload, Heart, Circle, Square, Download } from 'lucide-react';

type OccasionType = 'birthday' | 'anniversary' | 'wedding' | 'graduation' | 'congratulations' | 'valentine' | 'mothers-day' | 'fathers-day' | 'celebration';

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
  textPosition?: { x: number; y: number };
  onTextPositionChange?: (position: { x: number; y: number }) => void;
  occasionType?: OccasionType;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

export function PhotoPreview({ 
  shape, 
  backgroundImage, 
  onImageUpload, 
  uploadedImage,
  customText,
  imageSize = 120,
  onImageSizeChange,
  className = "",
  showDownload = false,
  textPosition = { x: 50, y: 70 },
  onTextPositionChange,
  occasionType = 'birthday',
  textColor = '#DC2626',
  fontSize = 100,
  fontFamily = 'Arial'
}: PhotoPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [isImageDragging, setIsImageDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTextMouseDown = (e: React.MouseEvent) => {
    if (!onTextPositionChange) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDragOffset({
        x: x - (textPosition.x * rect.width / 100),
        y: y - (textPosition.y * rect.height / 100)
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && onTextPositionChange) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left - dragOffset.x;
        const y = e.clientY - rect.top - dragOffset.y;
        
        // Convert to percentage
        const newX = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const newY = Math.max(0, Math.min(100, (y / rect.height) * 100));
        
        onTextPositionChange({ x: newX, y: newY });
      }
    }
    
    if (isImageDragging) {
      handleImageMove(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsImageDragging(false);
  };

  const handleImageMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsImageDragging(true);
    
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

  const handleImageMove = (e: React.MouseEvent) => {
    if (!isImageDragging) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      
      // Convert to percentage and constrain within bounds
      const newX = Math.max(10, Math.min(90, (x / rect.width) * 100));
      const newY = Math.max(10, Math.min(90, (y / rect.height) * 100));
      
      setImagePosition({ x: newX, y: newY });
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

  const downloadCustomizedImage = async () => {
    if (!uploadedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for high-quality print (increased resolution)
    const size = 1000; // Higher resolution for better print quality
    canvas.width = size;
    canvas.height = size;

    // Clear canvas and set white background
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

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
        const heartSize = size * 0.45;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - heartSize * 0.1);
        
        // Left top curve (left lobe)
        ctx.bezierCurveTo(
          centerX - heartSize * 0.3, centerY - heartSize * 0.7,
          centerX - heartSize * 0.8, centerY - heartSize * 0.4,
          centerX - heartSize * 0.6, centerY - heartSize * 0.1
        );
        
        // Left side to bottom
        ctx.bezierCurveTo(
          centerX - heartSize * 0.5, centerY + heartSize * 0.2,
          centerX - heartSize * 0.2, centerY + heartSize * 0.6,
          centerX, centerY + heartSize * 0.8
        );
        
        // Right side from bottom
        ctx.bezierCurveTo(
          centerX + heartSize * 0.2, centerY + heartSize * 0.6,
          centerX + heartSize * 0.5, centerY + heartSize * 0.2,
          centerX + heartSize * 0.6, centerY - heartSize * 0.1
        );
        
        // Right top curve (right lobe)
        ctx.bezierCurveTo(
          centerX + heartSize * 0.8, centerY - heartSize * 0.4,
          centerX + heartSize * 0.3, centerY - heartSize * 0.7,
          centerX, centerY - heartSize * 0.1
        );
        
        ctx.closePath();
        ctx.clip();
      } else if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size * 0.45, 0, 2 * Math.PI);
        ctx.clip();
      } else if (shape === 'square') {
        const squareSize = size * 0.8;
        const x = (size - squareSize) / 2;
        const y = (size - squareSize) / 2;
        ctx.beginPath();
        ctx.rect(x, y, squareSize, squareSize);
        ctx.clip();
      }

      // Draw image with proper positioning and scaling to match preview
      const scaledImageSize = (imageSize / 100) * size;
      const imgX = (imagePosition.x / 100) * size - scaledImageSize / 2;
      const imgY = (imagePosition.y / 100) * size - scaledImageSize / 2;
      
      // Calculate aspect ratio to preserve image proportions
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      let drawWidth = scaledImageSize;
      let drawHeight = scaledImageSize;
      
      if (aspectRatio > 1) {
        drawHeight = scaledImageSize / aspectRatio;
      } else {
        drawWidth = scaledImageSize * aspectRatio;
      }
      
      ctx.drawImage(img, imgX, imgY, drawWidth, drawHeight);
      
      ctx.restore();

      // Add text if present
      if (customText) {
        // Calculate text position based on textPosition prop to match preview exactly
        const textX = (textPosition.x / 100) * size;
        const textY = (textPosition.y / 100) * size;
        
        // Set text properties with shadow for better visibility
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add text shadow effect to match preview styling
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Add "Happy" text
        ctx.fillStyle = textColor;
        ctx.font = `bold ${Math.round(28 * fontSize / 100)}px ${fontFamily}`;
        ctx.fillText('Happy', textX, textY - 25);
        
        // Add occasion text (Birthday or Anniversary)
        ctx.fillStyle = textColor;
        ctx.font = `bold ${Math.round(32 * fontSize / 100)}px ${fontFamily}`;
        ctx.fillText(occasionType === 'birthday' ? 'Birthday' : 
                     occasionType === 'anniversary' ? 'Anniversary' :
                     occasionType === 'wedding' ? 'Wedding' :
                     occasionType === 'graduation' ? 'Graduation' :
                     occasionType === 'congratulations' ? 'Congratulations' :
                     occasionType === 'valentine' ? "Valentine's Day" :
                     occasionType === 'mothers-day' ? "Mother's Day" :
                     occasionType === 'fathers-day' ? "Father's Day" :
                     'Celebration', textX, textY + 5);
        
        // Add custom name text
        ctx.fillStyle = textColor;
        ctx.font = `${Math.round(20 * fontSize / 100)}px ${fontFamily}`;
        ctx.fillText(customText, textX, textY + 35);
        
        // Reset shadow for other drawing operations
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      // Add heart outline
      if (shape === 'heart') {
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 4;
        
        const centerX = size / 2;
        const centerY = size / 2;
        const heartSize = size * 0.45;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - heartSize * 0.1);
        
        // Left top curve (left lobe)
        ctx.bezierCurveTo(
          centerX - heartSize * 0.3, centerY - heartSize * 0.7,
          centerX - heartSize * 0.8, centerY - heartSize * 0.4,
          centerX - heartSize * 0.6, centerY - heartSize * 0.1
        );
        
        // Left side to bottom
        ctx.bezierCurveTo(
          centerX - heartSize * 0.5, centerY + heartSize * 0.2,
          centerX - heartSize * 0.2, centerY + heartSize * 0.6,
          centerX, centerY + heartSize * 0.8
        );
        
        // Right side from bottom
        ctx.bezierCurveTo(
          centerX + heartSize * 0.2, centerY + heartSize * 0.6,
          centerX + heartSize * 0.5, centerY + heartSize * 0.2,
          centerX + heartSize * 0.6, centerY - heartSize * 0.1
        );
        
        // Right top curve (right lobe)
        ctx.bezierCurveTo(
          centerX + heartSize * 0.8, centerY - heartSize * 0.4,
          centerX + heartSize * 0.3, centerY - heartSize * 0.7,
          centerX, centerY - heartSize * 0.1
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
        <div 
          ref={containerRef}
          className="relative"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Main photo with shape */}
          {uploadedImage ? (
            <div 
              className="border-4 border-gray-200 shadow-xl overflow-hidden bg-white relative"
              style={{
                width: `${fixedSize}px`,
                height: `${fixedSize}px`,
                clipPath: shape === 'heart' 
                  ? 'path("M140,45 C140,25 115,5 85,5 C55,5 30,25 30,55 C30,85 55,110 140,190 C225,110 250,85 250,55 C250,25 225,5 195,5 C165,5 140,25 140,45 Z")'
                  : shape === 'circle' 
                    ? 'circle(50%)'
                    : 'none',
                borderRadius: shape === 'square' ? '16px' : '0'
              }}
            >
              {/* Draggable Image with zoom functionality - no cropping, preserve original quality */}
              <div
                className="absolute cursor-move select-none image-drag-smooth"
                style={{
                  width: `${imageSize}%`,
                  height: `${imageSize}%`,
                  left: `${imagePosition.x}%`,
                  top: `${imagePosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  minWidth: `${imageSize}%`,
                  minHeight: `${imageSize}%`,

                }}
                onMouseDown={handleImageMouseDown}
              >
                <img 
                  src={uploadedImage} 
                  alt="Uploaded photo" 
                  className="w-full h-full object-contain high-quality-image" 
                  draggable={false}
                />
              </div>
              
              {/* Draggable text overlay */}
              {customText && (
                <div 
                  className="absolute text-white font-bold text-center cursor-move select-none z-10"
                  style={{
                    left: `${textPosition.x}%`,
                    top: `${textPosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)',
                    filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))'
                  }}
                  onMouseDown={handleTextMouseDown}
                >
                  <div 
                    className="font-bold"
                    style={{ 
                      color: textColor,
                      fontSize: `${Math.round(18 * fontSize / 100)}px`,
                      fontFamily: fontFamily
                    }}
                  >
                    Happy
                  </div>
                  <div 
                    className="font-bold"
                    style={{ 
                      color: textColor,
                      fontSize: `${Math.round(22 * fontSize / 100)}px`,
                      fontFamily: fontFamily
                    }}
                  >
                    {occasionType === 'birthday' ? 'Birthday' : 
                     occasionType === 'anniversary' ? 'Anniversary' :
                     occasionType === 'wedding' ? 'Wedding' :
                     occasionType === 'graduation' ? 'Graduation' :
                     occasionType === 'congratulations' ? 'Congratulations' :
                     occasionType === 'valentine' ? "Valentine's Day" :
                     occasionType === 'mothers-day' ? "Mother's Day" :
                     occasionType === 'fathers-day' ? "Father's Day" :
                     'Celebration'}
                  </div>
                  <div 
                    className="mt-1"
                    style={{ 
                      color: textColor,
                      fontSize: `${Math.round(14 * fontSize / 100)}px`,
                      fontFamily: fontFamily
                    }}
                  >
                    {customText}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div 
              className="border-4 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
              style={{
                width: `${fixedSize}px`,
                height: `${fixedSize}px`,
                clipPath: shape === 'heart' 
                  ? 'path("M140,45 C140,25 115,5 85,5 C55,5 30,25 30,55 C30,85 55,110 140,190 C225,110 250,85 250,55 C250,25 225,5 195,5 C165,5 140,25 140,45 Z")'
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
          {uploadedImage && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
              💡 <strong>Drag the image</strong> to position it within the {shape} shape
            </div>
          )}
          
          {/* Main Preview */}
          {renderPreviewWithOverlay()}
          

          

          
          {uploadedImage && (
            <div className="space-y-4">
              
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