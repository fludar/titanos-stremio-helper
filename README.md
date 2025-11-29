
<h1 align="center">
  TitanOS Stremio Helper
  <br>
</h1>

<h4 align="center">Stream Torrentio torrents to your Philips TV using your computer as a bridge</h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#build-instructions">Build Instructions</a> •
  <a href="#usage">Usage</a> •
  <a href="#api-endpoints">API Endpoints</a> •
  <a href="#credits">Credits</a>
</p>



## 🧮 Key Features

- **Stremio Addon Integration** - Acts as a Stremio addon that intercepts stream requests
- **Local Torrent Streaming** - Uses WebTorrent to download and stream torrents locally
- **Torrentio Bridge** - Fetches streams from Torrentio and converts them to local URLs
- **Range Request Support** - Supports HTTP range requests for seamless video seeking
- **Multi-format Support** - Handles various video formats (MP4, MKV, AVI, MOV, WebM, etc.)
- **Real-time Status** - Monitor torrent progress, peers, and download speeds



## 🛠 Build Instructions

This project was developed using **Node. js** with ES Modules. 

To build it:

1. Clone the repository:
   ```bash
   git clone https://github.com/fludar/titanos-stremio-helper.git
   cd titanos-stremio-helper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   node index.js
   ```


## ▶️ Usage 

1.  **Start the application** - It will launch two servers:
   
   | Server | Port | Purpose |
   |--------|------|---------|
   | Addon Server | `7000` | Stremio addon interface |
   | Stream Server | `7001` | WebTorrent streaming server |

3. **Set up your ngrok tunnel**
   
   > 📖 Refer to the [ngrok documentation](https://ngrok.com/docs) to obtain your static URL
   
   Start the tunnel:
   ```bash
   ngrok http --url="your-static-url" 7000
   ```

4. **Add the addon to Stremio** using your ngrok URL:
   ```
   https://<your-ngrok-url>/manifest.json
   ```

5. **Start streaming!** When you select a movie or series in Stremio, the addon will:
   - 📡 Fetch available streams from Torrentio
   - 🔄 Convert them to local streaming URLs
   - 📺 Stream the content through your computer to your TV


## 🔌 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /manifest.json` | Stremio addon manifest |
| `GET /stream/:type/:id. json` | Get streams for a movie/series |
| `GET /stream?torrent=<magnet>` | Stream a torrent via magnet URI |
| `GET /status?torrent=<magnet>` | Get torrent download status |
| `GET /torrents` | List all active torrents |

## 📦 Dependencies

- [stremio-addon-sdk](https://github.com/Stremio/stremio-addon-sdk) - Stremio addon development kit
- [webtorrent](https://github.com/webtorrent/webtorrent) - Streaming torrent client
- [express](https://expressjs.com/) - Web framework
- [cors](https://github.com/expressjs/cors) - CORS middleware
- [range-parser](https://github.com/jshttp/range-parser) - HTTP range header parser
- [pump](https://github.com/mafintosh/pump) - Stream piping utility

## 🙏 Credits

- [Torrentio](https://torrentio.strem.fun) - Torrent stream provider
- [Stremio](https://www.stremio.com/) - Media center application
- [WebTorrent](https://webtorrent.io/) - Streaming torrent client

## 📖 What did I learn? 

- Building Stremio addons using the official SDK
- WebTorrent integration for in-browser/Node.js torrent streaming
- HTTP range requests for video streaming
- Download optimization for faster loading times
