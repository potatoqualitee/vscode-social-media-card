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
                <h3>Design Generation</h3>
                <div class="settings-option">
                    <label for="num-designs">Number of Design Variations</label>
                    <div class="description">How many design variations to generate (1-10)</div>
                    <input type="number" id="num-designs" min="1" max="10" value="5">
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
                <h3>Advanced</h3>
                <div class="settings-option">
                    <label for="separate-requests">Premium Model Quality</label>
                    <div class="description">When using premium models (non-OpenAI), generate designs with separate API calls for better quality (slower but higher quality)</div>
                    <div class="checkbox-wrapper">
                        <input type="checkbox" id="separate-requests">
                        <span style="font-size: 12px;">Use separate requests for premium models</span>
                    </div>
                </div>
                <div class="settings-option">
                    <label for="loading-animation">Loading Animation</label>
                    <div class="description">Choose what to display in the preview area while generating designs</div>
                    <select id="loading-animation" class="loading-animation-select">
                        <option value="progress-bar">Progress Bar - Fun time estimation</option>
                        <option value="debug-console">Debug Console - Real-time model communication</option>
                    </select>
                </div>
            </div>
        </div>
    `;
}
