import * as vscode from 'vscode';
import { CliProviderService } from './services/CliProviderService';
import { ModelInfo } from './managers/ModelManager';

export interface CardDesign {
    title: string;
    html: string;
    generationTime?: number; // in milliseconds
}

export interface GenerationResult {
    analysis: string;
    designs: CardDesign[];
}

export interface BlogSummary {
    title: string;
    summary: string;
    modelName: string;
}

export class CardGenerator {
    /**
     * Send a request to either a VSCode LM model or a CLI provider
     */
    private async sendModelRequest(
        prompt: string,
        model?: vscode.LanguageModelChat,
        modelInfo?: ModelInfo,
        cancellationToken?: vscode.CancellationToken
    ): Promise<string> {
        // If modelInfo indicates it's a CLI provider, use CLI execution
        if (modelInfo?.isCli && modelInfo.cliCommand) {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
            console.log(`Using CLI provider: ${modelInfo.cliCommand}`);

            const response = await CliProviderService.executeCliProvider(
                modelInfo.cliCommand,
                prompt,
                workspaceFolder,
                cancellationToken
            );

            return response.text;
        }

        // Otherwise, use VSCode LM API
        if (!model) {
            throw new Error('No model or CLI provider specified');
        }

        const messages = [vscode.LanguageModelChatMessage.User(prompt)];
        const response = await model.sendRequest(
            messages,
            {},
            cancellationToken || new vscode.CancellationTokenSource().token
        );

        let text = '';
        for await (const fragment of response.text) {
            text += fragment;
        }

        return text;
    }

