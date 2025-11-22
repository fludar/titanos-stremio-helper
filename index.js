import sdk from 'stremio-addon-sdk';
import express from 'express';

const addonApp = express();
const ADDON_PORT = process.env.PORT || 7000;

addonApp.get('/', (req, res) => {
    res.redirect('/manifest.json');
});

addonApp.listen(ADDON_PORT, '0.0.0.0', () => {
    console.log(`Addon server is running on http://0.0.0.0:${ADDON_PORT}`);
});