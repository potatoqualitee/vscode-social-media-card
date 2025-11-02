import * as vscode from 'vscode';
import { CardGenerator, CardDesign } from './CardGenerator';
import { ScreenshotService } from './ScreenshotService';
import { getWebviewHtml } from './webview/WebviewHtmlTemplate';
import { ModelManager, ModelInfo } from './managers/ModelManager';

export class CardGeneratorProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private cardGenerator: CardGenerator;
    private screenshotService: ScreenshotService;
    private modelManager: ModelManager;
    private conversationHistory: vscode.LanguageModelChatMessage[] = [];
    private currentDesigns: CardDesign[] = [];
    private currentDimensions: { width: number; height: number } = { width: 1200, height: 630 };
    private currentSourceFile?: string; // Track which file the designs were generated from
    private currentCancellation?: vscode.CancellationTokenSource; // Track current generation cancellation
    private cachedSummary?: { title: string; summary: string; modelName: string; sourceFile: string; suggestedFilename?: string }; // Cached summary for the current file
    private cachedBlogContent?: string; // Cached blog content to support regeneration when no active editor

    constructor(private readonly _extensionUri: vscode.Uri, private readonly context: vscode.ExtensionContext) {
        this.cardGenerator = new CardGenerator(context);
        this.screenshotService = new ScreenshotService();
        this.modelManager = new ModelManager(context);

        // Initialize model manager and setup callbacks
        this.modelManager.initialize();
        this.modelManager.onModelsChanged((models, selectedId, isLoading) => {
            this.sendModelsToWebview(models, selectedId, isLoading);
        });
    }

    private sendModelsToWebview(models: ModelInfo[], selectedModelId?: string, isLoading?: boolean) {
        if (!this._view) return;

        this._view.webview.postMessage({
            type: 'models-updated',
            models: models,
            selectedModelId: selectedModelId,
            isLoading: isLoading || false
        });
    }

    private sendNumDesignsSetting() {
        if (!this._view) return;

        const config = vscode.workspace.getConfiguration('socialCardGenerator');
        const numberOfDesigns = config.get<number>('numberOfDesigns', 5);

        this._view.webview.postMessage({
            type: 'num-designs-setting',
            numDesigns: numberOfDesigns
        });
    }

    private sendCurrentSettings() {
        if (!this._view) return;

        const config = vscode.workspace.getConfiguration('socialCardGenerator');
        const numberOfDesigns = config.get<number>('numberOfDesigns', 5);
        const useSeparateRequests = config.get<boolean>('useSeparateRequestsForPremiumModels', false);
        const bestPracticesMode = config.get<string>('bestPracticesMode', 'default');
        const promptMode = config.get<string>('promptMode', 'default');
        const customPromptInstructions = config.get<string>('customPromptInstructions', '');
        const loadingAnimation = config.get<string>('loadingAnimation', 'progress-bar');
        const skipSummaryStep = config.get<boolean>('skipSummaryStep', false);

        this._view.webview.postMessage({
            type: 'current-settings',
            settings: {
                numberOfDesigns,
                useSeparateRequestsForPremiumModels: useSeparateRequests,
                bestPracticesMode,
                promptMode,
                customPromptInstructions,
                loadingAnimation,
                skipSummaryStep
            }
        });
    }

    private async updateSetting(key: string, value: any) {
        const config = vscode.workspace.getConfiguration('socialCardGenerator');
        await config.update(key, value, vscode.ConfigurationTarget.Global);
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

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = getWebviewHtml(webviewView.webview);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'generate':
                    await this.handleGenerate(data.dimensions, data.numDesigns, data.chatMessage);
                    break;
                case 'cancel-generation':
                    if (this.currentCancellation) {
                        this.currentCancellation.cancel();
                        this.currentCancellation.dispose();
                        this.currentCancellation = undefined;
                    }
                    break;
                case 'screenshot':
                    await this.handleScreenshot(data.imageData, data.dimensions);
                    break;
                case 'export-png':
                    await this.handleExportPng(data.imageData, data.dimensions, data.designTitle, data.designIndex);
                    break;
                case 'chat':
                    await this.handleChat(data.message);
                    break;
                case 'modify-designs':
                    await this.handleDesignModification(data.message);
                    break;
                case 'select-model':
                    this.handleModelSelection(data.modelId);
                    break;
                case 'request-models':
                    const models = this.modelManager.getAvailableModels();
                    const selectedModel = this.modelManager.getSelectedModel();
                    this.sendModelsToWebview(models, selectedModel?.id, this.modelManager.isLoading());
                    break;
                case 'clear-chat':
                    this.clearConversationHistory();
                    break;
                case 'open-preview':
                    await this.handleOpenPreview(data.imageData, data.dimensions);
                    break;
                case 'get-settings':
                    this.sendCurrentSettings();
                    break;
                case 'update-setting':
                    await this.updateSetting(data.key, data.value);
                    break;
            }
        });

        // Monitor active editor changes to enable/disable generate button
        vscode.window.onDidChangeActiveTextEditor(() => {
            this.updateButtonState();
        });

        // Monitor configuration changes for number of designs setting
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('socialCardGenerator.numberOfDesigns')) {
                this.sendNumDesignsSetting();
            }
        });

        // Initial button state check
        this.updateButtonState();

        // Send initial models list
        const models = this.modelManager.getAvailableModels();
        const selectedModel = this.modelManager.getSelectedModel();
        this.sendModelsToWebview(models, selectedModel?.id, this.modelManager.isLoading());

        // Send initial number of designs setting
        this.sendNumDesignsSetting();

        // Send initial settings (including loading animation type)
        this.sendCurrentSettings();
    }

    private updateButtonState() {
        const hasValidEditor = !!vscode.window.activeTextEditor;
        const currentFile = vscode.window.activeTextEditor?.document.uri.toString();

        // We have designs if currentDesigns is populated
        const hasDesigns = this.currentDesigns.length > 0;

        // If we have designs cached, we can always regenerate regardless of active editor
        // This allows the button to stay as "Regenerate" even when preview panel is open
        const shouldEnable = hasValidEditor || hasDesigns;

        // Only clear cached summary and content if we're actually switching to a DIFFERENT file
        // (not just losing focus because a preview panel opened)
        if (this.cachedSummary &&
            currentFile &&
            this.cachedSummary.sourceFile !== currentFile) {
            this.cachedSummary = undefined;
            this.cachedBlogContent = undefined;
        }

        this._view?.webview.postMessage({
            type: 'update-button-state',
            enabled: shouldEnable,
            hasDesigns: hasDesigns
        });
    }

    private async handleGenerate(dimensions: { width: number; height: number }, numDesigns?: number, chatMessage?: string) {
        // Create cancellation token for this generation
        this.currentCancellation = new vscode.CancellationTokenSource();
        const cancellationToken = this.currentCancellation.token;

        try {
            // Get active editor content, or use cached content if regenerating from Card Preview
            const editor = vscode.window.activeTextEditor;
            let blogContent: string;
            let currentFile: string;

            if (editor) {
                // Use active editor
                blogContent = editor.document.getText();
                currentFile = editor.document.uri.toString();

                if (!blogContent || blogContent.trim().length === 0) {
                    vscode.window.showErrorMessage('The active file is empty.');
                    this._view?.webview.postMessage({
                        type: 'generation-complete',
                        success: false
                    });
                    return;
                }

                // Cache the content for future regenerations
                this.cachedBlogContent = blogContent;
            } else if (this.cachedBlogContent && this.currentSourceFile) {
                // No active editor, but we have cached content (e.g., regenerating from Card Preview tab)
                blogContent = this.cachedBlogContent;
                currentFile = this.currentSourceFile;
            } else {
                vscode.window.showErrorMessage('Please open a blog post file first.');
                this._view?.webview.postMessage({
                    type: 'generation-complete',
                    success: false
                });
                return;
            }

            // Check if skipSummaryStep setting is enabled
            const config = vscode.workspace.getConfiguration('socialCardGenerator');
            const skipSummaryStep = config.get<boolean>('skipSummaryStep', false);

            // Variables for title, summary, and full content
            let title: string;
            let summary: string;
            let modelName: string;
            let fullContent: string | undefined;

            if (skipSummaryStep) {
                // Skip summarization - use full blog content directly
                fullContent = blogContent;
                // Extract a basic title from the first line or use a default
                const firstLine = blogContent.split('\n')[0].trim();
                title = firstLine.length > 0 && firstLine.length < 100
                    ? firstLine.replace(/^#+\s*/, '') // Remove markdown heading markers
                    : 'Blog Post';
                summary = ''; // Not used when fullContent is provided
                modelName = 'N/A (skip summary)';

                this._view?.webview.postMessage({
                    type: 'generating',
                    status: 'Generating designs...'
                });
            } else if (this.cachedSummary && this.cachedSummary.sourceFile === currentFile) {
                // Use cached summary (skip summarization step entirely)
                title = this.cachedSummary.title;
                summary = this.cachedSummary.summary;
                modelName = this.cachedSummary.modelName;
            } else {
                // Step 1: Summarize blog post with GPT-4o mini
                this._view?.webview.postMessage({
                    type: 'generating',
                    status: 'Step 1/2: Summarizing blog post...'
                });

                const summaryResult = await this.cardGenerator.summarizeBlogPost(
                    blogContent,
                    this.modelManager.getSelectedModel(),
                    this.modelManager.getSelectedModelInfo(),
                    (modelName) => {
                        // Update status with actual model being used
                        this._view?.webview.postMessage({
                            type: 'generating',
                            status: `Step 1/2: Summarizing blog post...`
                        });
                    },
                    (debugMessage) => {
                        // Send debug messages to webview
                        this._view?.webview.postMessage({
                            type: 'debug-message',
                            message: debugMessage
                        });
                    },
                    cancellationToken
                );

                title = summaryResult.title;
                summary = summaryResult.summary;
                modelName = summaryResult.modelName;

                // Cache the summary for future regenerations
                this.cachedSummary = {
                    title,
                    summary,
                    modelName,
                    sourceFile: currentFile,
                    suggestedFilename: summaryResult.suggestedFilename
                };
            }

            // Step 2: Generate designs with the summary (or full content if skipping summary)
            // Get the number of designs to generate
            const designCount = numDesigns || config.get<number>('numberOfDesigns', 5);

            // Only show "Step 2/2" if we didn't skip the summary step
            if (!skipSummaryStep) {
                this._view?.webview.postMessage({
                    type: 'generating',
                    status: 'Step 2/2: Generating designs...',
                    totalDesigns: designCount
                });
            }

            // Initialize designs array that will accumulate results
            const accumulatedDesigns: CardDesign[] = [];

            // Progress callback for separate design generation
            const progressCallback = (current: number, total: number) => {
                const statusPrefix = skipSummaryStep ? '' : 'Step 2/2: ';
                this._view?.webview.postMessage({
                    type: 'generating',
                    status: `${statusPrefix}Generating design ${current} of ${total}...`
                });
            };

            // Design callback to stream designs as they're generated
            const designCallback = (design: CardDesign) => {
                accumulatedDesigns.push(design);
                // Send the design immediately to the webview
                this._view?.webview.postMessage({
                    type: 'design-update',
                    designs: [...accumulatedDesigns] // Send all designs generated so far
                });
            };

            // Debug callback to send prompts to webview
            const debugCallback = (debugMessage: string) => {
                this._view?.webview.postMessage({
                    type: 'debug-message',
                    message: debugMessage
                });
            };

            const designs = await this.cardGenerator.generateDesigns(
                title,
                summary,
                dimensions,
                numDesigns,
                this.modelManager.getSelectedModel(),
                progressCallback,
                designCallback,
                debugCallback,
                cancellationToken,
                chatMessage, // pass chat message for append mode
                this.modelManager.getSelectedModelInfo(), // pass model info for CLI providers
                fullContent // pass full blog content if skipSummaryStep is enabled
            );

            // Store designs, dimensions, and source file for future modifications
            this.currentDesigns = designs;
            this.currentDimensions = dimensions;
            this.currentSourceFile = currentFile;

            // Send final designs to webview (in case callback wasn't used for batched mode)
            this._view?.webview.postMessage({
                type: 'designs',
                designs: designs
            });

            // Update button state to show "Regenerate"
            this.updateButtonState();
        } catch (error) {
            // Handle cancellation separately
            if (error instanceof vscode.CancellationError) {
                console.log('Generation was cancelled by user');
                this._view?.webview.postMessage({
                    type: 'generation-complete',
                    success: false
                });
                return;
            }

            const errorMessage = error instanceof Error ? error.message : String(error);

            this._view?.webview.postMessage({
                type: 'error',
                message: errorMessage
            });
        } finally {
            // Clean up cancellation token
            if (this.currentCancellation) {
                this.currentCancellation.dispose();
                this.currentCancellation = undefined;
            }
        }
    }

    private async handleScreenshot(imageData: string, dimensions: { width: number; height: number }) {
        try {
            const filePath = await this.screenshotService.saveScreenshot(imageData, dimensions);

            this._view?.webview.postMessage({
                type: 'screenshot-complete',
                filePath: filePath
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Screenshot failed: ${errorMessage}`);

            this._view?.webview.postMessage({
                type: 'error',
                message: errorMessage
            });
        }
    }

    private async handleOpenPreview(imageData: string, dimensions: { width: number; height: number }) {
        try {
            // Save to temp directory with dimensions in filename
            const tempFilePath = await this.screenshotService.saveToTemp(imageData, dimensions);

            // Get the active text editor's column, or default to Active
            const activeColumn = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.Active;

            // Create a new webview panel in the active column
            const panel = vscode.window.createWebviewPanel(
                'cardPreview',
                'Card Preview',
                activeColumn,
                {
                    enableScripts: true,
                    retainContextWhenHidden: false
                }
            );

            // Set the webview content with the PNG image (use base64 data directly)
            panel.webview.html = this.getPreviewHtml(imageData, tempFilePath, dimensions);

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(async (message) => {
                if (message.type === 'save') {
                    await this.handleSaveFromPreview(message.tempPath, message.imageData);
                }
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to open preview: ${errorMessage}`);
        }
    }

    private async handleSaveFromPreview(tempPath: string, imageData: string) {
        try {
            const path = await import('path');

            // Extract dimensions from filename
            const filenameMatch = path.basename(tempPath).match(/(\d+)x(\d+)/);
            const dimensions = filenameMatch
                ? { width: parseInt(filenameMatch[1]), height: parseInt(filenameMatch[2]) }
                : { width: 1200, height: 630 }; // Default dimensions

            // Show save dialog
            const defaultFilename = `card-${dimensions.width}x${dimensions.height}-${Date.now()}.png`;
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(defaultFilename),
                filters: {
                    'PNG Images': ['png'],
                    'All Files': ['*']
                }
            });

            if (!uri) {
                // User cancelled
                return;
            }

            // Write the file
            const fs = await import('fs');
            const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Image, 'base64');
            fs.writeFileSync(uri.fsPath, imageBuffer);

            vscode.window.showInformationMessage(`Image saved to: ${uri.fsPath}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to save: ${errorMessage}`);
        }
    }

    private getPreviewHtml(imageData: string, tempPath: string, dimensions: { width: number; height: number }): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Card Preview</title>
            <link rel="stylesheet" href="https://microsoft.github.io/vscode-codicons/dist/codicon.css">
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    background-color: var(--vscode-editor-background);
                }
                .toolbar {
                    position: sticky;
                    top: 0;
                    background-color: var(--vscode-editor-background);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding: 8px 12px;
                    display: flex;
                    justify-content: flex-end;
                    z-index: 100;
                }
                .save-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: background-color 0.15s ease;
                }
                .save-btn:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .save-btn .codicon {
                    font-size: 16px;
                }
                .image-container {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                    overflow: auto;
                }
                img {
                    max-width: 100%;
                    height: auto;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
            </style>
        </head>
        <body>
            <div class="toolbar">
                <button class="save-btn" onclick="saveImage()">
                    <span class="codicon codicon-save"></span>
                    Save As...
                </button>
            </div>
            <div class="image-container">
                <img src="${imageData}" alt="Card Preview" />
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                const imageData = '${imageData.replace(/'/g, "\\'")}';
                const tempPath = '${tempPath.replace(/\\/g, '\\\\')}';

                function saveImage() {
                    vscode.postMessage({
                        type: 'save',
                        tempPath: tempPath,
                        imageData: imageData
                    });
                }
            </script>
        </body>
        </html>`;
    }

    private handleModelSelection(modelId: string) {
        this.modelManager.selectModel(
            modelId,
            () => this.clearConversationHistory(),
            (selectedId) => {
                this._view?.webview.postMessage({
                    type: 'model-selected',
                    modelId: selectedId
                });
            }
        );
    }

    private clearConversationHistory() {
        this.conversationHistory = [];
        this._view?.webview.postMessage({
            type: 'conversation-cleared'
        });
    }

    private async handleDesignModification(modificationRequest: string) {
        // Create cancellation token for this modification
        this.currentCancellation = new vscode.CancellationTokenSource();
        const cancellationToken = this.currentCancellation.token;

        try {
            if (this.currentDesigns.length === 0) {
                vscode.window.showErrorMessage('No designs available to modify. Please generate designs first.');
                return;
            }

            // Show generating status
            this._view?.webview.postMessage({
                type: 'generating',
                status: 'Modifying designs...'
            });

            // Debug callback to send prompts to webview
            const debugCallback = (debugMessage: string) => {
                this._view?.webview.postMessage({
                    type: 'debug-message',
                    message: debugMessage
                });
            };

            // Call the card generator to modify designs
            const modifiedDesigns = await this.cardGenerator.modifyDesigns(
                this.currentDesigns,
                modificationRequest,
                this.currentDimensions,
                this.modelManager.getSelectedModel(),
                cancellationToken,
                debugCallback,
                this.modelManager.getSelectedModelInfo() // pass model info for CLI providers
            );

            // Update stored designs
            this.currentDesigns = modifiedDesigns;

            // Send updated designs to webview (this will clear the generating status)
            this._view?.webview.postMessage({
                type: 'designs',
                designs: modifiedDesigns
            });

            // Clear the status message
            this._view?.webview.postMessage({
                type: 'screenshot-complete'
            });

        } catch (error) {
            // Handle cancellation separately
            if (error instanceof vscode.CancellationError) {
                console.log('Modification was cancelled by user');
                this._view?.webview.postMessage({
                    type: 'generation-complete',
                    success: false
                });
                return;
            }

            const errorMessage = error instanceof Error ? error.message : String(error);

            this._view?.webview.postMessage({
                type: 'error',
                message: errorMessage
            });
        } finally {
            // Clean up cancellation token
            if (this.currentCancellation) {
                this.currentCancellation.dispose();
                this.currentCancellation = undefined;
            }
        }
    }

    private async handleExportPng(imageData: string, dimensions: { width: number; height: number }, designTitle?: string, designIndex?: number) {
        try {
            // Get the suggested filename from cached summary
            const suggestedFilename = this.cachedSummary?.suggestedFilename;

            // Export the PNG with suggested filename
            const result = await this.screenshotService.exportPng(
                imageData,
                dimensions,
                suggestedFilename,
                designIndex
            );

            // Send result back to webview
            this._view?.webview.postMessage({
                type: 'export-complete',
                success: result.success,
                message: result.message,
                filePath: result.filePath
            });

            // Only show error notifications to user (success is silent)
            if (!result.success && result.message && result.message !== 'Export cancelled') {
                vscode.window.showErrorMessage(result.message);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this._view?.webview.postMessage({
                type: 'export-complete',
                success: false,
                message: `Export failed: ${errorMessage}`
            });
            vscode.window.showErrorMessage(`Export failed: ${errorMessage}`);
        }
    }

    private async handleChat(message: string) {
        try {
            // Note: Initial generation (when no designs exist) is now handled in the frontend
            // by sending a 'generate' message instead of 'chat'
            // Modifications (when designs exist) are handled by 'modify-designs' message
            // This chat handler is kept for potential future conversational features

            this._view?.webview.postMessage({
                type: 'chat-response',
                content: 'Chat functionality is currently limited. Use the chat to generate designs initially or modify existing designs.'
            });

        } catch (error) {
            let errorMessage = 'An error occurred while processing your request.';

            if (error instanceof vscode.LanguageModelError) {
                // Check error message patterns since error codes might not be available as static properties
                const errMsg = error.message.toLowerCase();
                if (errMsg.includes('not found') || errMsg.includes('no model')) {
                    errorMessage = 'The selected model is no longer available. Please select a different model.';
                } else if (errMsg.includes('blocked')) {
                    errorMessage = 'Your request was blocked. Please try rephrasing your message.';
                } else if (errMsg.includes('permission') || errMsg.includes('consent')) {
                    errorMessage = 'You need to grant permission to use this language model. Please check your settings.';
                } else if (errMsg.includes('model is not supported') || errMsg.includes('model_not_supported')) {
                    errorMessage = `This model (${this.modelManager.getSelectedModel()?.family}) is not supported by the VS Code Language Model API yet. Please select a different model like GPT-4o or Claude 3.5 Sonnet.`;
                } else {
                    errorMessage = `Language model error: ${error.message}`;
                }
            } else if (error instanceof Error) {
                const errMsg = error.message.toLowerCase();
                if (errMsg.includes('model is not supported') || errMsg.includes('model_not_supported')) {
                    errorMessage = `This model (${this.modelManager.getSelectedModel()?.family}) is not supported by the VS Code Language Model API yet. Please select a different model like GPT-4o or Claude 3.5 Sonnet.`;
                } else {
                    errorMessage = error.message;
                }
            }

            this._view?.webview.postMessage({
                type: 'chat-response',
                content: `Error: ${errorMessage}`
            });
        }
    }
}
