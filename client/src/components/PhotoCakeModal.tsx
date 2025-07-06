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
      <DialogContent className="max-w-md w-full p-6">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-semibold">Personalise your cake</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Resize Slider - Only show after image upload */}
          {uploadedImage && (
            <div>
              <p className="text-sm text-gray-600 mb-3 text-center">
                Drag the slider to adjust image size
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Small</span>
                <div className="flex-1">
                  <input
                    type="range"
                    min="20"
                    max="80"
                    value={imageSize}
                    onChange={(e) => setImageSize(Number(e.target.value))}
                    className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #ea580c 0%, #ea580c ${((imageSize - 20) / (80 - 20)) * 100}%, #fed7aa ${((imageSize - 20) / (80 - 20)) * 100}%, #fed7aa 100%)`
                    }}
                  />
                </div>
                <span className="text-sm text-gray-500">Large</span>
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Drag & drop your photo here or click to select
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mb-2"
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
          </div>

          {/* Remove Photo Button - Only show after upload */}
          {uploadedImage && (
            <div className="text-center">
              <Button
                onClick={removeImage}
                variant="ghost"
                className="text-red-500 hover:text-red-700"
              >
                Remove Photo
              </Button>
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            Save & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}