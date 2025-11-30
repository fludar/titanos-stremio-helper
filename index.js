import sdk from 'stremio-addon-sdk';
import { addon } from './addon.js';
import serverApp from './server.js'
import express from 'express';
import os from 'os';

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    const skipPatterns = ['tailscale', 'zt', 'tun', 'tap', 'vpn', 'veth', 'docker', 'br-', 'vbox', 'vmware'];
    for (const name of Object.keys(interfaces)) {
        if (skipPatterns.some(p => name.toLowerCase().includes(p))) continue;
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                if (iface.address.startsWith('100.')) continue;
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const addonApp = express();
const ADDON_PORT = 7000;
const STREAM_PORT = 7001;

addonApp.get('/', (req, res) => {
    res.redirect('/manifest.json');
});

addonApp.use('/', sdk.getRouter(addon));

addonApp.listen(ADDON_PORT, '0.0.0.0', () => {
    console.log(`Addon server is running on http://${getLocalIp()}:${ADDON_PORT}/manifest.json`);
    });

serverApp.listen(STREAM_PORT, '0.0.0.0', () => {
    console.log(`Stream server is running on http://${getLocalIp()}:${STREAM_PORT}`);
});