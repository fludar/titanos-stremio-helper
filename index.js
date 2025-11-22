import sdk from 'stremio-addon-sdk';
import { addon } from './addon.js';
import express from 'express';
import os from 'os';

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const addonApp = express();
const ADDON_PORT = 7000;

addonApp.get('/', (req, res) => {
    res.redirect('/manifest.json');
});

addonApp.use('/', sdk.getRouter(addon));

addonApp.listen(ADDON_PORT, '0.0.0.0', () => {
    console.log(`Addon server is running on http://${getLocalIp()}:${ADDON_PORT}`);
});