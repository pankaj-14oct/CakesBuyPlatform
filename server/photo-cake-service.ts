import fs from 'fs';
import path from 'path';

export interface PhotoCakeCustomization {
  uploadedImage?: string;
  customText?: string;
  imagePosition?: { x: number; y: number };
  textPosition?: { x: number; y: number };
  imageSize?: number;
  backgroundImage?: string;
}

/**
 * Generate a composite image for photo cake orders
 * This creates a simple HTML/CSS representation that can be captured as an image
 */
export function generateCompositeImageData(customization: PhotoCakeCustomization): string {
  const {
    uploadedImage,
    customText,
    imagePosition = { x: 50, y: 40 },
    textPosition = { x: 50, y: 70 },
    imageSize = 32,
    backgroundImage
  } = customization;

  // Create HTML representation of the composite image
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        .cake-container {
          position: relative;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          overflow: hidden;
          background: #f4e4c1;
        }
        .background-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        .uploaded-image {
          position: absolute;
          border-radius: 8px;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          object-fit: cover;
          transform: translate(-50%, -50%);
        }
        .custom-text {
          position: absolute;
          background: rgba(255,255,255,0.9);
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: bold;
          color: #5d4037;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transform: translate(-50%, -50%);
          white-space: nowrap;
        }
      </style>
    </head>
    <body>
      <div class="cake-container">
        ${backgroundImage ? `<img src="${backgroundImage}" alt="Cake background" class="background-image" />` : ''}
        ${uploadedImage ? `
          <img 
            src="${uploadedImage}" 
            alt="Custom photo" 
            class="uploaded-image"
            style="
              left: ${imagePosition.x}%;
              top: ${imagePosition.y}%;
              width: ${imageSize}%;
              height: ${imageSize}%;
            "
          />
        ` : ''}
        ${customText ? `
          <div 
            class="custom-text"
            style="
              left: ${textPosition.x}%;
              top: ${textPosition.y}%;
            "
          >
            ${customText}
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Save composite image data to a file and return the path
 */
export async function saveCompositeImage(
  customization: PhotoCakeCustomization,
  orderNumber: string,
  itemIndex: number
): Promise<string> {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `composite-${orderNumber}-${itemIndex}-${Date.now()}.html`;
    const filepath = path.join(uploadsDir, filename);
    
    const htmlContent = generateCompositeImageData(customization);
    fs.writeFileSync(filepath, htmlContent);
    
    // Return the URL path that can be served by express static
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Failed to save composite image:', error);
    throw new Error('Failed to generate composite image');
  }
}

/**
 * Process photo cake items in an order and generate composite images
 */
export async function processPhotoCakeItems(
  items: Array<{
    cakeId: number;
    name: string;
    quantity: number;
    weight: string;
    flavor: string;
    customMessage?: string;
    customImage?: string;
    photoCustomization?: PhotoCakeCustomization;
    price: number;
    addons?: Array<{ id: number; name: string; price: number; quantity: number }>;
  }>,
  orderNumber: string
): Promise<typeof items> {
  const processedItems = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (item.photoCustomization && (item.photoCustomization.uploadedImage || item.photoCustomization.customText)) {
      try {
        // Generate composite image
        const compositeImageUrl = await saveCompositeImage(
          item.photoCustomization,
          orderNumber,
          i
        );
        
        // Update the item with the composite image URL
        processedItems.push({
          ...item,
          photoCustomization: {
            ...item.photoCustomization,
            compositeImage: compositeImageUrl
          }
        });
      } catch (error) {
        console.error(`Failed to process photo cake for item ${i}:`, error);
        // Keep the item without composite image if generation fails
        processedItems.push(item);
      }
    } else {
      processedItems.push(item);
    }
  }

  return processedItems;
}