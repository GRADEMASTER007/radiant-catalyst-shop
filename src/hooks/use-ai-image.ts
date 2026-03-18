/**
 * AI Image Hook - Routes through z.ai
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

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
      const { data, error } = await supabase.functions.invoke('zai-image', {
        body: {
          type: 'generate_prompt',
          prompt: params.additionalNotes || 'Create a professional product photo',
          context: {
            productName: params.productName,
            category: params.category,
            style: params.style || 'African artisan, handcrafted aesthetic',
          },
        },
      });
      if (error) throw error;
      return data?.content || null;
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
      const { data, error } = await supabase.functions.invoke('zai-image', {
        body: {
          type: 'analyze',
          prompt: params.prompt || 'Analyze this product image in detail',
          imageUrl: params.imageUrl,
        },
      });
      if (error) throw error;
      return data?.content || null;
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
      const { data, error } = await supabase.functions.invoke('zai-image', {
        body: {
          type: 'describe',
          prompt: 'Create SEO-optimized alt text for this product image',
          imageUrl,
        },
      });
      if (error) throw error;
      return data?.content || null;
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
