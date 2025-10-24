import * as vscode from 'vscode';
import OpenAI from 'openai';

export interface OpenAiCompatibleResponse {
    text: string;
}

export interface ModelInfo {
    id: string;
    created?: number;
    owned_by?: string;
}

export class OpenAiCompatibleService {
    /**
     * Send a request to an OpenAI-compatible API endpoint
     * @param prompt The prompt to send
     * @param cancellationToken Optional cancellation token
     * @returns The response text from the API
     */
    public static async sendRequest(
        prompt: string,
        cancellationToken?: vscode.CancellationToken
    ): Promise<OpenAiCompatibleResponse> {
        // Get configuration
        const config = vscode.workspace.getConfiguration('socialCardGenerator');
        const baseUrl = config.get<string>('openaiCompatible.baseUrl', '');
        const apiKey = config.get<string>('openaiCompatible.apiKey', '');
        const modelName = config.get<string>('openaiCompatible.modelName', '');

        // Validate configuration
        if (!baseUrl) {
            throw new Error('OpenAI-Compatible API base URL is not configured. Please set it in Settings (socialCardGenerator.openaiCompatible.baseUrl)');
        }

        if (!modelName) {
            throw new Error('OpenAI-Compatible API model name is not configured. Please set it in Settings (socialCardGenerator.openaiCompatible.modelName)');
        }

        // Check for cancellation before starting
        if (cancellationToken?.isCancellationRequested) {
            throw new vscode.CancellationError();
        }

        console.log(`Using OpenAI-Compatible API: ${baseUrl}`);
        console.log(`Model: ${modelName}`);

        // Create OpenAI client with custom base URL
        const client = new OpenAI({
            baseURL: baseUrl,
            apiKey: apiKey || 'not-needed', // Some providers don't require an API key (like Ollama)
            dangerouslyAllowBrowser: false // We're in Node.js, not browser
        });

        try {
            // Create abort controller for cancellation
            const abortController = new AbortController();

            // Listen for cancellation
            const cancellationListener = cancellationToken?.onCancellationRequested(() => {
                console.log('Request cancelled, aborting...');
                abortController.abort();
            });

            // Send request
            const response = await client.chat.completions.create({
                model: modelName,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                // Some providers may not support all parameters, but OpenAI-compatible ones usually do
                temperature: 0.7,
                max_tokens: 4096
            }, {
                signal: abortController.signal
            });

            // Clean up cancellation listener
            cancellationListener?.dispose();

            // Check for cancellation after request
            if (cancellationToken?.isCancellationRequested) {
                throw new vscode.CancellationError();
            }

            // Extract response text
            const text = response.choices[0]?.message?.content || '';

            if (!text) {
                throw new Error('No response content received from OpenAI-Compatible API');
            }

            return { text };
        } catch (error: unknown) {
            // Handle cancellation
            if (error instanceof vscode.CancellationError) {
                throw new vscode.CancellationError();
            }

            // Check for AbortError
            if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
                throw new vscode.CancellationError();
            }

            // Handle other errors
            if (error instanceof Error) {
                // Provide helpful error messages for common issues
                if (error.message.includes('ECONNREFUSED')) {
                    throw new Error(`Cannot connect to OpenAI-Compatible API at ${baseUrl}. Make sure the service is running.`);
                }
                if (error.message.includes('ENOTFOUND')) {
                    throw new Error(`Invalid base URL: ${baseUrl}. Please check your configuration.`);
                }
                if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    throw new Error('Invalid API key. Please check your configuration.');
                }
                if (error.message.includes('404')) {
                    throw new Error(`Model "${modelName}" not found. Please check your model name configuration.`);
                }

                throw new Error(`OpenAI-Compatible API error: ${error.message}`);
            }

            throw new Error(`OpenAI-Compatible API error: ${String(error)}`);
        }
    }

    /**
     * Get list of available models from the OpenAI-Compatible API
     */
    public static async getAvailableModels(): Promise<ModelInfo[]> {
        const config = vscode.workspace.getConfiguration('socialCardGenerator');
        const baseUrl = config.get<string>('openaiCompatible.baseUrl', '');
        const apiKey = config.get<string>('openaiCompatible.apiKey', '');

        if (!baseUrl) {
            throw new Error('OpenAI-Compatible API base URL is not configured');
        }

        const client = new OpenAI({
            baseURL: baseUrl,
            apiKey: apiKey || 'not-needed',
            dangerouslyAllowBrowser: false
        });

        try {
            const response = await client.models.list();
            return response.data.map(model => ({
                id: model.id,
                created: model.created,
                owned_by: model.owned_by
            }));
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Failed to fetch models: ${error.message}`);
            }
            throw new Error('Failed to fetch models from OpenAI-Compatible API');
        }
    }

    /**
     * Get the best model to use - last used or first available
     */
    public static async getBestModel(context: vscode.ExtensionContext): Promise<string | null> {
        try {
            // Check configuration first
            const config = vscode.workspace.getConfiguration('socialCardGenerator');
            const configuredModel = config.get<string>('openaiCompatible.modelName', '');

            if (configuredModel) {
                console.log(`Using configured model: ${configuredModel}`);
                return configuredModel;
            }

            // Check last used model
            const lastUsed = context.globalState.get<string>('openaiCompatible.lastUsedModel');
            if (lastUsed) {
                console.log(`Using last used model: ${lastUsed}`);
                return lastUsed;
            }

            // Try to fetch available models
            const available = await this.getAvailableModels();
            if (available.length > 0) {
                const firstModel = available[0].id;
                console.log(`Using first available model: ${firstModel}`);
                return firstModel;
            }

            return null;
        } catch (error) {
            console.error('Error getting best model:', error);
            // Fall back to configured model if it exists
            const config = vscode.workspace.getConfiguration('socialCardGenerator');
            return config.get<string>('openaiCompatible.modelName', '') || null;
        }
    }

    /**
     * Save the last used model
     */
    public static async saveLastUsedModel(context: vscode.ExtensionContext, modelName: string): Promise<void> {
        await context.globalState.update('openaiCompatible.lastUsedModel', modelName);
    }
}
