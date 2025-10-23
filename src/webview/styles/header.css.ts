export function getStyles(): string {
    return `
        /* Professional Page Header */
        .page-header {
            margin-bottom: 18px;
            padding-bottom: 16px;
            border-bottom: 2px solid transparent;
            background: linear-gradient(to right,
                var(--vscode-panel-border) 0%,
                var(--vscode-panel-border) 60%,
                transparent 100%) bottom / 100% 2px no-repeat;
        }

        .header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 8px;
        }

        .header-title-row {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 1;
            min-width: 0;
            overflow: hidden;
        }

        .header-icon-inline {
            font-size: 28px;
            color: var(--vscode-textLink-foreground);
            opacity: 0.9;
            flex-shrink: 0;
        }

        .header-title {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            line-height: 1.2;
            color: var(--vscode-foreground);
            letter-spacing: -0.03em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .header-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-button-foreground);
            background-color: var(--vscode-button-background);
            border-radius: 4px;
            white-space: nowrap;
        }

        /* Generate button in header */
        .header-top #generate-btn {
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            min-width: auto;
            margin: 0;
            flex-shrink: 0;
        }

        .header-description {
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
            color: var(--vscode-descriptionForeground);
            font-weight: 400;
            max-width: 500px;
        }

        /* Hide subtitle when space is constrained */
        @media (max-width: 400px) {
            .header-description {
                display: none;
            }
        }

        @container (max-width: 400px) {
            .header-description {
                display: none;
            }
        }
    `;
}
