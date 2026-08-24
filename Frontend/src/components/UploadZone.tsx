import { ACCEPTED_VIDEO_TYPES, SUPPORTED_FORMATS_LABEL } from '../utils/format';
import { RefObject, ChangeEvent, DragEvent } from 'react';

interface UploadZoneProps {
    dragging: boolean;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onSelectFile: (e: ChangeEvent<HTMLInputElement>) => void;
    onDrop: (e: DragEvent) => void;
    onDragOver: (e: DragEvent) => void;
    onDragLeave: () => void;
    onClick: () => void;
}

export const UploadZone = ({
    dragging,
    fileInputRef,
    onSelectFile,
    onDrop,
    onDragOver,
    onDragLeave,
    onClick
}: UploadZoneProps) => {
    return (
        <div
            id="upload-zone"
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onClick={onClick}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            style={{ marginBottom: 24 }}
        >
            <div className="upload-zone-icon">☁️</div>
            <div className="upload-zone-text">
                {dragging ? 'Drop your video here' : 'Click or drag a video file to upload'}
            </div>
            <div className="upload-zone-hint">{SUPPORTED_FORMATS_LABEL}</div>
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_VIDEO_TYPES}
                style={{ display: 'none' }}
                onChange={onSelectFile}
            />
        </div>
    );
};
