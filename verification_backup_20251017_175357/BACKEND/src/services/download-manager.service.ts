import { EventEmitter } from 'events';
import path from 'path';
import { getDatabase, query } from '../database/connection';
import { hfService } from './huggingface.service';
import { logger } from '../middleware/logger';

export interface DownloadJob {
  id: string;
  modelId: string;
  userId: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  bytesDownloaded: number;
  bytesTotal: number;
  currentFile: string;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export class DownloadManager extends EventEmitter {
  private activeDownloads = new Map<string, boolean>();
  private maxConcurrent = 3;

  /**
   * Start a new download job
   */
  async startDownload(
    modelId: string,
    repoId: string,
    userId: string,
    token?: string
  ): Promise<string> {
    try {
      // Check if model exists in database
      let dbModel = await query(
        'SELECT id FROM models WHERE repo_id = $1',
        [repoId]
      );

      let dbModelId: string;

      if (dbModel.rows.length === 0) {
        // Get model info from HuggingFace
        const modelInfo = await hfService.getModelInfo(repoId, token);
        
        if (!modelInfo) {
          throw new Error(`Model not found on HuggingFace: ${repoId}`);
        }

        // Insert model into database
        const insertResult = await query(
          `INSERT INTO models (name, type, repo_id, status, metadata)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            modelInfo.id,
            this.inferModelType(modelInfo),
            repoId,
            'downloading',
            JSON.stringify({
              author: modelInfo.author,
              downloads: modelInfo.downloads,
              tags: modelInfo.tags,
              pipeline_tag: modelInfo.pipeline_tag
            })
          ]
        );

        dbModelId = insertResult.rows[0].id;
      } else {
        dbModelId = dbModel.rows[0].id;
        
        // Update status to downloading
        await query(
          'UPDATE models SET status = $1 WHERE id = $2',
          ['downloading', dbModelId]
        );
      }

      // Create download job
      const downloadResult = await query(
        `INSERT INTO download_queue (model_id, user_id, status, created_at)
         VALUES ($1, $2, 'pending', NOW())
         RETURNING id`,
        [dbModelId, userId]
      );

      const downloadId = downloadResult.rows[0].id;

      logger.info({
        msg: 'download_job_created',
        downloadId,
        modelId: dbModelId,
        repoId
      });

      // Start download in background
      this.processDownload(downloadId, repoId, dbModelId, token).catch(error => {
        logger.error({
          msg: 'download_processing_error',
          downloadId,
          error: error.message
        });
      });

      return downloadId;
    } catch (error: any) {
      logger.error({
        msg: 'start_download_failed',
        modelId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process download in background
   */
  private async processDownload(
    downloadId: string,
    repoId: string,
    modelId: string,
    token?: string
  ): Promise<void> {
    try {
      // Mark as downloading
      this.activeDownloads.set(downloadId, true);

      await query(
        `UPDATE download_queue 
         SET status = 'downloading', started_at = NOW()
         WHERE id = $1`,
        [downloadId]
      );

      // Prepare destination directory
      const destDir = path.join(
        process.cwd(),
        'models',
        repoId.replace('/', '_')
      );

      logger.info({
        msg: 'download_started',
        downloadId,
        repoId,
        destDir
      });

      let totalBytesDownloaded = 0;
      let totalBytesTotal = 0;
      let currentFileIndex = 0;
      let totalFiles = 0;

      // Download model using HuggingFace service
      await hfService.downloadModel(
        repoId,
        destDir,
        token,
        async (file, downloaded, total, fileIndex, fileCount) => {
          currentFileIndex = fileIndex;
          totalFiles = fileCount;
          totalBytesDownloaded = downloaded;
          totalBytesTotal = total;

          // Calculate overall progress
          const fileProgress = fileIndex / fileCount;
          const bytesProgress = totalBytesTotal > 0 
            ? downloaded / totalBytesTotal 
            : 0;
          const overallProgress = Math.floor(
            ((fileProgress * 0.5) + (bytesProgress * 0.5)) * 100
          );

          // Update progress in database
          await query(
            `UPDATE download_queue 
             SET progress = $1, 
                 bytes_downloaded = $2, 
                 bytes_total = $3, 
                 current_file = $4
             WHERE id = $5`,
            [overallProgress, downloaded, total, file, downloadId]
          );

          // Emit progress event
          this.emit('progress', {
            downloadId,
            progress: overallProgress,
            bytesDownloaded: downloaded,
            bytesTotal: total,
            currentFile: file,
            fileIndex,
            totalFiles: fileCount
          });

          logger.debug({
            msg: 'download_progress',
            downloadId,
            file,
            progress: overallProgress,
            fileIndex,
            totalFiles: fileCount
          });
        }
      );

      // Mark as completed
      await query(
        `UPDATE download_queue 
         SET status = 'completed', 
             progress = 100, 
             completed_at = NOW()
         WHERE id = $1`,
        [downloadId]
      );

      // Update model status
      const fileSizeMB = Math.round(totalBytesTotal / (1024 * 1024));
      await query(
        `UPDATE models 
         SET status = 'installed', 
             file_path = $1,
             size_mb = $2,
             download_progress = 100
         WHERE id = $3`,
        [destDir, fileSizeMB, modelId]
      );

      this.activeDownloads.delete(downloadId);

      this.emit('completed', {
        downloadId,
        modelId,
        repoId
      });

      logger.info({
        msg: 'download_completed',
        downloadId,
        repoId,
        filesDownloaded: totalFiles,
        totalSize: fileSizeMB
      });

    } catch (error: any) {
      // Mark as failed
      await query(
        `UPDATE download_queue 
         SET status = 'failed', 
             error_message = $1, 
             completed_at = NOW()
         WHERE id = $2`,
        [error.message, downloadId]
      );

      await query(
        `UPDATE models 
         SET status = 'available'
         WHERE id = $1`,
        [modelId]
      );

      this.activeDownloads.delete(downloadId);

      this.emit('failed', {
        downloadId,
        error: error.message
      });

      logger.error({
        msg: 'download_failed',
        downloadId,
        error: error.message
      });
    }
  }

  /**
   * Get download status
   */
  async getDownloadStatus(downloadId: string): Promise<DownloadJob | null> {
    try {
      const result = await query(
        `SELECT 
          dq.id,
          m.repo_id as "modelId",
          dq.user_id as "userId",
          dq.status,
          dq.progress,
          dq.bytes_downloaded as "bytesDownloaded",
          dq.bytes_total as "bytesTotal",
          dq.current_file as "currentFile",
          dq.error_message as "errorMessage",
          dq.started_at as "startedAt",
          dq.completed_at as "completedAt",
          dq.created_at as "createdAt"
         FROM download_queue dq
         JOIN models m ON dq.model_id = m.id
         WHERE dq.id = $1`,
        [downloadId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as DownloadJob;
    } catch (error: any) {
      logger.error({
        msg: 'get_download_status_failed',
        downloadId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get all downloads for a user
   */
  async getUserDownloads(userId: string): Promise<DownloadJob[]> {
    try {
      const result = await query(
        `SELECT 
          dq.id,
          m.repo_id as "modelId",
          m.name as "modelName",
          dq.user_id as "userId",
          dq.status,
          dq.progress,
          dq.bytes_downloaded as "bytesDownloaded",
          dq.bytes_total as "bytesTotal",
          dq.current_file as "currentFile",
          dq.error_message as "errorMessage",
          dq.started_at as "startedAt",
          dq.completed_at as "completedAt",
          dq.created_at as "createdAt"
         FROM download_queue dq
         JOIN models m ON dq.model_id = m.id
         WHERE dq.user_id = $1
         ORDER BY dq.created_at DESC`,
        [userId]
      );

      return result.rows as DownloadJob[];
    } catch (error: any) {
      logger.error({
        msg: 'get_user_downloads_failed',
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get all active downloads
   */
  async getActiveDownloads(): Promise<DownloadJob[]> {
    try {
      const result = await query(
        `SELECT 
          dq.id,
          m.repo_id as "modelId",
          m.name as "modelName",
          dq.user_id as "userId",
          dq.status,
          dq.progress,
          dq.bytes_downloaded as "bytesDownloaded",
          dq.bytes_total as "bytesTotal",
          dq.current_file as "currentFile",
          dq.started_at as "startedAt",
          dq.created_at as "createdAt"
         FROM download_queue dq
         JOIN models m ON dq.model_id = m.id
         WHERE dq.status IN ('pending', 'downloading')
         ORDER BY dq.created_at ASC`
      );

      return result.rows as DownloadJob[];
    } catch (error: any) {
      logger.error({
        msg: 'get_active_downloads_failed',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cancel a download
   */
  async cancelDownload(downloadId: string): Promise<boolean> {
    try {
      const result = await query(
        `UPDATE download_queue 
         SET status = 'failed', 
             error_message = 'Cancelled by user', 
             completed_at = NOW()
         WHERE id = $1 AND status IN ('pending', 'downloading')
         RETURNING id`,
        [downloadId]
      );

      if (result.rowCount && result.rowCount > 0) {
        this.activeDownloads.delete(downloadId);
        
        this.emit('cancelled', { downloadId });
        
        logger.info({
          msg: 'download_cancelled',
          downloadId
        });

        return true;
      }

      return false;
    } catch (error: any) {
      logger.error({
        msg: 'cancel_download_failed',
        downloadId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Infer model type from HuggingFace metadata
   */
  private inferModelType(modelInfo: any): string {
    const pipelineTag = modelInfo.pipeline_tag?.toLowerCase() || '';
    
    if (pipelineTag.includes('text-to-speech') || pipelineTag.includes('tts')) {
      return 'tts';
    }
    if (pipelineTag.includes('automatic-speech-recognition') || pipelineTag.includes('asr')) {
      return 'stt';
    }
    if (pipelineTag.includes('text-generation') || pipelineTag.includes('llm')) {
      return 'llm';
    }
    if (pipelineTag.includes('feature-extraction') || pipelineTag.includes('embedding')) {
      return 'embedding';
    }
    if (pipelineTag.includes('text-classification') || pipelineTag.includes('classification')) {
      return 'classification';
    }

    return 'llm'; // default
  }
}

// Export singleton instance
export const downloadManager = new DownloadManager();
