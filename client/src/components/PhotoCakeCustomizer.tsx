import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon, Type, Palette } from 'lucide-react';
import { PhotoCakeSummary } from './PhotoCakeSummary';
import { PreviewPersonalisedImage } from './PreviewPersonalisedImage';

interface PhotoCakeCustomizerProps {
  onImageUpload: (file: File) => void;
  onTextChange: (text: string) => void;
  uploadedImage?: string;
  customText?: string;
  isPhotoCake?: boolean;
  onImagePositionChange?: (position: { x: number; y: number }) => void;
  imagePosition?: { x: number; y: number };
}

export default function PhotoCakeCustomizer({
  onImageUpload,
  onTextChange,
  uploadedImage,
  customText = '',
  isPhotoCake = false,
  onImagePositionChange,
  imagePosition = { x: 50, y: 50 }
}: PhotoCakeCustomizerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isPhotoCake) {
    return null;
  }

  // Show summary if both image and text are provided and customizer is hidden
  const isPersonalizationComplete = uploadedImage && customText.trim() && !showCustomizer;
  
  if (isPersonalizationComplete) {
    return (
      <PhotoCakeSummary
        uploadedImage={uploadedImage}
        customText={customText}
        shape="circle"
        onEditPersonalization={() => setShowCustomizer(true)}
      />
    );
  }

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
        onImageUpload(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        onImageUpload(file);
      }
    }
  };

  const removeImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Reset the uploaded image by calling with null
    onImageUpload(null as any);
  };

  return (
    <Card className="border-2 border-pink-200 bg-pink-50/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="h-5 w-5 text-pink-600" />
          Personalize Your Photo Cake
        </CardTitle>
        <p className="text-sm text-gray-600">
          Upload your favorite photo and add custom text to make it extra special!
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Photo Upload Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Upload Photo
          </Label>
          
          {uploadedImage ? (
            <PreviewPersonalisedImage
              uploadedImage={uploadedImage}
              shape="heart"
              onRemove={removeImage}
              onImagePositionChange={onImagePositionChange}
              imagePosition={imagePosition}
            />
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-pink-500 bg-pink-50' 
                  : 'border-gray-300 hover:border-pink-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your photo here
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Or click to browse (JPG, PNG, GIF up to 10MB)
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-pink-300 text-pink-600 hover:bg-pink-50"
              >
                <Upload className="h-4 w-4 mr-2" />
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
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>• High resolution photos (min 800x800px) work best</p>
            <p>• Avoid blurry or dark images for best results</p>
            <p>• Your photo will be printed with food-safe edible ink</p>
          </div>
        </div>

        {/* Custom Text Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Type className="h-4 w-4" />
            Custom Message on Cake
          </Label>
          <Textarea
            placeholder="Happy Anniversary! | Happy Birthday Sarah! | Congratulations!"
            value={customText}
            onChange={(e) => onTextChange(e.target.value)}
            className="min-h-20 resize-none border-pink-200 focus:border-pink-400"
            maxLength={100}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Add a personalized message to make it extra special</span>
            <span>{customText.length}/100</span>
          </div>
        </div>

        {/* Customization Tips */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">✨ Pro Tips for Best Results:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use bright, clear photos with good lighting</li>
            <li>• Photos with faces work best when they're centered</li>
            <li>• Keep text short and meaningful for better impact</li>
            <li>• Square photos fit better than rectangular ones</li>
          </ul>
        </div>

        {/* Pricing Info */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">📝 What's Included:</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• High-quality edible photo printing</li>
            <li>• Custom text in beautiful fonts</li>
            <li>• Same-day delivery available</li>
            <li>• 100% eggless and fresh</li>
          </ul>
        </div>

        {/* Done Button - Show when both image and text are provided */}
        {uploadedImage && customText.trim() && (
          <div className="pt-4 border-t">
            <Button 
              onClick={() => setShowCustomizer(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium"
            >
              ✓ Personalization Complete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}