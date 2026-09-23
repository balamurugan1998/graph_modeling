const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  ShadingType,
  convertInchesToTwip
} = require('docx');

// Color palette
const COLORS = {
  primary: '1E3A8A',     // Deep Navy
  secondary: '0D9488',   // Teal
  text: '1E293B',        // Dark Slate
  muted: '64748B',       // Muted Gray
  codeBg: 'F8FAFC',      // Very Light Slate
  codeBorder: 'CBD5E1',  // Slate border
  calloutBg: 'F0FDF4',   // Light Mint
  calloutBorder: '16A34A',// Green
  tableHeaderBg: '1E3A8A',
  tableHeaderColor: 'FFFFFF',
  tableRowAlt: 'F8FAFC',
  tableBorder: 'E2E8F0',
  accentOrange: 'EA580C',
  accentPurple: '7C3AED',
};

// Formatting helpers
function createTitle(text) {
  return new Paragraph({
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 36, // 18pt
        color: COLORS.primary,
        font: 'Calibri',
      }),
    ],
  });
}

function createSubtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    children: [
      new TextRun({
        text,
        italics: true,
        size: 22, // 11pt
        color: COLORS.muted,
        font: 'Calibri',
      }),
    ],
  });
}

function createHeading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28, // 14pt
        color: COLORS.primary,
        font: 'Calibri',
      }),
    ],
  });
}

function createHeading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24, // 12pt
        color: COLORS.secondary,
        font: 'Calibri',
      }),
    ],
  });
}

function createHeading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22, // 11pt
        color: COLORS.text,
        font: 'Calibri',
      }),
    ],
  });
}

function createParagraph(text, options = {}) {
  const runs = Array.isArray(text) ? text : [new TextRun({ text, size: 20, color: COLORS.text, font: 'Calibri', ...options })];
  return new Paragraph({
    spacing: { before: 60, after: 100, line: 260 },
    children: runs,
  });
}

function createBullet(text, boldPrefix = '') {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix + ' ', bold: true, size: 20, color: COLORS.text, font: 'Calibri' }));
  }
  children.push(new TextRun({ text, size: 20, color: COLORS.text, font: 'Calibri' }));
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 60, line: 240 },
    children,
  });
}

function createCallout(title, text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      left: { style: BorderStyle.SINGLE, size: 24, color: COLORS.calloutBorder },
      top: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.calloutBg, type: ShadingType.CLEAR },
            margins: { top: convertInchesToTwip(0.1), bottom: convertInchesToTwip(0.1), left: convertInchesToTwip(0.15), right: convertInchesToTwip(0.15) },
            children: [
              new Paragraph({
                spacing: { after: 40 },
                children: [new TextRun({ text: title, bold: true, size: 20, color: COLORS.calloutBorder, font: 'Calibri' })],
              }),
              new Paragraph({
                spacing: { line: 240 },
                children: [new TextRun({ text, size: 19, color: COLORS.text, font: 'Calibri' })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createCodeBlock(code) {
  const lines = code.trim().split('\n');
  const paragraphs = lines.map((line) => {
    return new Paragraph({
      spacing: { before: 20, after: 20, line: 220 },
      children: [
        new TextRun({
          text: line,
          font: 'Consolas',
          size: 17, // 8.5pt
          color: '0F172A',
        }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      left: { style: BorderStyle.SINGLE, size: 8, color: COLORS.codeBorder },
      top: { style: BorderStyle.SINGLE, size: 8, color: COLORS.codeBorder },
      right: { style: BorderStyle.SINGLE, size: 8, color: COLORS.codeBorder },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.codeBorder },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.codeBg, type: ShadingType.CLEAR },
            margins: { top: convertInchesToTwip(0.1), bottom: convertInchesToTwip(0.1), left: convertInchesToTwip(0.12), right: convertInchesToTwip(0.12) },
            children: paragraphs,
          }),
        ],
      }),
    ],
  });
}

function createTable(headers, rowsData, widths = []) {
  const tableRows = [];

  // Header row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headers.map((headerText, i) => {
        return new TableCell({
          width: widths[i] ? { size: widths[i], type: WidthType.PERCENTAGE } : undefined,
          shading: { fill: COLORS.tableHeaderBg, type: ShadingType.CLEAR },
          margins: { top: convertInchesToTwip(0.08), bottom: convertInchesToTwip(0.08), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: headerText,
                  bold: true,
                  size: 19,
                  color: COLORS.tableHeaderColor,
                  font: 'Calibri',
                }),
              ],
            }),
          ],
        });
      }),
    })
  );

  // Data rows
  rowsData.forEach((row, rowIndex) => {
    const isAlt = rowIndex % 2 === 1;
    tableRows.push(
      new TableRow({
        children: row.map((cellText, i) => {
          return new TableCell({
            width: widths[i] ? { size: widths[i], type: WidthType.PERCENTAGE } : undefined,
            shading: isAlt ? { fill: COLORS.tableRowAlt, type: ShadingType.CLEAR } : undefined,
            margins: { top: convertInchesToTwip(0.06), bottom: convertInchesToTwip(0.06), left: convertInchesToTwip(0.08), right: convertInchesToTwip(0.08) },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.tableBorder },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.tableBorder },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.tableBorder },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.tableBorder },
            },
            children: [
              new Paragraph({
                alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: String(cellText),
                    size: 18,
                    color: COLORS.text,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          });
        }),
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: COLORS.tableHeaderBg },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.tableHeaderBg },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.tableBorder },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.tableBorder },
    },
    rows: tableRows,
  });
}

module.exports = {
  createTitle,
  createSubtitle,
  createHeading1,
  createHeading2,
  createHeading3,
  createParagraph,
  createBullet,
  createCallout,
  createCodeBlock,
  createTable,
  COLORS
};
