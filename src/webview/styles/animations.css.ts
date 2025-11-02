export function getStyles(): string {
    return `
        /* GitHub-style inline status */
        #status-area {
            margin-bottom: 16px;
        }

        .status-message {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0;
            margin-bottom: 12px;
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            line-height: 1.5;
            background: none;
            border: none;
        }

        .status-message::before {
            content: '';
            display: inline-block;
            width: 4px;
            height: 4px;
            background-color: var(--vscode-textLink-foreground);
            border-radius: 50%;
            animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
        }

        .error-message {
            color: var(--vscode-errorForeground);
        }

        .error-message::before {
            background-color: var(--vscode-errorForeground);
            animation: none;
        }

        #preview-area {
            margin-top: 24px;
        }

        /* Loading animation styles */
        .loading-container {
            padding: 40px 20px;
            text-align: center;
        }

        .progress-bar-container {
            max-width: 600px;
            margin: 0 auto;
        }

        .progress-bar-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--vscode-foreground);
            margin-bottom: 20px;
        }

        .progress-bar-section {
            margin-bottom: 8px;
        }

        .progress-bar-label {
            font-size: 13px;
            font-weight: 500;
            color: var(--vscode-foreground);
            margin-bottom: 8px;
            opacity: 0.9;
        }

        .progress-bar-wrapper {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            height: 32px;
            overflow: hidden;
            position: relative;
            margin-bottom: 12px;
        }

        .progress-bar-count {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }

        .progress-bar-fill {
            background: var(--vscode-progressBar-background);
            height: 100%;
            width: 0%;
            transition: width 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .progress-bar-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            background: linear-gradient(
                90deg,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, 0.2) 50%,
                rgba(255, 255, 255, 0) 100%
            );
            animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        .progress-bar-time {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 8px;
        }

        .progress-bar-overtime {
            color: var(--vscode-textLink-foreground);
            font-weight: 600;
            font-size: 14px;
            margin-top: 16px;
            animation: fadeInBounce 0.5s ease-out;
        }

        @keyframes fadeInBounce {
            0% { opacity: 0; transform: translateY(-10px); }
            60% { transform: translateY(5px); }
            100% { opacity: 1; transform: translateY(0); }
        }

        .debug-console {
            background: transparent;
            border: none;
            padding: 20px 0;
            margin: 0;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            max-height: 500px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
            color: var(--vscode-descriptionForeground);
            line-height: 1.6;
            text-align: left;
        }
    `;
}
