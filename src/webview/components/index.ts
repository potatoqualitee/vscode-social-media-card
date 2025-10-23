import { getSettingsView } from './settingsView.html';
import { getPageHeader } from './header.html';
import { getDimensionPicker } from './dimensionPicker.html';
import { getMainContent } from './mainContent.html';
import { getChatInterface } from './chatInterface.html';

export function getBodyContent(): string {
    return `
        ${getSettingsView()}
        <div class="main-content main-view">
            ${getPageHeader()}
            ${getDimensionPicker()}
            ${getMainContent()}
        </div>
        ${getChatInterface()}
    `;
}
