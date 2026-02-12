import { File, Directory, Paths } from 'expo-file-system';

/**
 * FileSafeService
 * Provides a reliable bridge between expo-audio (which saves to a restricted cache)
 * and expo-av/other modules (which need public directory access).
 * 
 * Uses the modern Expo SDK 54 "File" and "Directory" classes for maximum performance.
 */
class FileSafeService {
    private readonly SAVED_RECORDINGS_DIR_NAME = 'saved_recordings';
    private savedRecordingsDir: Directory;

    constructor() {
        // Correct way to get document directory and subfolder
        this.savedRecordingsDir = new Directory(Paths.document, this.SAVED_RECORDINGS_DIR_NAME);
        this.ensureDirExists();
    }

    /**
     * Ensure the saved_recordings directory exists
     */
    private async ensureDirExists() {
        try {
            if (!this.savedRecordingsDir.exists) {
                console.log('[FileSafe] Creating recordings directory:', this.savedRecordingsDir.uri);
                this.savedRecordingsDir.create();
            }
        } catch (error) {
            console.error('[FileSafe] Failed to ensure directory exists:', error);
        }
    }

    /**
     * Move a file from the expo-audio internal cache to the public documents directory.
     * This is necessary because expo-av cannot access expo-audio's cache on iOS.
     * 
     * @param sourceUri - The file:// URI from expo-audio
     * @param preferredName - Optional preferred filename
     * @returns The new public file:// URI
     */
    async makeFileAccessible(sourceUri: string, preferredName?: string): Promise<string> {
        try {
            await this.ensureDirExists();

            if (!sourceUri) {
                throw new Error('No source URI provided');
            }

            const sourceFile = new File(sourceUri);

            // Generate a clean filename
            const timestamp = Date.now();
            // Nitro's extension property includes the dot (e.g., ".caf")
            const rawExt = sourceFile.extension || '.caf';
            const extension = rawExt.startsWith('.') ? rawExt.substring(1) : rawExt;

            const fileName = preferredName
                ? `${preferredName}_${timestamp}.${extension}`
                : `recording_${timestamp}.${extension}`;

            // Correct way to create a destination file reference
            const destinationFile = new File(this.savedRecordingsDir, fileName);
            const destinationUri = destinationFile.uri;

            console.log('[FileSafe] Moving file:', {
                from: sourceUri.substring(0, 60) + '...',
                to: destinationUri.substring(0, 60) + '...'
            });

            // CRITICAL: expo-audio might still be writing the file.
            // We retry a few times if the source doesn't exist yet.
            let retries = 5;
            while (retries > 0) {
                if (sourceFile.exists) {
                    break;
                }
                console.log(`[FileSafe] Source file not ready, retrying... (${retries} left)`);
                await new Promise(resolve => setTimeout(resolve, 500));
                retries--;
            }

            if (!sourceFile.exists) {
                throw new Error(`Source file does not exist after retries: ${sourceUri}`);
            }

            // Use copy to destinationFile
            sourceFile.copy(destinationFile);

            // Verify the copy
            if (!destinationFile.exists) {
                throw new Error('Copy failed - destination file does not exist');
            }

            console.log('[FileSafe] File moved successfully. Size:', destinationFile.size);

            // Clean up the source if possible
            try {
                sourceFile.delete();
            } catch (e) {
                console.warn('[FileSafe] Could not delete source file, ignoring...');
            }

            return destinationUri;
        } catch (error) {
            console.error('[FileSafe] Failed to move file:', error);
            // Fallback: return the original URI if move fails
            return sourceUri;
        }
    }

    /**
     * Clean up all saved recordings (e.g., on logout or app reset)
     */
    async clearAllRecordings() {
        try {
            if (this.savedRecordingsDir.exists) {
                this.savedRecordingsDir.delete();
                this.ensureDirExists();
            }
        } catch (error) {
            console.error('[FileSafe] Failed to clear recordings:', error);
        }
    }
}

export const fileSafeService = new FileSafeService();
export default fileSafeService;
