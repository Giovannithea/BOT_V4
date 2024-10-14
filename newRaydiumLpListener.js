require('dotenv').config();
const { Connection, PublicKey } = require('@solana/web3.js');
const { processRaydiumLpTransaction } = require('./newRaydiumLpService');
const SniperManager = require('./SniperManager'); // Import the SniperManager

// Solana WebSocket URL
const WS_URL = process.env.SOLANA_WS_URL || 'https://api.mainnet-beta.solana.com/';
const connection = new Connection(WS_URL, 'confirmed');
const RAYDIUM_AMM_PROGRAM_ID = new PublicKey(process.env.RAYDIUM_AMM_PROGRAM_ID);

async function subscribeRaydium() {
    console.log("Listening for new Raydium LP transactions...");

    connection.onLogs(RAYDIUM_AMM_PROGRAM_ID, async (log) => {
        try {
            if (log.logs.some(line => line.includes('InitializeInstruction2') || line.includes('CreatePool'))) {
                console.log("New AMM LP transaction found!");
                const signature = log.signature;
                const tokenData = await processRaydiumLpTransaction(connection, signature); // Process the transaction

                if (tokenData) {
                    // Define sniper configuration based on the detected LP
                    const sniperConfig = {
                        baseToken: process.env.BASE_TOKEN, // Use the base token from .env
                        targetToken: tokenData.coinMint.toString(), // Use the coinMint from LP
                        buyAmount: process.env.BUY_AMOUNT || 1, // Use buy amount from .env or default to 1
                        sellTargetPrice: process.env.SELL_TARGET_PRICE || 2, // Use sell target price from .env or default to 2
                        tokenData: tokenData
                    };

                    // Launch a sniper for the new LP
                    SniperManager.addSniper(sniperConfig);
                }
            }
        } catch (error) {
            console.error("Error processing log:", error.message);
        }
    }, 'confirmed');
}

module.exports = { subscribeRaydium };
