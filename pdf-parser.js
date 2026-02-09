/**
 * PDF Parser - Converts PDF pages to images using PDF.js
 */
const PdfParser = (() => {
  let pdfjsLib = null;
  let initialized = false;

  // Initialize PDF.js library
  async function init() {
    if (initialized) return;

    // Check if pdfjsLib is already loaded
    if (window.pdfjsLib) {
      pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
      initialized = true;
      return;
    }

    throw new Error('PDF.js library not loaded');
  }

  /**
   * Check if a file is a PDF
   * @param {File} file
   * @returns {boolean}
   */
  function isPdf(file) {
    return file.type === 'application/pdf' ||
           file.name.toLowerCase().endsWith('.pdf');
  }

  /**
   * Load a PDF file and return page information
   * @param {File} file - PDF file to load
   * @returns {Promise<{pdf: PDFDocumentProxy, numPages: number}>}
   */
  async function loadPdf(file) {
    await init();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    return {
      pdf,
      numPages: pdf.numPages
    };
  }

  /**
   * Render a specific page of the PDF to a canvas
   * @param {PDFDocumentProxy} pdf - The loaded PDF document
   * @param {number} pageNum - Page number (1-indexed)
   * @param {number} scale - Render scale (default 2 for good quality)
   * @returns {Promise<HTMLCanvasElement>}
   */
  async function renderPage(pdf, pageNum, scale = 2) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    return canvas;
  }

  /**
   * Convert a PDF page to an Image element
   * @param {PDFDocumentProxy} pdf - The loaded PDF document
   * @param {number} pageNum - Page number (1-indexed)
   * @param {number} scale - Render scale
   * @returns {Promise<HTMLImageElement>}
   */
  async function pageToImage(pdf, pageNum, scale = 2) {
    const canvas = await renderPage(pdf, pageNum, scale);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = canvas.toDataURL('image/png');
    });
  }

  /**
   * Convert first page of a PDF file to an Image
   * @param {File} file - PDF file
   * @param {number} scale - Render scale (default 2)
   * @returns {Promise<HTMLImageElement>}
   */
  async function pdfToImage(file, scale = 2) {
    const { pdf } = await loadPdf(file);
    return await pageToImage(pdf, 1, scale);
  }

  /**
   * Convert a PDF page to a canvas (for legend parsing)
   * @param {File} file - PDF file
   * @param {number} pageNum - Page number (1-indexed)
   * @param {number} scale - Render scale
   * @returns {Promise<HTMLCanvasElement>}
   */
  async function pdfPageToCanvas(file, pageNum = 1, scale = 2) {
    const { pdf } = await loadPdf(file);
    return await renderPage(pdf, pageNum, scale);
  }

  /**
   * Get thumbnail previews of all pages
   * @param {File} file - PDF file
   * @param {number} thumbScale - Thumbnail scale (default 0.5)
   * @returns {Promise<{pageNum: number, canvas: HTMLCanvasElement}[]>}
   */
  async function getAllPageThumbnails(file, thumbScale = 0.5) {
    const { pdf, numPages } = await loadPdf(file);
    const thumbnails = [];

    for (let i = 1; i <= numPages; i++) {
      const canvas = await renderPage(pdf, i, thumbScale);
      thumbnails.push({ pageNum: i, canvas });
    }

    return thumbnails;
  }

  return {
    isPdf,
    loadPdf,
    renderPage,
    pageToImage,
    pdfToImage,
    pdfPageToCanvas,
    getAllPageThumbnails
  };
})();
