export function getDimensionPicker(): string {
    return `
        <div class="dimension-picker">
            <div class="preset-buttons">
                <button class="preset-btn selected" data-width="1200" data-height="630">
                    <strong>Standard OG</strong>
                    <div class="ratio">1.9:1</div>
                    <div class="dimensions">1200 × 630 px</div>
                </button>
                <button class="preset-btn" data-width="1080" data-height="1080">
                    <strong>Instagram</strong>
                    <div class="ratio">1:1</div>
                    <div class="dimensions">1080 × 1080 px</div>
                </button>
                <button class="preset-btn" data-width="1000" data-height="1500">
                    <strong>Pinterest</strong>
                    <div class="ratio">2:3</div>
                    <div class="dimensions">1000 × 1500 px</div>
                </button>
                <button class="preset-btn custom" data-custom="true">
                    <strong>Custom</strong>
                    <div class="ratio">?</div>
                </button>
            </div>

            <div class="custom-dimensions hidden">
                <label>
                    WIDTH
                    <input type="number" id="width" value="1200" min="100" max="4000">
                </label>
                <span class="dimension-separator">×</span>
                <label>
                    HEIGHT
                    <input type="number" id="height" value="630" min="100" max="4000">
                </label>
            </div>
        </div>
    `;
}
