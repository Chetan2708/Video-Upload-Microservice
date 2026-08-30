import {
    MediaConvertClient as AwsMediaConvertClient,
    CreateJobCommand,
    GetJobCommand,
    type CreateJobCommandInput,
    type OutputGroup,
} from '@aws-sdk/client-mediaconvert';
import { config } from '../../core/config/config';
import { ITranscodeService, TranscodeJobResult, TranscodeJobDetails, TranscodeJobStatus } from '../../core/interfaces/ITranscodeService';
import { logger } from '../../core/utils/logger';

/**
 * AWS MediaConvert implementation of ITranscodeService.
 *
 * Creates transcoding jobs that produce:
 *   - HLS adaptive bitrate (360p, 720p, 1080p)
 *   - Web-optimised MP4 (720p fallback)
 *
 * Output is written to:
 *   s3://<bucket>/processed-videos/<videoId>/hls/
 *   s3://<bucket>/processed-videos/<videoId>/mp4/
 */
export class MediaConvertService implements ITranscodeService {
    private client: AwsMediaConvertClient;
    private readonly roleArn: string;
    private readonly outputBucket: string;
    private readonly inputBucket: string;
    private readonly enabled: boolean;

    constructor() {
        const { endpoint, roleArn, outputBucket } = config.mediaConvert;

        this.enabled = !!(endpoint && roleArn) && config.features.transcodingEnabled;
        this.roleArn = roleArn;
        this.outputBucket = outputBucket;
        this.inputBucket = config.aws.bucketName;

        this.client = new AwsMediaConvertClient({
            region: config.aws.region,
            endpoint: endpoint || undefined,
            credentials: {
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey,
            },
        });
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    async submitJob(videoId: string, s3Key: string, contentType: string): Promise<TranscodeJobResult> {
        const outputPrefix = `processed-videos/${videoId}`;
        const inputFileUri = `s3://${this.inputBucket}/${s3Key}`;

        const outputGroups = this.buildOutputGroups(outputPrefix);

        const jobInput: CreateJobCommandInput = {
            Role: this.roleArn,
            Settings: {
                Inputs: [
                    {
                        FileInput: inputFileUri,
                        AudioSelectors: {
                            'Audio Selector 1': {
                                DefaultSelection: 'DEFAULT',
                            },
                        },
                        VideoSelector: {},
                    },
                ],
                OutputGroups: outputGroups,
            },
            // Tag the job with our internal videoId for traceability
            UserMetadata: {
                videoId,
            },
        };

        logger.info({ videoId, inputFileUri, outputPrefix }, 'Submitting MediaConvert job');

        const command = new CreateJobCommand(jobInput);
        const response = await this.client.send(command);

        const jobId = response.Job?.Id;
        if (!jobId) {
            throw new Error('MediaConvert CreateJob did not return a job ID');
        }

        logger.info({ videoId, jobId }, 'MediaConvert job submitted');
        return { jobId, outputPrefix };
    }

    async getJobStatus(jobId: string): Promise<TranscodeJobDetails> {
        const command = new GetJobCommand({ Id: jobId });
        const response = await this.client.send(command);

        const job = response.Job;
        if (!job) {
            throw new Error(`MediaConvert job ${jobId} not found`);
        }

        const status = this.mapJobStatus(job.Status as string);
        const percentComplete = job.JobPercentComplete ?? 0;

        // Collect output file paths on completion
        const outputFiles: string[] = [];
        if (status === 'COMPLETE' && job.Settings?.OutputGroups) {
            for (const og of job.Settings.OutputGroups) {
                const destination = og.OutputGroupSettings?.HlsGroupSettings?.Destination
                    ?? og.OutputGroupSettings?.FileGroupSettings?.Destination;
                if (destination) {
                    // Extract S3 key from the s3://bucket/key destination
                    const prefix = `s3://${this.outputBucket}/`;
                    const key = destination.startsWith(prefix)
                        ? destination.slice(prefix.length)
                        : destination;
                    outputFiles.push(key);
                }
            }
        }

        const errorMessage = status === 'ERROR'
            ? job.ErrorMessage ?? 'Unknown MediaConvert error'
            : undefined;

        return { status, percentComplete, outputFiles, errorMessage };
    }

    // ── Private helpers ──────────────────────────────────────────────

    /**
     * Build HLS + MP4 output groups.
     *
     * HLS: 3 renditions (1080p, 720p, 360p) with a master playlist.
     * MP4: Single 720p file for direct download / fallback playback.
     */
    private buildOutputGroups(outputPrefix: string): OutputGroup[] {
        const hlsDestination = `s3://${this.outputBucket}/${outputPrefix}/hls/`;
        const mp4Destination = `s3://${this.outputBucket}/${outputPrefix}/mp4/`;

        return [
            // ── HLS Adaptive Bitrate ──
            {
                Name: 'HLS',
                OutputGroupSettings: {
                    Type: 'HLS_GROUP_SETTINGS',
                    HlsGroupSettings: {
                        Destination: hlsDestination,
                        SegmentLength: 6,
                        MinSegmentLength: 0,
                    },
                },
                Outputs: [
                    this.hlsOutput('_1080p', 1920, 1080, 5_000_000),
                    this.hlsOutput('_720p', 1280, 720, 3_000_000),
                    this.hlsOutput('_360p', 640, 360, 1_000_000),
                ],
            },
            // ── MP4 Fallback ──
            {
                Name: 'MP4',
                OutputGroupSettings: {
                    Type: 'FILE_GROUP_SETTINGS',
                    FileGroupSettings: {
                        Destination: mp4Destination,
                    },
                },
                Outputs: [
                    {
                        NameModifier: '_720p',
                        ContainerSettings: {
                            Container: 'MP4',
                            Mp4Settings: {},
                        },
                        VideoDescription: {
                            Width: 1280,
                            Height: 720,
                            CodecSettings: {
                                Codec: 'H_264',
                                H264Settings: {
                                    RateControlMode: 'QVBR',
                                    MaxBitrate: 3_000_000,
                                    QvbrSettings: { QvbrQualityLevel: 7 },
                                    SceneChangeDetect: 'TRANSITION_DETECTION',
                                },
                            },
                        },
                        AudioDescriptions: [
                            {
                                AudioSourceName: 'Audio Selector 1',
                                CodecSettings: {
                                    Codec: 'AAC',
                                    AacSettings: {
                                        Bitrate: 128000,
                                        CodingMode: 'CODING_MODE_2_0',
                                        SampleRate: 48000,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        ];
    }

    /**
     * Create a single HLS output rendition.
     */
    private hlsOutput(nameModifier: string, width: number, height: number, maxBitrate: number) {
        return {
            NameModifier: nameModifier,
            ContainerSettings: {
                Container: 'M3U8' as const,
                M3u8Settings: {},
            },
            VideoDescription: {
                Width: width,
                Height: height,
                CodecSettings: {
                    Codec: 'H_264' as const,
                    H264Settings: {
                        RateControlMode: 'QVBR' as const,
                        MaxBitrate: maxBitrate,
                        QvbrSettings: { QvbrQualityLevel: 7 },
                        SceneChangeDetect: 'TRANSITION_DETECTION' as const,
                    },
                },
            },
            AudioDescriptions: [
                {
                    AudioSourceName: 'Audio Selector 1',
                    CodecSettings: {
                        Codec: 'AAC' as const,
                        AacSettings: {
                            Bitrate: 96000,
                            CodingMode: 'CODING_MODE_2_0' as const,
                            SampleRate: 48000,
                        },
                    },
                },
            ],
        };
    }

    /**
     * Map MediaConvert's status string to our internal enum.
     */
    private mapJobStatus(awsStatus: string): TranscodeJobStatus {
        switch (awsStatus) {
            case 'SUBMITTED': return 'SUBMITTED';
            case 'PROGRESSING': return 'PROGRESSING';
            case 'COMPLETE': return 'COMPLETE';
            case 'ERROR': return 'ERROR';
            case 'CANCELED': return 'CANCELED';
            default: return 'SUBMITTED';
        }
    }
}
