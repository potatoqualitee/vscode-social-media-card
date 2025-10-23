export function getStyles(): string {
    return `
        .design-card {
            margin: 20px 0;
            padding: 0;
            background-color: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .design-card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            transform: translateY(-2px);
        }

        .design-card-header {
            padding: 20px 24px;
            background: linear-gradient(135deg, var(--vscode-editor-background) 0%, var(--vscode-sideBar-background) 100%);
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }

        .design-card-title {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 0;
            flex: 1;
            min-width: 0;
        }

        .design-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 6px;
            font-size: 14px;
            font-weight: 700;
            flex-shrink: 0;
        }

        .design-name {
            font-size: 18px;
            font-weight: 600;
            color: var(--vscode-foreground);
            line-height: 1.3;
            letter-spacing: -0.01em;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .design-header-actions {
            display: flex;
            gap: 6px;
            flex-shrink: 0;
        }

        .design-card-body {
            padding: 24px;
            position: relative;
        }

        .design-card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding: 0;
        }

        .generation-time {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 400;
            line-height: 1.4;
            white-space: nowrap;
            height: 26px;
            background-color: transparent;
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
        }

        .generation-time-placeholder {
            width: 1px;
            height: 1px;
        }

        .design-preview {
            margin: 0 auto 20px auto;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 6px;
            overflow: hidden;
            background: white;
            position: relative;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            max-width: 100%;
            cursor: pointer;
            transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .design-preview:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            transform: translateY(-2px);
        }

        .preview-wrapper {
            transform-origin: top left;
            position: relative;
        }

        .design-preview iframe {
            border: none;
            display: block;
            overflow: hidden;
            pointer-events: none;
        }

        .design-actions {
            display: none;
        }

        .design-code {
            display: none;
            margin-top: 10px;
        }

        .design-code.visible {
            display: block;
        }

        .design-code textarea {
            width: 100%;
            min-height: 200px;
            padding: 10px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            resize: vertical;
        }
    `;
}
