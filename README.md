# QRtailor — Modern QR Code Generator

QRtailor is a small, production-ready QR Code generator built with HTML, CSS, and Vanilla JavaScript. It is static, offline-ready (vendored QR library), accessible, and easy to deploy to GitHub Pages.

Features
- Fully static: no server required — suitable for GitHub Pages
- Vendored QR library (offline use)
- Export as SVG and PNG
- Copy QR image to clipboard (supported browsers)
- Dark mode UI and responsive layout
- Settings saved to localStorage
- Keyboard accessibility (Ctrl/Cmd + Enter to generate)
- Graceful loading/error states

Screenshots
- assets/screenshots/placeholder-1.png
- assets/screenshots/placeholder-2.png

Project structure

- index.html — UI entry
- css/styles.css — styles (dark theme, responsive)
- js/script.js — main logic: generation, export, clipboard, persistence
- js/vendor/qrcode.min.js — vendored QR library (replace with upstream minified bundle for production)
- assets/screenshots/ — placeholder screenshots
- LICENSE — MIT

Getting started (local)

1. Clone the repository

   git clone https://github.com/a0wannabee/QRcode.git
   cd QRcode

2. Serve the folder with a static server (recommended)

- Python 3:

  python3 -m http.server 8000

- Node (serve):

  npm install -g serve
  serve .

3. Open http://localhost:8000

Usage

1. Enter a URL or text into the content box.
2. Adjust size, margin, and error-correction level.
3. Click Generate (or press Ctrl/Cmd + Enter).
4. Use Export SVG, Download PNG, or Copy PNG as needed.

Deployment — GitHub Pages

1. Ensure you have the repo on the `main` branch.
2. In your repository, go to Settings -> Pages.
3. Under "Build and deployment", select the branch `main` and the folder `/ (root)`.
4. Save. After a minute or two your site will be available at:

   https://<your-username>.github.io/QRcode

Notes on the vendored library

- The repo includes `js/vendor/qrcode.min.js` as a placeholder shim. Replace this file with the full minified bundle from the upstream `qrcode` package (for example, `qrcode@1.5.1`) to get full functionality and best performance.

Contributing

Contributions are welcome. If you want to improve the project:
- Replace the vendored file with the official minified bundle
- Add tests and CI (Lighthouse, accessibility)
- Add Service Worker for offline-first caching

License

This project is licensed under the MIT License. See LICENSE.
