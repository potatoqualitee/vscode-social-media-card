// This module generates the complete inline JavaScript for the webview
// Since the webview doesn't support ES modules, we concatenate everything into one script

export function getMainScript(): string {
    return `
        const vscode = acquireVsCodeApi();

        // ===== STATE MANAGEMENT =====
        let numDesignsFromSettings = 5;
        let loadingAnimationType = 'progress-bar';
        let loadingMessageInterval = null;
        const loadingMessages = [
            'Working', 'Crafting', 'Creating', 'Designing', 'Cooking up',
            'Brewing', 'Building', 'Generating', 'Conjuring', 'Assembling'
        ];
        let currentLoadingIndex = 0;
        let progressStartTime = null;
        let progressInterval = null;
        const MAX_GENERATION_TIME = 90000;
        const OVERTIME_THRESHOLD = MAX_GENERATION_TIME;
        let debugConsoleLines = [];
        let availableModels = [];
        let currentStreamingMessage = null;
        let isGenerating = false;

        // ===== UTILITY FUNCTIONS =====
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function formatTime(ms) {
            const totalSeconds = Math.round(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            if (minutes > 0) {
                return \`\${minutes}m\${seconds}s\`;
            } else {
                return \`\${seconds}s\`;
            }
        }

        function showStatus(message, type) {
            const statusArea = document.getElementById('status-area');
            statusArea.innerHTML = \`
                <div class="status-message \${type === 'error' ? 'error-message' : ''}">
                    \${escapeHtml(message)}
                </div>
            \`;
        }

        function clearStatus() {
            document.getElementById('status-area').innerHTML = '';
        }

        function updateClearButtonState() {
            const clearChatBtn = document.getElementById('clear-chat-btn');
            if (clearChatBtn) {
                const hasChatMessages = document.getElementById('chat-messages').children.length > 0;
                const hasDesigns = document.getElementById('preview-area').children.length > 0;
                clearChatBtn.disabled = !hasChatMessages && !hasDesigns;
            }
        }

        // ===== DIMENSION PICKER =====
        const customDimensionsDiv = document.querySelector('.custom-dimensions');
        const widthInput = document.getElementById('width');
        const heightInput = document.getElementById('height');

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');

                if (btn.dataset.custom) {
                    customDimensionsDiv.classList.remove('hidden');
                } else {
                    customDimensionsDiv.classList.add('hidden');
                    widthInput.value = btn.dataset.width;
                    heightInput.value = btn.dataset.height;
                }
            });
        });

        // ===== GENERATION FUNCTIONS =====
        function updateGenerateButton(enabled, hasDesigns = false) {
            const btn = document.getElementById('generate-btn');
            btn.disabled = !enabled;
            btn.classList.remove('loading');

            if (enabled) {
                if (hasDesigns) {
                    btn.textContent = 'Regenerate Designs';
                } else {
                    btn.textContent = 'Generate Designs';
                }
            } else {
                btn.textContent = 'Open a file to generate designs';
            }
        }

        function startLoadingMessages(stepText) {
            if (loadingMessageInterval) {
                clearInterval(loadingMessageInterval);
            }

            currentLoadingIndex = 0;
            const btn = document.getElementById('generate-btn');
            const message = loadingMessages[currentLoadingIndex];
            btn.innerHTML = \`<span class="spinner"></span><span>\${stepText}: \${message}... This usually takes a minute or two.\`;

            loadingMessageInterval = setInterval(() => {
                currentLoadingIndex = (currentLoadingIndex + 1) % loadingMessages.length;
                const message = loadingMessages[currentLoadingIndex];
                btn.innerHTML = \`<span class="spinner"></span><span>\${stepText}: \${message}... This usually takes a minute or two..</span>\`;
            }, 10000);
        }

        function stopLoadingMessages() {
            if (loadingMessageInterval) {
                clearInterval(loadingMessageInterval);
                loadingMessageInterval = null;
            }
        }

        function showLoadingAnimation(step) {
            const previewArea = document.getElementById('preview-area');

            if (loadingAnimationType === 'progress-bar') {
                previewArea.innerHTML = \`
                    <div class="loading-container">
                        <div class="progress-bar-container">
                            <div class="progress-bar-title">Generating designs</div>
                            <div class="progress-bar-wrapper">
                                <div class="progress-bar-fill" id="progress-fill"></div>
                            </div>
                            <div class="progress-bar-time" id="progress-time">This usually takes a minute or two..</div>
                            <div class="progress-bar-overtime" id="overtime-message" style="display: none;"></div>
                        </div>
                    </div>
                \`;

                progressStartTime = Date.now();
                if (progressInterval) clearInterval(progressInterval);

                progressInterval = setInterval(() => {
                    const elapsed = Date.now() - progressStartTime;
                    const percentage = Math.min((elapsed / MAX_GENERATION_TIME) * 100, 100);

                    const fillEl = document.getElementById('progress-fill');
                    const timeEl = document.getElementById('progress-time');
                    const overtimeEl = document.getElementById('overtime-message');

                    if (fillEl) {
                        fillEl.style.width = percentage + '%';
                    }

                    if (timeEl) {
                        if (elapsed < 30000) {
                            timeEl.innerHTML = 'This usually takes a minute or two.....';
                        } else if (elapsed < 60000) {
                            timeEl.textContent = 'Still working on it...';
                        } else if (elapsed < 90000) {
                            timeEl.textContent = 'Should be done soon...';
                        } else if (elapsed < OVERTIME_THRESHOLD) {
                            timeEl.textContent = 'Almost there...';
                        } else {
                            timeEl.textContent = 'Taking longer than usual...';
                        }
                    }

                    if (elapsed > OVERTIME_THRESHOLD && overtimeEl && overtimeEl.style.display === 'none') {
                        overtimeEl.textContent = 'Oh wow, this is taking foreverrrr... but good things take time!';
                        overtimeEl.style.display = 'block';
                    }
                }, 100);
            } else {
                previewArea.innerHTML = \`
                    <div class="loading-container">
                        <div class="debug-console" id="debug-console-content"></div>
                    </div>
                \`;
                debugConsoleLines = [];
            }
        }

        function hideLoadingAnimation() {
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
            progressStartTime = null;
        }

        function addDebugLine(message) {
            const consoleContent = document.getElementById('debug-console-content');
            if (consoleContent) {
                consoleContent.textContent += message;
                consoleContent.scrollTop = consoleContent.scrollHeight;
            }
        }

        // Generate button
        document.getElementById('generate-btn').addEventListener('click', () => {
            // If currently generating, stop the generation
            if (isGenerating) {
                // STEP 1: Set flag to false FIRST - this blocks all incoming backend messages immediately
                isGenerating = false;

                // STEP 2: Clear ALL UI elements synchronously (instant, no waiting)
                const btn = document.getElementById('generate-btn');
                const previewArea = document.getElementById('preview-area');
                const progressBar = document.getElementById('generation-progress-bar');

                // Clear preview area (removes progress bar HTML entirely)
                previewArea.innerHTML = '';

                // Hide and reset progress bar element
                progressBar.classList.add('hidden');
                progressBar.classList.remove('active');

                // Stop all intervals immediately
                stopLoadingMessages();
                hideLoadingAnimation();

                // Reset button to normal state
                btn.classList.remove('loading', 'stop-mode');
                updateGenerateButton(true, false);

                // Clear status
                clearStatus();
                updateClearButtonState();

                // STEP 3: Send cancellation to backend (fire and forget, don't wait for response)
                vscode.postMessage({ type: 'cancel-generation' });

                // STEP 4: Show brief cancellation message
                showStatus('Cancelled', 'info');
                setTimeout(clearStatus, 1500);

                return;
            }

            // Otherwise, start generation
            const width = parseInt(document.getElementById('width').value);
            const height = parseInt(document.getElementById('height').value);
            const numDesigns = numDesignsFromSettings;

            if (!width || !height || width < 100 || height < 100) {
                showStatus('Please enter valid dimensions (minimum 100x100)', 'error');
                return;
            }

            if (!numDesigns || numDesigns < 1 || numDesigns > 10) {
                showStatus('Please check the Number of Designs setting (should be 1-10)', 'error');
                return;
            }

            isGenerating = true;
            const btn = document.getElementById('generate-btn');
            btn.classList.add('loading', 'stop-mode');
            btn.innerHTML = '<span class="codicon codicon-debug-stop"></span><span>Stop Generation</span>';
            document.getElementById('preview-area').innerHTML = '';
            clearStatus();
            updateClearButtonState();

            vscode.postMessage({
                type: 'generate',
                dimensions: { width, height },
                numDesigns: numDesigns
            });
        });

        // ===== DESIGN FUNCTIONS =====
        function displayDesigns(designs) {
            const previewArea = document.getElementById('preview-area');

            if (!designs || designs.length === 0) {
                previewArea.innerHTML = '<p>No designs generated.</p>';
                updateClearButtonState();
                return;
            }

            previewArea.innerHTML = '';

            designs.forEach((design, index) => {
                const card = document.createElement('div');
                card.className = 'design-card';

                const width = parseInt(document.getElementById('width').value);
                const height = parseInt(document.getElementById('height').value);

                const containerPadding = 48;
                const containerWidth = previewArea.offsetWidth - containerPadding;
                const maxPreviewWidth = Math.min(600, containerWidth);
                const scale = Math.min(maxPreviewWidth / width, 1);
                const scaledWidth = width * scale;
                const scaledHeight = height * scale;

                card.innerHTML = \`
                    <div class="design-card-header">
                        <div class="design-card-title">
                            <span class="design-number">\${index + 1}</span>
                            <span class="design-name">\${escapeHtml(design.title)}</span>
                        </div>
                        <div class="design-header-actions">
                            <button class="export-btn" title="Export this design as a PNG image">
                                <span class="codicon codicon-desktop-download"></span>
                                Export as PNG
                            </button>
                        </div>
                    </div>
                    <div class="design-card-body">
                        <div class="design-preview preview-clickable" data-index="\${index}" style="width: \${scaledWidth}px; height: \${scaledHeight}px; cursor: pointer;" title="Click to open larger preview">
                            <div class="preview-wrapper" style="transform: scale(\${scale}); width: \${width}px; height: \${height}px;">
                                <iframe
                                    id="preview-\${index}"
                                    width="\${width}"
                                    height="\${height}"
                                    scrolling="no"
                                    sandbox="allow-same-origin allow-scripts"
                                    style="pointer-events: none;"
                                ></iframe>
                            </div>
                        </div>
                        <div class="design-code" id="code-\${index}">
                            <textarea id="html-\${index}">\${escapeHtml(design.html)}</textarea>
                        </div>
                        <div class="design-card-footer">
                            <button class="toggle-code-btn" onclick="toggleCode(\${index})" title="View or edit the HTML source code">
                                <span class="codicon codicon-code"></span>
                                View/Edit HTML
                            </button>
                            \${design.generationTime ? \`<div class="generation-time">time taken: \${formatTime(design.generationTime)}</div>\` : '<div class="generation-time-placeholder"></div>'}
                        </div>
                    </div>
                \`;

                previewArea.appendChild(card);

                const iframe = document.getElementById(\`preview-\${index}\`);
                if (iframe) {
                    iframe.srcdoc = design.html;
                }

                // Add click handler to the preview container (not iframe, since iframe clicks don't bubble)
                const previewContainer = card.querySelector('.preview-clickable');
                if (previewContainer) {
                    previewContainer.addEventListener('click', async () => {
                        // Convert the design to an image and open in a new tab
                        const imageData = await convertToImage(index);
                        if (imageData) {
                            const width = parseInt(document.getElementById('width').value);
                            const height = parseInt(document.getElementById('height').value);
                            vscode.postMessage({
                                type: 'open-preview',
                                imageData: imageData,
                                dimensions: { width, height }
                            });
                        }
                    });
                }
            });

            updateClearButtonState();
        }


        function toggleCode(index) {
            const codeDiv = document.getElementById(\`code-\${index}\`);
            const toggleBtn = event.target.closest('.toggle-code-btn');

            if (codeDiv) {
                const isExpanded = codeDiv.classList.toggle('visible');
                if (toggleBtn) {
                    if (isExpanded) {
                        toggleBtn.classList.add('expanded');
                        toggleBtn.setAttribute('title', 'Hide the HTML source code');
                    } else {
                        toggleBtn.classList.remove('expanded');
                        toggleBtn.setAttribute('title', 'View or edit the HTML source code');
                    }
                }
            }
        }

        // ===== EXPORT FUNCTIONS =====
        async function convertToImage(index) {
            const iframe = document.getElementById(\`preview-\${index}\`);

            if (!iframe || !iframe.contentDocument) {
                showStatus('Preview not found', 'error');
                return null;
            }

            const width = parseInt(document.getElementById('width').value);
            const height = parseInt(document.getElementById('height').value);

            try {
                // Capture the iframe's body directly - no DOM manipulation needed!
                const iframeBody = iframe.contentDocument.body;

                if (!iframeBody) {
                    showStatus('Preview content not loaded', 'error');
                    return null;
                }

                const canvas = await html2canvas(iframeBody, {
                    width: width,
                    height: height,
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    windowWidth: width,
                    windowHeight: height
                });

                const imageData = canvas.toDataURL('image/png');
                return imageData;
            } catch (error) {
                showStatus('Conversion failed: ' + error.message, 'error');
                console.error('Conversion error:', error);
                return null;
            }
        }

        async function exportDesign(index) {
            try {
                showStatus('Converting design to image...', 'info');

                const imageData = await convertToImage(index);
                if (!imageData) {
                    return;
                }

                const width = parseInt(document.getElementById('width').value);
                const height = parseInt(document.getElementById('height').value);

                // Get the design title for filename suggestion
                const designCard = document.querySelectorAll('.design-card')[index];
                const titleElement = designCard?.querySelector('.design-name');
                const designTitle = titleElement?.textContent || \`Design \${index + 1}\`;

                vscode.postMessage({
                    type: 'export-png',
                    imageData: imageData,
                    dimensions: { width, height },
                    designIndex: index,
                    designTitle: designTitle
                });

                showStatus('Exporting...', 'info');
            } catch (error) {
                showStatus('Export failed: ' + error.message, 'error');
                console.error('Export error:', error);
            }
        }

        // Event delegation for export buttons
        document.getElementById('preview-area').addEventListener('click', function(e) {
            const exportBtn = e.target.closest('.export-btn');
            if (exportBtn) {
                const designCard = exportBtn.closest('.design-card');
                const allCards = Array.from(document.querySelectorAll('.design-card'));
                const index = allCards.indexOf(designCard);
                if (index !== -1) {
                    exportDesign(index);
                }
            }
        });

        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                const previewArea = document.getElementById('preview-area');
                if (previewArea && previewArea.children.length > 0) {
                    const designs = [];
                    let index = 0;
                    while (true) {
                        const textarea = document.getElementById(\`html-\${index}\`);
                        if (!textarea) break;

                        const designCard = textarea.closest('.design-card');
                        const titleElement = designCard?.querySelector('.design-name');
                        const title = titleElement?.textContent || \`Design \${index + 1}\`;

                        const timeElement = designCard?.querySelector('.generation-time');
                        let generationTime = undefined;
                        if (timeElement) {
                            const timeText = timeElement.textContent || '';
                            const match = timeText.match(/(\\d+)m(\\d+)s|(\\d+)s/);
                            if (match) {
                                if (match[1] && match[2]) {
                                    generationTime = parseInt(match[1]) * 60000 + parseInt(match[2]) * 1000;
                                } else if (match[3]) {
                                    generationTime = parseInt(match[3]) * 1000;
                                }
                            }
                        }

                        designs.push({
                            title: title,
                            html: textarea.value,
                            generationTime: generationTime
                        });
                        index++;
                    }

                    if (designs.length > 0) {
                        displayDesigns(designs);
                    }
                }
            }, 250);
        });

        // ===== CHAT FUNCTIONS =====
        const chatInput = document.getElementById('chat-input');
        const sendChatBtn = document.getElementById('send-chat-btn');
        const chatMessagesContainer = document.getElementById('chat-messages');
        const agentSelect = document.getElementById('agent-select');

        vscode.postMessage({ type: 'request-models' });

        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            sendChatBtn.disabled = this.value.trim().length === 0;
        });

        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendChatBtn.disabled) {
                    sendChatMessage();
                }
            }
        });

        sendChatBtn.addEventListener('click', sendChatMessage);

        agentSelect.addEventListener('change', function() {
            const selectedModelId = this.value;
            if (selectedModelId) {
                vscode.postMessage({
                    type: 'select-model',
                    modelId: selectedModelId
                });
            }
        });

        document.getElementById('attach-btn').addEventListener('click', function() {
            showStatus('Attach context - coming soon!', 'info');
        });

        document.getElementById('clear-chat-btn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (!this.dataset.confirming) {
                this.dataset.confirming = 'true';
                this.style.border = '2px solid var(--vscode-focusBorder)';
                const originalText = this.innerHTML;
                this.innerHTML = '<span class="codicon codicon-trash"></span> Click again to confirm';

                setTimeout(() => {
                    this.dataset.confirming = '';
                    this.style.border = '';
                    this.innerHTML = originalText;
                }, 3000);
                return;
            }

            this.dataset.confirming = '';
            this.style.border = '';
            this.innerHTML = '<span class="codicon codicon-trash"></span> Clear';

            chatMessagesContainer.innerHTML = '';
            chatMessagesContainer.classList.add('hidden');
            currentStreamingMessage = null;

            document.getElementById('preview-area').innerHTML = '';
            updateGenerateButton(true, false);
            vscode.postMessage({ type: 'clear-chat' });
            updateClearButtonState();

            showStatus('Chat and design output cleared', 'info');
            setTimeout(clearStatus, 2000);
        });

        updateClearButtonState();

        function sendChatMessage() {
            const message = chatInput.value.trim();
            if (!message) return;

            // Check if there are no designs yet - if so, treat this as a generate request with append mode
            const previewArea = document.getElementById('preview-area');
            const hasDesigns = previewArea && previewArea.children.length > 0;

            if (!hasDesigns) {
                // Clear the input
                chatInput.value = '';
                chatInput.style.height = 'auto';
                sendChatBtn.disabled = true;

                // Trigger generation flow with chat message (this will show progress bar/debug)
                isGenerating = true;
                const btn = document.getElementById('generate-btn');
                btn.classList.add('loading', 'stop-mode');
                btn.innerHTML = '<span class="codicon codicon-debug-stop"></span><span>Stop Generation</span>';
                previewArea.innerHTML = '';
                clearStatus();
                updateClearButtonState();

                const width = parseInt(document.getElementById('width').value);
                const height = parseInt(document.getElementById('height').value);
                const numDesigns = numDesignsFromSettings;

                vscode.postMessage({
                    type: 'generate',
                    dimensions: { width, height },
                    numDesigns: numDesigns,
                    chatMessage: message
                });
                return;
            }

            // If designs exist, treat chat as a modification request
            chatInput.value = '';
            chatInput.style.height = 'auto';
            sendChatBtn.disabled = true;

            // Mark as generating for modification
            isGenerating = true;

            // Only show editing notification in debug mode
            if (loadingAnimationType === 'debug-console') {
                const statusArea = document.getElementById('status-area');
                statusArea.innerHTML = \`
                    <div class="editing-notification">
                        <span class="codicon codicon-sync codicon-modifier-spin"></span>
                        Editing designs...
                    </div>
                \`;
            }

            // Show the thin progress bar
            const progressBar = document.getElementById('generation-progress-bar');
            progressBar.classList.remove('hidden');
            progressBar.classList.remove('active');
            void progressBar.offsetWidth; // Force reflow
            progressBar.classList.add('active');

            // Send modification request
            vscode.postMessage({
                type: 'modify-designs',
                message: message
            });
        }

        function updateModelsDropdown(models, selectedModelId, isLoading) {
            agentSelect.innerHTML = '';

            if (isLoading) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Loading models...';
                agentSelect.appendChild(option);
                agentSelect.disabled = true;
                return;
            }

            if (!models || models.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No models available - Sign in to GitHub Copilot';
                agentSelect.appendChild(option);
                agentSelect.disabled = true;
                sendChatBtn.disabled = true;
                return;
            }

            agentSelect.disabled = false;

            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                if (model.id === selectedModelId) {
                    option.selected = true;
                }
                // Disable separator option
                if (model.id === '---separator---') {
                    option.disabled = true;
                }
                agentSelect.appendChild(option);
            });

            availableModels = models;
        }

        function addChatMessage(role, content, isTyping = false) {
            if (chatMessagesContainer.classList.contains('hidden')) {
                chatMessagesContainer.classList.remove('hidden');
            }

            const typingIndicator = chatMessagesContainer.querySelector('.typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }

            const messageDiv = document.createElement('div');
            messageDiv.className = \`chat-message \${role}\`;
            if (isTyping) {
                messageDiv.classList.add('typing-indicator');
            }

            const label = role === 'user' ? 'You' : (agentSelect.options[agentSelect.selectedIndex]?.text || 'Assistant');

            messageDiv.innerHTML = \`
                <div class="message-label">\${label}</div>
                <div class="message-content">\${escapeHtml(content)}</div>
            \`;

            chatMessagesContainer.appendChild(messageDiv);
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
            updateClearButtonState();

            return messageDiv;
        }

        function updateStreamingMessage(messageDiv, content) {
            if (messageDiv) {
                const contentDiv = messageDiv.querySelector('.message-content');
                if (contentDiv) {
                    contentDiv.textContent = content;
                }
                chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
            }
        }

        // ===== SETTINGS =====
        const settingsView = document.querySelector('.settings-view');
        const mainView = document.querySelector('.main-view');

        document.getElementById('settings-btn').addEventListener('click', function() {
            mainView.classList.add('hidden');
            settingsView.classList.add('active');
            vscode.postMessage({ type: 'get-settings' });
        });

        document.getElementById('settings-back-btn').addEventListener('click', function() {
            settingsView.classList.remove('active');
            mainView.classList.remove('hidden');
        });

        // Bottom back button (same functionality)
        document.getElementById('settings-back-btn-bottom').addEventListener('click', function() {
            settingsView.classList.remove('active');
            mainView.classList.remove('hidden');
        });

        document.getElementById('num-designs').addEventListener('change', function() {
            const value = parseInt(this.value);
            if (value >= 1 && value <= 10) {
                vscode.postMessage({
                    type: 'update-setting',
                    key: 'numberOfDesigns',
                    value: value
                });
                numDesignsFromSettings = value;
            }
        });

        document.getElementById('separate-requests').addEventListener('change', function() {
            vscode.postMessage({
                type: 'update-setting',
                key: 'useSeparateRequestsForPremiumModels',
                value: this.checked
            });
        });

        document.getElementById('loading-animation').addEventListener('change', function() {
            const value = this.value;
            loadingAnimationType = value;
            vscode.postMessage({
                type: 'update-setting',
                key: 'loadingAnimation',
                value: value
            });
        });

        document.getElementById('prompt-mode').addEventListener('change', function() {
            const value = this.value;
            vscode.postMessage({
                type: 'update-setting',
                key: 'promptMode',
                value: value
            });
            updatePromptModeUI(value);
        });

        let instructionsTimeout;
        document.getElementById('custom-instructions').addEventListener('input', function() {
            clearTimeout(instructionsTimeout);
            instructionsTimeout = setTimeout(() => {
                vscode.postMessage({
                    type: 'update-setting',
                    key: 'customPromptInstructions',
                    value: this.value
                });
            }, 500);
        });

        function updatePromptModeUI(mode) {
            const instructionsContainer = document.getElementById('custom-instructions-container');
            const instructionsDescription = document.getElementById('instructions-description');

            if (mode === 'default') {
                instructionsContainer.style.display = 'none';
            } else {
                instructionsContainer.style.display = 'flex';

                if (mode === 'append') {
                    instructionsDescription.innerHTML = 'Add extra direction to the default prompt. This will be added before the technical requirements.';
                } else if (mode === 'custom') {
                    instructionsDescription.innerHTML = 'Write your own prompt using template variables: <code>{{title}}</code>, <code>{{summary}}</code>, <code>{{width}}</code>, <code>{{height}}</code>, <code>{{designNumber}}</code>, <code>{{numberOfDesigns}}</code>';
                }
            }
        }

        // ===== MESSAGE HANDLER =====
        window.addEventListener('message', event => {
            const message = event.data;

            switch (message.type) {
                case 'update-button-state':
                    stopLoadingMessages();
                    updateGenerateButton(message.enabled, message.hasDesigns);
                    break;
                case 'generating':
                    // Ignore generating messages if we're not in generating mode (cancelled)
                    if (!isGenerating) {
                        break;
                    }

                    const btn = document.getElementById('generate-btn');
                    const progressBar = document.getElementById('generation-progress-bar');

                    if (loadingAnimationType === 'debug-console' && !document.getElementById('debug-console-content')) {
                        const previewArea = document.getElementById('preview-area');
                        previewArea.innerHTML = \`<div class="debug-console" id="debug-console-content"></div>\`;
                    }

                    // Show progress bar/animation for BOTH steps (summarization and design generation)
                    if (loadingAnimationType === 'progress-bar') {
                        // Determine title based on step or action
                        let progressTitle;
                        if (message.status.includes('Step 1/2')) {
                            progressTitle = 'Summarizing blog post';
                        } else if (message.status.includes('Modifying')) {
                            progressTitle = 'Redesigning';
                        } else {
                            progressTitle = 'Generating designs';
                        }

                        // If this is the first status update, show the loading animation
                        if (!document.getElementById('progress-fill')) {
                            showLoadingAnimation(progressTitle);
                        } else {
                            // Update the title if it exists
                            const titleEl = document.querySelector('.progress-bar-title');
                            if (titleEl) {
                                titleEl.textContent = progressTitle;
                            }
                        }
                    } else {
                        progressBar.classList.remove('hidden');
                        progressBar.classList.remove('active');
                        void progressBar.offsetWidth;
                        progressBar.classList.add('active');
                    }

                    // Keep button in stop mode
                    btn.classList.add('loading', 'stop-mode');
                    btn.innerHTML = '<span class="codicon codicon-debug-stop"></span><span>Stop Generation</span>';
                    break;
                case 'debug-message':
                    // Ignore debug messages if we're not in generating mode (cancelled)
                    if (!isGenerating) {
                        break;
                    }
                    if (loadingAnimationType === 'debug-console') {
                        addDebugLine(message.message);
                    }
                    break;
                case 'design-update':
                    // Ignore design updates if we're not in generating mode (cancelled)
                    if (!isGenerating) {
                        break;
                    }
                    hideLoadingAnimation();
                    displayDesigns(message.designs);
                    break;
                case 'designs':
                    // Only process if we're still generating (not cancelled)
                    if (!isGenerating) {
                        break;
                    }
                    isGenerating = false;
                    stopLoadingMessages();
                    hideLoadingAnimation();

                    // Hide the thin progress bar
                    document.getElementById('generation-progress-bar').classList.add('hidden');
                    document.getElementById('generation-progress-bar').classList.remove('active');

                    const designBtn = document.getElementById('generate-btn');
                    designBtn.classList.remove('loading', 'stop-mode');
                    updateGenerateButton(true, true);
                    clearStatus();
                    displayDesigns(message.designs);

                    // Re-enable the chat input (for modifications)
                    sendChatBtn.disabled = chatInput.value.trim().length === 0;
                    break;
                case 'error':
                    // Always clean up UI state on errors, even if generation was already stopped
                    // This ensures progress bars are cleared for late-arriving errors (e.g., 400 responses)
                    isGenerating = false;
                    stopLoadingMessages();
                    hideLoadingAnimation();

                    // Hide the thin progress bar
                    document.getElementById('generation-progress-bar').classList.add('hidden');
                    document.getElementById('generation-progress-bar').classList.remove('active');

                    const errorBtn = document.getElementById('generate-btn');
                    errorBtn.classList.remove('loading', 'stop-mode');
                    updateGenerateButton(true);
                    showStatus(message.message, 'error');

                    // Re-enable the chat input
                    sendChatBtn.disabled = chatInput.value.trim().length === 0;
                    break;
                case 'generation-complete':
                    // Only process if we're still generating (not cancelled)
                    if (!isGenerating) {
                        break;
                    }
                    isGenerating = false;
                    stopLoadingMessages();
                    hideLoadingAnimation();
                    document.getElementById('generation-progress-bar').classList.add('hidden');
                    document.getElementById('generation-progress-bar').classList.remove('active');
                    const completeBtn = document.getElementById('generate-btn');
                    completeBtn.classList.remove('loading', 'stop-mode');
                    updateGenerateButton(message.success);

                    // Re-enable the chat input
                    sendChatBtn.disabled = chatInput.value.trim().length === 0;
                    break;
                case 'screenshot-progress':
                    showStatus(message.status, 'info');
                    break;
                case 'screenshot-complete':
                    clearStatus();
                    break;
                case 'export-complete':
                    if (message.success) {
                        // Success is silent - just clear the "Converting..." message
                        clearStatus();
                    } else if (message.message && message.message !== 'Export cancelled') {
                        // Only show actual errors (not cancellation)
                        showStatus(message.message, 'error');
                    } else {
                        // Cancelled - silent
                        clearStatus();
                    }
                    break;
                case 'current-settings':
                    document.getElementById('num-designs').value = message.settings.numberOfDesigns;
                    document.getElementById('separate-requests').checked = message.settings.useSeparateRequestsForPremiumModels;
                    document.getElementById('prompt-mode').value = message.settings.promptMode || 'default';
                    document.getElementById('custom-instructions').value = message.settings.customPromptInstructions || '';
                    document.getElementById('loading-animation').value = message.settings.loadingAnimation || 'progress-bar';
                    loadingAnimationType = message.settings.loadingAnimation || 'progress-bar';
                    updatePromptModeUI(message.settings.promptMode || 'default');
                    break;
                case 'models-updated':
                    updateModelsDropdown(message.models, message.selectedModelId, message.isLoading);
                    break;
                case 'model-selected':
                    chatMessagesContainer.innerHTML = '';
                    chatMessagesContainer.classList.add('hidden');
                    currentStreamingMessage = null;
                    updateClearButtonState();
                    break;
                case 'conversation-cleared':
                    updateClearButtonState();
                    break;
                case 'chat-response-stream':
                    if (currentStreamingMessage) {
                        currentStreamingMessage.classList.remove('typing-indicator');
                        updateStreamingMessage(currentStreamingMessage, message.content);
                    }
                    break;
                case 'chat-response':
                    if (currentStreamingMessage) {
                        currentStreamingMessage.classList.remove('typing-indicator');
                        updateStreamingMessage(currentStreamingMessage, message.content);
                        currentStreamingMessage = null;
                    } else {
                        addChatMessage('assistant', message.content);
                    }
                    break;
                case 'num-designs-setting':
                    if (message.numDesigns) {
                        numDesignsFromSettings = message.numDesigns;
                    }
                    break;
            }
        });
    `;
}
