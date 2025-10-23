import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export class ScreenshotService {
    async saveScreenshot(
        base64Data: string,
        dimensions: { width: number; height: number }
    ): Promise<string> {
        try {
            // Generate filename
            const workspace = vscode.workspace.workspaceFolders?.[0];
            if (!workspace) {
                throw new Error('No workspace folder open. Please open a folder first.');
            }

            const outputDir = path.join(workspace.uri.fsPath, 'social-cards');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const timestamp = Date.now();
            const filename = `card-${dimensions.width}x${dimensions.height}-${timestamp}.png`;
            const filepath = path.join(outputDir, filename);

            // Remove data URL prefix if present (e.g., "data:image/png;base64,")
            const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');

            // Convert base64 to buffer and save
            const imageBuffer = Buffer.from(base64Image, 'base64');
            fs.writeFileSync(filepath, imageBuffer);

            vscode.window.showInformationMessage(
                `Screenshot saved to: social-cards/${filename}`
            );

            return filepath;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Screenshot failed: ${errorMessage}`);
            throw error;
        }
    }

    async exportPng(
        base64Data: string,
        dimensions: { width: number; height: number },
        suggestedFilename?: string,
        designIndex?: number
    ): Promise<{ success: boolean; message: string; filePath?: string }> {
        try {
            // Get export save mode from settings
            const config = vscode.workspace.getConfiguration('socialCardGenerator');
            const saveMode = config.get<string>('exportSaveMode', 'prompt');
            const absolutePath = config.get<string>('exportAbsolutePath', '');

            // Generate default filename
            const timestamp = Date.now();
            const baseFilename = suggestedFilename
                ? `${suggestedFilename}-${dimensions.width}x${dimensions.height}`
                : `card-${dimensions.width}x${dimensions.height}-${timestamp}`;
            const filename = `${baseFilename}.png`;

            // Remove data URL prefix if present
            const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Image, 'base64');

            let filepath: string;

            if (saveMode === 'prompt') {
                // Show save dialog
                const workspace = vscode.workspace.workspaceFolders?.[0];
                const defaultUri = workspace
                    ? vscode.Uri.file(path.join(workspace.uri.fsPath, 'social-cards', filename))
                    : vscode.Uri.file(filename);

                const uri = await vscode.window.showSaveDialog({
                    defaultUri: defaultUri,
                    filters: {
                        'PNG Images': ['png'],
                        'All Files': ['*']
                    }
                });

                if (!uri) {
                    // User cancelled
                    return { success: false, message: 'Export cancelled' };
                }

                filepath = uri.fsPath;
            } else if (saveMode === 'relative') {
                // Save to workspace/social-cards folder
                const workspace = vscode.workspace.workspaceFolders?.[0];
                if (!workspace) {
                    throw new Error('No workspace folder open. Please open a folder first.');
                }

                const outputDir = path.join(workspace.uri.fsPath, 'social-cards');
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                filepath = path.join(outputDir, filename);
            } else if (saveMode === 'absolute') {
                // Save to absolute path
                if (!absolutePath) {
                    throw new Error('Absolute export path not configured. Please set socialCardGenerator.exportAbsolutePath in settings.');
                }

                if (!fs.existsSync(absolutePath)) {
                    fs.mkdirSync(absolutePath, { recursive: true });
                }

                filepath = path.join(absolutePath, filename);
            } else {
                throw new Error(`Unknown export save mode: ${saveMode}`);
            }

            // Write the file
            fs.writeFileSync(filepath, imageBuffer);

            const successMessage = saveMode === 'prompt'
                ? `Image saved to: ${filepath}`
                : `Image saved to: ${path.basename(filepath)}`;

            return { success: true, message: successMessage, filePath: filepath };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { success: false, message: `Export failed: ${errorMessage}` };
        }
    }

    async saveToTemp(base64Data: string, dimensions?: { width: number; height: number }): Promise<string> {
        try {
            // Create temp directory for social cards
            const tempDir = path.join(os.tmpdir(), 'vscode-social-cards');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const timestamp = Date.now();
            const dimensionStr = dimensions ? `${dimensions.width}x${dimensions.height}-` : '';
            const filename = `card-preview-${dimensionStr}${timestamp}.png`;
            const filepath = path.join(tempDir, filename);

            // Remove data URL prefix if present
            const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');

            // Convert base64 to buffer and save
            const imageBuffer = Buffer.from(base64Image, 'base64');
            fs.writeFileSync(filepath, imageBuffer);

            return filepath;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to save to temp: ${errorMessage}`);
        }
    }
}