    /**
     * Retry wrapper for API calls with exponential backoff
     * Retries up to maxAttempts times on any error except CancellationError
     */
    private async retryApiCall<T>(
        operation: () => Promise<T>,
        maxAttempts: number = 3,
        cancellationToken?: vscode.CancellationToken
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // Check for cancellation before each attempt
                if (cancellationToken?.isCancellationRequested) {
                    throw new vscode.CancellationError();
                }

                return await operation();
            } catch (error) {
                // Never retry cancellation errors
                if (error instanceof vscode.CancellationError) {
                    throw error;
                }

                lastError = error instanceof Error ? error : new Error(String(error));
                console.log(`API call attempt ${attempt}/${maxAttempts} failed: ${lastError.message}`);

                // If this isn't the last attempt, wait before retrying
                if (attempt < maxAttempts) {
                    // Exponential backoff: 1s, 2s, 4s, etc.
                    const delayMs = Math.pow(2, attempt - 1) * 1000;
                    console.log(`Retrying in ${delayMs}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
        }

        // All attempts failed
        throw lastError || new Error('API call failed after multiple attempts');
    }

    /**
     * Attempts to parse JSON with fallback cleaning for common LLM formatting issues
     */
    private parseJsonWithFallback(jsonString: string): any {
        // First attempt: direct parse
        try {
            return JSON.parse(jsonString);
        } catch (firstError) {
            console.log('First parse attempt failed, trying to clean JSON...');

            // Second attempt: try to fix common issues
            try {
                let cleaned = jsonString;

                // Log the problematic JSON for debugging
                console.log('=== PROBLEMATIC JSON (first 500 chars) ===');
                console.log(cleaned.substring(0, 500));
                console.log('=== END ===');

                // Try using JSON5-like parsing approach - find the "html" field and properly escape it
                // This is a more aggressive approach
                const htmlMatch = cleaned.match(/"html"\s*:\s*"([\s\S]*?)"\s*[,}]/);
                if (htmlMatch) {
                    const htmlContent = htmlMatch[1];
                    // Check if HTML has unescaped control characters
                    if (/[\x00-\x1F]/.test(htmlContent)) {
                        console.log('Detected control characters in HTML, attempting to fix...');
                        // Replace the HTML content with properly escaped version
                        const escapedHtml = htmlContent
                            .replace(/\\/g, '\\\\')  // Escape backslashes
                            .replace(/"/g, '\\"')     // Escape quotes
                            .replace(/\n/g, '\\n')    // Escape newlines
                            .replace(/\r/g, '\\r')    // Escape carriage returns
                            .replace(/\t/g, '\\t');   // Escape tabs

                        cleaned = cleaned.replace(htmlMatch[0], `"html": "${escapedHtml}"${htmlMatch[0].slice(-1)}`);
                    }
                }

                return JSON.parse(cleaned);
            } catch (secondError) {
                // Third attempt: Try to extract and rebuild the JSON structure manually
                console.log('Second parse attempt failed, trying manual extraction...');
                try {
                    const analysisMatch = jsonString.match(/"analysis"\s*:\s*"([^"]*)"/);
                    const titleMatch = jsonString.match(/"title"\s*:\s*"([^"]*)"/);

                    // For HTML, we need to be more careful - find the opening quote and match to the closing
                    let html = '';
                    const htmlStartMatch = jsonString.match(/"html"\s*:\s*"/);
                    if (htmlStartMatch) {
                        const startIndex = htmlStartMatch.index! + htmlStartMatch[0].length;
                        let depth = 0;
                        let i = startIndex;
                        let escaped = false;

                        while (i < jsonString.length) {
                            const char = jsonString[i];

                            if (escaped) {
                                html += char;
                                escaped = false;
                            } else if (char === '\\') {
                                html += char;
                                escaped = true;
                            } else if (char === '"') {
                                // Found the end of the HTML string
                                break;
                            } else {
                                html += char;
                            }
                            i++;
                        }
                    }

                    if (analysisMatch && titleMatch && html) {
                        return {
                            analysis: analysisMatch[1],
                            designs: [{
                                title: titleMatch[1],
                                html: html
                            }]
                        };
                    }

                    throw new Error('Could not extract required fields');
                } catch (thirdError) {
                    // All attempts failed
                    console.error('All JSON parse attempts failed');
                    console.error('First error:', firstError);
                    console.error('Second error:', secondError);
                    console.error('Third error:', thirdError);
                    throw new Error(`Failed to parse JSON response: ${firstError instanceof Error ? firstError.message : 'Unknown error'}`);
                }
            }
        }
    }

    /**
     * Builds the design prompt based on user settings and template variables
     */
    private buildDesignPrompt(
        title: string,
        summary: string,
        dimensions: { width: number; height: number },
        designNumber: number,
        numberOfDesigns: number,
        isBatchMode: boolean = false,
        chatMessage?: string
    ): string {
        const config = vscode.workspace.getConfiguration('socialCardGenerator');
        // If chatMessage is provided, treat it as append mode (override user's setting)
        const promptMode = chatMessage ? 'append' : config.get<string>('promptMode', 'default');
        const customInstructions = chatMessage || config.get<string>('customPromptInstructions', '');

        // Template variables for replacement
        const variables: Record<string, string> = {
            '{{title}}': title,
            '{{summary}}': summary,
            '{{width}}': dimensions.width.toString(),
            '{{height}}': dimensions.height.toString(),
            '{{designNumber}}': designNumber.toString(),
            '{{numberOfDesigns}}': numberOfDesigns.toString()
        };

        // Replace template variables in custom instructions
        const replaceVariables = (text: string): string => {
            let result = text;
            for (const [variable, value] of Object.entries(variables)) {
                result = result.split(variable).join(value);
            }
            return result;
        };

        // Technical requirements that are always included (for JSON format and HTML/CSS)
        const technicalRequirements = `
Return ONLY valid JSON in this exact format:
{
  "analysis": "Brief analysis of your design approach for this variation",
  "designs": [
    {
      "title": "Design concept name",
      "html": "Complete HTML with inline CSS for the card"
    }
  ]
}

CRITICAL JSON FORMATTING:
- The HTML string MUST be properly escaped for JSON
- Escape all backslashes: \\ becomes \\\\
- Escape all double quotes: " becomes \\"
- Escape all newlines: actual newlines become \\n
- Escape all tabs: actual tabs become \\t
- Do NOT use backticks (\`) in the HTML - they break JSON parsing
- Use regular quotes for HTML attributes

The HTML should be self-contained with all CSS inline or in <style> tags. Use the exact dimensions provided (${dimensions.width}x${dimensions.height}px). Ensure the HTML is valid and displays properly when rendered.`;

        // Default prompt content (varies based on batch mode)
        const designInstruction = isBatchMode
            ? `You are a social media card designer. Create EXACTLY ${numberOfDesigns} design variations for a social media card based on this blog post.`
            : `You are a social media card designer. Create a single unique design variation (design #${designNumber} of ${numberOfDesigns}) for a social media card based on this blog post.`;

        const uniquenessInstruction = isBatchMode
            ? `IMPORTANT: You MUST create EXACTLY ${numberOfDesigns} different designs. Do not create more or fewer.`
            : `IMPORTANT: Create ONE unique design. Make it distinctly different from typical social media cards. Be creative with the layout, color scheme, and visual approach.`;

        const defaultPromptContent = `${designInstruction}

Blog post title: ${title}

Blog post summary: ${summary}

Card dimensions: ${dimensions.width}x${dimensions.height}px

${uniquenessInstruction}

Requirements:

CONTENT & HIERARCHY:
- Use the title and summary to craft the most compelling message - what would make someone stop scrolling?
- Use MAXIMUM 10 words total (preferably 5-7) - be ruthlessly concise
- Put the most important message first and largest
- Be specific, not generic (e.g., "5 Python Mistakes" not "Python Tips")
- Use size and weight to establish hierarchy: larger/bolder = more important

TYPOGRAPHY (CRITICAL):
- Minimum 60-80px font size for headlines on 1200x630px canvas (scale proportionally for other sizes)
- Use bold/heavy font weights - avoid thin fonts that disappear at thumbnail size
- Limit to 2-3 font weights maximum
- High contrast text: minimum 4.5:1 ratio for body text, 3:1 for large text (WCAG AA)
- Use system fonts or Google Fonts only

COLOR & CONTRAST:
- Design will be viewed at thumbnail size on mobile - high contrast is essential
- Avoid low-contrast "aesthetic" choices that fail accessibility
- Be careful with gradients - they can look muddy when compressed
- ${isBatchMode ? 'Each design should have a distinct color scheme' : 'Use a distinct color scheme'}

COMPOSITION:
- Leave generous breathing room - don't cram elements
- Keep critical elements at least 50px from edges (safe zones for platform cropping)
- Balance text and visual elements - neither should overwhelm
- ${isBatchMode ? `Create visual variety across all ${numberOfDesigns} designs (different layouts, not just color swaps)` : 'Create a unique layout (try different approaches like split screen, centered, asymmetric, etc.)'}

TECHNICAL:
- Use exact dimensions: ${dimensions.width}x${dimensions.height}px
- Self-contained HTML with all CSS inline or in <style> tags
- Ensure designs look good when compressed (avoid fine details that blur)

AVOID:
- More than 10 words of text
- Thin/light fonts
- Low contrast text
- Placing text near edges
- Generic stock imagery
- Using background-clip: text or -webkit-background-clip: text (not supported in PNG export - use solid colors instead)${isBatchMode ? '\n- Making all designs look too similar' : ''}`;

        // Build the final prompt based on mode
        if (promptMode === 'append' && customInstructions.trim()) {
            // Append mode: default prompt + custom instructions + technical requirements
            const processedInstructions = replaceVariables(customInstructions);
            return `${defaultPromptContent}

ADDITIONAL INSTRUCTIONS:
${processedInstructions}

${technicalRequirements}`;
        } else if (promptMode === 'custom' && customInstructions.trim()) {
            // Custom mode: custom instructions (with variables replaced) + technical requirements
            const processedInstructions = replaceVariables(customInstructions);
            return `${processedInstructions}

${technicalRequirements}`;
        } else {
            // Default mode: original prompt
            return `${defaultPromptContent}

${technicalRequirements}`;
        }
    }

    async summarizeBlogPost(blogContent: string, onModelSelected?: (modelName: string) => void, debugCallback?: (message: string) => void, cancellationToken?: vscode.CancellationToken): Promise<BlogSummary> {
        // Get all available models and find the best mini model
        const allModels = await vscode.lm.selectChatModels();

        if (allModels.length === 0) {
            throw new Error('No language models available. Please ensure GitHub Copilot is active.');
        }

        // Look for mini models in order of preference
        // Priority: gpt-5-mini > gpt-4o-mini > any other mini model > first available model
        let model: vscode.LanguageModelChat | undefined;

        // Helper function to get most recent version of models
        const getMostRecent = (models: vscode.LanguageModelChat[]) => {
            return models.sort((a, b) => {
                const dateRegex = /(\d{4}-\d{2}-\d{2})/;
                const dateA = a.id.match(dateRegex)?.[1];
                const dateB = b.id.match(dateRegex)?.[1];

                if (dateA && dateB) {
                    return dateB.localeCompare(dateA); // Most recent first
                }
                return b.id.localeCompare(a.id);
            })[0];
        };

        // First priority: GPT-5 mini
        const gpt5MiniModels = allModels.filter(m => {
            const family = m.family?.toLowerCase() || '';
            const id = m.id?.toLowerCase() || '';
            return (family.includes('gpt-5') || family.includes('gpt5') || id.includes('gpt-5') || id.includes('gpt5')) &&
                   (family.includes('mini') || id.includes('mini'));
        });

        if (gpt5MiniModels.length > 0) {
            model = getMostRecent(gpt5MiniModels);
        }

        // Second priority: GPT-4o mini
        if (!model) {
            const gpt4oMiniModels = allModels.filter(m => {
                const family = m.family?.toLowerCase() || '';
                const id = m.id?.toLowerCase() || '';
                return (family.includes('gpt-4o') || id.includes('gpt-4o')) &&
                       (family.includes('mini') || id.includes('mini'));
            });

            if (gpt4oMiniModels.length > 0) {
                model = getMostRecent(gpt4oMiniModels);
            }
        }

        // Third priority: any other mini model
        if (!model) {
            const anyMiniModels = allModels.filter(m => {
                const family = m.family?.toLowerCase() || '';
                const id = m.id?.toLowerCase() || '';
                return family.includes('mini') || id.includes('mini');
            });

            if (anyMiniModels.length > 0) {
                model = getMostRecent(anyMiniModels);
            }
        }

        // Last resort: use the first available model
        if (!model) {
            model = allModels[0];
            console.warn('No mini model found, using fallback model:', model.id);
        }

        console.log(`Using model for summarization: ${model.id} (${model.family})`);

        // Get model name and notify via callback if provided
        const modelName = model.name || model.id || model.family || 'Unknown model';
        if (onModelSelected) {
            onModelSelected(modelName);
        }

        const prompt = `Analyze this blog post and extract:
1. A clear, compelling title (5-10 words max)
2. A concise summary that captures the main points (2-3 sentences)

Blog post content:
${blogContent}

Return ONLY valid JSON in this exact format:
{
  "title": "The extracted or refined title",
  "summary": "A 2-3 sentence summary of the key points"
}`;

        console.log('=== SUMMARIZATION PROMPT ===');
        console.log(prompt);
        console.log('=== END PROMPT ===');

        // Send prompt to debug console immediately (before API call)
        if (debugCallback) {
            debugCallback(`\n=== Step 1: Summarization ===\nModel: ${modelName}\n\n--- Prompt ---\n${prompt}\n\n--- Response ---\n`);
        }

        const messages = [vscode.LanguageModelChatMessage.User(prompt)];

        try {
            // Wrap the API call in retry logic
            const fullResponse = await this.retryApiCall(async () => {
                const response = await model.sendRequest(
                    messages,
                    {},
                    cancellationToken || new vscode.CancellationTokenSource().token
                );

                let text = '';
                let streamedToDebug = false;
                for await (const fragment of response.text) {
                    text += fragment;
                    // Only stream the first part to debug console (stop after we see opening brace)
                    if (!streamedToDebug && debugCallback) {
                        debugCallback(fragment);
                        // Stop streaming to debug once we hit the JSON response
                        if (text.includes('{')) {
                            debugCallback('... [JSON response received, rendering designs]\n');
                            streamedToDebug = true;
                        }
                    }
                }
                return text;
            }, 3, cancellationToken);

            console.log('=== SUMMARIZATION RESPONSE ===');
            console.log(fullResponse);
            console.log('=== END RESPONSE ===');

            // Extract JSON from response
            let jsonText = fullResponse;

            // Remove markdown code fences if present
            const codeFenceMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (codeFenceMatch) {
                jsonText = codeFenceMatch[1];
            }

            // Find JSON object
            const jsonMatch = jsonText.match(/\{[\s\S]*?\}/);
            if (!jsonMatch) {
                throw new Error('Invalid response format from summarization. Could not find JSON.');
            }

            const summary: BlogSummary = this.parseJsonWithFallback(jsonMatch[0]);

            if (!summary.title || !summary.summary) {
                throw new Error('Summarization did not return title and summary');
            }

            // Add the model name to the summary
            summary.modelName = modelName;

            console.log('=== PARSED SUMMARY ===');
            console.log('Title:', summary.title);
            console.log('Summary:', summary.summary);
            console.log('Model:', summary.modelName);
            console.log('=== END PARSED SUMMARY ===');

            return summary;
        } catch (err) {
            // Check if cancellation was requested
            if (cancellationToken?.isCancellationRequested) {
                console.log('Summarization cancelled by user');
                throw new vscode.CancellationError();
            }

            if (err instanceof vscode.LanguageModelError) {
                // Check if the error message indicates cancellation
                const errMsg = err.message.toLowerCase();
                if (errMsg.includes('cancel') || errMsg.includes('abort')) {
                    console.log('Summarization cancelled (detected from error message)');
                    throw new vscode.CancellationError();
                }

                console.error('Language Model Error during summarization:', err);
                throw new Error(`Summarization Error: ${err.message}`);
            }
            throw err;
        }
    }

    private async generateDesignsSeparately(
        title: string,
        summary: string,
        dimensions: { width: number; height: number },
        numberOfDesigns: number,
        model: vscode.LanguageModelChat | undefined,
        progressCallback?: (current: number, total: number) => void,
        designCallback?: (design: CardDesign) => void,
        debugCallback?: (message: string) => void,
        cancellationToken?: vscode.CancellationToken,
        chatMessage?: string,
        modelInfo?: ModelInfo
    ): Promise<CardDesign[]> {
        const designs: CardDesign[] = [];

        console.log(`Generating ${numberOfDesigns} designs separately for better quality`);

        if (debugCallback) {
            const modelName = modelInfo?.name || model?.name || model?.id || model?.family || 'Unknown model';
            debugCallback(`\n=== Step 2: Design Generation (Separate Requests) ===\nModel: ${modelName}\nGenerating ${numberOfDesigns} designs with separate API calls\n`);
        }

        for (let i = 0; i < numberOfDesigns; i++) {
            // Report progress
            if (progressCallback) {
                progressCallback(i + 1, numberOfDesigns);
            }

            // Start timing
            const startTime = performance.now();

            // Craft prompt for a single design
            const designNumber = i + 1;
            const prompt = this.buildDesignPrompt(title, summary, dimensions, designNumber, numberOfDesigns, false, chatMessage);

            console.log(`=== DESIGN GENERATION PROMPT (${designNumber}/${numberOfDesigns}) ===`);
            console.log(prompt);
            console.log('=== END PROMPT ===');

            // Send prompt immediately (before API call)
            if (debugCallback) {
                debugCallback(`\n--- Request ${designNumber}/${numberOfDesigns} ---\n${prompt}\n`);

                // Show user guidance if provided via chat
                if (chatMessage) {
                    debugCallback(`\n=== ADDITIONAL USER GUIDANCE ===\n${chatMessage}\n`);
                }

                debugCallback(`\n--- Response ${designNumber}/${numberOfDesigns} ---\n`);
            }

            const messages = [vscode.LanguageModelChatMessage.User(prompt)];

            try {
                // Wrap the API call in retry logic
                const fullResponse = await this.retryApiCall(async () => {
                    const text = await this.sendModelRequest(prompt, model, modelInfo, cancellationToken);

                    // Stream to debug if available (for CLI, this happens after completion)
                    if (debugCallback) {
                        const previewText = text.substring(0, Math.min(100, text.length));
                        debugCallback(previewText);
                        if (text.includes('{')) {
                            debugCallback('... [JSON response received, rendering design]\n');
                        }
                    }

                    return text;
                }, 3, cancellationToken);

                console.log(`=== DESIGN GENERATION RESPONSE (${designNumber}/${numberOfDesigns}) ===`);
                console.log(fullResponse);
                console.log('=== END RESPONSE ===');

                // Extract JSON from response
                let jsonText = fullResponse;

                // Remove markdown code fences if present
                const codeFenceMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (codeFenceMatch) {
                    jsonText = codeFenceMatch[1];
                }

                // Find JSON object
                const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error(`Invalid response format for design ${designNumber}. Could not find JSON.`);
                }

                const result: GenerationResult = this.parseJsonWithFallback(jsonMatch[0]);

                if (!result.designs || result.designs.length === 0) {
                    throw new Error(`No design generated for design ${designNumber}`);
                }

                // Add the first design from the response
                const design = result.designs[0];

                // Calculate generation time
                const endTime = performance.now();
                design.generationTime = Math.round(endTime - startTime);

                designs.push(design);

                console.log(`Design ${designNumber}: ${design.title}`);
                console.log(`HTML length: ${design.html.length} characters`);
                console.log(`Generation time: ${design.generationTime}ms`);

                // Stream the design immediately to the callback
                if (designCallback) {
                    designCallback(design);
                }
            } catch (err) {
                // Check if cancellation was requested
                if (cancellationToken?.isCancellationRequested) {
                    console.log(`Design generation cancelled by user at design ${designNumber}`);
                    throw new vscode.CancellationError();
                }

                if (err instanceof vscode.LanguageModelError) {
                    // Check if the error message indicates cancellation
                    const errMsg = err.message.toLowerCase();
                    if (errMsg.includes('cancel') || errMsg.includes('abort')) {
                        console.log(`Design generation cancelled (detected from error message) at design ${designNumber}`);
                        throw new vscode.CancellationError();
                    }

                    console.error(`Language Model Error for design ${designNumber}:`, err);
                    throw new Error(`Language Model Error for design ${designNumber}: ${err.message}`);
                }
                throw err;
            }
        }

        console.log(`=== COMPLETED SEPARATE DESIGN GENERATION ===`);
        console.log(`Total designs generated: ${designs.length}`);
        console.log('=== END ===');

        return designs;
    }

    async generateDesigns(
        title: string,
        summary: string,
        dimensions: { width: number; height: number },
        numberOfDesigns?: number,
        selectedModel?: vscode.LanguageModelChat,
        progressCallback?: (current: number, total: number) => void,
        designCallback?: (design: CardDesign) => void,
        debugCallback?: (message: string) => void,
        cancellationToken?: vscode.CancellationToken,
        chatMessage?: string,
        modelInfo?: ModelInfo
    ): Promise<CardDesign[]> {
        // Get configured number of designs if not provided
        if (!numberOfDesigns) {
            const config = vscode.workspace.getConfiguration('socialCardGenerator');
            numberOfDesigns = config.get<number>('numberOfDesigns', 5);
        }

        // Use provided model or fallback to selecting Copilot model
        let model: vscode.LanguageModelChat | undefined;
        if (selectedModel) {
            model = selectedModel;
        } else if (!modelInfo?.isCli) {
            // Only fetch a model if we're not using CLI
            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
                family: 'gpt-4o'
            });

            if (models.length === 0) {
                throw new Error('No language models available. Please ensure GitHub Copilot is active.');
            }

            model = models[0];
        }

        // Determine if we should use separate requests
        const config = vscode.workspace.getConfiguration('socialCardGenerator');
        const useSeparateForPremium = config.get<boolean>('useSeparateRequestsForPremiumModels', false);

        // Check if model is from OpenAI (always use separate requests) or if user opted in for premium
        // For CLI providers, always use separate requests
        const isOpenAI = model?.vendor === 'copilot'; // GitHub Copilot uses OpenAI models which are free
        const isCli = modelInfo?.isCli === true;
        const shouldUseSeparateRequests = isOpenAI || useSeparateForPremium || isCli;

        console.log(`Model vendor: ${model?.vendor || 'CLI'}, Using separate requests: ${shouldUseSeparateRequests}`);

        if (shouldUseSeparateRequests && numberOfDesigns > 1) {
            // Generate designs separately for better quality
            return this.generateDesignsSeparately(
                title,
                summary,
                dimensions,
                numberOfDesigns,
                model,
                progressCallback,
                designCallback,
                debugCallback,
                cancellationToken,
                chatMessage,
                modelInfo
            );
        }

        // Fall back to batched request (original behavior)

        // Craft prompt using the helper (batch mode)
        const prompt = this.buildDesignPrompt(title, summary, dimensions, 1, numberOfDesigns, true, chatMessage);

        console.log('=== DESIGN GENERATION PROMPT ===');
        console.log(prompt);
        console.log('=== END PROMPT ===');

        // Send prompt immediately (before API call)
        if (debugCallback) {
            const modelName = modelInfo?.name || model?.name || model?.id || model?.family || 'Unknown model';
            debugCallback(`\n=== Step 2: Design Generation (Batch Mode) ===\nModel: ${modelName}\nGenerating ${numberOfDesigns} designs in one request\n`);
            debugCallback(`\n--- Prompt ---\n${prompt}\n`);

            // Show user guidance if provided via chat
            if (chatMessage) {
                debugCallback(`\n=== ADDITIONAL USER GUIDANCE ===\n${chatMessage}\n`);
            }
        }

        const messages = [vscode.LanguageModelChatMessage.User(prompt)];

        // Start timing
        const startTime = performance.now();

        try {
            // Wrap the API call in retry logic
            const fullResponse = await this.retryApiCall(async () => {
                const text = await this.sendModelRequest(prompt, model, modelInfo, cancellationToken);

                // Stream to debug if available (for CLI, this happens after completion)
                if (debugCallback) {
                    const previewText = text.substring(0, Math.min(100, text.length));
                    debugCallback(previewText);
                    if (text.includes('{')) {
                        debugCallback('... [JSON response received, rendering designs]\n');
                    }
                }

                return text;
            }, 3, cancellationToken);

            console.log('=== DESIGN GENERATION RESPONSE ===');
            console.log(fullResponse);
            console.log('=== END RESPONSE ===');

            // Try to extract JSON from the response
            // Look for JSON between code fences or raw JSON
            let jsonText = fullResponse;

            // Remove markdown code fences if present
            const codeFenceMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (codeFenceMatch) {
                jsonText = codeFenceMatch[1];
            }

            // Find JSON object
            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid response format from LLM. Could not find JSON.');
            }

            const result: GenerationResult = this.parseJsonWithFallback(jsonMatch[0]);

            if (!result.designs || result.designs.length === 0) {
                throw new Error('No designs generated by the LLM');
            }

            // Calculate generation time and add to all designs (batched request)
            const endTime = performance.now();
            const generationTime = Math.round(endTime - startTime);

            console.log('=== PARSED DESIGNS ===');
            console.log('Analysis:', result.analysis);
            console.log('Number of designs:', result.designs.length);
            result.designs.forEach((design, index) => {
                design.generationTime = generationTime; // All designs in batch have same time
                console.log(`Design ${index + 1}: ${design.title}`);
                console.log(`HTML length: ${design.html.length} characters`);
            });
            console.log(`Total generation time: ${generationTime}ms`);
            console.log('=== END PARSED DESIGNS ===');

            return result.designs;
        } catch (err) {
            // Check if cancellation was requested
            if (cancellationToken?.isCancellationRequested) {
                console.log('Design generation cancelled by user');
                throw new vscode.CancellationError();
            }

            if (err instanceof vscode.LanguageModelError) {
                // Check if the error message indicates cancellation
                const errMsg = err.message.toLowerCase();
                if (errMsg.includes('cancel') || errMsg.includes('abort')) {
                    console.log('Design generation cancelled (detected from error message)');
                    throw new vscode.CancellationError();
                }

                console.error('Language Model Error:', err);
                throw new Error(`Language Model Error: ${err.message}`);
            }
            throw err;
        }
    }

    async modifyDesigns(
        currentDesigns: CardDesign[],
        modificationRequest: string,
        dimensions: { width: number; height: number },
        selectedModel?: vscode.LanguageModelChat,
        cancellationToken?: vscode.CancellationToken,
        debugCallback?: (message: string) => void,
        modelInfo?: ModelInfo
    ): Promise<CardDesign[]> {
        // Use provided model or fallback to selecting Copilot model
        let model: vscode.LanguageModelChat | undefined;
        if (selectedModel) {
            model = selectedModel;
        } else if (!modelInfo?.isCli) {
            // Only fetch a model if we're not using CLI
            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
                family: 'gpt-4o'
            });

            if (models.length === 0) {
                throw new Error('No language models available. Please ensure GitHub Copilot is active.');
            }

            model = models[0];
        }

        // Create context about current designs
        const designsContext = currentDesigns.map((design, index) =>
            `Design ${index + 1}: ${design.title}\nHTML:\n${design.html}`
        ).join('\n\n---\n\n');

        // Craft prompt for modification
        const prompt = `You are a social media card designer. The user has requested modifications to existing designs.

Current designs:
${designsContext}

Card dimensions: ${dimensions.width}x${dimensions.height}px

User's modification request:
${modificationRequest}

IMPORTANT:
1. Parse the user's request carefully to understand which design(s) they want to modify and what changes they want
2. If they mention a specific design number (e.g., "design 3" or "the third one"), modify ONLY that design
3. If they say "all designs" or don't specify, apply the changes to ALL designs
4. Keep all other design properties intact unless specifically asked to change them
5. Return the COMPLETE set of designs (modified ones in their new form, unchanged ones as-is)

Requirements for modified designs:

CONTENT & HIERARCHY:
- Use the title and summary to craft the most compelling message - what would make someone stop scrolling?
- Use MAXIMUM 10 words total (preferably 5-7) - be ruthlessly concise
- Put the most important message first and largest
- Be specific, not generic (e.g., "5 Python Mistakes" not "Python Tips")
- Use size and weight to establish hierarchy: larger/bolder = more important

TYPOGRAPHY (CRITICAL):
- Minimum 60-80px font size for headlines on 1200x630px canvas (scale proportionally for other sizes)
- Use bold/heavy font weights - avoid thin fonts that disappear at thumbnail size
- Limit to 2-3 font weights maximum
- High contrast text: minimum 4.5:1 ratio for body text, 3:1 for large text (WCAG AA)
- Use system fonts or Google Fonts only

COLOR & CONTRAST:
- Design will be viewed at thumbnail size on mobile - high contrast is essential
- Avoid low-contrast "aesthetic" choices that fail accessibility
- Be careful with gradients - they can look muddy when compressed
- Each design should have a distinct color scheme

COMPOSITION:
- Leave generous breathing room - don't cram elements
- Keep critical elements at least 50px from edges (safe zones for platform cropping)
- Balance text and visual elements - neither should overwhelm

TECHNICAL:
- Use exact dimensions: ${dimensions.width}x${dimensions.height}px
- Self-contained HTML with all CSS inline or in <style> tags
- Ensure designs look good when compressed (avoid fine details that blur)

AVOID:
- More than 10 words of text
- Thin/light fonts
- Low contrast text
- Placing text near edges
- Generic stock imagery

Return ONLY valid JSON in this exact format:
{
  "analysis": "Brief explanation of what changes you made and to which design(s)",
  "designs": [
    {
      "title": "Design concept name",
      "html": "Complete HTML with inline CSS for the card"
    }
  ]
}

CRITICAL JSON FORMATTING:
- The HTML string MUST be properly escaped for JSON
- Escape all backslashes: \\ becomes \\\\
- Escape all double quotes: " becomes \\"
- Escape all newlines: actual newlines become \\n
- Escape all tabs: actual tabs become \\t
- Do NOT use backticks (\`) in the HTML - they break JSON parsing
- Use regular quotes for HTML attributes

The HTML should be self-contained with all CSS inline or in <style> tags. Use the exact dimensions provided (${dimensions.width}x${dimensions.height}px). Ensure the HTML is valid and displays properly when rendered.`;

        console.log('=== DESIGN MODIFICATION PROMPT ===');
        console.log(prompt);
        console.log('=== END PROMPT ===');

        // Send prompt immediately (before API call)
        if (debugCallback) {
            const modelName = modelInfo?.name || model?.name || model?.id || model?.family || 'Unknown model';
            debugCallback(`\n=== Design Modification ===\nModel: ${modelName}\n`);
            debugCallback(`\n=== USER REDESIGN REQUEST ===\n${modificationRequest}\n`);
            debugCallback(`\n--- Prompt ---\n${prompt}\n`);
            debugCallback(`\n--- Response ---\n`);
        }

        const messages = [vscode.LanguageModelChatMessage.User(prompt)];

        // Start timing
        const startTime = performance.now();

        try {
            // Wrap the API call in retry logic
            const fullResponse = await this.retryApiCall(async () => {
                const text = await this.sendModelRequest(prompt, model, modelInfo, cancellationToken);

                // Stream to debug if available (for CLI, this happens after completion)
                if (debugCallback) {
                    const previewText = text.substring(0, Math.min(100, text.length));
                    debugCallback(previewText);
                    if (text.includes('{')) {
                        debugCallback('... [JSON response received, rendering designs]\n');
                    }
                }

                return text;
            }, 3, cancellationToken);

            console.log('=== DESIGN MODIFICATION RESPONSE ===');
            console.log(fullResponse);
            console.log('=== END RESPONSE ===');

            // Try to extract JSON from the response
            let jsonText = fullResponse;

            // Remove markdown code fences if present
            const codeFenceMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (codeFenceMatch) {
                jsonText = codeFenceMatch[1];
            }

            // Find JSON object
            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid response format from LLM. Could not find JSON.');
            }

            const result: GenerationResult = this.parseJsonWithFallback(jsonMatch[0]);

            if (!result.designs || result.designs.length === 0) {
                throw new Error('No designs generated by the LLM');
            }

            // Calculate generation time and add to all designs
            const endTime = performance.now();
            const generationTime = Math.round(endTime - startTime);

            console.log('=== PARSED MODIFIED DESIGNS ===');
            console.log('Analysis:', result.analysis);
            console.log('Number of designs:', result.designs.length);
            result.designs.forEach((design, index) => {
                design.generationTime = generationTime; // Add generation time to each design
                console.log(`Design ${index + 1}: ${design.title}`);
                console.log(`HTML length: ${design.html.length} characters`);
            });
            console.log(`Generation time: ${generationTime}ms`);
            console.log('=== END PARSED MODIFIED DESIGNS ===');

            return result.designs;
        } catch (err) {
            // Check if cancellation was requested
            if (cancellationToken?.isCancellationRequested) {
                console.log('Design modification cancelled by user');
                throw new vscode.CancellationError();
            }

            if (err instanceof vscode.LanguageModelError) {
                // Check if the error message indicates cancellation
                const errMsg = err.message.toLowerCase();
                if (errMsg.includes('cancel') || errMsg.includes('abort')) {
                    console.log('Design modification cancelled (detected from error message)');
                    throw new vscode.CancellationError();
                }

                console.error('Language Model Error:', err);
                throw new Error(`Language Model Error: ${err.message}`);
            }
            throw err;
        }
    }
}
