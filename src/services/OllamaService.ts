import { spawn } from 'child_process';
import * as vscode from 'vscode';

export interface OllamaModel {
    name: string;
    size: string;
    modified_at: string;
}

export interface OllamaRunningModel {
    name: string;
    model: string;
    size: number;
}

export class OllamaService {
    /**
     * Get list of available Ollama models
     */
    public static async getAvailableModels(): Promise<OllamaModel[]> {
        return new Promise((resolve, reject) => {
            const process = spawn('ollama', ['list'], {
                shell: true
            });

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Failed to get Ollama models: ${stderr}`));
                    return;
                }

                // Parse the output
                const models: OllamaModel[] = [];
                const lines = stdout.split('\n').slice(1); // Skip header

                for (const line of lines) {
                    if (!line.trim()) continue;

                    // Parse line format: "NAME                    ID              SIZE      MODIFIED"
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 3) {
                        models.push({
                            name: parts[0],
                            size: parts[2] || 'unknown',
                            modified_at: parts.slice(3).join(' ') || 'unknown'
                        });
                    }
                }

                resolve(models);
            });

            process.on('error', (error) => {
                reject(new Error(`Failed to execute 'ollama list': ${error.message}. Make sure Ollama is installed.`));
            });

            // Timeout after 5 seconds
            setTimeout(() => {
                process.kill();
                reject(new Error('Timeout waiting for Ollama models list'));
            }, 5000);
        });
    }

    /**
     * Get currently running/loaded Ollama model
     */
    public static async getRunningModel(): Promise<string | null> {
        return new Promise((resolve) => {
            const process = spawn('ollama', ['ps'], {
                shell: true
            });

            let stdout = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    resolve(null);
                    return;
                }

                // Parse the output to find running model
                const lines = stdout.split('\n').slice(1); // Skip header
                for (const line of lines) {
                    if (!line.trim()) continue;

                    // First column is the model name
                    const parts = line.trim().split(/\s+/);
                    if (parts.length > 0) {
                        resolve(parts[0]);
                        return;
                    }
                }

                resolve(null);
            });

            process.on('error', () => {
                resolve(null);
            });

            // Timeout after 3 seconds
            setTimeout(() => {
                process.kill();
                resolve(null);
            }, 3000);
        });
    }

    /**
     * Get the best model to use - running model, last used, or first available
     */
    public static async getBestModel(context: vscode.ExtensionContext): Promise<string | null> {
        try {
            // 1. Check if there's a running model
            const runningModel = await this.getRunningModel();
            if (runningModel) {
                console.log(`Using running Ollama model: ${runningModel}`);
                return runningModel;
            }

            // 2. Check last used model
            const lastUsed = context.globalState.get<string>('ollama.lastUsedModel');
            if (lastUsed) {
                // Verify it still exists
                const available = await this.getAvailableModels();
                if (available.some(m => m.name === lastUsed)) {
                    console.log(`Using last used Ollama model: ${lastUsed}`);
                    return lastUsed;
                }
            }

            // 3. Use first available model
            const available = await this.getAvailableModels();
            if (available.length > 0) {
                const firstModel = available[0].name;
                console.log(`Using first available Ollama model: ${firstModel}`);
                return firstModel;
            }

            return null;
        } catch (error) {
            console.error('Error getting best Ollama model:', error);
            return null;
        }
    }

    /**
     * Save the last used model
     */
    public static async saveLastUsedModel(context: vscode.ExtensionContext, modelName: string): Promise<void> {
        await context.globalState.update('ollama.lastUsedModel', modelName);
    }
}
