import express from 'express';
import { ethers } from 'ethers';
import fs from 'fs';

export const app = express();
app.use(express.json());

let RPC_URL;
if (process.env.RPC_URL_FILE) {
  try {
    RPC_URL = fs.readFileSync(process.env.RPC_URL_FILE, 'utf-8').trim();
  } catch (err) {
    console.error('Failed to read RPC_URL_FILE:', err);
    process.exit(1);
  }
} else {
  RPC_URL = process.env.RPC_URL;
}

if (!RPC_URL) {
  console.error('Missing RPC_URL or RPC_URL_FILE');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);

app.post('/check-tokens', async (req, res) => {
  try {
    const { senderWallet, tokenContract, amount } = req.body;

    const contract = new ethers.Contract(tokenContract, [
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ], provider);

    const decimals = await contract.decimals();
    const required = ethers.parseUnits(amount, decimals);
    const balance = await contract.balanceOf(senderWallet);

    res.json({
      hasEnoughTokens: balance >= required,
      currentBalance: ethers.formatUnits(balance, decimals),
      requiredAmount: amount
    });
  } catch (error) {
    console.error('Balance Service error:', error);
    res.status(500).json({ error: error.message });
  }
});
