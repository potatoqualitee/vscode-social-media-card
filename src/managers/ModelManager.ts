import * as vscode from 'vscode';

export interface ModelInfo {
    id: string;
    vendor: string;
    family: string;
    version: string;
    name: string;
    maxInputTokens: number;
}

export class ModelManager {
    private selectedModel?: vscode.LanguageModelChat;
    private selectedModelId?: string;
    private availableModels: vscode.LanguageModelChat[] = [];
    private cachedModels: vscode.LanguageModelChat[] = [];
    private isLoadingModels: boolean = true;
    private onModelsChangedCallback?: (models: ModelInfo[], selectedId?: string, isLoading?: boolean) => void;

    constructor(private context: vscode.ExtensionContext) {
        // Load previously selected model ID from storage
        this.selectedModelId = this.context.globalState.get<string>('selectedModelId');
    }

    public async initialize() {
        await this.refreshAvailableModels(true);

        // Listen for model changes
        vscode.lm.onDidChangeChatModels(() => {
            this.refreshAvailableModels(false);
        });
    }

    public getSelectedModel(): vscode.LanguageModelChat | undefined {
        return this.selectedModel;
    }

    public getAvailableModels(): ModelInfo[] {
        return this.availableModels.map(model => ({
            id: model.id,
            vendor: model.vendor,
            family: model.family,
            version: model.version,
            name: this.getModelDisplayName(model),
            maxInputTokens: model.maxInputTokens
        }));
    }

    public isLoading(): boolean {
        return this.isLoadingModels;
    }

    public onModelsChanged(callback: (models: ModelInfo[], selectedId?: string, isLoading?: boolean) => void) {
        this.onModelsChangedCallback = callback;
    }

    public selectModel(modelId: string, onClearHistory?: () => void, onModelSelected?: (modelId: string) => void) {
        const model = this.availableModels.find(m => m.id === modelId);
        if (model) {
            this.selectedModel = model;
            this.selectedModelId = modelId;

            // Persist the selected model ID
            this.context.globalState.update('selectedModelId', modelId);

            // Clear conversation history when switching models to avoid confusion
            if (onClearHistory) {
                onClearHistory();
            }

            if (onModelSelected) {
                onModelSelected(modelId);
            }
        }
    }

    private async refreshAvailableModels(isInitialLoad: boolean = false) {
        try {
            // If we have cached models and this is initial load, use cache first
            if (isInitialLoad && this.cachedModels.length > 0) {
                this.availableModels = this.cachedModels;
                this.isLoadingModels = false;
                this.notifyModelsChanged();
            }

            // Fetch fresh models
            const allModels = await vscode.lm.selectChatModels();

            // Filter out unsupported models
            // VS Code LM API currently supports:
            // - GitHub Copilot models (GPT-4o, GPT-4o-mini, o1, o1-mini, o1-preview)
            // - Claude 3.5 Sonnet (but NOT newer Claude 3.7+ or 4.x models yet)
            // - Local models (Ollama, etc.)
            //
            // Models NOT supported by 3rd party apps:
            // - xAI/Grok models
            // - Gemini models
            const filteredModels = allModels.filter(model => {
                const vendor = model.vendor?.toLowerCase() || '';
                const family = model.family?.toLowerCase() || '';
                const id = model.id?.toLowerCase() || '';

                // Filter out xAI/Grok - not supported by 3rd party apps
                if (vendor === 'xai' || family.includes('grok')) {
                    return false;
                }

                // Filter out Gemini - not supported by 3rd party apps
                if (vendor === 'google' || family.includes('gemini')) {
                    return false;
                }

                // For Claude models, only allow 3.5 Sonnet
                // Block newer Claude 3.7+, 4.0+, etc. as they're not supported by VS Code LM API yet
                if (family.includes('claude')) {
                    // Allow claude-3-5-sonnet or claude-3.5-sonnet
                    if (family.includes('3-5-sonnet') || family.includes('3.5-sonnet') ||
                        id.includes('3-5-sonnet') || id.includes('3.5-sonnet')) {
                        return true;
                    }
                    // Block all other Claude variants
                    return false;
                }

                // Allow all other models (GPT, o1, local models, etc.)
                return true;
            });

            // Deduplicate models by display name, keeping the most recent version
            this.availableModels = this.deduplicateModels(filteredModels);

            // Cache the models
            this.cachedModels = this.availableModels;
            this.isLoadingModels = false;

            // Try to restore previously selected model by ID
            if (this.selectedModelId) {
                const previousModel = this.availableModels.find(m => m.id === this.selectedModelId);
                if (previousModel) {
                    this.selectedModel = previousModel;
                } else {
                    // Fall back to first model if previous selection not available
                    this.selectedModel = this.availableModels.length > 0 ? this.availableModels[0] : undefined;
                }
            } else if (!this.selectedModel && this.availableModels.length > 0) {
                // Select the first model by default if none selected
                this.selectedModel = this.availableModels[0];
            }

            // Send updated model list
            this.notifyModelsChanged();
        } catch (error) {
            console.error('Failed to fetch available models:', error);
            this.isLoadingModels = false;
            // Keep using cached models if available
            if (this.cachedModels.length > 0) {
                this.availableModels = this.cachedModels;
            } else {
                this.availableModels = [];
            }
            this.notifyModelsChanged();
        }
    }

