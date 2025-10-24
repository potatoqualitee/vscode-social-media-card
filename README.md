# Social Media Card Generator

Generate beautiful social media cards for your blog posts using AI, powered by multiple LLM providers including GitHub Copilot, Cursor AI, OpenAI-Compatible APIs, and Ollama.

## Features

- **AI-Powered Design**: Analyze your blog posts and generate multiple design variations using:
  - GitHub Copilot (requires active subscription)
  - Cursor AI (cursor-agent)
  - OpenAI-Compatible APIs (Azure, OpenAI, LM Studio, etc.)
  - Ollama (local or remote models)
- **Multiple Platforms**: Presets for Standard OG (1200×630), Instagram (1080×1080), Pinterest (1000×1500)
- **Custom Dimensions**: Set any custom dimensions you need
- **Live Preview**: See designs rendered in real-time before exporting
- **Export to PNG**: High-quality PNG export using in-browser rendering (no external dependencies)
- **Editable HTML**: Tweak the generated HTML/CSS before exporting
- **Flexible LLM Provider Selection**: Choose your preferred AI model provider

## Requirements

- **VS Code**: Version 1.95.0 or higher
- **One of the following AI providers**:
  - **GitHub Copilot**: Free tier available
  - **Cursor AI**: Free tier available
  - **Google Gemini**: Free tier available
  - **Claude Code**: Subscription required
  - **Ollama**: Free and open-source LLM platform (local or remote instance)
  - **OpenAI API**: API key required (supports OpenAI, Azure, LM Studio, and other compatible APIs)

### Supported CLIs

The extension supports the following command-line interfaces for AI providers:

- **claude**: Anthropic's command-line tool
- **codex**: OpenAI's command-line tool
- **cursor-agent**: Cursor AI's command-line tool
- **gemini**: Google Gemini CLI for accessing Google's models
- **ollama**: Ollama command-line interface for running local models

Each CLI needs to be installed and configured separately. The extension will automatically detect available CLIs in your system PATH.

No external browsers or dependencies are needed for PNG export.

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
- **Webview Sidebar**: Interactive UI for dimension selection, provider selection, and preview
- **Language Model API**: Leverages multiple LLM providers:
  - GitHub Copilot
  - Cursor AI
  - OpenAI-Compatible APIs (OpenAI, Azure, LM Studio, etc.)
  - Ollama (local or remote instances)
- **html2canvas**: In-browser HTML to PNG conversion (no external dependencies)

### Key Components

- `extension.ts`: Main extension activation and registration
- `CardGeneratorProvider.ts`: Webview provider with html2canvas integration
- `CardGenerator.ts`: AI/LLM integration for design generation
- `ScreenshotService.ts`: Saves base64 image data to disk
- `managers/ModelManager.ts`: Manages model discovery and selection across all providers
- `services/OllamaService.ts`: Ollama API integration
- `services/OpenAiCompatibleService.ts`: OpenAI-Compatible API integration
- `services/CliProviderService.ts`: Command-line provider management

## Output

Generated PNG files are saved to the `social-cards` folder in your workspace root with the naming format:

```
card-{width}x{height}-{timestamp}.png
```

Example: `card-1200x630-1234567890.png`

## Configuration

You can customize the extension's behavior through VS Code settings or the UI:

### AI Provider Selection

Choose your preferred LLM provider in VS Code Settings:

1. Open VS Code Settings (Ctrl+, or Cmd+,)
2. Search for "Social Card Generator"
3. Select your provider:
   - **GitHub Copilot**: No additional setup required (uses your Copilot subscription)
   - **OpenAI-Compatible API**: Enter your API endpoint and key
     - Supports: OpenAI, Azure OpenAI, LM Studio, and other compatible APIs
   - **Ollama**: Specify your Ollama instance URL (default: `http://localhost:11434`)

### Model Selection

For OpenAI-Compatible APIs and Ollama, select the specific model to use for generation.

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

- If using GitHub Copilot: Ensure the extension is installed and active, and you have an active subscription
- If using Cursor AI: Ensure you're using the Cursor editor with the extension installed
- If using OpenAI-Compatible API: Verify your API endpoint and key are correctly configured
- If using Ollama: Ensure Ollama is running and the correct URL is specified
- Try reloading the window

### "No workspace folder open"

- Open a folder in VS Code before generating cards
- The extension needs a workspace to save exported images

### OpenAI-Compatible API Issues

- Verify your API endpoint URL is correct (e.g., `https://api.openai.com/v1` for OpenAI)
- Check that your API key is valid and has appropriate permissions
- For Azure OpenAI, ensure you're using the correct endpoint format
- For LM Studio, ensure the local server is running on the specified port

### Ollama Issues

- Ensure Ollama is installed and running: https://ollama.ai
- Verify the Ollama instance URL is accessible (default: `http://localhost:11434`)
- Check that your desired model is pulled and available: `ollama pull model-name`
- For remote Ollama instances, ensure network connectivity and correct URL configuration

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
