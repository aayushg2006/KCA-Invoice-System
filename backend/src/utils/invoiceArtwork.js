const fs = require('fs');
const path = require('path');

const artworkDirectory = path.resolve(__dirname, '../../assets/templates');

let cachedArtwork = null;

function svgToDataUrl(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function readArtworkFile(baseName) {
  const candidates = [
    `${baseName}.png`,
    `${baseName}.jpg`,
    `${baseName}.jpeg`,
    `${baseName}.webp`,
    `${baseName}.svg`,
  ];

  for (const candidate of candidates) {
    const filePath = path.join(artworkDirectory, candidate);

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const mimeType =
      extension === '.svg'
        ? 'image/svg+xml'
        : extension === '.jpg' || extension === '.jpeg'
          ? 'image/jpeg'
          : extension === '.webp'
            ? 'image/webp'
            : 'image/png';

    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
  }

  return '';
}

function buildSignatureSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 210">
      <g fill="none" stroke="#09090b" stroke-linecap="round" stroke-linejoin="round">
        <path
          d="M95 176
             C50 126 51 45 113 31
             C167 19 208 74 177 123
             C151 162 98 149 90 108
             C84 76 105 47 130 50
             C160 54 164 101 162 136
             C160 160 164 175 177 186"
          stroke-width="8"
        />
        <path
          d="M179 183
             C193 167 201 147 209 121
             C220 83 225 49 226 16
             C233 58 238 90 245 120
             C250 141 256 113 262 88
             C267 68 274 61 281 75
             C289 90 294 107 302 107
             C311 107 316 88 321 66
             C326 46 330 40 334 54
             C339 69 340 84 348 84
             C357 84 362 65 370 49
             C379 31 389 20 398 14
             C410 8 419 20 411 35"
          stroke-width="7"
        />
        <path
          d="M398 13
             C401 67 400 108 405 145
             C408 165 413 179 421 186"
          stroke-width="7"
        />
        <path
          d="M183 165
             C297 136 402 111 569 58"
          stroke-width="7"
        />
        <path
          d="M247 188
             C337 154 417 127 500 92"
          stroke-width="6"
        />
        <path
          d="M564 60
             C579 50 590 41 601 26"
          stroke-width="6"
        />
      </g>
    </svg>
  `;
}

function buildLaurelLeaves(side) {
  const direction = side === 'left' ? -1 : 1;
  const centerX = side === 'left' ? 110 : 390;
  const rotationStart = side === 'left' ? 230 : -50;
  const steps = Array.from({ length: 20 }, (_, index) => index);

  return steps
    .map((step) => {
      const rotate = rotationStart + step * 5.6;
      const y = 85 + step * 15.4;

      return `
        <g transform="translate(${centerX}, ${y}) rotate(${rotate})">
          <path
            d="M0 0 C8 -11 22 -16 34 -9 C25 3 12 10 0 0Z"
            fill="#111111"
            transform="scale(${direction}, 1)"
          />
        </g>
      `;
    })
    .join('');
}

function buildStampSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
      <defs>
        <path id="topArc" d="M78 250a172 172 0 1 1 344 0" />
        <path id="bottomArc" d="M422 250a172 172 0 1 1-344 0" />
      </defs>

      <rect width="500" height="500" fill="#ffffff" />
      ${buildLaurelLeaves('left')}
      ${buildLaurelLeaves('right')}

      <circle cx="250" cy="250" r="181" fill="none" stroke="#111111" stroke-width="6" />
      <circle cx="250" cy="250" r="144" fill="none" stroke="#111111" stroke-width="5" />

      <text
        fill="#111111"
        font-family="Arial, Helvetica, sans-serif"
        font-size="27"
        font-weight="800"
        letter-spacing="3.3"
      >
        <textPath href="#topArc" startOffset="50%" text-anchor="middle">KAMATH CHESS ACADEMY</textPath>
      </text>

      <text
        fill="#111111"
        font-family="Arial, Helvetica, sans-serif"
        font-size="23"
        font-weight="800"
        letter-spacing="2.7"
      >
        <textPath href="#bottomArc" startOffset="50%" text-anchor="middle">
          BRILLIANCE WITH INTELLIGENCE
        </textPath>
      </text>

      <text x="105" y="262" fill="#111111" font-family="Arial Black, Arial, sans-serif" font-size="120">K</text>
      <text x="305" y="262" fill="#111111" font-family="Arial Black, Arial, sans-serif" font-size="120">A</text>
      <text x="79" y="260" fill="#111111" font-family="Arial, Helvetica, sans-serif" font-size="38">★</text>
      <text x="386" y="260" fill="#111111" font-family="Arial, Helvetica, sans-serif" font-size="38">★</text>

      <g transform="translate(214 140)" fill="#111111">
        <rect x="18" y="0" width="36" height="14" rx="4" />
        <rect x="12" y="12" width="48" height="12" rx="4" />
        <rect x="18" y="22" width="8" height="18" />
        <rect x="34" y="22" width="8" height="18" />
        <rect x="50" y="22" width="8" height="18" />
        <path d="M18 40 L58 40 L70 118 L6 118 Z" />
        <rect x="2" y="118" width="72" height="12" rx="4" />
      </g>
    </svg>
  `;
}

function getDefaultArtwork() {
  if (!cachedArtwork) {
    const signatureAsset = readArtworkFile('kca-signature');
    const stampAsset = readArtworkFile('kca-stamp');

    cachedArtwork = {
      signatureDataUrl: signatureAsset || svgToDataUrl(buildSignatureSvg()),
      stampDataUrl: stampAsset || svgToDataUrl(buildStampSvg()),
    };
  }

  return cachedArtwork;
}

module.exports = {
  getDefaultArtwork,
};
