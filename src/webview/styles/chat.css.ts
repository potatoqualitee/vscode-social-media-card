export function getStyles(): string {
    return `
        /* Chat interface styles */
        .chat-container {
            border-top: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-sideBar-background);
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            position: relative;
        }

        .generation-progress-bar {
            position: absolute;
            top: 0;
            left: 0;
            height: 2px;
            width: 0%;
            background: var(--vscode-progressBar-background);
            transition: width 0.3s ease-out;
            z-index: 10;
        }

        .generation-progress-bar.active {
            transition: width 150s linear;
            width: 100%;
        }

        .chat-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
        }

        .chat-header label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }

        .agent-selector {
            padding: 4px 8px;
            background-color: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
        }

        .chat-input-wrapper {
            display: flex;
            align-items: flex-end;
        }

        .chat-input-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            overflow: hidden;
        }

        .chat-input-container:focus-within {
            border-color: var(--vscode-focusBorder);
            border-width: 1px;
        }

        .chat-input {
            width: 100%;
            min-height: 36px;
            max-height: 120px;
            padding: 10px;
            background-color: transparent;
            color: var(--vscode-input-foreground);
            border: none;
            outline: none;
            font-family: var(--vscode-font-family);
            font-size: 13px;
            resize: none;
            overflow-y: auto;
        }

        .chat-input::placeholder {
            color: var(--vscode-input-placeholderForeground);
        }

        .chat-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            background: var(--vscode-input-background);
            padding: 8px 10px;
            border-top: 1px solid var(--vscode-widget-border);
            gap: 4px;
        }

        /* Chat messages area */
        .chat-messages {
            margin-top: 20px;
            padding: 15px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
            max-height: 300px;
            overflow-y: auto;
        }

        .chat-message {
            margin-bottom: 12px;
            padding: 10px;
            border-radius: 4px;
        }

        .chat-message.user {
            background-color: var(--vscode-button-secondaryBackground);
        }

        .chat-message.assistant {
            background-color: var(--vscode-editor-background);
        }

        .message-label {
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 4px;
            color: var(--vscode-descriptionForeground);
        }

        .message-content {
            font-size: 13px;
            line-height: 1.5;
        }

        /* Editing notification above chat box */
        .editing-notification {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            font-size: 12px;
            color: var(--vscode-foreground);
            margin-bottom: 8px;
        }

        .editing-notification .codicon {
            font-size: 14px;
        }

        @keyframes spin {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }

        .codicon-modifier-spin {
            animation: spin 1s linear infinite;
        }
    `;
}
