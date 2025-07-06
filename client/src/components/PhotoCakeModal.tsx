import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, Camera } from 'lucide-react';
import { PhotoPreview } from './photo-preview';

interface PhotoCakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageFile: File | null, customText: string, imagePosition?: { x: number; y: number }, textPosition?: { x: number; y: number }, imageSize?: number) => void;
  cakePreviewImage?: string;
  backgroundImage?: string;
  initialText?: string;
  photoPreviewShape?: 'circle' | 'heart' | 'square';
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
  backgroundImage,
  initialText = '',
  photoPreviewShape = 'circle'
}: PhotoCakeModalProps) {
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [customText, setCustomText] = useState(initialText);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePosition, setImagePosition] = useState<Position>({ x: 50, y: 40 }); // Center position as percentage
  const [textPosition, setTextPosition] = useState<Position>({ x: 50, y: 70 }); // Below image
  const [imageSize, setImageSize] = useState(70); // Size in percentage for the new preview system
  const [isDragging, setIsDragging] = useState<'image' | 'text' | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'message'>('upload');
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImage, setTempImage] = useState<string>('');
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

  const handleFileUpload = (file: File | null) => {
    if (!file) {
      // Handle removal
      setUploadedImage('');
      setUploadedFile(null);
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    setTempImage(imageUrl);
    setUploadedFile(file);
    setShowCropModal(true);
  };

  const handleCropSave = () => {
    setUploadedImage(tempImage);
    setShowCropModal(false);
    setActiveTab('upload'); // Stay on upload tab to show resize slider
  };

  const handleCropCancel = () => {
    setTempImage('');
    setShowCropModal(false);
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
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-xl font-semibold">Personalise your cake</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 flex overflow-hidden">
              {/* Left Side - Photo Preview */}
              <div className="w-1/2 p-6 bg-gray-50">
                <PhotoPreview
                  shape={photoPreviewShape}
                  uploadedImage={uploadedImage}
                  customText={customText}
                  imageSize={imageSize}
                  onImageSizeChange={setImageSize}
                  onImageUpload={handleFileUpload}
                  showDownload={true}
                  className="h-full"
                />
              </div>
              
              {/* Right Side - Tabbed Interface */}
              <div className="w-1/2 flex flex-col">
                {/* Tab Headers */}
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                      activeTab === 'upload'
                        ? 'border-red-500 text-red-600 bg-red-50'
                        : 'border-gray-200 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Upload Image
                  </button>
                  <button
                    onClick={() => setActiveTab('message')}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                      activeTab === 'message'
                        ? 'border-red-500 text-red-600 bg-red-50'
                        : 'border-gray-200 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Cake Message
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 p-6">
                  {activeTab === 'upload' && (
                    <div className="h-full flex flex-col">
                      {!uploadedImage ? (
                        /* Upload Area */
                        <div
                          className={`flex-1 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            dragActive 
                              ? 'border-red-500 bg-red-50' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          <div className="flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <Upload className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Image</h3>
                            <p className="text-sm text-gray-500 mb-4">
                              File size should be 100kb to 10mb. Only png & jpg images.
                            </p>
                            <Button
                              onClick={() => fileInputRef.current?.click()}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                            >
                              Choose File
                            </Button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                          </div>
                        </div>
                      ) : (
                        /* Uploaded Image with Resize */
                        <div className="space-y-4">
                          <div className="border-2 border-dashed border-green-300 rounded-lg p-4">
                            <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg">
                              <img 
                                src={uploadedImage} 
                                alt="Uploaded" 
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1">
                                <span className="text-sm text-green-700 font-medium flex items-center gap-2">
                                  ✓ Saved
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={removeImage}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Resize Slider */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm font-medium">🔄 Resize</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">Small</span>
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
                              <span className="text-xs text-gray-500">Large</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Save Button for Upload Tab */}
                      <div className="mt-6">
                        <Button
                          onClick={handleSave}
                          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 text-lg font-semibold"
                        >
                          Save & Continue
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'message' && (
                    <div className="h-full flex flex-col">
                      <div className="space-y-4 flex-1">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Name on Cake</Label>
                          <div className="relative">
                            <Input
                              placeholder="Text..."
                              value={customText}
                              onChange={(e) => setCustomText(e.target.value)}
                              maxLength={12}
                              className="border-blue-300 focus:border-blue-500 pr-12"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                              {customText.length} / 12
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Save Button for Message Tab */}
                      <div className="mt-6">
                        <Button
                          onClick={handleSave}
                          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 text-lg font-semibold"
                        >
                          Save Personalisation
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={handleCropCancel}>
        <DialogContent className="max-w-lg w-full p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold">Crop Image</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Image Preview Area */}
            <div className="border-4 border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="aspect-square bg-white rounded border-2 border-blue-400 overflow-hidden">
                {tempImage && (
                  <img 
                    src={tempImage} 
                    alt="Crop preview" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>

            {/* Warning Message */}
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <span>⚠️</span>
              <span>Inappropriate content may lead to order cancellation</span>
            </div>

            {/* Action Buttons */}
            <Button
              onClick={handleCropSave}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 text-lg font-semibold"
            >
              SAVE & CONTINUE
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}