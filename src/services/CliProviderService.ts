import { spawn } from 'child_process';
import * as vscode from 'vscode';

export interface CliModelResponse {
    text: string;
}

export class CliProviderService {
    /**
     * Execute a CLI command and pipe the prompt to it
     * @param cliCommand The CLI command to execute (e.g., 'claude', 'codex', 'gemini')
     * @param prompt The prompt to send to the CLI
     * @param workspaceFolder The workspace folder path
     * @param cancellationToken Optional cancellation token
     * @returns The response text from the CLI
     */
    public static async executeCliProvider(
        cliCommand: string,
        prompt: string,
        workspaceFolder: string,
        cancellationToken?: vscode.CancellationToken
    ): Promise<CliModelResponse> {
        return new Promise((resolve, reject) => {
            // Check for cancellation before starting
            if (cancellationToken?.isCancellationRequested) {
                reject(new vscode.CancellationError());
                return;
            }

            console.log(`Executing CLI provider: ${cliCommand}`);

            // Spawn the CLI process
            const cliProcess = spawn(cliCommand, [], {
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
