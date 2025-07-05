import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, Camera } from 'lucide-react';

interface PhotoCakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageFile: File | null, customText: string) => void;
  cakePreviewImage?: string;
  initialText?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    onSave(uploadedFile, customText);
    onClose();
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
              <div className="relative">
                {/* Base cake image */}
                <img 
                  src={cakePreviewImage || '/api/placeholder/400/400'} 
                  alt="Cake preview"
                  className="w-80 h-80 object-cover rounded-full shadow-lg"
                />
                
                {/* Uploaded image overlay */}
                {uploadedImage && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-md">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Custom text overlay */}
                {customText && (
                  <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-md">
                    <p className="text-center font-semibold text-brown text-sm">
                      {customText}
                    </p>
                  </div>
                )}
                
                {/* Placeholder for no image */}
                {!uploadedImage && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-white bg-opacity-80">
                    <div className="text-center">
                      <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Your photo here</p>
                    </div>
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