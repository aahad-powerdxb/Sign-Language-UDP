Here’s a revised `README.md` that matches what you’ve implemented (split files, UDP send/receive, and browser live updates). I’ve added a **Setup** section with GitHub Desktop + Node installation steps and clarified how the UDP listener and SSE forwarding work:

---

# UDP Web App

A minimal Node.js + client web app to **send** and **receive** UDP packets with a simple UI.
The webpage displays two buttons ("English" and "Arabic") to send UDP messages, and can also **receive UDP packets** from other devices on the same network (via an SSE event stream).

This project is intended to be run on a host machine (PC, Raspberry Pi, etc.) and accessed from an iPad (or other device) through its browser.

---

## Features

* **Send UDP packets** when "English" or "Arabic" buttons are pressed.
* **Listen for UDP packets** on a configurable port, then forward them to all connected browsers via SSE.
* **Configurable via `.env`** (host, ports, messages).
* **Simple modular structure** (`server/udp`, `server/routes`, `server/events`, `public/js`).

---

## Setup

### 1. Install GitHub Desktop

* Download and install [GitHub Desktop](https://desktop.github.com/).
* Clone this repository to your machine using GitHub Desktop.

### 2. Install Node.js

* Download [Node.js LTS](https://nodejs.org/en/download) and install it.
* Verify installation in terminal / command prompt:

  ```bash
  node -v
  npm -v
  ```

### 3. Install Dependencies

From the project folder:

```bash
npm install
```

### 4. Configure Environment

Copy `.env.example` to `.env` and edit as needed:

```env
# Web server
PORT=3000

# UDP sending target (the device to receive packets you send)
UDP_HOST=192.168.1.50
UDP_PORT=41234

# UDP listener (to receive packets from other devices)
START_UDP_LISTENER=true
UDP_LISTEN_HOST=0.0.0.0
UDP_LISTEN_PORT=41235

# Messages
UDP_MESSAGE_EN=ENGLISH_SIGNAL
UDP_MESSAGE_AR=ARABIC_SIGNAL
```

* `UDP_HOST` / `UDP_PORT`: where **outgoing UDP packets** will be sent.
* `UDP_LISTEN_HOST=0.0.0.0`: allows receiving from any device on the LAN.
* `UDP_LISTEN_PORT`: the port this server listens on for incoming UDP packets.

### 5. Run the App

Start the server:

```bash
npm start
```

(or `npm run dev` for live-reload with nodemon).

### 6. Open the Web App

On your iPad (or any device on the same network), open:

```
http://<server-ip>:3000
```

Example: `http://192.168.1.100:3000`

---

## Usage

* **Send**: Press "English" or "Arabic" to send configured messages via UDP.
* **Receive**: If another device sends a UDP packet to `<this-server-ip>:UDP_LISTEN_PORT`, the packet will appear live on the webpage.

---

## Notes

* UDP messages are sent/received as UTF-8 text.
* Outgoing messages are defined in `.env` as `UDP_MESSAGE_EN` / `UDP_MESSAGE_AR`.
* Make sure firewall rules allow inbound UDP traffic on the listener port.
* This project is meant for LAN use; add authentication and HTTPS for production environments.
