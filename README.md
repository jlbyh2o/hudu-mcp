# HUDU MCP Server

A Model Context Protocol (MCP) server that integrates with HUDU for technical documentation and customer information management. This server allows Large Language Models (LLMs) to interact with HUDU's API to retrieve customer account information, knowledge base articles, assets, and more.

## Features

- **Company/Customer Management**: Retrieve company information and details
- **Knowledge Base Access**: Search and retrieve technical documentation articles
- **Asset Management**: Access asset information and password management
- **Secure Authentication**: API key-based authentication with HUDU
- **Type Safety**: Built with TypeScript and Zod validation
- **Error Handling**: Comprehensive error handling and logging

## Prerequisites

- Node.js 18.0.0 or higher
- A HUDU instance with API access
- HUDU API key (obtainable from your HUDU admin panel)

## Installation

### From NPM (Recommended)

```bash
npm install -g hudu-mcp
```

### From Source

```bash
git clone https://github.com/jlbyh2o/hudu-mcp.git
cd hudu-mcp
npm install
npm run build
```

## Configuration

The server requires two environment variables:

- `HUDU_API_KEY`: Your HUDU API key (found in HUDU under Admin > API Keys)
- `HUDU_BASE_URL`: Your HUDU instance base URL (domain only, do not include `/api/v1`)

### Setting up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your actual values:
   ```bash
   HUDU_API_KEY=your_actual_api_key_here
   HUDU_BASE_URL=https://your-company.huducloud.com
   ```

**Important:** The `HUDU_BASE_URL` should only contain your domain (e.g., `https://your-company.huducloud.com`). Do NOT include `/api/v1` in the URL as this is automatically appended by the client.

