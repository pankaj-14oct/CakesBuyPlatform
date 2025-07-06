import { X } from 'lucide-react';

interface PreviewPersonalisedImageProps {
  uploadedImage: string;
  shape: 'circle' | 'heart' | 'square';
  onRemove: () => void;
}

export function PreviewPersonalisedImage({ 
  uploadedImage, 
  shape,
  onRemove 
}: PreviewPersonalisedImageProps) {
  const getShapeClasses = () => {
    switch (shape) {
      case 'circle':
        return 'rounded-full';
      case 'heart':
        return 'rounded-full';
      case 'square':
        return 'rounded-lg';
      default:
        return 'rounded-full';
    }
  };

  const getShapeStyle = () => {
    if (shape === 'heart') {
      return {
        clipPath: 'polygon(50% 100%, 20% 60%, 20% 40%, 30% 30%, 40% 30%, 50% 40%, 60% 30%, 70% 30%, 80% 40%, 80% 60%)'
      };
    }
    if (shape === 'circle') {
      return {
        clipPath: 'circle(50%)'
      };
    }
    return {};
  };

  return (
    <div className="border-2 border-red-200 rounded-xl p-4 bg-red-50 relative">
      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
      >
        <X className="w-4 h-4 text-gray-600" />
      </button>

      <div className="flex items-center gap-4">
        {/* Shape Preview */}
        <div className="relative">
          <div 
            className={`w-16 h-16 border-2 border-red-300 overflow-hidden bg-white ${getShapeClasses()}`}
            style={getShapeStyle()}
          >
            <img 
              src={uploadedImage} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Text */}
        <div className="flex-1">
          <h4 className="text-red-700 font-medium underline cursor-pointer hover:text-red-800">
            Preview Personalised Image
          </h4>
        </div>
      </div>
    </div>
  );
}