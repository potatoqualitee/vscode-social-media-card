import * as vscode from 'vscode';
import { CardGeneratorProvider } from './CardGeneratorProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Social Card Generator extension is now active');

    const provider = new CardGeneratorProvider(context.extensionUri, context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'socialCardView',
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );
}

export function deactivate() {}
