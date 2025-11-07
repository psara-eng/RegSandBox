import formidable from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable();
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        return res.status(500).json({ error: 'Failed to parse form' });
      }

      const file = files.file?.[0] || files.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        const dataBuffer = fs.readFileSync(file.filepath);
        const data = await pdf(dataBuffer);
        
        const text = data.text;
        const rows = extractRows(text);
        
        res.status(200).json(rows);
      } catch (pdfError) {
        console.error('PDF parse error:', pdfError);
        res.status(500).json({ error: 'Failed to parse PDF' });
      } finally {
        // Clean up temp file
        if (file.filepath) {
          fs.unlinkSync(file.filepath);
        }
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function extractRows(text) {
  const rows = [];
  
  // Pattern to match section numbers like "1.", "1.1", "1.1.1", "1.1.1.1"
  const sectionPattern = /^(\d+(?:\.\d+)*)[\.\s]+(.*)/gm;
  
  let match;
  let lastIndex = 0;
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