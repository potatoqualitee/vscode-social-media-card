export function getMainContent(): string {
    return `
        <hr class="content-divider">

        <div id="status-area"></div>
        <div id="preview-area"></div>

        <!-- Chat messages history -->
        <div id="chat-messages" class="chat-messages hidden"></div>
    `;
}
