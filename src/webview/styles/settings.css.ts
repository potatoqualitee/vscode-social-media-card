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

        /* Bottom actions for settings */
        .settings-bottom-actions {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: center;
        }

        .settings-back-btn-bottom {
            padding: 10px 20px;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            transition: background-color 0.2s;
        }

        .settings-back-btn-bottom:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        /* Token Usage Slider - Elegant & Minimal */
        .slider-container {
            margin-top: 24px;
            padding: 0;
        }

        .slider-labels {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 0 2px;
        }

        .slider-label {
            font-size: 11px;
            font-weight: 400;
            color: var(--vscode-descriptionForeground);
            text-align: center;
            transition: all 0.2s ease;
            user-select: none;
            opacity: 0.6;
        }

        .slider-label.active {
            color: var(--vscode-foreground);
            font-weight: 500;
            opacity: 1;
        }

        /* Wrapper for slider track */
        .slider-track-wrapper {
            position: relative;
            height: 24px;
            display: flex;
            align-items: center;
            margin-bottom: 4px;
        }

        .token-slider {
            -webkit-appearance: none;
            width: 100%;
            height: 2px;
            background: var(--vscode-input-border);
            outline: none;
            cursor: pointer;
            position: relative;
            transition: all 0.2s ease;
        }

        .token-slider:hover {
            height: 3px;
        }

        .token-slider:focus {
            outline: none;
        }

        /* Webkit Slider Thumb */
        .token-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 7px;
            background: var(--vscode-foreground);
            cursor: pointer;
            border: 2px solid var(--vscode-editor-background);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            transition: all 0.15s ease;
        }

        .token-slider::-webkit-slider-thumb:hover {
            transform: scale(1.15);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
        }

        .token-slider::-webkit-slider-thumb:active {
            transform: scale(1.05);
        }

        /* Firefox Slider Thumb */
        .token-slider::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border-radius: 7px;
            background: var(--vscode-foreground);
            cursor: pointer;
            border: 2px solid var(--vscode-editor-background);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            transition: all 0.15s ease;
        }

        .token-slider::-moz-range-thumb:hover {
            transform: scale(1.15);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
        }

        .token-slider::-moz-range-thumb:active {
            transform: scale(1.05);
        }

        /* Firefox track */
        .token-slider::-moz-range-track {
            background: var(--vscode-input-border);
            border: none;
            height: 2px;
        }

        /* Subtle tick marks */
        .slider-ticks {
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            transform: translateY(-50%);
            display: flex;
            justify-content: space-between;
            padding: 0 calc(50% / 3);
            pointer-events: none;
        }

        .slider-ticks .tick {
            width: 1px;
            height: 8px;
            background-color: var(--vscode-input-border);
            opacity: 0.4;
        }

        /* Subtle progress indicator */
        .slider-track-wrapper::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            height: 2px;
            background: var(--vscode-foreground);
            opacity: 0.15;
            transition: width 0.2s ease;
            pointer-events: none;
        }

        /* Dynamic width based on slider value */
        .slider-track-wrapper[data-value="0"]::before { width: 0%; }
        .slider-track-wrapper[data-value="1"]::before { width: 33.33%; }
        .slider-track-wrapper[data-value="2"]::before { width: 66.66%; }
        .slider-track-wrapper[data-value="3"]::before { width: 100%; }
    `;
}
