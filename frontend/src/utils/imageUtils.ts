/**
 * Utility functions for image processing in ReelCraft AI
 */

/**
 * Options for image resizing
 */
interface ResizeOptions {
  /** Target width (default: 1280) */
  targetWidth?: number;
  /** Target height (default: 720) */
  targetHeight?: number;
  /** Output format (default: 'jpeg') */
  format?: string;
}

/**
 * Resize an image to target dimensions while maintaining aspect ratio and adding padding
 * @param imageFile - The image file to resize
 * @param options - Resize options
 * @returns Promise with Base64 encoded image data
 */
export const resizeAndEncodeImage = async (
  imageFile: File,
  { targetWidth = 1280, targetHeight = 720, format = 'jpeg' }: ResizeOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create file reader to read the file
      const reader = new FileReader();
      
      reader.onload = (event: ProgressEvent<FileReader>) => {
        // Create an image element to load the file
        const img = new Image();
        
        img.onload = () => {
          // Create canvas with target dimensions
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Fill canvas with background color (matching Streamlit's dark theme)
          ctx.fillStyle = '#1e1e2e';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          
          // Calculate dimensions while maintaining aspect ratio
          let newWidth = img.width;
          let newHeight = img.height;
          
          if (img.width > targetWidth || img.height > targetHeight) {
            const ratio = Math.min(targetWidth / img.width, targetHeight / img.height);
            newWidth = img.width * ratio;
            newHeight = img.height * ratio;
          }
          
          // Calculate position to center the image
          const x = (targetWidth - newWidth) / 2;
          const y = (targetHeight - newHeight) / 2;
          
          // Draw the image on the canvas
          ctx.drawImage(img, x, y, newWidth, newHeight);
          
          // Convert canvas to base64
          const dataUrl = canvas.toDataURL(`image/${format}`, 0.92);
          const base64Data = dataUrl.split(',')[1];
          
          resolve(base64Data);
        };
        
        img.onerror = () => {
          reject(new Error('Error loading image'));
        };
        
        // Set the image source to the file reader result
        if (event.target?.result) {
          img.src = event.target.result as string;
        } else {
          reject(new Error('File reader did not produce a result'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      // Read the file as a data URL
      reader.readAsDataURL(imageFile);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Process an image file for API submission
 * @param imageFile - The image file to process
 * @returns Promise with Base64 encoded image data or null if no file provided
 */
export const processImageForSubmission = async (imageFile: File | null): Promise<string | null> => {
  if (!imageFile) return null;
  
  try {
    // Check if file is an image
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('File is not an image');
    }
    
    // Resize and encode the image
    const base64Data = await resizeAndEncodeImage(imageFile);
    return base64Data;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};
