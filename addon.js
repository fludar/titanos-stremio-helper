import sdk from 'stremio-addon-sdk';
const { addonBuilder } = sdk;

const manifest = {
    id: 'org.titanos.helper',
    version: '1.0.0',
    name: 'TitanOS Helper',
    description: 'Stream torrentio torrents to your philips tv using your computer as a bridge.',
    resources: ['stream'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    catalogs: [],
    behaviorHints: {
        configurable: false
    }
};

export const addon = builder.getInterface();