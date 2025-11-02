export function getChatInterface(): string {
    return `
        <!-- Fixed chat input at bottom -->
        <div class="chat-container">
            <div id="generation-progress-bar" class="generation-progress-bar hidden"></div>
            <div class="chat-header">
                <div class="chat-header-group">
                    <label for="agent-select">Model:</label>
                    <select id="agent-select" class="agent-selector">
                        <option value="">Loading models...</option>
                    </select>
                </div>
                <div class="chat-header-group">
                    <label for="num-designs">Designs:</label>
                    <input type="number" id="num-designs" class="num-designs-input" min="1" max="10" value="5" title="Number of design variations to generate (1-10)">
                </div>
                <button id="clear-chat-btn" class="chat-action-btn" title="Clear conversation history" style="margin-left: auto;">
                    <span class="codicon codicon-trash"></span>
                    Clear
                </button>
            </div>
            <div class="chat-input-wrapper">
                <div class="chat-input-container">
                    <textarea
                        id="chat-input"
                        class="chat-input"
                        placeholder="Use this chatbox to provide guidance or request design changes..."
                        rows="1"
                    ></textarea>
                    <div class="chat-actions">
                        <button class="icon-btn" id="attach-btn" title="Attach context">
                            <span class="codicon codicon-paperclip"></span>
                        </button>
                        <button class="icon-btn" id="settings-btn" title="Settings">
                            <span class="codicon codicon-gear"></span>
                        </button>
                        <button id="send-chat-btn" class="icon-btn" disabled title="Send">
                            <span class="codicon codicon-send"></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
