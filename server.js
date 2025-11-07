import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import cors from 'cors';
import fs from 'fs';

const app = express();
const upload = multer({ dest: '/tmp/' });

app.use(cors());
app.use(express.json());

app.post('/api/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdf(dataBuffer);
    
    const text = data.text;
    const rows = extractRows(text);
    
    // Clean up temp file
    fs.unlinkSync(req.file.path);
    
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to parse PDF' });
  }
});

function extractRows(text) {
  const rows = [];
  
  // Pattern to match section numbers like "1.", "1.1", "1.1.1"
  const sectionPattern = /^(\d+(?:\.\d+)*)[\.\s]+(.*)/gm;
  
  let match;
  const matches = [];
  
  // Find all section matches
  while ((match = sectionPattern.exec(text)) !== null) {
    matches.push({
      index: match.index,
      reference: match[1],
      titleStart: match.index + match[0].indexOf(match[2]),
    });
  }
  
  // Extract text between sections
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    
    const endIndex = next ? next.index : text.length;
    const sectionText = text.substring(current.titleStart, endIndex).trim();
    
    if (sectionText) {
      rows.push({
        reference: current.reference,
        text: sectionText,
      });
    }
  }
  
  // If no sections found, split by double newlines
  if (rows.length === 0) {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    paragraphs.forEach((para, idx) => {
      rows.push({
        reference: String(idx + 1),
        text: para.trim(),
      });
    });
  }
  
  return rows;
}

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});