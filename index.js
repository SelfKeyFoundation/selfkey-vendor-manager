const Web3 = require('web3');
const ProviderEngine = require('web3-provider-engine');
const FetchSubprovider = require('web3-provider-engine/subproviders/fetch');
const HookedWalletEthTxSubprovider = require('web3-provider-engine/subproviders/hooked-wallet-ethtx');

selfkeyMainABI = require('./SelfKeyMain.json').abi;

const chainURL = 'https://ropsten.infura.io/v3/...';
const contractAddress = '...';
const privateKey = '...';
const vendorDID = '...';

let web3 = null;

const getWalletEthTxSubprovider = _ => {
	return new HookedWalletEthTxSubprovider({
		getAccounts: callback => {
			callback(null, [web3.eth.defaultAccount]);
		},
		getPrivateKey: (address, callback) => {
			if (address.toLowerCase() === web3.eth.defaultAccount.toLowerCase()) {
				return callback(
					null,
					Buffer.from(
						web3.eth.accounts.wallet[address].privateKey.replace('0x', ''),
						'hex'
					)
				);
			}
			return callback(new Error('not private key supplied for that account'));
		}
	});
}

const engine = new ProviderEngine();
engine.addProvider(getWalletEthTxSubprovider());
engine.addProvider(new FetchSubprovider({ rpcUrl: chainURL }));
engine.start();
web3 = new Web3(engine);

web3.transactionConfirmationBlocks = 2;

const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

const selfkeyMain = new web3.eth.Contract(selfkeyMainABI, contractAddress);

const getGasLimit = async _ => {
	const MAX_GAS = 4500000;
	const estimate = await selfkeyMain.methods.registerVendor(vendorDID).estimateGas({ from: account.address });
	return Math.round(Math.min(estimate * 1.1, MAX_GAS));
}

const registerVendor = async _ => {
	const gas = await getGasLimit();
	return selfkeyMain.methods.registerVendor(vendorDID).send({ from: account.address, gas });
};

registerVendor().then(console.log);

