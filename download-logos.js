// Script to download DEX logos
// Run this with: node download-logos.js

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const logos = [
  {
    url: 'https://raydium.io/favicon.ico',
    filename: 'raydium.ico'
  },
  {
    url: 'https://pbs.twimg.com/profile_images/1623689233813864450/XDk-DpAP_400x400.jpg',
    filename: 'meteora.jpg'
  },
  {
    url: 'https://www.orca.so/favicon.ico',
    filename: 'orca.ico'
  },
  {
    url: 'https://dd.dexscreener.com/ds-data/dexes/pumpfun.png',
    filename: 'pumpfun.png'
  },
  {
    url: 'https://statics.solscan.io/cdn/imgs/s60?ref=68747470733a2f2f737461746963732e736f6c7363616e2e696f2f736f6c7363616e2d696d672f736f6c66695f69636f6e2e6a7067',
    filename: 'solfi.jpg'
  }
];

const downloadFile = (url, filename) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, 'public', 'images', 'dex-logos', filename);
    const file = fs.createWriteStream(filePath);
    
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file on error
      console.error(`Error downloading ${filename}:`, err.message);
      reject(err);
    });
  });
};

async function downloadAllLogos() {
  console.log('Starting logo downloads...');
  
  for (const logo of logos) {
    try {
      await downloadFile(logo.url, logo.filename);
    } catch (error) {
      console.error(`Failed to download ${logo.filename}`);
    }
  }
  
  console.log('Download complete!');
}

downloadAllLogos();
