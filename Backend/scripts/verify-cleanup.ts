import 'dotenv/config';
import mongoose from 'mongoose';
import { MongoVideoRepository } from '../src/infrastructure/repositories/MongoVideoRepository';
import { CleanupService } from '../src/core/services/CleanupService';
import { IStorageService } from '../src/core/interfaces/IStorageService';
import { config } from '../src/core/config/config';
import { v4 as uuidv4 } from 'uuid';

// Mock Storage Service
class MockStorageService implements IStorageService {
    async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
        console.log(`[MockS3] Aborting upload key=${key}, uploadId=${uploadId}`);
        return Promise.resolve();
    }
    // No-ops for others
    async initiateMultipartUpload() { return { uploadId: 'mock', key: 'mock' }; }
    async generatePresignedUrl() { return 'mock'; }
    async completeMultipartUpload() { }
    async generatePresignedDownloadUrl() { return 'mock'; }
}

async function runTest() {
    console.log("Connecting to Mongo...");
    await mongoose.connect(config.mongo.uri);

    const repo = new MongoVideoRepository();
    const mockS3 = new MockStorageService();
    const cleanupService = new CleanupService(repo, mockS3);

    const staleUserId = "test-user-stale";
    const staleVideoId = uuidv4();

    try {
        // 1. Create a stale video (25 hours ago)
        console.log("Creating stale video...");
        const staleDate = new Date();
        staleDate.setHours(staleDate.getHours() - 25);

        // We need to bypass mongoose timestamps to force 'createdAt'
        // Using direct collection insert if possible, or model create then update
        const video = await repo.create({
            videoId: staleVideoId,
            userId: staleUserId,
            status: 'INITIATED',
            fileName: 'stale.mp4',
            contentType: 'video/mp4',
            fileSize: 1000,
            uploadId: 'stale-upload-id',
            s3Key: 'stale-key'
        });

        // Force update createdAt
        await mongoose.connection.collection('videos').updateOne(
            { videoId: staleVideoId },
            { $set: { createdAt: staleDate } }
        );

        console.log(`Video ${staleVideoId} created with createdAt: ${staleDate.toISOString()}`);

        // 2. Run Cleanup
        console.log("Running Cleanup Service...");
        await cleanupService.cleanupStaleUploads();

        // 3. Verify
        const updatedVideo = await repo.findById(staleVideoId);
        if (updatedVideo?.status === 'FAILED' && updatedVideo.failureReason === 'EXPIRED') {
            console.log("✅ TEST PASSED: Video marked as FAILED.");
        } else {
            console.error("❌ TEST FAILED: Video status is", updatedVideo?.status);
            process.exit(1);
        }

    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        // Cleanup test data
        await mongoose.connection.collection('videos').deleteOne({ videoId: staleVideoId });
        await mongoose.disconnect();
    }
}

runTest();