3. Make sure your `.env` file is not committed to version control (it's already in `.gitignore`)

## Usage

### Running the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### Startup Validation

The MCP server automatically validates your API connection during startup by calling the `/api_info` endpoint. This ensures:

- Your `HUDU_API_KEY` is valid and active
- Your `HUDU_BASE_URL` is correct and accessible
- Your API key has the necessary permissions

If validation fails, you'll see a clear error message indicating the issue:
- **401 errors**: Invalid or expired API key
- **403 errors**: API key lacks sufficient permissions
- **404/connection errors**: Incorrect base URL or network issues

This validation helps catch configuration issues early, before you start using the MCP tools.

### Available Tools

The MCP server provides the following tools for LLM interaction:

#### Company/Customer Tools

**`get_companies`** - Retrieve a list of companies/customers
- Parameters:
  - `name` (optional): Filter companies by name
  - `page` (optional): Page number for pagination
  - `page_size` (optional): Number of results per page

**`get_company_details`** - Get detailed information about a specific company
- Parameters:
  - `id` (required): Company ID

#### Knowledge Base Tools

**`search_articles`** - Search knowledge base articles
- Parameters:
  - `search` (optional): Search query for articles
  - `company_id` (optional): Filter articles by company ID
  - `page` (optional): Page number for pagination
  - `page_size` (optional): Number of results per page

**`get_article`** - Get detailed content of a specific article
- Parameters:
  - `id` (required): Article ID

#### Asset Management Tools

**`get_assets`** - Retrieve assets for a company
- Parameters:
  - `company_id` (optional): Company ID to filter assets
  - `asset_layout_id` (optional): Filter by asset layout ID
  - `page` (optional): Page number for pagination
  - `page_size` (optional): Number of results per page

**`get_asset_passwords`** - Retrieve password assets (credentials) for a company
- Parameters:
  - `company_id` (optional): Company ID to filter passwords
  - `name` (optional): Filter by password name
  - `page` (optional): Page number for pagination
  - `page_size` (optional): Number of results per page

*Note: Passwords are masked in list responses for security. Individual password retrieval would require additional implementation.*

### Example Usage with Claude Desktop

1. Add the server to your Claude Desktop configuration:
```json
{
  "mcpServers": {
    "hudu": {
      "command": "node",
      "args": ["/path/to/hudu-mcp/dist/index.js"],
      "env": {
        "HUDU_API_KEY": "your_api_key",
        "HUDU_BASE_URL": "https://your-hudu-instance.huducloud.com"
      }
    }
  }
}
```

2. Restart Claude Desktop

3. You can now ask Claude to:
   - "Show me all companies in HUDU"
   - "Find articles about network configuration for company ID 123"
   - "Get details for company 'Acme Corp'"
   - "List all assets for company ID 456"

## API Integration

This MCP server integrates with the HUDU API v1. The following endpoints are supported:

- `/api/v1/companies` - Company management
- `/api/v1/articles` - Knowledge base articles
- `/api/v1/assets` - Asset management
- `/api/v1/asset_passwords` - Password/credential management
- `/api/v1/asset_layouts` - Asset layout definitions
- `/api/v1/activity_logs` - Activity logging
- `/api/v1/api_info` - API information

## Development

### Project Structure

```
src/
├── index.ts              # Main MCP server entry point
├── hudu-client.ts        # HUDU API client with type definitions
├── tools/
│   ├── index.ts          # Tool registration and routing
│   ├── company-tools.ts  # Company/customer related tools
│   ├── article-tools.ts  # Knowledge base article tools
│   └── asset-tools.ts    # Asset management tools
└── .env.example          # Environment configuration template
```

### Available Scripts

- `npm run build` - Build the TypeScript project
- `npm run dev` - Run in development mode with hot reload
- `npm run start` - Run the built server
- `npm run watch` - Watch for changes and rebuild
- `npm run clean` - Clean the dist directory

### Adding New Tools

1. Define the tool schema and handler in the appropriate tools file
2. Add the tool name to the routing logic in `tools/index.ts`
3. Update the tool list in `index.ts`
4. Add corresponding API methods to `hudu-client.ts` if needed

## Security Considerations

- API keys are passed via environment variables
- Passwords are masked in list responses
- All API requests include proper authentication headers
- Input validation using Zod schemas
- Comprehensive error handling to prevent information leakage

## Troubleshooting

### Common Issues

**"Configuration validation failed"**
- Ensure `HUDU_API_KEY` and `HUDU_BASE_URL` are set in your environment
- Verify the API key is valid and has appropriate permissions

**"HUDU API Error (401)"**
- Check that your API key is correct
- Verify the API key has not expired
- Ensure your HUDU user has API access permissions

**"HUDU API Error (404)"**
- Verify the HUDU_BASE_URL is correct
- Check that the HUDU instance is accessible

**Connection timeouts**
- Check network connectivity to your HUDU instance
- Verify firewall settings allow outbound HTTPS connections

### Debugging

Enable debug logging by setting the environment variable:
```bash
DEBUG=hudu-mcp:*
```

## Troubleshooting

### Common Issues

**"Invalid URL" Error**
- Ensure your `HUDU_BASE_URL` contains only the domain (e.g., `https://your-company.huducloud.com`)
- Do NOT include `/api/v1` in the base URL - this is automatically appended
- Make sure the URL starts with `https://` or `http://`

**"Configuration validation failed" Error**
- Check that both `HUDU_API_KEY` and `HUDU_BASE_URL` are set in your `.env` file
- Verify there are no extra spaces or quotes around the values
- Ensure the `.env` file is in the correct directory (project root)

**"403 Forbidden" or Authentication Errors**
- Verify your API key is correct and active in HUDU (Admin > API Keys)
- Check that your API key has the necessary permissions
- Ensure your HUDU instance URL is correct

**"401 Unauthorized" for Password Access**
- This occurs when your API key doesn't have permission to access password data
- HUDU allows administrators to restrict password access per API key for security
- The MCP server now handles this gracefully with an informative message
- Contact your HUDU administrator to enable password access if needed
- You can still use other asset management tools that don't require password permissions

**"page_size must be less than or equal to 100" Error**
- The HUDU API limits page_size to a maximum of 100 results per request
- Use pagination with multiple requests for larger datasets

### Testing Your Configuration

To test if your configuration is working:

1. Set up your `.env` file with correct values
2. Run the server: `npm start`
3. If using with Claude Desktop, check the MCP server logs
4. Try a simple query like getting companies with a small page_size (e.g., 10)

## Contributing

We welcome contributions to the HUDU MCP Server! Here's how you can help:

### Getting Started

1. Fork the repository on GitHub
2. Clone your fork:

```bash
git clone https://github.com/your-username/hudu-mcp.git
cd hudu-mcp
```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Guidelines

- Follow the existing code style (enforced by Biome)
- Add appropriate error handling
- Update documentation for new features
- Test your changes thoroughly
- Run the linter and formatter:
  ```bash
  npm run check:fix
  ```

### Submitting Changes

1. Commit your changes with clear, descriptive messages
2. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
3. Create a Pull Request on GitHub
4. Describe your changes and their purpose
5. Link any related issues

### Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary

You are free to:
- ✅ Use this software for any purpose
- ✅ Modify and distribute the software
- ✅ Include it in commercial projects
- ✅ Sublicense the software

Requirements:
- 📄 Include the original copyright notice
- 📄 Include the license text

The software is provided "as is" without warranty.

## Support

For issues related to:
- **HUDU API**: Consult the HUDU documentation or contact HUDU support
- **MCP Protocol**: See the Model Context Protocol documentation
- **This Server**: Create an issue in this repository