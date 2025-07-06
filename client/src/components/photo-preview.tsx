import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface PhotoPreviewProps {
  uploadedImage?: string;
  customText?: string;
  imagePosition?: { x: number; y: number };
  textPosition?: { x: number; y: number };
  imageSize?: number;
  shape?: 'circle' | 'heart' | 'square';
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  occasionType?: 'birthday' | 'anniversary' | 'wedding' | 'graduation' | 'congratulations' | 'valentine' | 'mothers-day' | 'fathers-day' | 'celebration';
  onImagePositionChange?: (position: { x: number; y: number }) => void;
  onTextPositionChange?: (position: { x: number; y: number }) => void;
  onRemovePhoto?: () => void;
  showDownload?: boolean;
  onImageSizeChange?: (size: number) => void;
  onImageUpload?: (file: File) => void;
  className?: string;
}

export function PhotoPreview({
  uploadedImage,
  customText,
  imagePosition = { x: 50, y: 50 },
  textPosition = { x: 50, y: 70 },
  imageSize = 120,
  shape = 'circle',
  textColor = '#FFFFFF',
  fontSize = 100,
  fontFamily = 'Dancing Script',
  occasionType = 'birthday',
  onImagePositionChange,
  onTextPositionChange,
  onRemovePhoto,
  showDownload = true,
  onImageSizeChange,
  onImageUpload,
  className
}: PhotoPreviewProps) {
  // Adjust text position for heart shape to be more centered
  const effectiveTextPosition = shape === 'heart' && textPosition.y === 70 
    ? { x: textPosition.x, y: 55 } 
    : textPosition;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'image' | 'text' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Mouse event handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'image' | 'text') => {
    if (!containerRef.current) return;
    
    setIsDragging(type);
    const rect = containerRef.current.getBoundingClientRect();
    const currentPosition = type === 'image' ? imagePosition : effectiveTextPosition;
    const elementX = (currentPosition.x / 100) * rect.width;
    const elementY = (currentPosition.y / 100) * rect.height;
    
    setDragOffset({
      x: e.clientX - rect.left - elementX,
      y: e.clientY - rect.top - elementY
    });
  }, [imagePosition, effectiveTextPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
    
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    if (isDragging === 'image' && onImagePositionChange) {
      onImagePositionChange({ x: clampedX, y: clampedY });
    } else if (isDragging === 'text' && onTextPositionChange) {
      onTextPositionChange({ x: clampedX, y: clampedY });
    }
  }, [isDragging, dragOffset, onImagePositionChange, onTextPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const downloadCustomizedImage = async () => {
    if (!uploadedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match preview container (scaled up for print quality)
    const previewSize = 280; // This matches the fixedSize in preview
    const scale = 4; // Scale factor for high resolution
    const canvasSize = previewSize * scale;
    
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear canvas and set white background
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Create image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Create clipping path that matches preview exactly
      ctx.save();
      
      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, 2 * Math.PI);
        ctx.clip();
      } else if (shape === 'heart') {
        // Heart shape path scaled to canvas size
        const heartPath = new Path2D("M140,45 C140,25 115,5 85,5 C55,5 30,25 30,55 C30,85 55,110 140,190 C225,110 250,85 250,55 C250,25 225,5 195,5 C165,5 140,25 140,45 Z");
        ctx.scale(canvasSize / 280, canvasSize / 280);
        ctx.clip(heartPath);
        ctx.scale(280 / canvasSize, 280 / canvasSize);
      } else if (shape === 'square') {
        const borderRadius = 16 * scale;
        ctx.beginPath();
        ctx.roundRect(0, 0, canvasSize, canvasSize, borderRadius);
        ctx.clip();
      }

      // Calculate image container dimensions that match preview exactly
      const containerWidth = (imageSize / 100) * canvasSize;
      const containerHeight = (imageSize / 100) * canvasSize;
      
      // Position container based on imagePosition (matching preview logic)
      const containerX = (imagePosition.x / 100) * canvasSize - containerWidth / 2;
      const containerY = (imagePosition.y / 100) * canvasSize - containerHeight / 2;
      
      // Draw image using object-contain logic (like CSS object-contain)
      const imgAspectRatio = img.naturalWidth / img.naturalHeight;
      const containerAspectRatio = containerWidth / containerHeight;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspectRatio > containerAspectRatio) {
        // Image is wider than container - fit width
        drawWidth = containerWidth;
        drawHeight = containerWidth / imgAspectRatio;
        drawX = containerX;
        drawY = containerY + (containerHeight - drawHeight) / 2;
      } else {
        // Image is taller than container - fit height
        drawWidth = containerHeight * imgAspectRatio;
        drawHeight = containerHeight;
        drawX = containerX + (containerWidth - drawWidth) / 2;
        drawY = containerY;
      }
      
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      
      ctx.restore();

      // Add text if present (matching preview text positioning and styling)
      if (customText) {
        // Calculate text position based on effectiveTextPosition to match preview exactly
        const textX = (effectiveTextPosition.x / 100) * canvasSize;
        const textY = (effectiveTextPosition.y / 100) * canvasSize;
        
        // Set text properties with shadow for better visibility
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add text shadow effect to match preview styling
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8 * scale;
        ctx.shadowOffsetX = 4 * scale;
        ctx.shadowOffsetY = 4 * scale;
        
        // Add text with proper vertical spacing to prevent overlapping
        ctx.fillStyle = textColor;
        
        // Calculate font sizes to exactly match the preview CSS
        // The preview uses relative font sizes, so we need to calculate the actual pixel values
        const previewBaseSize = 16; // Base font size in pixels
        const scaledBaseSize = previewBaseSize * scale;
        
        // Calculate each text size based on the fontSize slider value and relative multipliers
        const happySize = Math.round((fontSize / 100) * scaledBaseSize * 0.28);
        const occasionSize = Math.round((fontSize / 100) * scaledBaseSize * 0.32);
        const nameSize = Math.round((fontSize / 100) * scaledBaseSize * 0.26);
        
        // Calculate proper line spacing that matches the CSS mb-2 and mb-3 classes
        // CSS margin-bottom classes translate to specific pixel spacing
        const mb2Spacing = 8 * scale; // mb-2 = 0.5rem = 8px
        const mb3Spacing = 12 * scale; // mb-3 = 0.75rem = 12px
        
        // Position text lines to match preview exactly
        // Calculate total text height to center the group properly
        const totalTextHeight = happySize + mb2Spacing + occasionSize + mb3Spacing + nameSize;
        const startY = textY - (totalTextHeight / 2) + (happySize / 2);
        
        // "Happy" text - top line
        ctx.font = `bold ${happySize}px ${fontFamily}`;
        ctx.fillText('Happy', textX, startY);
        
        // Occasion text - middle line with mb-2 spacing
        ctx.font = `bold ${occasionSize}px ${fontFamily}`;
        const occasionY = startY + happySize + mb2Spacing + (occasionSize / 2);
        ctx.fillText(occasionType === 'birthday' ? 'Birthday' : 
                     occasionType === 'anniversary' ? 'Anniversary' :
                     occasionType === 'wedding' ? 'Wedding' :
                     occasionType === 'graduation' ? 'Graduation' :
                     occasionType === 'congratulations' ? 'Congratulations' :
                     occasionType === 'valentine' ? "Valentine's Day" :
                     occasionType === 'mothers-day' ? "Mother's Day" :
                     occasionType === 'fathers-day' ? "Father's Day" :
                     'Celebration', textX, occasionY);
        
        // Custom name text - bottom line with mb-3 spacing
        ctx.font = `bold ${nameSize}px ${fontFamily}`;
        const nameY = occasionY + (occasionSize / 2) + mb3Spacing + (nameSize / 2);
        ctx.fillText(customText, textX, nameY);
        
        // Reset shadow for other drawing operations
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      // Download the image
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `customized-${shape}-cake-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
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
                  minHeight: `${imageSize}%`
                }}
                onMouseDown={(e) => handleMouseDown(e, 'image')}
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
                    left: `${effectiveTextPosition.x}%`,
                    top: `${effectiveTextPosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)',
                    filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))',
                    color: textColor,
                    fontSize: `${fontSize}%`,
                    fontFamily: fontFamily
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'text')}
                >
                  <div className="leading-tight mb-2" style={{ fontSize: `${fontSize * 0.28}%` }}>Happy</div>
                  <div className="leading-tight mb-3" style={{ fontSize: `${fontSize * 0.32}%` }}>
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
                  <div className="font-bold leading-tight" style={{ fontSize: `${fontSize * 0.26}%` }}>{customText}</div>
                </div>
              )}
            </div>
          ) : (
            <div 
              className="border-4 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-500"
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
              <span>No photo uploaded</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold mb-2">Photo Preview</h3>
          <p className="text-sm text-gray-600">
            Your uploaded photo will appear in {shape} shape
          </p>
          {uploadedImage && (
            <p className="text-xs text-blue-600 mt-2">
              💡 Drag the image to position it within the {shape} shape
            </p>
          )}
        </div>
        
        <div className="mb-6">
          {renderPreviewWithOverlay()}
        </div>
        
        <div className="space-y-2">
          {uploadedImage && (
            <div className="flex flex-col space-y-2">
              <Button 
                variant="outline" 
                onClick={onRemovePhoto}
                className="text-red-600 border-red-200 hover:bg-red-50"
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