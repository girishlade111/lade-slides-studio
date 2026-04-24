# Lade Slides Studio

A powerful **web-based presentation and spreadsheet application** for creating, editing, and presenting professional slideshows with integrated spreadsheet functionality.

---

## Features

### Core Features
- **Slide Editor** - Create and edit presentation slides with a rich visual interface
- **Spreadsheet Integration** - Built-in formula engine for spreadsheet calculations
- **Real-time Collaboration** - Work together with your team seamlessly
- **Theme Editor** - Customize slide themes with customizable colors and backgrounds
- **Transitions & Animations** - Add smooth transitions and animations to slides
- **Export Options** - Export presentations in multiple formats (PPTX, PDF, images)
- **Master Slides** - Create reusable slide templates
- **Multi-layout Support** - Choose from various slide layouts (title, content, two-column, etc.)

### UI Components
- **Ribbon Toolbar** - Microsoft Office-style ribbon interface
- **Slide Panel** - Thumbnail navigation for slides
- **Properties Panel** - Fine-tuneelement properties
- **Smart Guides** - Alignment assistance while editing
- **Presenter View** - Speaker notes and presentation controls
- **Drawing Tools** - Freehand drawing and shape tools
- **Commenting** - Add and manage comments on slides

---

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Accessible UI component library
- **Zustand** - State management
- **React Router** - Client-side routing
- **Lucide React** - Icon library

### Libraries & Tools
- **PPTXGenJS** - PowerPoint (.pptx) export
- **jsPDF** - PDF generation
- **html-to-image** - Convert HTML to images
- **Recharts** - Charts and data visualization
- **date-fns** - Date manipulation
- **Zod** - Schema validation
- **Vitest** - Testing framework
- **ESLint** - Code linting
- **Sharp** - Image processing (favicon generation)

---

## Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/girishlade111/lade-slides-studio.git

# Navigate to the project directory
cd lade-slides-studio

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
npm run test:watch
```

---

## Configuration

### Project Structure
```
├── public/              # Static assets
│   ├── favicon.ico      # Browser favicon
│   └── lade-logo.png   # Application logo
├── src/
│   ├── assets/         # Project assets
│   ├── components/    # React components
│   │   ├── slides/    # Slide-related components
│   │   └── ui/       # UI components (shadcn)
│   ├── hooks/         # Custom React hooks
│   ├── lib/          # Utility functions
│   │   └── formulaEngine.ts  # Spreadsheet formulas
│   ├── pages/        # Page components
│   ├── stores/       # Zustand state stores
│   ├── types/        # TypeScript definitions
│   └── test/         # Test files
├── scripts/           # Build scripts
│   └── generate-favicon.mjs
└── index.html        # Entry HTML file
```

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_APP_TITLE=Lade Slides Studio
VITE_API_URL=your_api_url
```

### Package Scripts
| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

---

## Development Stats

- **License**: Private
- **Version**: 0.0.0
- **Type**: React + TypeScript Web Application

### Dependencies
- **Runtime**: 74 dependencies
- **Dev**: 25 dependencies

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/name`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature/name`)
5. Open a Pull Request

---

## License

Private - All rights reserved

-----

## Author

**Girish Lade**
- GitHub: [@girishlade111](https://github.com/girishlade111)
- Email: girishlade111@gmail.com