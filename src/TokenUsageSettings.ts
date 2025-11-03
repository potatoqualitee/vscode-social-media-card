import * as vscode from 'vscode';

export interface TokenUsageSettings {
    bestPracticesMode: 'default' | 'dynamic';
    useSeparateRequestsForPremiumModels: boolean;
    alwaysUseMiniForSummary: boolean;
    skipSummaryStep: boolean;
}

/**
 * Get token usage settings based on the tokenUsageLevel slider
 * Level 0 (Conservative): Minimum tokens
 * Level 1 (Balanced): Dynamic best practices, but still conservative elsewhere
 * Level 2 (Quality): Separate requests, main model for summary
 * Level 3 (Maximum): All quality features + full content
 */
export function getTokenUsageSettings(): TokenUsageSettings {
    const config = vscode.workspace.getConfiguration('socialCardGenerator');
    const tokenUsageLevel = config.get<number>('tokenUsageLevel', 1);

    switch (tokenUsageLevel) {
        case 0: // Conservative - Minimum token usage
            return {
                bestPracticesMode: 'default',
                useSeparateRequestsForPremiumModels: false,
                alwaysUseMiniForSummary: true,
                skipSummaryStep: false
            };
        case 1: // Balanced - Good quality with reasonable tokens
            return {
                bestPracticesMode: 'dynamic',
                useSeparateRequestsForPremiumModels: false,
                alwaysUseMiniForSummary: true,
                skipSummaryStep: false
            };
        case 2: // Quality - Higher quality designs
            return {
                bestPracticesMode: 'dynamic',
                useSeparateRequestsForPremiumModels: true,
                alwaysUseMiniForSummary: false,
                skipSummaryStep: false
            };
        case 3: // Maximum - Best quality, highest token usage
            return {
                bestPracticesMode: 'dynamic',
                useSeparateRequestsForPremiumModels: true,
                alwaysUseMiniForSummary: false,
                skipSummaryStep: true
            };
        default:
            // Default to balanced
            return {
                bestPracticesMode: 'dynamic',
                useSeparateRequestsForPremiumModels: false,
                alwaysUseMiniForSummary: true,
                skipSummaryStep: false
            };
    }
}
