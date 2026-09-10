import sharp from "sharp";

const width = 1200;
const height = 630;

const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.6" fill="rgba(255,255,255,0.16)"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#dots)"/>

  <!-- soft glow blobs -->
  <circle cx="1040" cy="80" r="220" fill="rgba(255,255,255,0.08)"/>
  <circle cx="120" cy="560" r="180" fill="rgba(255,255,255,0.07)"/>

  <!-- logo mark -->
  <rect x="80" y="76" width="56" height="56" rx="14" fill="rgba(255,255,255,0.18)"/>
  <g transform="translate(96,92)">
    <path d="M2 3a2 2 0 012-2h6a4 4 0 014 4 4 4 0 014-4h6a2 2 0 012 2v18a2 2 0 01-2 2h-6a4 4 0 00-4 2 4 4 0 00-4-2H4a2 2 0 01-2-2z"
      fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" transform="scale(1.05)"/>
  </g>

  <text x="150" y="118" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="white">Bookkeeply</text>

  <text x="80" y="250" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="700" fill="white">Bookkeeping and taxes,</text>
  <text x="80" y="322" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="700" fill="white">without the dread.</text>

  <text x="80" y="380" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="rgba(255,255,255,0.92)">Simple bookkeeping and accurate tax estimates</text>
  <text x="80" y="416" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="rgba(255,255,255,0.92)">built for freelancers and service businesses.</text>

  <rect x="80" y="470" width="270" height="56" rx="14" fill="white"/>
  <text x="215" y="505" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#4f46e5">Get Started Free</text>
</svg>
`;

await sharp(Buffer.from(svg)).png().toFile("public/marketing/og-image.png");
console.log("done");
