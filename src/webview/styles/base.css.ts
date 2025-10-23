export function getStyles(): string {
    return `
        * {
            box-sizing: border-box;
        }

        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }

        body {
            display: flex;
            flex-direction: column;
        }

        /* Main scrollable content area */
        .main-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 20px;
            padding-bottom: 10px;
        }

        h2 {
            margin-top: 0;
            color: var(--vscode-foreground);
        }

        /* Content divider */
        .content-divider {
            border: none;
            border-top: 1px solid var(--vscode-panel-border);
            margin: 16px 0 24px 0;
            opacity: 0.6;
        }

        .hidden {
            display: none;
        }

        .main-view {
            display: block;
        }

        .main-view.hidden {
            display: none;
        }

        /* Scrollbar styling */
        .main-content::-webkit-scrollbar,
        .chat-messages::-webkit-scrollbar,
        .chat-input::-webkit-scrollbar {
            width: 10px;
        }

        .main-content::-webkit-scrollbar-track,
        .chat-messages::-webkit-scrollbar-track,
        .chat-input::-webkit-scrollbar-track {
            background: var(--vscode-scrollbarSlider-background);
        }

        .main-content::-webkit-scrollbar-thumb,
        .chat-messages::-webkit-scrollbar-thumb,
        .chat-input::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-hoverBackground);
            border-radius: 5px;
        }

        .main-content::-webkit-scrollbar-thumb:hover,
        .chat-messages::-webkit-scrollbar-thumb:hover,
        .chat-input::-webkit-scrollbar-thumb:hover {
            background: var(--vscode-scrollbarSlider-activeBackground);
        }
    `;
}
