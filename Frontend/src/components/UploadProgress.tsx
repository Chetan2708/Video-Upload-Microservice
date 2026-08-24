interface UploadProgressProps {
    filename: string;
    progress: number;
}

export const UploadProgress = ({ filename, progress }: UploadProgressProps) => {
    return (
        <div className="upload-progress">
            <div className="upload-progress-header">
                <span className="upload-progress-filename">📎 {filename}</span>
                <span className="upload-progress-percent">{progress}%</span>
            </div>
            <div className="upload-progress-bar">
                <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
};
