import sys
import fitz  # PyMuPDF
from pathlib import Path

def extract_pages(pdf_path, page_numbers, output_dir):
    """Extract specific pages from PDF as PNG images"""
    doc = fitz.open(pdf_path)

    for page_num in page_numbers:
        # PyMuPDF uses 0-based indexing
        page = doc[page_num - 1]

        # Render page to image (matrix for 2x zoom for better quality)
        mat = fitz.Matrix(2, 2)
        pix = page.get_pixmap(matrix=mat)

        output_path = Path(output_dir) / f"page-{page_num}-actual.png"
        pix.save(output_path)
        print(f"Extracted page {page_num} to {output_path}")

    doc.close()
    print("Done")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python extract_pdf_pages.py <pdf-path> <output-dir> <page-numbers...>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]
    page_numbers = [int(n) for n in sys.argv[3:]]

    extract_pages(pdf_path, page_numbers, output_dir)
