import sdk from 'stremio-addon-sdk';
const { addonBuilder } = sdk;
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


const builder = new addonBuilder(manifest);

const TORRENTIO_BASE = 'https://torrentio.strem.fun';
const STREAM_PORT = 7001;

builder.defineStreamHandler(async ({type, id}) => {
    console.log(`[addon.js] Stream request for ${type} ${id}`);
    const url = `${TORRENTIO_BASE}/stream/${type}/${id}.json`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.12.45 Mobile Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error('[addon.js] Torrentio HTTP error:', response.status);
            return { streams: [] };
        }

        const data = await response.json();

        if (!data.streams || data.streams.length === 0) {
            console.log('[addon.js] No streams found from Torrentio.');
            return { streams: [] };
        }
        const localIp = getLocalIp();

        const defaultTrackers = [
            'udp://tracker.opentrackr.org:1337/announce',
            'udp://tracker.openbittorrent.com:6969/announce',
            'udp://tracker.internetwarriors.net:1337/announce',
            'udp://tracker.cyberia.is:6969/announce',
            'udp://tracker.leechers-paradise.org:6969/announce',
            'udp://tracker.coppersurfer.tk:6969/announce'
        ];

        const streams = data.streams.map(stream => {
            const hash = stream.infoHash || stream.infohash || stream.hash || stream.btih;

            if (hash) {
                    const baseMagnet = `magnet:?xt=urn:btih:${hash}`;
                    const trackersList = (Array.isArray(stream.trackers) && stream.trackers.length) ? stream.trackers : defaultTrackers;
                    const magnetWithTrackers = trackersList.reduce((m, tr) => m + `&tr=${encodeURIComponent(tr)}`, baseMagnet);
                    const localUrl = `http://${localIp}:${STREAM_PORT}/stream?torrent=${encodeURIComponent(magnetWithTrackers)}`;
                    return {
                        name: `[Local] ${stream.name}`,
                        title: stream.title,
                        url: localUrl,
                    };
                }

                return null;
            })
            .filter(Boolean);

        console.log(`[addon.js] Built ${streams.length} local stream(s)`);

        return { streams };
        }
        catch (error) {
            console.error('[addon.js] Error fetching streams from Torrentio:', error);
            return { streams: [] };
        }
    }
        
);

export const addon = builder.getInterface();