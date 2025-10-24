import { spawn } from 'child_process';
import * as vscode from 'vscode';
import { OllamaService } from './OllamaService';

export interface CliModelResponse {
    text: string;
}

export class CliProviderService {
    /**
     * Execute a CLI command and pipe the prompt to it
     * @param cliCommand The CLI command to execute (e.g., 'claude', 'codex', 'gemini')
     * @param prompt The prompt to send to the CLI
     * @param workspaceFolder The workspace folder path
     * @param context Extension context for state storage
     * @param cancellationToken Optional cancellation token
     * @returns The response text from the CLI
     */
    public static async executeCliProvider(
        cliCommand: string,
        prompt: string,
        workspaceFolder: string,
        context: vscode.ExtensionContext,
        cancellationToken?: vscode.CancellationToken
    ): Promise<CliModelResponse> {
        // Check for cancellation before starting
        if (cancellationToken?.isCancellationRequested) {
            throw new vscode.CancellationError();
        }

        // Handle Ollama specially - get the best model
        let finalCommand = cliCommand;
        let selectedModel: string | null = null;

        if (cliCommand.startsWith('ollama run')) {
            // Check config first
            const config = vscode.workspace.getConfiguration('socialCardGenerator');
            const configuredModel = config.get<string>('openaiCompatible.ollamaModelName', '');

            if (configuredModel) {
                selectedModel = configuredModel;
            } else {
                // Auto-detect best model
                try {
                    selectedModel = await OllamaService.getBestModel(context);
                    if (!selectedModel) {
                        throw new Error('No Ollama models found. Please run "ollama pull <model>" to download a model first.');
                    }
                } catch (error) {
                    if (error instanceof Error) {
                        throw new Error(`Failed to detect Ollama model: ${error.message}`);
                    }
                    throw error;
                }
            }

            finalCommand = `${cliCommand} ${selectedModel}`;
        }

        console.log(`Executing CLI provider: ${finalCommand}`);

        return new Promise((resolve, reject) => {

            // Spawn the CLI process
            const cliProcess = spawn(finalCommand, [], {
                cwd: workspaceFolder,
                env: process.env,
                shell: true
            });

            let stdout = '';
            let stderr = '';

            // Collect stdout
            cliProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            // Collect stderr
            cliProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // Handle process completion
            cliProcess.on('close', (code) => {
                if (cancellationToken?.isCancellationRequested) {
                    reject(new vscode.CancellationError());
                    return;
                }

                if (code === 0) {
                    console.log(`CLI provider ${cliCommand} completed successfully`);

                    // Save last used model for Ollama
                    if (selectedModel && cliCommand.startsWith('ollama run')) {
                        OllamaService.saveLastUsedModel(context, selectedModel).catch(err => {
                            console.error('Failed to save last used Ollama model:', err);
                        });
                    }

                    resolve({ text: stdout });
                } else {
                    console.error(`CLI provider ${cliCommand} failed with code ${code}`);
                    console.error('stderr:', stderr);
                    reject(new Error(`CLI command '${cliCommand}' failed with exit code ${code}\n${stderr}`));
                }
            });

            // Handle process errors
            cliProcess.on('error', (error) => {
                console.error(`Failed to spawn CLI provider ${cliCommand}:`, error);
                reject(new Error(`Failed to execute '${cliCommand}': ${error.message}. Make sure the CLI is installed and available in your PATH.`));
            });

            // Handle cancellation
            if (cancellationToken) {
                cancellationToken.onCancellationRequested(() => {
                    console.log(`Cancelling CLI provider ${cliCommand}`);
                    cliProcess.kill();
                    reject(new vscode.CancellationError());
                });
            }

            // Pipe the prompt to stdin
            cliProcess.stdin.write(prompt);
            cliProcess.stdin.end();
        });
    }

    /**
     * Check if a CLI command is available
     * @param cliCommand The CLI command to check
     * @returns True if the CLI is available, false otherwise
     */
    public static async isCliAvailable(cliCommand: string): Promise<boolean> {
        return new Promise((resolve) => {
            const checkProcess = spawn(cliCommand, ['--version'], {
                shell: true
            });

            checkProcess.on('close', (code) => {
                resolve(code === 0);
            });

            checkProcess.on('error', () => {
                resolve(false);
            });

            // Timeout after 2 seconds
            setTimeout(() => {
                checkProcess.kill();
                resolve(false);
            }, 2000);
        });
    }
}
