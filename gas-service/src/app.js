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

app.post('/check-tx-gas', async (req, res) => {
  try {
    const { senderWallet, tokenContract, amount, recipientAddress } = req.body;

    const erc20 = new ethers.Contract(
      tokenContract,
      ['function decimals() view returns (uint8)'],
      provider
    );
    const decimals = await erc20.decimals();
    const parsedAmount = ethers.parseUnits(amount, decimals);

    const iface = new ethers.Interface([
      'function transfer(address,uint256) returns (bool)'
    ]);
    const data = iface.encodeFunctionData('transfer', [recipientAddress, parsedAmount]);

    const gasLimit = await provider.estimateGas({
      from: senderWallet,
      to: tokenContract,
      data
    });

    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas;

    const gasCost = gasLimit * gasPrice;
    const balance = await provider.getBalance(senderWallet);

    res.json({
      hasEnoughEth: balance >= gasCost,
      requiredGas: ethers.formatEther(gasCost),
      currentBalance: ethers.formatEther(balance)
    });
  } catch (error) {
    console.error('Gas Service error:', error);
    res.status(500).json({ error: error.message });
  }
});
