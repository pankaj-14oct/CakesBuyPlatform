import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image, AlertCircle } from 'lucide-react';

interface HighQualityImageUploadProps {
  onImageUpload: (file: File) => void;
  className?: string;
  acceptedFormats?: string[];
  maxFileSize?: number; // in MB
}

export function HighQualityImageUpload({
  onImageUpload,
  className = "",
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff'],
  maxFileSize = 20
}: HighQualityImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Please upload a high-quality image format (JPEG, PNG, WebP, TIFF). Current file: ${file.type}`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `File size too large. Please upload an image smaller than ${maxFileSize}MB. Current size: ${fileSizeMB.toFixed(1)}MB`;
    }

    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    onImageUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-blue-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={false}
          className="hidden"
          accept={acceptedFormats.join(',')}
          onChange={handleChange}
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Image className="w-8 h-8 text-gray-400" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload High-Quality Image
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              For best print quality, upload high-resolution images (300 DPI or higher)
            </p>
            
            <div className="space-y-2 text-xs text-gray-500">
              <p>✓ Supported formats: JPEG, PNG, WebP, TIFF</p>
              <p>✓ Maximum file size: {maxFileSize}MB</p>
              <p>✓ Recommended: High resolution (300+ DPI) for print quality</p>
            </div>
          </div>
          
          <Button
            type="button"
            onClick={onButtonClick}
            className="inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Choose High-Quality Image
          </Button>
          
          <p className="text-xs text-gray-400">
            or drag and drop your image here
          </p>
        </div>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}