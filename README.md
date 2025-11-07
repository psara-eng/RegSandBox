# Regulation Extractor

A lightweight web application for extracting structured regulation clauses from PDF documents.

## Features

✅ **PDF Upload** - Drag & drop or browse to upload PDF files  
✅ **Automatic Extraction** - Extracts sections, subsections, and clauses  
✅ **Editable Table** - Click cells to edit content  
✅ **Dynamic Columns** - Add/remove custom columns  
✅ **Row Operations** - Add, delete, merge, and split rows  
✅ **CSV Export** - Download your structured data  
✅ **Clean UI** - Modern, responsive design with Tailwind CSS

## Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)
- React Dropzone

**Backend:**
- Node.js (Express)
- PDF.js (pdf extraction)
- Multer (file upload)

**Deployment:**
- Vercel (optimized for serverless)

## Local Development

### Prerequisites
- Node.js 18+
- Yarn or npm

### Installation

```bash
# Install dependencies
yarn install

# Start development servers (API + Frontend)
yarn dev
```

The app will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:3001

### Build for Production

```bash
yarn build
```

Output will be in the `dist/` folder.

## Vercel Deployment

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/regulation-extractor)

### Manual Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts

The `/api/extract` endpoint will be automatically configured as a serverless function.

## API Reference

### POST /api/extract

Extracts text from PDF and returns structured data.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `file` (PDF file)

**Response:**
```json
[
  {
    "reference": "1.1",
    "text": "Full clause text..."
  },
  {
    "reference": "1.2",
    "text": "Another clause..."
  }
]
```

**Extraction Logic:**
1. Detects section numbers (1., 1.1, 1.1.1, etc.)
2. Falls back to double-newline splitting if no sections found
3. Returns array of {reference, text} objects

## Usage Guide

### 1. Upload PDF
- Drag and drop a PDF file, or click to browse
- The app will automatically extract sections

### 2. Edit Table
- Click any cell to edit its content
- Changes are saved automatically in memory

### 3. Add Columns
- Click "Add Column" button
- Enter column name and press "Add"
- Delete custom columns by clicking the trash icon in the header

### 4. Row Operations

**Select Rows:**
- Click checkboxes to select rows
- Use the header checkbox to select all

**Add Row:**
- Click "Add Row" to append a blank row

**Delete Rows:**
- Select rows and click "Delete (N)"

**Merge Rows:**
- Select 2+ rows
- Click "Merge" to combine their text

**Split Row:**
- Select 1 row
- Click "Split" to break it into sentences

### 5. Export
- Click "Download CSV" to export your table
- Opens as a standard CSV file

### 6. Clear Workspace
- Click "Clear" to reset the entire workspace
- Requires confirmation

## Project Structure

```
/
├── api/
│   ├── extract.js          # Vercel serverless function
│   └── package.json        # API dependencies
├── src/
│   ├── App.jsx            # Main React component
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles
├── server.js              # Local dev server
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
├── vercel.json            # Vercel deployment config
└── package.json           # Frontend dependencies
```

## Bundle Size

**Optimized for Vercel:**
- Frontend bundle: ~215 KB (gzipped: ~66 KB)
- Serverless function: < 1 MB
- No Python dependencies
- No large AI libraries

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first.
