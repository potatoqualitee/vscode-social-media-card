export function getPageHeader(): string {
    return `
        <div class="page-header">
            <div class="header-top">
                <div class="header-title-row">
                    <span class="codicon codicon-sparkle header-icon-inline"></span>
                    <h1 class="header-title">Social Card Generator</h1>
                </div>
                <button id="generate-btn">Generate Designs</button>
            </div>
            <p class="header-description">Generate social media cards from your content</p>
        </div>
    `;
}
