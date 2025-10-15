# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` - Starts Next.js development server on http://localhost:3000
- **Build**: `npm run build` - Creates production build
- **Start production**: `npm start` - Starts production server
- **Lint**: `npm run lint` - Runs ESLint

## Project Architecture

This is a Next.js 15 application using the App Router pattern with TypeScript and Tailwind CSS v4.

### Key Technologies
- **Next.js 15** with App Router (src/app directory structure)
- **TypeScript** with strict mode enabled
- **Tailwind CSS v4** for styling
- **React 19** as the UI library
- **Web3 libraries**: Stellar SDK, Ethers.js, and Web3.js for blockchain interactions

### Project Structure
- `src/app/` - App Router pages and layouts
- `src/app/layout.tsx` - Root layout with Geist fonts
- `src/app/page.tsx` - Homepage component
- `src/app/globals.css` - Global styles with Tailwind imports and CSS variables for theming
- Path alias: `@/*` maps to `./src/*` (configured in tsconfig.json)

### Styling Approach
- Uses Tailwind CSS v4 with inline theme configuration
- CSS custom properties for theming (light/dark mode support)
- Geist Sans and Geist Mono fonts configured as CSS variables

### Web3 Integration
The project includes dependencies for multi-chain blockchain development:
- `@stellar/stellar-sdk` - Stellar blockchain operations
- `ethers` v6 - Ethereum interactions
- `web3` v4 - General Web3 utilities

This appears to be a Web3-focused application template with support for both Stellar and Ethereum ecosystems.