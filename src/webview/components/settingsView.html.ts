export function getSettingsView(): string {
    return `
        <!-- Settings View -->
        <div class="main-content settings-view">
            <div class="settings-header">
                <button class="settings-back-btn" id="settings-back-btn" title="Back">
                    <span class="codicon codicon-arrow-left"></span>
                </button>
                <h2 style="margin: 0;">Settings</h2>
            </div>

            <div class="settings-section">
                <h3>Token Usage & Quality</h3>
                <div class="settings-option">
                    <label for="token-usage-level">Token Usage Level</label>
                    <div class="description">Balance between token/API costs and design quality. Slide right for better quality but higher costs.</div>
                    <div class="slider-container">
                        <div class="slider-labels">
                            <span class="slider-label" data-level="0">Conservative</span>
                            <span class="slider-label active" data-level="1">Balanced</span>
                            <span class="slider-label" data-level="2">Quality</span>
                            <span class="slider-label" data-level="3">Maximum</span>
                        </div>
                        <div class="slider-track-wrapper" data-value="1">
                            <input type="range" id="token-usage-level" min="0" max="3" step="1" value="1" class="token-slider">
                            <div class="slider-ticks">
                                <span class="tick"></span>
                                <span class="tick"></span>
                                <span class="tick"></span>
                            </div>
                        </div>
                    </div>
                    <div class="hint-text" id="token-usage-description" style="margin-top: 8px;">
                        <strong>Level 1 (Balanced):</strong> Dynamic best practices per post, batched requests, mini model for summary
                    </div>
                </div>
            </div>

            <div class="settings-section">
                <h3>Prompt Customization</h3>
                <div class="settings-option">
                    <label for="prompt-mode">Prompt Mode</label>
                    <div class="description">Choose how to customize the AI design prompt</div>
                    <select id="prompt-mode" class="prompt-mode-select">
                        <option value="default">Default - Use built-in prompt</option>
                        <option value="append">Append - Add custom instructions to default</option>
                        <option value="custom">Custom - Write your own prompt with template variables</option>
                    </select>
                </div>
                <div class="settings-option" id="custom-instructions-container">
                    <label for="custom-instructions">Custom Instructions</label>
                    <div class="description" id="instructions-description">
                        Add extra direction to the default prompt. For custom mode, use template variables: <code>{{title}}</code>, <code>{{summary}}</code>, <code>{{width}}</code>, <code>{{height}}</code>, <code>{{designNumber}}</code>, <code>{{numberOfDesigns}}</code>
                    </div>
                    <textarea id="custom-instructions" class="custom-instructions-textarea" rows="8" placeholder="Enter your custom instructions here..."></textarea>
                    <div class="hint-text">Technical requirements (JSON format, dimensions, HTML/CSS) will be automatically included.</div>
                </div>
            </div>

            <div class="settings-section">
                <h3>Display</h3>
                <div class="settings-option">
                    <label for="loading-animation">Loading Animation</label>
                    <div class="description">Choose what to display in the preview area while generating designs</div>
                    <select id="loading-animation" class="loading-animation-select">
                        <option value="progress-bar">Progress Bar - Fun time estimation</option>
                        <option value="debug-console">Debug Console - Real-time model communication</option>
                    </select>
                </div>
            </div>

            <!-- Bottom Back Button -->
            <div class="settings-bottom-actions">
                <button class="settings-back-btn-bottom" id="settings-back-btn-bottom">
                    <span class="codicon codicon-arrow-left"></span>
                    Back to Chat
                </button>
            </div>
        </div>
    `;
}