    private notifyModelsChanged() {
        if (this.onModelsChangedCallback) {
            this.onModelsChangedCallback(
                this.getAvailableModels(),
                this.selectedModel?.id,
                this.isLoadingModels
            );
        }
    }

    private deduplicateModels(models: vscode.LanguageModelChat[]): vscode.LanguageModelChat[] {
        // Group models by their display name
        const modelMap = new Map<string, vscode.LanguageModelChat[]>();

        for (const model of models) {
            const displayName = this.getModelDisplayName(model);
            if (!modelMap.has(displayName)) {
                modelMap.set(displayName, []);
            }
            modelMap.get(displayName)!.push(model);
        }

        // For each display name, keep only the most recent version
        const deduplicatedModels: vscode.LanguageModelChat[] = [];

        for (const [displayName, duplicates] of modelMap.entries()) {
            if (duplicates.length === 1) {
                deduplicatedModels.push(duplicates[0]);
            } else {
                // Sort by version/id to get the most recent (assuming later versions have later dates or higher version numbers)
                // Priority: models with version > models without version
                // Then sort by id (which often includes date info like gpt-4o-2024-11-20)
                const sorted = duplicates.sort((a, b) => {
                    // Extract date from id if present (e.g., gpt-4o-2024-11-20)
                    const dateRegex = /(\d{4}-\d{2}-\d{2})/;
                    const dateA = a.id.match(dateRegex)?.[1];
                    const dateB = b.id.match(dateRegex)?.[1];

                    if (dateA && dateB) {
                        return dateB.localeCompare(dateA); // Most recent date first
                    } else if (dateA) {
                        return -1; // Models with dates take priority
                    } else if (dateB) {
                        return 1;
                    }

                    // Fall back to comparing IDs lexicographically (newer models often have later IDs)
                    return b.id.localeCompare(a.id);
                });

                deduplicatedModels.push(sorted[0]);
            }
        }

        return deduplicatedModels;
    }

    private getModelDisplayName(model: vscode.LanguageModelChat): string {
        // Create a friendly display name from the model info - just the nice name
        const family = model.family || '';
        const version = model.version || '';

        // Build a clean name from family and version
        let displayName = '';

        // Handle common model naming patterns
        if (family.toLowerCase().includes('gpt')) {
            displayName = family.toUpperCase();
            if (version) {
                displayName += ` ${version}`;
            }
        } else if (family.toLowerCase().includes('claude')) {
            displayName = 'Claude';
            // Extract the model variant (e.g., "Sonnet 3.5")
            const variant = family.replace(/claude-?/i, '').trim();
            if (variant) {
                // Capitalize first letter of each word
                const formatted = variant.split('-').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                displayName += ` ${formatted}`;
            }
            if (version) {
                displayName += ` ${version}`;
            }
        } else if (family.toLowerCase().includes('gemini')) {
            displayName = 'Gemini';
            const variant = family.replace(/gemini-?/i, '').trim();
            if (variant) {
                displayName += ` ${variant.toUpperCase()}`;
            }
            if (version) {
                displayName += ` ${version}`;
            }
        } else {
            // Generic fallback - capitalize family name
            displayName = family.charAt(0).toUpperCase() + family.slice(1);
            if (version) {
                displayName += ` ${version}`;
            }
        }

        // Post-process: Remove the last element if there's a space and it contains dashes
        // This handles cases like "GPT-4o gpt-4o-2024-11-20" -> "GPT-4o"
        const parts = displayName.split(' ');
        if (parts.length > 1 && parts[parts.length - 1].includes('-')) {
            parts.pop(); // Remove the last element
            displayName = parts.join(' ');
        }

        // Helper function to capitalize a single model segment (word or hyphen-separated part)
        const capitalizeModelSegment = (segment: string): string => {
            const lower = segment.toLowerCase();

            // Special cases - always lowercase
            if (lower === 'mini') {
                return lower;
            }

            // Special cases - always uppercase
            if (lower === 'gpt') {
                return 'GPT';
            }

            // o-series models (o1, o3, etc.) - always lowercase
            if (/^o\d+$/.test(lower)) {
                return lower;
            }

            // Special cases - Title case (model variants)
            if (lower === 'turbo' || lower === 'flash' || lower === 'pro' || lower === 'codex' || lower === 'instruct') {
                return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
            }

            // Model versions (4o, 3.5, etc.) - lowercase any letters
            if (/^[\d.]+[a-z]*$/.test(lower)) {
                return lower;
            }

            // Default: Title case
            return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
        };

        // Fix capitalization to match official product names
        displayName = displayName.split(' ').map(word => {
            const lowerWord = word.toLowerCase();

            // Handle standalone o-series models (o1, o3, etc.)
            if (/^o\d+$/.test(lowerWord)) {
                return lowerWord;
            }

            // If the word contains hyphens, split and capitalize each segment
            // This handles: GPT-3.5-Turbo, Gemini-2.0-Flash, etc.
            if (word.includes('-')) {
                const segments = word.split('-');
                return segments.map(seg => capitalizeModelSegment(seg)).join('-');
            }

            // Handle simple words without hyphens
            return capitalizeModelSegment(word);
        }).join(' ');

        return displayName || 'Unknown Model';
    }
}
