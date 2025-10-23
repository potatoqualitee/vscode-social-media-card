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
