/* Shared launcher. The checks are Playwright scripts; point them at a served
   copy of the site, not at file:// — turn.js needs real URLs.
     BASE=http://localhost:8000  the served site (default)
     CHROME=/path/to/chrome      override the browser binary
   Chromium is found in this order: $CHROME, the Playwright bundle, the system. */
import { chromium } from 'playwright-core';
import fs from 'fs';

export const BASE = (process.env.BASE || 'http://localhost:8000').replace(/\/$/, '');
export const PAGE = BASE + '/index.html';

function findChrome(){
  if(process.env.CHROME) return process.env.CHROME;
  const roots = ['/opt/pw-browsers', process.env.HOME + '/.cache/ms-playwright'];
  for(const root of roots){
    if(!fs.existsSync(root)) continue;
    for(const d of fs.readdirSync(root).filter(x => x.startsWith('chromium-')).sort().reverse()){
      for(const rel of ['chrome-linux/chrome','chrome-mac/Chromium.app/Contents/MacOS/Chromium','chrome-win/chrome.exe']){
        const p = `${root}/${d}/${rel}`;
        if(fs.existsSync(p)) return p;
      }
    }
  }
  for(const p of ['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome']){
    if(fs.existsSync(p)) return p;
  }
  throw new Error('No Chromium found. Set CHROME=/path/to/chrome.');
}

export function launch(){
  return chromium.launch({
    executablePath: findChrome(),
    args: ['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'],
  });
}
