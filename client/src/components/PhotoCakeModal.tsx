import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Upload, X, Camera } from 'lucide-react';
import { PhotoPreview } from './photo-preview';

type OccasionType = 'birthday' | 'anniversary' | 'wedding' | 'graduation' | 'congratulations' | 'valentine' | 'mothers-day' | 'fathers-day' | 'celebration';

interface PhotoCakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageFile: File | null, customText: string, imagePosition?: { x: number; y: number }, textPosition?: { x: number; y: number }, imageSize?: number, occasionType?: OccasionType, textColor?: string, fontSize?: number, fontFamily?: string) => void;
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
  const [textPosition, setTextPosition] = useState<Position>({ x: 50, y: photoPreviewShape === 'heart' ? 55 : 70 });
  const [imageSize, setImageSize] = useState(120);
  const [isDragging, setIsDragging] = useState<'image' | 'text' | null>(null);
  const [occasionType, setOccasionType] = useState<OccasionType>('birthday');
  const [textColor, setTextColor] = useState('#DC2626');
  const [fontSize, setFontSize] = useState(150);
  const [fontFamily, setFontFamily] = useState('Dancing Script');
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
    onSave(uploadedFile, customText, imagePosition, textPosition, imageSize, occasionType, textColor, fontSize, fontFamily);
    onClose();
  };

  const handleClose = () => {
    setUploadedImage('');
    setUploadedFile(null);
    setCustomText(initialText);
    setTextPosition({ x: 50, y: 70 });
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
                textPosition={textPosition}
                onTextPositionChange={setTextPosition}
                occasionType={occasionType}
                textColor={textColor}
                fontSize={fontSize}
                fontFamily={fontFamily}
              />
              {uploadedImage && (
                <div className="text-center mt-4 space-y-2">
                  <span className="text-sm text-gray-600">💡 Drag the image to adjust it</span>
                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Current zoom: {imageSize}%
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Side - Simple Upload and Text Controls */}
            <div className="w-1/2 p-6 flex flex-col max-h-[500px] overflow-y-auto">
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

                    {/* Image Zoom Slider */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium">🔍 Zoom Image</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">
                        Drag the slider to zoom in/out on your image. Higher zoom preserves print quality.
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">Zoom Out</span>
                        <div className="flex-1">
                          <input
                            type="range"
                            min="80"
                            max="300"
                            step="5"
                            value={imageSize}
                            onChange={(e) => setImageSize(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #ea580c 0%, #ea580c ${((imageSize - 80) / (300 - 80)) * 100}%, #fed7aa ${((imageSize - 80) / (300 - 80)) * 100}%, #fed7aa 100%)`
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">Zoom In</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Cake Message</h3>
                
                {/* Occasion Type */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Occasion Type</Label>
                  <Select value={occasionType} onValueChange={(value: OccasionType) => setOccasionType(value)}>
                    <SelectTrigger className="border-gray-300 focus:border-red-500">
                      <SelectValue placeholder="Select occasion" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="graduation">Graduation</SelectItem>
                      <SelectItem value="congratulations">Congratulations</SelectItem>
                      <SelectItem value="valentine">Valentine's Day</SelectItem>
                      <SelectItem value="mothers-day">Mother's Day</SelectItem>
                      <SelectItem value="fathers-day">Father's Day</SelectItem>
                      <SelectItem value="celebration">Celebration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Name Input */}
                <div className="mb-4">
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

                {/* Text Color */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Text Color</Label>
                  <div className="flex gap-2">
                    {[
                      { color: '#DC2626', name: 'Red' },
                      { color: '#059669', name: 'Green' },
                      { color: '#2563EB', name: 'Blue' },
                      { color: '#7C3AED', name: 'Purple' },
                      { color: '#EA580C', name: 'Orange' },
                      { color: '#BE185D', name: 'Pink' },
                      { color: '#000000', name: 'Black' },
                      { color: '#FFFFFF', name: 'White' }
                    ].map((item) => (
                      <button
                        key={item.color}
                        onClick={() => setTextColor(item.color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          textColor === item.color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: item.color }}
                        title={item.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Font Style */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Font Style</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger className="border-gray-300 focus:border-red-500">
                      <SelectValue placeholder="Select font style" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="Dancing Script">Dancing Script (Elegant Cursive)</SelectItem>
                      <SelectItem value="Pacifico">Pacifico (Italian Style)</SelectItem>
                      <SelectItem value="Great Vibes">Great Vibes (Luxury Script)</SelectItem>
                      <SelectItem value="Satisfy">Satisfy (Handwritten)</SelectItem>
                      <SelectItem value="Lobster">Lobster (Bold Curves)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Size */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Font Size</Label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Small</span>
                    <div className="flex-1">
                      <Slider
                        value={[fontSize]}
                        onValueChange={(value) => setFontSize(value[0])}
                        max={300}
                        min={50}
                        step={10}
                        className="w-full"
                      />
                    </div>
                    <span className="text-xs text-gray-500">Large</span>
                  </div>
                  <div className="text-center text-xs text-gray-500 mt-1">
                    {fontSize}%
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