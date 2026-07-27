export type EditorSetup = {
  editor: string;
  icon: string;
  configPath: string;
  snippet: string;
  notes: string[];
};

export const EDITOR_SETUPS: EditorSetup[] = [
  {
    editor: "VS Code (Copilot / MCP)",
    icon: "Code2",
    configPath: ".vscode/mcp.json",
    snippet: `{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": { "Authorization": "Bearer \${input:github_token}" }
    },
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "\${workspaceFolder}"]
    },
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "\${input:pg_url}"]
    }
  },
  "inputs": [
    { "id": "github_token", "type": "promptString", "password": true },
    { "id": "pg_url", "type": "promptString", "password": true }
  ]
}`,
    notes: [
      "Open Command Palette → 'MCP: Add Server' or edit .vscode/mcp.json.",
      "Tokens are prompted on demand and stored in the OS keychain.",
      "Restart VS Code after editing to reload servers.",
    ],
  },
  {
    editor: "Cursor",
    icon: "MousePointer2",
    configPath: "~/.cursor/mcp.json",
    snippet: `{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx" }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/code"]
    }
  }
}`,
    notes: [
      "Settings → MCP → 'Add new MCP server' opens this file.",
      "Use fine-grained GitHub PAT with repo + read:org scopes.",
      "Toggle each server on in the MCP panel to enable it in chat.",
    ],
  },
  {
    editor: "Claude Desktop",
    icon: "Sparkles",
    configPath: "~/Library/Application Support/Claude/claude_desktop_config.json",
    snippet: `{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/Projects"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx" }
    },
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "/absolute/path/db.sqlite"]
    }
  }
}`,
    notes: [
      "Quit Claude fully, then relaunch after editing.",
      "Verify the hammer icon appears in the composer — servers are loaded.",
      "Windows path: %APPDATA%\\Claude\\claude_desktop_config.json",
    ],
  },
  {
    editor: "Windsurf",
    icon: "Wind",
    configPath: "~/.codeium/windsurf/mcp_config.json",
    snippet: `{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "\${env:GH_TOKEN}" }
    }
  }
}`,
    notes: [
      "Cascade panel → Plugins → 'Configure' to edit.",
      "Environment variable interpolation via \${env:NAME}.",
    ],
  },
  {
    editor: "Zed",
    icon: "Zap",
    configPath: "~/.config/zed/settings.json",
    snippet: `{
  "context_servers": {
    "github": {
      "command": {
        "path": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx" }
      }
    }
  }
}`,
    notes: [
      "Zed calls MCP servers 'context servers'.",
      "cmd-, opens settings; changes hot-reload.",
    ],
  },
  {
    editor: "JetBrains IDEs",
    icon: "Boxes",
    configPath: "Settings → Tools → AI Assistant → MCP",
    snippet: `# Add server via UI or ~/.config/JetBrains/<IDE>/mcp.json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx" }
    }
  }
}`,
    notes: [
      "Requires AI Assistant plugin (2024.3+).",
      "Use the built-in secret storage for tokens where possible.",
    ],
  },
];

export const MCP_SERVERS = [
  { name: "GitHub", pkg: "@modelcontextprotocol/server-github", envs: ["GITHUB_PERSONAL_ACCESS_TOKEN"], link: "https://github.com/github/github-mcp-server" },
  { name: "Filesystem", pkg: "@modelcontextprotocol/server-filesystem", envs: [], link: "https://github.com/modelcontextprotocol/servers" },
  { name: "Postgres", pkg: "@modelcontextprotocol/server-postgres", envs: ["DATABASE_URL"], link: "https://github.com/modelcontextprotocol/servers" },
  { name: "SQLite", pkg: "@modelcontextprotocol/server-sqlite", envs: [], link: "https://github.com/modelcontextprotocol/servers" },
  { name: "Slack", pkg: "@modelcontextprotocol/server-slack", envs: ["SLACK_BOT_TOKEN","SLACK_TEAM_ID"], link: "https://github.com/modelcontextprotocol/servers" },
  { name: "Notion", pkg: "@notionhq/notion-mcp-server", envs: ["NOTION_TOKEN"], link: "https://developers.notion.com" },
  { name: "Linear", pkg: "@linear/mcp-server", envs: ["LINEAR_API_KEY"], link: "https://linear.app/developers" },
  { name: "Sentry", pkg: "@sentry/mcp-server", envs: ["SENTRY_AUTH_TOKEN"], link: "https://sentry.io" },
  { name: "Puppeteer / Browser", pkg: "@modelcontextprotocol/server-puppeteer", envs: [], link: "https://github.com/modelcontextprotocol/servers" },
  { name: "Google Drive", pkg: "@modelcontextprotocol/server-gdrive", envs: ["GDRIVE_CREDS_PATH"], link: "https://github.com/modelcontextprotocol/servers" },
];

export const API_KEYS = [
  { provider: "OpenAI", env: "OPENAI_API_KEY", get: "https://platform.openai.com/api-keys" },
  { provider: "Anthropic", env: "ANTHROPIC_API_KEY", get: "https://console.anthropic.com/settings/keys" },
  { provider: "Google Gemini", env: "GOOGLE_API_KEY", get: "https://aistudio.google.com/apikey" },
  { provider: "DeepSeek", env: "DEEPSEEK_API_KEY", get: "https://platform.deepseek.com/api_keys" },
  { provider: "Groq", env: "GROQ_API_KEY", get: "https://console.groq.com/keys" },
  { provider: "Mistral", env: "MISTRAL_API_KEY", get: "https://console.mistral.ai/api-keys" },
  { provider: "Hugging Face", env: "HF_TOKEN", get: "https://huggingface.co/settings/tokens" },
  { provider: "OpenRouter", env: "OPENROUTER_API_KEY", get: "https://openrouter.ai/keys" },
  { provider: "GitHub PAT", env: "GITHUB_PERSONAL_ACCESS_TOKEN", get: "https://github.com/settings/tokens" },
  { provider: "Ollama (local)", env: "OLLAMA_HOST", get: "https://ollama.com/download" },
];
