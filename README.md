# Social Media Card Generator

Generate beautiful social media cards for your blog posts using AI, powered by your GitHub Copilot subscription.

## Features

- **AI-Powered Design**: Uses GitHub Copilot to analyze your blog posts and generate multiple design variations
- **Multiple Platforms**: Presets for Standard OG (1200×630), Instagram (1080×1080), Pinterest (1000×1500)
- **Custom Dimensions**: Set any custom dimensions you need
- **Live Preview**: See designs rendered in real-time before exporting
- **Export to PNG**: High-quality PNG export using in-browser rendering (no external dependencies)
- **Editable HTML**: Tweak the generated HTML/CSS before exporting

## Requirements

- **VS Code**: Version 1.95.0 or higher
- **GitHub Copilot**: Active subscription required for AI design generation

That's it! No external browsers or dependencies needed for PNG export.

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile the extension:
   ```bash
   npm run compile
   ```

3. Run the extension:
   - Press `F5` in VS Code to launch the Extension Development Host
   - Or use the "Run Extension" launch configuration

## Usage

1. **Open a blog post**: Open any markdown or text file with your blog post content
2. **Open Social Cards view**: Click the Social Cards icon in the Activity Bar
3. **Select dimensions**: Choose a preset or enter custom dimensions
4. **Set number of variations**: Adjust the "Variations" field (1-10 designs, default is 5)
5. **Generate designs**: Click "Generate Designs" button
6. **Preview**: View the AI-generated designs in the preview area
7. **Edit (optional)**: Click "View/Edit HTML" to customize the design
8. **Export**: Click "Export to PNG" to save the design as an image

## How It Works

### Architecture

- **Activity Bar Icon**: Provides quick access to the extension
- **Webview Sidebar**: Interactive UI for dimension selection and preview
- **Language Model API**: Leverages GitHub Copilot (GPT-4o) for design generation
- **html2canvas**: In-browser HTML to PNG conversion (no external dependencies)

### Key Components

- `extension.ts`: Main extension activation and registration
- `CardGeneratorProvider.ts`: Webview provider with html2canvas integration
- `CardGenerator.ts`: AI/LLM integration for design generation
- `ScreenshotService.ts`: Saves base64 image data to disk

## Output

Generated PNG files are saved to the `social-cards` folder in your workspace root with the naming format:

```
card-{width}x{height}-{timestamp}.png
```

Example: `card-1200x630-1234567890.png`

## Configuration

You can customize the extension's behavior through VS Code settings or the UI:

### Number of Designs

Control how many design variations are generated (1-10):

**Option 1: UI Control (Easiest)**
- In the Social Cards sidebar, adjust the "Variations" field under "Number of Designs"
- The value is saved and will be used when you click "Generate Designs"

**Option 2: VS Code Settings**
1. Open VS Code Settings (Ctrl+, or Cmd+,)
2. Search for "Social Card Generator"
3. Set `socialCardGenerator.numberOfDesigns` to your preferred number (1-10)
4. This value is used as the default when the extension loads

**Examples:**
- Set to 3 for quick iterations
- Set to 5 for good variety (default)
- Set to 10 for maximum options

## Troubleshooting

### "No language models available"

- Ensure GitHub Copilot extension is installed and active
- Check that you have an active Copilot subscription
- Try reloading the VS Code window

### "No workspace folder open"

- Open a folder in VS Code before generating cards
- The extension needs a workspace to save exported images

## Development

### Build Commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile on save)
npm run watch

# Lint
npm run lint
```

### Project Structure

```
.
├── src/
│   ├── extension.ts              # Main entry point
│   ├── CardGeneratorProvider.ts  # Webview provider
│   ├── CardGenerator.ts          # AI integration
│   └── ScreenshotService.ts      # Screenshot capture
├── resources/
│   └── icon.svg                  # Activity bar icon
├── package.json                  # Extension manifest
└── tsconfig.json                 # TypeScript config
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Credits

Built with:
- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Language Model API](https://code.visualstudio.com/api/extension-guides/language-model)
- [html2canvas](https://html2canvas.hertzen.com/)
