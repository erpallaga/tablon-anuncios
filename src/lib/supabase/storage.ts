import { supabase } from './client';

const BUCKET_NAME = 'pdfs';

export const storageService = {
  /**
   * Upload a PDF file to Supabase storage
   * @param file The PDF file to upload
   * @param fileName Optional custom file name. If not provided, uses the file's name
   * @returns The public URL of the uploaded file
   */
  async uploadPDF(file: File, fileName?: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const filePath = fileName || `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return publicUrl;
  },

  /**
   * Delete a PDF file from Supabase storage
   * @param filePath The path of the file to delete
   */
  async deletePDF(filePath: string): Promise<void> {
    // Extract the path from a full URL if needed
    const path = filePath.includes('/storage/v1/object/public/') 
      ? filePath.split('/storage/v1/object/public/')[1].replace(`${BUCKET_NAME}/`, '')
      : filePath.replace(`${BUCKET_NAME}/`, '');

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) throw error;
  },

  /**
   * Get public URL for a file
   * @param filePath The path of the file
   * @returns The public URL
   */
  getPublicUrl(filePath: string): string {
    // If it's already a full URL, return it
    if (filePath.startsWith('http')) return filePath;

    // Otherwise, get the public URL from Supabase
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};

