const Sniper = require('./Sniper');
require('dotenv').config(); // Load environment variables
const newRaydiumLpService = require('./newRaydiumLpService'); // Import the service for mapping token data

class SniperManager {
    constructor() {
        this.snipers = [];
    }

    async addSniper(config) {
        try {
            // Ensure the base token from the .env is being used
            const baseToken = process.env.BASE_TOKEN;

            // Fetch the correct userCoinVault for the target token using the newRaydiumLpService
            const userCoinVault = await newRaydiumLpService.getUserCoinVault(config.targetToken);

            if (!userCoinVault) {
                console.error('Failed to fetch userCoinVault for token:', config.targetToken);
                return;
            }

            // Pass userCoinVault and baseToken to the sniper config
            const sniperConfig = {
                ...config,
                baseToken, // Use base token from .env
                userCoinVault
            };

            const sniper = new Sniper(sniperConfig);
            this.snipers.push(sniper);
            console.log('Sniper added with config:', sniperConfig);

            // Perform the buy operation and start watching for the target price
            sniper.buyToken().then(() => {
                console.log('Token bought. Now watching for sell target price.');
                sniper.watchPrice().catch(err => {
                    console.error('Error watching price:', err);
                });
            }).catch(err => {
                console.error('Error buying token:', err);
            });

        } catch (error) {
            console.error("Error adding sniper:", error.message);
        }
    }

    setBuyAmount(index, amount) {
        if (this.snipers[index]) {
            this.snipers[index].setBuyAmount(amount);
            console.log(`Buy amount set to ${amount} for sniper at index ${index}`);
        } else {
            console.error('Sniper not found at index:', index);
        }
    }

    setSellTargetPrice(index, price) {
        if (this.snipers[index]) {
            this.snipers[index].setSellTargetPrice(price);
            console.log(`Sell target price set to ${price} for sniper at index ${index}`);
        } else {
            console.error('Sniper not found at index:', index);
        }
    }

    async init() {
        console.log('Sniper Manager initialized');
    }
}

module.exports = new SniperManager();
