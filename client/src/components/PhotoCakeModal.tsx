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
  const [imagePosition, setImagePosition] = useState<Position>({ x: 50, y: 40 });
  const [textPosition, setTextPosition] = useState<Position>({ x: 50, y: 70 });
  const [imageSize, setImageSize] = useState(70);
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

  const handleFileUpload = (file: File | null) => {
    if (!file) {
      setUploadedImage('');
      setUploadedFile(null);
      return;
    }
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

  const handleClose = () => {
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
              {uploadedImage && (
                <div className="text-center mt-4">
                  <span className="text-sm text-gray-600">💡 Drag the image to adjust it</span>
                </div>
              )}
            </div>
            
            {/* Right Side - Simple Upload and Text Controls */}
            <div className="w-1/2 p-6 flex flex-col">
              {/* Upload Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Upload Image</h3>
                
                {!uploadedImage ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Image</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      File size should be 100kb to 10mb. Only png & jpg images.
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
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
                ) : (
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-4">
                    <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg mb-4">
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
                            max="80"
                            value={imageSize}
                            onChange={(e) => setImageSize(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${((imageSize - 20) / (80 - 20)) * 100}%, #e5e7eb ${((imageSize - 20) / (80 - 20)) * 100}%, #e5e7eb 100%)`
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">Large</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Cake Message</h3>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Name on Cake</Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter text for your cake..."
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      maxLength={15}
                      className="border-gray-300 focus:border-red-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                      {customText.length} / 15
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-auto">
                <Button
                  onClick={handleSave}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 text-lg font-semibold"
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}