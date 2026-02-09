# Deployment Guide

This is a Node.js application using SQLite. Unlike static sites, it requires a server environment to run the backend process.

## 1. Hosting Options

You have several options to host this application:

### Option A: VPS (Virtual Private Server) - Recommended for Control
Providers: DigitalOcean, Linode, AWS Lightsail, Hetzner.

1.  **Provision a Server**: Ubuntu 20.04 or 22.04.
2.  **Install Node.js**:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```
3.  **Clone the Repository**:
    ```bash
    git clone https://github.com/jouharpalakkal/The-Portfolio.git
    cd The-Portfolio
    npm install
    ```
4.  **Run with PM2** (Process Manager):
    ```bash
    sudo npm install -g pm2
    pm2 start server.js --name "portfolio"
    pm2 save
    pm2 startup
    ```
5.  **Set up Nginx as Reverse Proxy** (to point your domain to port 3000):
    ```bash
    sudo apt install nginx
    ```
    Edit configuration: `sudo nano /etc/nginx/sites-available/default`
    ```nginx
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
    Restart Nginx: `sudo systemctl restart nginx`

### Option B: Platform as a Service (PaaS) - Easier Setup
Providers: Railway, Render, Fly.io.
*Note: Since this app uses SQLite (a local file), you must use a service that supports persistent storage (Volumes), otherwise your data will be lost every time the app restarts.*

**Example with Fly.io:**
1.  Install flyctl.
2.  `fly launch`
3.  Attach a volume for the SQLite database so data persists.

## 2. Connecting Your Domain

Once your server is running and has a Public IP address (Option A) or a default URL (Option B):

1.  **Go to your Domain Registrar** (Namecheap, GoDaddy, Google Domains, etc.).
2.  **Manage DNS Records**.
3.  **Add an A Record**:
    *   **Type**: `A`
    *   **Host**: `@` (root)
    *   **Value**: `YOUR_SERVER_IP_ADDRESS`
    *   **TTL**: `Automatic` or `3600`
4.  **Add a CNAME Record** (for www):
    *   **Type**: `CNAME`
    *   **Host**: `www`
    *   **Value**: `yourdomain.com`

## 3. Environment Variables
For security, do not hardcode secrets.
1.  Create a `.env` file on the server.
2.  Add `SESSION_SECRET=your_long_random_string`.
3.  Update `server.js` to use `process.env.SESSION_SECRET`.
