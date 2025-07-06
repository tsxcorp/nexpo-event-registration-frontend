# Nexpo Event Registration Platform

A modern event registration platform built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Event registration forms with dynamic fields
- QR code generation for event check-in
- Responsive design for all devices
- Real-time form validation
- Customizable event branding
- Export registration data

## Translation System

The platform includes a comprehensive translation system that automatically translates content based on user language preferences.

### Features

- **Automatic Translation**: Uses Google Translate API to translate event data
- **Custom Translations**: Allows users to add and edit translations via JSON files
- **Translation Caching**: Caches translations to improve performance
- **Language Switcher**: UI component to switch between supported languages
- **Translation Editor**: Modal interface for editing and improving translations

### Supported Languages

- Vietnamese (vi) - Default
- English (en)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)

### Setup

1. **Google Translate API Key**: Add your API key to environment variables:
   ```env
   NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY=your_api_key_here
   ```

2. **Custom Translations**: The system automatically creates and manages custom translations in `data/custom-translations.json`

### Usage

The translation system is integrated into the registration form and automatically translates:
- Event names and descriptions
- Form field labels, help text, and placeholders
- Select field options
- Agreement field content and checkbox labels

### Components

- `LanguageSwitcher`: Dropdown to change language
- `TranslationEditor`: Modal for editing translations
- `TranslatableText`: Wrapper component for editable translated text
- `useTranslation`: Custom hook for translation state management

## Tech Stack

- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form
- Axios
- Jest & Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/nexpo-event-registration-frontend.git
cd nexpo-event-registration-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables:
```bash
cp .env.example .env.local
```

4. Update the environment variables in `.env.local` with your configuration.

### Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3001`.

### Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate test coverage:
```bash
npm run test:coverage
```

### Building for Production

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js app directory
├── components/            # React components
│   ├── common/           # Shared components
│   ├── features/         # Feature-specific components
│   ├── layouts/          # Layout components
│   └── ui/               # UI components
├── lib/                  # Utility functions and services
│   ├── api/             # API client and endpoints
│   ├── auth/            # Authentication logic
│   └── utils/           # Helper functions
├── hooks/               # Custom React hooks
├── styles/             # Global styles
└── types/              # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
