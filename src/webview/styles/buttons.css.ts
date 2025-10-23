export function getStyles(): string {
    return `
        #generate-btn {
            padding: 12px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        }

        #generate-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        #generate-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        #generate-btn.loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            opacity: 1;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        #generate-btn.loading:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        #generate-btn.stop-mode {
            background-color: var(--vscode-inputValidation-errorBackground);
            color: var(--vscode-inputValidation-errorForeground);
            cursor: pointer;
            opacity: 1;
        }

        #generate-btn.stop-mode:hover {
            background-color: var(--vscode-inputValidation-errorBorder);
        }

        #generate-btn.stop-mode .codicon {
            font-size: 16px;
        }

        .spinner {
            width: 14px;
            height: 14px;
            border: 2px solid var(--vscode-descriptionForeground);
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            display: inline-block;
            opacity: 0.6;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .export-btn,
        .toggle-code-btn,
        .refresh-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            padding: 4px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 400;
            line-height: 1.4;
            transition: all 0.15s ease;
            white-space: nowrap;
            outline: none;
            height: 26px;
        }

        .export-btn:focus-visible,
        .toggle-code-btn:focus-visible,
        .refresh-btn:focus-visible {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: 1px;
        }

        .export-btn:active,
        .toggle-code-btn:active,
        .refresh-btn:active {
            transform: scale(0.98);
        }

        .export-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            font-weight: 500;
        }

        .export-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        }

        .export-btn .codicon {
            font-size: 14px;
        }

        .toggle-code-btn {
            background-color: transparent;
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
        }

        .toggle-code-btn:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
            border-color: var(--vscode-contrastBorder);
        }

        .toggle-code-btn .codicon {
            font-size: 14px;
        }

        .toggle-code-btn.expanded {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .refresh-btn {
            background-color: transparent;
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            padding: 4px 8px;
            min-width: unset;
        }

        .refresh-btn:hover:not(:disabled) {
            background-color: var(--vscode-button-secondaryHoverBackground);
            border-color: var(--vscode-contrastBorder);
        }

        .refresh-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .refresh-btn .codicon {
            font-size: 14px;
        }

        .refresh-btn .codicon-modifier-spin {
            animation: spin 1s linear infinite;
        }

        .toggle-code-btn.expanded .codicon-code {
            transform: rotate(90deg);
        }

        .toggle-code-btn .codicon {
            transition: transform 0.2s ease;
        }

        .icon-btn {
            background: none;
            border: none;
            color: var(--vscode-foreground);
            font-size: 14px;
            padding: 4px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.8;
        }

        .icon-btn:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.08);
            opacity: 1;
        }

        .icon-btn:active:not(:disabled) {
            background: rgba(255, 255, 255, 0.15);
        }

        .icon-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .icon-btn .codicon {
            font-size: 16px;
        }

        .chat-action-btn {
            padding: 4px 8px;
            background-color: transparent;
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .chat-action-btn:hover {
            background-color: var(--vscode-toolbar-hoverBackground);
        }

        .chat-action-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
    `;
}
