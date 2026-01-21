import { useState } from 'react';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface GeneratePromptParams {
  productName: string;
  category?: string;
  style?: string;
  additionalNotes?: string;
}

interface AnalyzeImageParams {
  imageUrl: string;
  prompt?: string;
}

export function useAIImage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateImagePrompt = async (params: GeneratePromptParams): Promise<string | null> => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-image-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          type: 'generate_prompt',
          prompt: params.additionalNotes || 'Create a professional product photo',
          context: {
            productName: params.productName,
            category: params.category,
            style: params.style || 'African artisan, handcrafted aesthetic',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate prompt');
      }

      const data = await response.json();
      return data.content;
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate image prompt');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeImage = async (params: AnalyzeImageParams): Promise<string | null> => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-image-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          type: 'analyze',
          prompt: params.prompt || 'Analyze this product image in detail',
          imageUrl: params.imageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze image');
      }

      const data = await response.json();
      return data.content;
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze image');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAltText = async (imageUrl: string): Promise<string | null> => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-image-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          type: 'describe',
          prompt: 'Create SEO-optimized alt text for this product image',
          imageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate alt text');
      }

      const data = await response.json();
      return data.content;
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate alt text');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    generateImagePrompt,
    analyzeImage,
    generateAltText,
    isGenerating,
    isAnalyzing,
  };
}
