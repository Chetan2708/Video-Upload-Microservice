/**
 * Represents the result of submitting a transcode job.
 */
export interface TranscodeJobResult {
    jobId: string;
    outputPrefix: string;
}

/**
 * Possible states for a transcode job, mapped from MediaConvert's job statuses.
 */
export type TranscodeJobStatus = 'SUBMITTED' | 'PROGRESSING' | 'COMPLETE' | 'ERROR' | 'CANCELED';

/**
 * Detailed status of a transcode job, including output file paths on completion.
 */
export interface TranscodeJobDetails {
    status: TranscodeJobStatus;
    /** Percentage progress (0-100). Only meaningful while PROGRESSING. */
    percentComplete: number;
    /** S3 keys of output files. Populated only when status is COMPLETE. */
    outputFiles: string[];
    /** Human-readable error message when status is ERROR. */
    errorMessage?: string;
}

/**
 * Abstraction over the video transcoding provider (e.g. AWS MediaConvert).
 *
 * Core services depend on this interface, not on the AWS SDK directly.
 * This makes the transcoding layer replaceable for testing or alternative providers.
 */
export interface ITranscodeService {
    /**
     * Whether transcoding is configured and available.
     * When false, upload flows should skip the PROCESSING stage entirely.
     */
    isEnabled(): boolean;

    /**
     * Submit a new transcoding job for a raw video in S3.
     *
     * @param videoId   - Internal video identifier (used for output path namespacing)
     * @param s3Key     - S3 key of the raw uploaded video
     * @param contentType - MIME type of the source file
     * @returns Job ID and the output prefix where processed files will be written
     */
    submitJob(videoId: string, s3Key: string, contentType: string): Promise<TranscodeJobResult>;

    /**
     * Query the current status of a previously submitted transcoding job.
     *
     * @param jobId - The job ID returned by submitJob()
     */
    getJobStatus(jobId: string): Promise<TranscodeJobDetails>;
}
