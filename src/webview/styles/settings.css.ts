export function getStyles(): string {
    return `
        /* Settings view styles */
        .settings-view {
            display: none;
        }

        .settings-view.active {
            display: block;
        }

        .settings-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
        }

        .settings-back-btn {
            padding: 8px;
            background: none;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background-color 0.2s;
        }

        .settings-back-btn:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .settings-section {
            margin-bottom: 24px;
            padding: 16px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 8px;
            border: 1px solid var(--vscode-panel-border);
        }

        .settings-section h3 {
            margin: 0 0 16px 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }

        .settings-option {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
        }

        .settings-option:last-child {
            margin-bottom: 0;
        }

        .settings-option label {
            font-size: 13px;
            font-weight: 500;
            color: var(--vscode-foreground);
        }

        .settings-option .description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: -4px;
        }

        .settings-option input[type="number"] {
            width: 100%;
            max-width: 200px;
            padding: 8px 10px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 13px;
        }

        .settings-option input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        .settings-option select {
            width: 100%;
            max-width: 400px;
            padding: 8px 10px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
        }

        .settings-option select:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }

        .settings-option textarea {
            width: 100%;
            padding: 10px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-family: var(--vscode-editor-font-family);
            font-size: 13px;
            line-height: 1.5;
            resize: vertical;
            min-height: 100px;
        }

        .settings-option textarea:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }

        .settings-option .hint-text {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            margin-top: 4px;
        }

        .settings-option .description code {
            background-color: var(--vscode-textCodeBlock-background);
            color: var(--vscode-textPreformat-foreground);
            padding: 2px 5px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 11px;
        }

        .checkbox-wrapper {
            display: flex;
            align-items: center;
            gap: 10px;
        }
    `;
}
