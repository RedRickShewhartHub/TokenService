import fs from 'fs';
import axios from 'axios';
import express from 'express';
import { ethers } from 'ethers';

export const app = express();
app.use(express.json());

const { TOKEN_ADDRESS, PRIVATE_KEY_FILE, RPC_URL_FILE } = process.env;

if (!TOKEN_ADDRESS || !PRIVATE_KEY_FILE || !RPC_URL_FILE) {
  console.error('Missing TOKEN_ADDRESS, PRIVATE_KEY_FILE or RPC_URL_FILE');
  process.exit(1);
}

let privateKey;
try {
  privateKey = fs.readFileSync(PRIVATE_KEY_FILE, 'utf8').trim();
} catch (e) {
  console.error('Cannot read private key:', e);
  process.exit(1);
}

let rpcUrl;
try {
  rpcUrl = fs.readFileSync(RPC_URL_FILE, 'utf8').trim();
} catch (e) {
  console.error('Cannot read RPC_URL_FILE:', e);
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

app.get('/health', (_req, res) => res.send('OK'));

async function checkBalances(sender, amount) {
  const [tok, gas] = await Promise.all([
    axios.post('http://balance-service:3002/check-tokens', {
      senderWallet: sender,
      tokenContract: TOKEN_ADDRESS,
      amount
    }),
    axios.post('http://gas-service:3001/check-tx-gas', {
      senderWallet: sender,
      tokenContract: TOKEN_ADDRESS,
      recipientAddress: sender,
      amount
    })
  ]);
  return { token: tok.data, gas: gas.data };
}

app.post('/transfer', async (req, res) => {
  try {
    const { userAddress, amount } = req.body;
    if (!userAddress || !amount) {
      return res.status(400).json({ error: 'userAddress & amount required' });
    }

    const sender = wallet.address;
    const { token, gas } = await checkBalances(sender, amount);

    if (!token.hasEnoughTokens) {
      return res.status(400).json({
        error: 'Insufficient tokens',
        current: token.currentBalance,
        required: token.requiredAmount
      });
    }

    if (!gas.hasEnoughEth) {
      return res.status(400).json({
        error: 'Insufficient ETH for gas',
        currentEth: gas.currentBalance,
        requiredGas: gas.requiredGas
      });
    }

    const iface = new ethers.Interface(['function transfer(address,uint256)']);
    const data = iface.encodeFunctionData('transfer', [
      userAddress,
      ethers.parseUnits(amount, 18)
    ]);

    const feeData = await provider.getFeeData();
    const { maxFeePerGas, maxPriorityFeePerGas } = feeData;
    const nonce = await provider.getTransactionCount(sender);

    const txRequest = {
      to: TOKEN_ADDRESS,
      data,
      gasLimit: 100_000,
      nonce,
      maxFeePerGas,
      maxPriorityFeePerGas
    };

    const txResponse = await wallet.sendTransaction(txRequest);
    res.json({ success: true, txHash: txResponse.hash });
  } catch (e) {
    console.error('Transfer error:', e);
    res.status(500).json({ error: e.message });
  }
});
