# Quantified Dashboard

This is a simple dashboard that pulls time-series data from Singly.

## Setup

1. `npm install`
2. Copy the `env.sample` file to `.env`
3. Edit `.env` to include your Client ID and Secret
4. Run the server
    - If you have Foreman installed, `foreman start` will do it
    - Otherwise, you'll need to load your `.env` into your environment and run
      `node app.js`
    - If all else fails, run
      `SINGLY_CLIENT_ID=<your id> SINGLY_CLIENT_SECRET=<your secret> node app.js`
