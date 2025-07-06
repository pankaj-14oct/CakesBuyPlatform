import { Button } from '@/components/ui/button';
import { Camera, CheckCircle } from 'lucide-react';

interface PhotoCakeSummaryProps {
  uploadedImage: string;
  customText: string;
  shape: 'circle' | 'heart' | 'square';
  onEditPersonalization: () => void;
}

export function PhotoCakeSummary({ 
  uploadedImage, 
  customText, 
  shape,
  onEditPersonalization 
}: PhotoCakeSummaryProps) {
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
    <div className="border-2 border-red-200 rounded-xl p-6 bg-red-50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
          <Camera className="w-4 h-4 text-orange-600" />
        </div>
        <h3 className="text-xl font-bold text-red-700">
          Personalize Your Photo Cake
        </h3>
      </div>

      {/* Status Line */}
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <span className="text-green-700 font-medium">
          Photo uploaded • Custom text: "{customText}"
        </span>
      </div>

      {/* Content Area */}
      <div className="flex items-center justify-between">
        {/* Left Side - Preview */}
        <div className="flex items-center gap-4">
          {/* Small Preview Image */}
          <div className="relative">
            <div 
              className={`w-20 h-20 border-2 border-red-300 overflow-hidden bg-white ${getShapeClasses()}`}
              style={getShapeStyle()}
            >
              <img 
                src={uploadedImage} 
                alt="Cake preview" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Text overlay on preview */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded text-xs font-medium text-gray-700 border shadow-sm">
              {customText}
            </div>
          </div>

          {/* Status Text */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-red-700">Personalization Complete</span>
            </div>
            <p className="text-red-600 text-sm">
              Photo positioned & text: "{customText}"
            </p>
          </div>
        </div>

        {/* Right Side - Edit Button */}
        <Button 
          onClick={onEditPersonalization}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          Edit Personalization
        </Button>
      </div>
    </div>
  );
}