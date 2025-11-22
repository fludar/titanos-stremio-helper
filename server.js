import WebTorrent from 'webtorrent';
import express from 'express';
import cors from 'cors';
import rangeParser from 'range-parser';
import pump from 'pump';

const app = express();
app.use(cors());

const client = new WebTorrent({ 
    dht: true,
    maxConns: 100,
    downloadLimit: -1,
    uploadLimit: -1
});
client.on('error', (e) => console.error('WebTorrent error:', e));

app.get('/stream', (req, res) => {
    const magnetURI = req.query.torrent;
    
    if (!magnetURI || !magnetURI.startsWith('magnet:')) {
        return res.status(400).send('Missing or invalid magnet URI');
    }

    console.log(`Stream request received`);

    const infoHashMatch = magnetURI.match(/btih:([a-f0-9]{40}|[A-Z2-7]{32})/i);
    if (!infoHashMatch) {
        return res.status(400).send('Invalid magnet URI');
    }
    
    const infoHash = infoHashMatch[1].toLowerCase();
    const existingTorrent = client.torrents.find(t => t.infoHash === infoHash);
    
    if (existingTorrent && existingTorrent.ready) {
        console.log(`Torrent exists, streaming immediately`);
        return streamFile(existingTorrent, req, res);
    }

    if (existingTorrent && !existingTorrent.ready) {
        console.log(`Torrent exists, waiting for metadata...`);
        existingTorrent.once('ready', () => {
            handleReadyTorrent(existingTorrent, req, res);
        });
        return;
    }

    console.log(`Adding torrent...`);
    
    client.add(magnetURI, (torrent) => {
        console.log(`Torrent added, checking if ready...`);
      
        if (torrent.ready) {
            console.log(`Already ready! Streaming now`);
            handleReadyTorrent(torrent, req, res);
        } else {
            console.log(`Not ready yet, waiting for metadata...`);
            torrent.once('ready', () => {
                handleReadyTorrent(torrent, req, res);
            });
        }

        torrent.on('error', (err) => {
            console.error('Torrent error:', err);
            if (!res.headersSent) {
                res.status(500).send('Torrent error: ' + err.message);
            }
        });
    });
});

function handleReadyTorrent(torrent, req, res) {
    console.log(`METADATA READY - ${torrent.files.length} files`);
    
    const videoFile = selectVideoFile(torrent);
    if (!videoFile) {
        console.error('No video file found');
        if (!res.headersSent) {
            return res.status(404).send('No video file found');
        }
        return;
    }

    console.log(`Selected: ${videoFile.name} (${(videoFile.length / 1024 / 1024).toFixed(2)} MB)`);
    
    videoFile.select();
    
    const pieceLength = torrent.pieceLength;
    const startPiece = Math.floor(videoFile.offset / pieceLength);
    const criticalPieces = Math.min(64, Math.ceil(torrent.pieces.length * 0.1));
    
    for (let i = startPiece; i < startPiece + criticalPieces; i++) {
        if (i < torrent.pieces.length) {
            torrent.critical(i, i + 1);
        }
    }
    
    console.log(`Prioritized ${criticalPieces} pieces (from piece ${startPiece})`);
    console.log(`Progress: ${(torrent.progress * 100).toFixed(2)}%, Peers: ${torrent.numPeers}, Speed: ${(torrent.downloadSpeed / 1024).toFixed(0)} KB/s`);

    // STREAM IMMEDIATELY
    console.log(`STREAMING NOW`);
    streamFile(torrent, req, res);
}

function selectVideoFile(torrent) {
    const videoExts = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v', '.flv', '.wmv', '.ts', '.m2ts'];
    
    const videoFiles = torrent.files.filter(f => 
        videoExts.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    
    if (videoFiles.length > 0) {
        return videoFiles.reduce((a, b) => a.length > b.length ? a : b);
    }
    
    return torrent.files.reduce((a, b) => a.length > b.length ? a : b);
}

function streamFile(torrent, req, res) {
    if (res.headersSent) {
        console.log('Response already sent, aborting');
        return;
    }

    const file = selectVideoFile(torrent);
    
    if (!file) {
        return res.status(404).send('No file found');
    }

    console.log(`Streaming: ${file.name}`);

    const range = req.headers.range;
    
    if (range) {
        const ranges = rangeParser(file.length, range);
        
        if (ranges === -1 || ranges === -2 || !ranges.length) {
            return res.status(416).send('Range Not Satisfiable');
        }

        const { start, end } = ranges[0];
        
        console.log(`  Range request: ${start}-${end}`);
        
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${file.length}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': end - start + 1,
            'Content-Type': 'video/mp4'
        });

        pump(file.createReadStream({ start, end }), res);
    } else {
        console.log(`  Full file request`);
        
        res.writeHead(200, {
            'Content-Length': file.length,
            'Accept-Ranges': 'bytes',
            'Content-Type': 'video/mp4'
        });

        pump(file.createReadStream(), res);
    }
}

app.get('/status', (req, res) => {
    const magnetURI = req.query.torrent;
    if (!magnetURI) {
        return res.status(400).send('Missing torrent parameter');
    }

    const infoHashMatch = magnetURI.match(/btih:([a-f0-9]{40}|[A-Z2-7]{32})/i);
    if (!infoHashMatch) {
        return res.status(400).send('Invalid magnet URI');
    }

    const infoHash = infoHashMatch[1].toLowerCase();
    const torrent = client.torrents.find(t => t.infoHash === infoHash);
    
    if (!torrent) {
        return res.json({ exists: false });
    }

    res.json({
        exists: true,
        infoHash: torrent.infoHash,
        name: torrent.name,
        ready: torrent.ready,
        progress: (torrent.progress * 100).toFixed(2) + '%',
        downloadSpeed: (torrent.downloadSpeed / 1024 / 1024).toFixed(2) + ' MB/s',
        uploadSpeed: (torrent.uploadSpeed / 1024 / 1024).toFixed(2) + ' MB/s',
        downloaded: (torrent.downloaded / 1024 / 1024).toFixed(2) + ' MB',
        peers: torrent.numPeers,
        files: torrent.files.map(f => ({ name: f.name, size: (f.length / 1024 / 1024).toFixed(2) + ' MB' }))
    });
});

app.get('/torrents', (req, res) => {
    res.json(client.torrents.map(t => ({
        infoHash: t.infoHash,
        name: t.name,
        ready: t.ready,
        progress: (t.progress * 100).toFixed(2) + '%',
        peers: t.numPeers,
        downloadSpeed: (t.downloadSpeed / 1024 / 1024).toFixed(2) + ' MB/s'
    })));
});

export default app;