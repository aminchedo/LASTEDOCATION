import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { logger } from '../middleware/logger';

export interface HFModel {
  id: string;
  modelId: string;
  author: string;
  sha: string;
  lastModified: string;
  private: boolean;
  downloads: number;
  tags: string[];
  pipeline_tag?: string;
  library_name?: string;
  siblings?: HFFile[];
}

export interface HFFile {
  rfilename: string;
  size: number;
  blob_id: string;
  lfs?: {
    oid: string;
    size: number;
    pointer_size: number;
  };
}

export interface HFWhoAmI {
  type: string;
  name: string;
  fullname: string;
  email?: string;
  emailVerified?: boolean;
  avatarUrl?: string;
  orgs?: Array<{ name: string }>;
}

export class HuggingFaceService {
  private baseUrl = 'https://huggingface.co';
  private apiUrl = 'https://huggingface.co/api';

  /**
   * Validate HuggingFace token
   */
  async validateToken(token: string): Promise<{ valid: boolean; username?: string; type?: string; data?: HFWhoAmI }> {
    try {
      const response = await fetch(`${this.apiUrl}/whoami`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json() as HFWhoAmI;
        return {
          valid: true,
          username: data.name,
          type: data.type,
          data
        };
      }

      return { valid: false };
    } catch (error: any) {
      logger.error({ msg: 'token_validation_failed', error: error.message });
      return { valid: false };
    }
  }

  /**
   * Search models on HuggingFace Hub
   */
  async searchModels(
    query: string,
    filter?: {
      task?: string;
      library?: string;
      language?: string;
      sort?: 'downloads' | 'likes' | 'trending';
    },
    token?: string
  ): Promise<HFModel[]> {
    try {
      let url = `${this.apiUrl}/models?search=${encodeURIComponent(query)}&limit=50`;
      
      if (filter?.task) {
        url += `&filter=pipeline_tag:${filter.task}`;
      }
      if (filter?.library) {
        url += `&filter=library:${filter.library}`;
      }
      if (filter?.language) {
        url += `&filter=language:${filter.language}`;
      }
      if (filter?.sort) {
        url += `&sort=${filter.sort}`;
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`HF API error: ${response.status} ${response.statusText}`);
      }

      const models = await response.json() as HFModel[];
      
      logger.info({
        msg: 'models_searched',
        query,
        count: models.length
      });

      return models;
    } catch (error: any) {
      logger.error({
        msg: 'model_search_failed',
        query,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(repoId: string, token?: string): Promise<HFModel | null> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${this.apiUrl}/models/${repoId}`,
        { headers }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get model info: ${response.status}`);
      }

      const model = await response.json() as HFModel;
      return model;
    } catch (error: any) {
      logger.error({
        msg: 'get_model_info_failed',
        repoId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get list of files in a model repository
   */
  async getModelFiles(repoId: string, token?: string): Promise<HFFile[]> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${this.apiUrl}/models/${repoId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get model files: ${response.status}`);
      }

      const model = await response.json() as HFModel;
      const files = model.siblings || [];
      
      // Filter for relevant model files
      const relevantFiles = files.filter((f: HFFile) => 
        f.rfilename.match(/\.(bin|safetensors|json|txt|md|onnx|pb|h5|pt|pth)$/)
      );

      logger.info({
        msg: 'model_files_retrieved',
        repoId,
        totalFiles: files.length,
        relevantFiles: relevantFiles.length
      });

      return relevantFiles;
    } catch (error: any) {
      logger.error({
        msg: 'get_model_files_failed',
        repoId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Download a single file from HuggingFace
   */
  async downloadFile(
    repoId: string,
    filename: string,
    destination: string,
    token?: string,
    onProgress?: (downloaded: number, total: number) => void
  ): Promise<void> {
    try {
      const url = `${this.baseUrl}/${repoId}/resolve/main/${filename}`;
      const headers: Record<string, string> = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      logger.info({
        msg: 'starting_file_download',
        repoId,
        filename,
        destination
      });

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const totalSize = parseInt(response.headers.get('content-length') || '0');
      let downloadedSize = 0;

      await fs.ensureDir(path.dirname(destination));
      const fileStream = createWriteStream(destination);

      if (response.body) {
        response.body.on('data', (chunk: Buffer) => {
          downloadedSize += chunk.length;
          if (onProgress && totalSize > 0) {
            onProgress(downloadedSize, totalSize);
          }
        });

        await pipeline(response.body, fileStream);
      }

      logger.info({
        msg: 'file_downloaded',
        filename,
        size: totalSize,
        sizeM: (totalSize / 1024 / 1024).toFixed(2)
      });
    } catch (error: any) {
      logger.error({
        msg: 'file_download_failed',
        filename,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Download entire model repository
   */
  async downloadModel(
    repoId: string,
    destDir: string,
    token?: string,
    onProgress?: (file: string, downloaded: number, total: number, fileIndex: number, totalFiles: number) => void
  ): Promise<void> {
    try {
      logger.info({
        msg: 'starting_model_download',
        repoId,
        destDir
      });
      
      // Get list of files
      const files = await this.getModelFiles(repoId, token);
      
      if (files.length === 0) {
        throw new Error('No files found in model repository');
      }

      logger.info({
        msg: 'files_to_download',
        count: files.length,
        files: files.map(f => ({ name: f.rfilename, size: f.size }))
      });

      // Download each file
      let fileIndex = 0;
      for (const file of files) {
        fileIndex++;
        const destPath = path.join(destDir, file.rfilename);
        
        logger.info({
          msg: 'downloading_file',
          file: file.rfilename,
          index: fileIndex,
          total: files.length
        });
        
        await this.downloadFile(
          repoId,
          file.rfilename,
          destPath,
          token,
          (downloaded, total) => {
            if (onProgress) {
              onProgress(file.rfilename, downloaded, total, fileIndex, files.length);
            }
          }
        );
      }

      logger.info({
        msg: 'model_download_completed',
        repoId,
        filesDownloaded: files.length
      });
    } catch (error: any) {
      logger.error({
        msg: 'model_download_failed',
        repoId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Search for Persian TTS models
   */
  async searchPersianTTS(token?: string): Promise<HFModel[]> {
    return this.searchModels('persian tts', {
      task: 'text-to-speech',
      sort: 'downloads'
    }, token);
  }

  /**
   * Search for Persian STT models
   */
  async searchPersianSTT(token?: string): Promise<HFModel[]> {
    return this.searchModels('persian speech', {
      task: 'automatic-speech-recognition',
      sort: 'downloads'
    }, token);
  }

  /**
   * Search for Persian LLM models
   */
  async searchPersianLLM(token?: string): Promise<HFModel[]> {
    return this.searchModels('persian llm', {
      task: 'text-generation',
      sort: 'downloads'
    }, token);
  }

  /**
   * Get dataset information
   */
  async getDatasetInfo(datasetId: string, token?: string): Promise<any> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${this.apiUrl}/datasets/${datasetId}`,
        { headers }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get dataset info: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      logger.error({
        msg: 'get_dataset_info_failed',
        datasetId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Search datasets
   */
  async searchDatasets(query: string, token?: string): Promise<any[]> {
    try {
      const url = `${this.apiUrl}/datasets?search=${encodeURIComponent(query)}&limit=50`;
      
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`HF API error: ${response.status}`);
      }

      const datasets = await response.json();
      return datasets;
    } catch (error: any) {
      logger.error({
        msg: 'dataset_search_failed',
        query,
        error: error.message
      });
      throw error;
    }
  }
}

// Export singleton instance
export const hfService = new HuggingFaceService();
