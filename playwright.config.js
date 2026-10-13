import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',use:{baseURL:'http://127.0.0.1:5173',viewport:{width:375,height:812},hasTouch:true,isMobile:true,launchOptions:{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}},webServer:{command:'npm run dev -- --port 5173',url:'http://127.0.0.1:5173',reuseExistingServer:true}});
