# Thinkz AI mobile scaffold

This Expo app is the React Native foundation for the Live Studio, TA Dashboard,
and RBAC Matrix assignment. It is isolated from the Vite web application.

## Run locally

1. Open the `mobile` directory.
2. Install dependencies with `npm install`.
3. Set `EXPO_PUBLIC_API_URL` to the reachable Thinkz backend API URL, including
   `/api`.
   - Android emulator: `http://10.0.2.2:5000/api`
   - Physical device: use your computer LAN IP, for example
     `http://192.168.1.20:5000/api`.
   - Production Android builds require an HTTPS URL; production EAS builds fail
     during config validation if the URL is missing or uses HTTP.
4. Run `npm start`.

## Video configuration

The backend issues a short-lived Jitsi token at:

`POST /api/studio/sessions/:id/jitsi-token`

The deployment owner must provide `JITSI_JWT_SECRET`, `JITSI_APP_ID`, and
`JITSI_DOMAIN`. The endpoint requires a valid Thinkz JWT and never uses a
local demo user.
