<div align="center">
  <a href="https://particle.network/">
    <img src="https://i.imgur.com/xmdzXU4.png" />
  </a>
  <h3>
    Particle Connect Solana Demo
  </h3>
</div>

This example demonstrates integrating social and Web3 logins on the Solana blockchain using [Particle Connect](https://developers.particle.network/api-reference/connect/desktop/web)  and sending a transaction. 

Built using:

- **Particle Connect 2.0**
- **solana/web3.js**
- **TypeScript**
- **Tailwind CSS**

## 🔑 Particle Connect

**Particle Connect** enables a unified modal driving connection with social logins (through Particle Auth) and standard Web3 wallets, creating an equally accessible experience for Web3 natives and traditional consumers. Particle Connect is an all-in-one SDK capable of handling end-to-end onboarding and wallet connection.

👉 Learn more about [Particle Connect](https://developers.particle.network/api-reference/connect/desktop/web).

👉 Learn more about Particle Network: https://particle.network

## 🛠️ Quickstart

### Clone this repository

```
git clone https://github.com/Particle-Network/connect-solana-demo
```

Access the app:

```
cd solana-demo
```

### Install dependencies

```
yarn
```
OR
```
npm install
```

### Set environment variables
This project requires several keys from Particle Network to be defined in `.env`. The following should be defined:

- `NEXT_PUBLIC_PROJECT_ID`, the ID of the corresponding application in your [Particle Network dashboard](https://dashboard.particle.network/#/applications).
- `NEXT_PUBLIC_CLIENT_KEY`, the ID of the corresponding project in your [Particle Network dashboard](https://dashboard.particle.network/#/applications).
- `NEXT_PUBLIC_APP_ID`, the client key of the corresponding project in your [Particle Network dashboard](https://dashboard.particle.network/#/applications).

### Start the project
```
npm run start
```
OR
```
yarn dev
```
