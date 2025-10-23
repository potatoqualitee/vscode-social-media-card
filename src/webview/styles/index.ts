import * as base from './base.css';
import * as header from './header.css';
import * as dimensions from './dimensions.css';
import * as buttons from './buttons.css';
import * as cards from './cards.css';
import * as chat from './chat.css';
import * as settings from './settings.css';
import * as animations from './animations.css';

export function getAllStyles(): string {
    return [
        base.getStyles(),
        header.getStyles(),
        dimensions.getStyles(),
        buttons.getStyles(),
        cards.getStyles(),
        chat.getStyles(),
        settings.getStyles(),
        animations.getStyles()
    ].join('\n');
}
