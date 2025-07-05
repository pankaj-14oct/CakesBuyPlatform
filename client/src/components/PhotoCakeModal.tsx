import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, Camera } from 'lucide-react';

interface PhotoCakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageFile: File | null, customText: string, imagePosition?: { x: number; y: number }, textPosition?: { x: number; y: number }, imageSize?: number) => void;
  cakePreviewImage?: string;
  initialText?: string;
}

interface Position {
  x: number;
  y: number;
}

export default function PhotoCakeModal({
  isOpen,
  onClose,
  onSave,
  cakePreviewImage,
  initialText = ''
}: PhotoCakeModalProps) {
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [customText, setCustomText] = useState(initialText);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePosition, setImagePosition] = useState<Position>({ x: 50, y: 40 }); // Center position as percentage
  const [textPosition, setTextPosition] = useState<Position>({ x: 50, y: 70 }); // Below image
  const [imageSize, setImageSize] = useState(32); // Size in percentage of cake (32 = 128px on 400px cake)
  const [isDragging, setIsDragging] = useState<'image' | 'text' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleFileUpload(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        handleFileUpload(file);
      }
    }
  };

  const handleFileUpload = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
    setUploadedFile(file);
  };

  const removeImage = () => {
    setUploadedImage('');
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    onSave(uploadedFile, customText, imagePosition, textPosition, imageSize);
    onClose();
  };

  const handleMouseDown = (element: 'image' | 'text', e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(element);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain to preview area
    const constrainedX = Math.max(5, Math.min(95, x));
    const constrainedY = Math.max(5, Math.min(95, y));

    if (isDragging === 'image') {
      setImagePosition({ x: constrainedX, y: constrainedY });
    } else if (isDragging === 'text') {
      setTextPosition({ x: constrainedX, y: constrainedY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const handleClose = () => {
    // Reset state when closing
    setUploadedImage('');
    setUploadedFile(null);
    setCustomText(initialText);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-semibold">Personalise your cake</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex overflow-hidden">
            {/* Left Side - Cake Preview */}
            <div className="w-1/2 p-6 bg-gray-50 flex items-center justify-center">
              <div 
                ref={previewRef}
                className="relative w-80 h-80 cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Base cake image */}
                <img 
                  src={cakePreviewImage || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDAwIj4KICA8IS0tIENha2UgQmFzZSAtLT4KICA8Y2lyY2xlIGN4PSIyMDAiIGN5PSIyMDAiIHI9IjE5MCIgZmlsbD0iI2Y0ZTRjMSIgc3Ryb2tlPSIjZDRjNGExIiBzdHJva2Utd2lkdGg9IjQiLz4KICA8IS0tIENha2UgTGF5ZXJzIC0tPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjIwMCIgcj0iMTgwIiBmaWxsPSIjZjhmMGQ4IiBzdHJva2U9IiNlOGQ4YzgiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjIwMCIgcj0iMTcwIiBmaWxsPSIjZmRmNmUzIiBzdHJva2U9IiNlZGUzZDMiIHN0cm9rZS13aWR0aD0iMSIvPgogIDwhLS0gRGVjb3JhdGl2ZSBCb3JkZXIgLS0+CiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMjAwIiByPSIxNzUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Q0YjhhMSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtZGFzaGFycmF5PSI4LDQiLz4KICA8IS0tIFBob3RvIEFyZWEgUGxhY2Vob2xkZXIgLS0+CiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTYwIiByPSI3MCIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjZTBlMGUwIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cmVjdCB4PSIxNjAiIHk9IjEyMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI2Y4ZjhmOCIgc3Ryb2tlPSIjZDBkMGQwIiBzdHJva2Utd2lkdGg9IjEiLz4KICA8IS0tIFBob3RvIHBsYWNlaG9sZGVyIGljb24gLS0+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjAwLDE2MCkiPgogICAgPGNpcmNsZSByPSIyMCIgZmlsbD0iI2U4ZThlOCIvPgogICAgPHBhdGggZD0iTSAtMTIsLTggTCAxMiwtOCBMIDgsLTQgTCAtOCwtNCBaIiBmaWxsPSIjYzBjMGMwIi8+CiAgICA8Y2lyY2xlIHI9IjYiIGZpbGw9IiNhMGEwYTAiLz4KICAgIDxjaXJjbGUgcj0iMyIgZmlsbD0iI2ZmZmZmZiIvPgogIDwvZz4KICA8IS0tIFRleHQgcGxhY2Vob2xkZXIgYXJlYSAtLT4KICA8cmVjdCB4PSIxNDAiIHk9IjI1MCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSIyNSIgcng9IjEyIiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiNlMGUwZTAiIHN0cm9rZS13aWR0aD0iMSIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjY3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiPllvdXIgTWVzc2FnZTwvdGV4dD4KICA8IS0tIERlY29yYXRpdmUgZWxlbWVudHMgLS0+CiAgPGcgc3Ryb2tlPSIjZDRiOGExIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiPgogICAgPCEtLSBUb3AgZGVjb3JhdGl2ZSBzd2lybHMgLS0+CiAgICA8cGF0aCBkPSJNIDgwLDEwMCBRIDkwLDkwIDEwMCwxMDAgUSAxMTAsMTEwIDEyMCwxMDAiLz4KICAgIDxwYXRoIGQ9Ik0gMjgwLDEwMCBRIDI5MCw5MCAzMDAsMTAwIFEgMzEwLDExMCAzMjAsMTAwIi8+CiAgICA8IS0tIEJvdHRvbSBkZWNvcmF0aXZlIHN3aXJscyAtLT4KICAgIDxwYXRoIGQ9Ik0gODAsMzAwIFEgOTAsMzEwIDEwMCwzMDAgUSAxMTAsMjkwIDEyMCwzMDAiLz4KICAgIDxwYXRoIGQ9Ik0gMjgwLDMwMCBRIDI5MCwzMTAgMzAwLDMwMCBRIDMxMCwyOTAgMzIwLDMwMCIvPgogIDwvZz4KICA8IS0tIFNtYWxsIGRlY29yYXRpdmUgZG90cyAtLT4KICA8Y2lyY2xlIGN4PSIxMjAiIGN5PSIxNDAiIHI9IjMiIGZpbGw9IiNkNGI4YTEiLz4KICA8Y2lyY2xlIGN4PSIyODAiIGN5PSIxNDAiIHI9IjMiIGZpbGw9IiNkNGI4YTEiLz4KICA8Y2lyY2xlIGN4PSIxMjAiIGN5PSIyNjAiIHI9IjMiIGZpbGw9IiNkNGI4YTEiLz4KICA8Y2lyY2xlIGN4PSIyODAiIGN5PSIyNjAiIHI9IjMiIGZpbGw9IiNkNGI4YTEiLz4KICA8IS0tIENyZWFtIGJvcmRlciBkZXRhaWwgLS0+CiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMjAwIiByPSIxODUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2YwZThkOCIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg=='} 
                  alt="Cake preview"
                  className="w-full h-full object-cover rounded-full shadow-lg"
                  draggable={false}
                />
                
                {/* Uploaded image overlay - draggable and resizable */}
                {uploadedImage && (
                  <div 
                    className="absolute rounded-lg overflow-hidden border-2 border-white shadow-lg cursor-move hover:border-blue-400 transition-colors"
                    style={{
                      left: `${imagePosition.x}%`,
                      top: `${imagePosition.y}%`,
                      width: `${imageSize}%`,
                      height: `${imageSize}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: isDragging === 'image' ? 20 : 10
                    }}
                    onMouseDown={(e) => handleMouseDown('image', e)}
                  >
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded photo"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    {/* Drag indicator overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <div className="text-white text-xs font-semibold opacity-0 hover:opacity-100 bg-black bg-opacity-50 px-2 py-1 rounded">
                        🤏 Drag the image to adjust it
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Custom text overlay - draggable */}
                {customText && (
                  <div 
                    className="absolute bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-md cursor-move hover:bg-opacity-100 hover:shadow-lg transition-all duration-200"
                    style={{
                      left: `${textPosition.x}%`,
                      top: `${textPosition.y}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: isDragging === 'text' ? 20 : 10
                    }}
                    onMouseDown={(e) => handleMouseDown('text', e)}
                  >
                    <p className="text-center font-semibold text-brown text-sm whitespace-nowrap">
                      {customText}
                    </p>
                    {/* Drag indicator */}
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-0 hover:bg-opacity-10 rounded-lg transition-all duration-200"></div>
                  </div>
                )}
                
                {/* Placeholder for no image */}
                {!uploadedImage && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-white bg-opacity-80">
                    <div className="text-center">
                      <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Your photo here</p>
                      <button 
                        onClick={() => {
                          // Add a demo photo for testing
                          const demoPhotoSvg = `data:image/svg+xml;base64,${btoa(`
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                              <rect width="200" height="200" fill="#87CEEB"/>
                              <circle cx="100" cy="80" r="25" fill="#FDBCB4"/>
                              <circle cx="90" cy="75" r="3" fill="#000"/>
                              <circle cx="110" cy="75" r="3" fill="#000"/>
                              <path d="M85,85 Q100,95 115,85" stroke="#000" stroke-width="2" fill="none"/>
                              <rect x="70" y="105" width="60" height="80" fill="#FF6B6B"/>
                              <rect x="50" y="120" width="20" height="50" fill="#FDBCB4"/>
                              <rect x="130" y="120" width="20" height="50" fill="#FDBCB4"/>
                              <text x="100" y="190" text-anchor="middle" font-family="Arial" font-size="12" fill="#fff">Demo Photo</text>
                            </svg>
                          `)}`;
                          
                          // Create a blob and simulate file upload
                          fetch(demoPhotoSvg)
                            .then(res => res.blob())
                            .then(blob => {
                              const file = new File([blob], 'demo-photo.svg', { type: 'image/svg+xml' });
                              const imageUrl = URL.createObjectURL(file);
                              setUploadedImage(imageUrl);
                              setUploadedFile(file);
                            });
                        }}
                        className="mt-2 text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Try Demo Photo
                      </button>
                    </div>
                  </div>
                )}

                {/* Instructions overlay */}
                {uploadedImage && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-lg opacity-75">
                    💡 Drag image & text to position
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Side - Customization Options */}
            <div className="w-1/2 p-6 flex flex-col max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Photo Upload Section */}
              <div className="mb-4 flex-shrink-0">
                <div className="bg-pink-100 px-3 py-2 rounded-t-lg">
                  <h3 className="text-sm font-medium text-pink-800 text-center">Upload Photo</h3>
                </div>
                
                {uploadedImage ? (
                  <div className="border border-pink-200 rounded-b-lg p-4">
                    <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img 
                          src={uploadedImage} 
                          alt="Uploaded" 
                          className="w-12 h-12 object-cover rounded"
                        />
                        <span className="text-sm text-green-700 font-medium">Photo uploaded successfully</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeImage}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`border border-pink-200 rounded-b-lg p-6 text-center transition-colors ${
                      dragActive 
                        ? 'border-pink-500 bg-pink-50' 
                        : 'hover:border-pink-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Drop your photo here
                    </p>
                    <p className="text-xs text-gray-600 mb-4">
                      Or click to browse (JPG, PNG up to 10MB)
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-pink-300 text-pink-600 hover:bg-pink-50"
                    >
                      Choose Photo
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Resize Section */}
              {uploadedImage && (
                <div className="mb-4 flex-shrink-0">
                  <div className="bg-pink-100 px-3 py-2 rounded-t-lg">
                    <h3 className="text-sm font-medium text-pink-800 text-center">🔄 Resize</h3>
                  </div>
                  <div className="border border-pink-200 rounded-b-lg p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 min-w-12">Small</span>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="20"
                          max="50"
                          value={imageSize}
                          onChange={(e) => setImageSize(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${((imageSize - 20) / (50 - 20)) * 100}%, #e5e7eb ${((imageSize - 20) / (50 - 20)) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 min-w-12">Large</span>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Drag the slider to adjust image size
                    </p>
                  </div>
                </div>
              )}

              {/* Custom Message Section */}
              <div className="mb-4 flex-shrink-0">
                <div className="bg-pink-100 px-3 py-2 rounded-t-lg">
                  <h3 className="text-sm font-medium text-pink-800 text-center">Cake Message</h3>
                </div>
                <div className="border border-pink-200 rounded-b-lg p-4">
                  <Label className="text-sm font-medium mb-2 block">Name on Cake</Label>
                  <div className="relative">
                    <Input
                      placeholder="Text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      maxLength={15}
                      className="border-blue-300 focus:border-blue-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                      {customText.length} / 15
                    </span>
                  </div>
                  {customText && (
                    <p className="text-xs text-blue-600 mt-2 text-center">
                      💡 Drag your message text on the cake preview to position it
                    </p>
                  )}
                </div>
              </div>

              {/* Tips Section */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4 flex-shrink-0">
                <h4 className="font-medium text-blue-900 mb-2">✨ Pro Tips:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use bright, clear photos with good lighting</li>
                  <li>• Square photos work best for round cakes</li>
                  <li>• Avoid very dark or blurry images</li>
                  <li>• High resolution photos (min 800x800px) recommended</li>
                </ul>
              </div>

              {/* Save Button - Fixed at bottom */}
              <div className="mt-auto pt-4 flex-shrink-0">
                <Button
                  onClick={handleSave}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 text-lg font-semibold"
                  disabled={!uploadedImage}
                >
                  Save Personalisation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}