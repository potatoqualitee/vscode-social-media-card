import * as vscode from 'vscode';
import * as styles from './styles';
import * as components from './components';
import { getMainScript } from './scripts';

/**
 * Generates the HTML content for the main webview
 */
export function getWebviewHtml(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Social Card Generator</title>
        <link rel="stylesheet" href="https://microsoft.github.io/vscode-codicons/dist/codicon.css">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        <style>
            ${styles.getAllStyles()}
        </style>
    </head>
    <body>
        ${components.getBodyContent()}
        <script>
            ${getMainScript()}
        </script>
    </body>
    </html>`;
}
