export function getStyles(): string {
    return `
        .dimension-picker {
            margin-top: 0;
            margin-bottom: 16px;
        }

        .preset-buttons {
            display: flex;
            gap: 12px;
            margin-bottom: 15px;
            align-items: flex-end;
            justify-content: center;
            flex-wrap: nowrap;
        }

        .preset-btn {
            padding: 16px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            color: var(--vscode-foreground);
            border: 2px solid rgba(128, 128, 128, 0.2);
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
            font-size: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s ease;
            flex: 0 0 auto;
        }

        .preset-btn[data-width="1200"] {
            width: 180px;
            height: 95px;
        }

        .preset-btn[data-width="1080"] {
            width: 130px;
            height: 130px;
        }

        .preset-btn[data-width="1000"] {
            width: 100px;
            height: 150px;
        }

        .preset-btn.custom {
            width: 120px;
            height: 110px;
            border-style: dashed;
        }

        /* Hide custom button when there's not enough space (prevents wrapping) */
        @media (max-width: 700px) {
            .preset-btn.custom {
                display: none;
            }

            /* Also hide custom dimensions input when button is hidden */
            .custom-dimensions {
                display: none !important;
            }
        }

        .preset-btn:hover {
            background-color: var(--vscode-list-hoverBackground);
            border-color: var(--vscode-focusBorder);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .preset-btn:active {
            transform: translateY(0);
        }

        .preset-btn.selected {
            background-color: var(--vscode-button-secondaryBackground);
            border: 2px solid var(--vscode-focusBorder);
            opacity: 0.7;
        }

        .preset-btn strong {
            font-size: 13px;
            font-weight: 600;
            color: var(--vscode-textLink-foreground);
            line-height: 1.2;
        }

        .preset-btn .dimensions {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            line-height: 1;
        }

        .preset-btn .ratio {
            font-size: 18px;
            font-weight: 500;
            color: var(--vscode-foreground);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .custom-dimensions {
            display: flex;
            gap: 8px;
            align-items: center;
            margin-top: 12px;
            padding: 12px;
            background-color: var(--vscode-editor-background);
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
        }

        .custom-dimensions.hidden {
            display: none;
        }

        .custom-dimensions label {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            font-weight: 500;
        }

        .custom-dimensions input {
            width: 90px;
            padding: 8px 10px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 13px;
            font-weight: 500;
            text-align: center;
        }

        .custom-dimensions input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }

        .dimension-separator {
            font-size: 16px;
            color: var(--vscode-descriptionForeground);
            margin-top: 18px;
        }
    `;
}
