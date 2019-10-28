import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as contract from 'truffle-contract';
import { CollateralType, Network } from '../models';
import { TOKEN_BTC_ADDRESS, TOKEN_ETH_ADDRESS, TOKEN_USD_ADDRESS } from '../models/default-collateral-types';
import { Web3Service } from './web3.service';
import { DefinerApiService } from './definer-api.service';
import { TokenAddress } from '../enums/token-address.enum';
const ignoreCase = require('ignore-case');

const KYBER_NETWORK_PROXY_ARTIFACT = require('../../../contracts/kyber/KyberNetworkProxy.json')
const COMPOUND_CDAI_ARTIFACT = require('../../../contracts/compound/cDai.json')
const ERC20_ARTIFACT = require('../../../build/contracts/ERC20.json');

// Base URL for API queries
// Refer to API/ABI >> RESTFul API Overview >> Network URL section
const NETWORK_URL = 'https://api.kyber.network';

// Token Addresses
export const RINKEBY_KNC_TOKEN_ADDRESS = '0x6FA355a7b6bD2D6bD8b927C489221BFBb6f1D7B2'; // Ropsten DAI token address
export const COMPOUND_CDAI_ADDRESS = '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC';
export const TOKEN_DAI_ADDRESS = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359';

// Gas amount affecting speed of tx
const GAS_PRICE = 'medium';
const DEFAULT_GAS_PRICE = 3000000000;

export const KYBER_ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export class KyberTokenType {
  value: string;
  viewValue: string;
  name: string;
  network: Network;
  icon: string;
}

export const KyberTokenTypes: KyberTokenType[] = [
  <KyberTokenType>{ value: KYBER_ETH_ADDRESS, viewValue: 'ETH', name: 'Ethereum', network: Network.Mainnet, icon: '../../../assets/img/currencies/ETH.png' },

  <KyberTokenType>{ value: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', viewValue: 'DAI', name: 'Dai Stablecoin', network: Network.Mainnet, icon: '../../../assets/img/currencies/DAI.svg' },

  <KyberTokenType>{ value: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', viewValue: 'USDC', name: 'USD Coinbase', network: Network.Mainnet, icon: '../../../assets/img/currencies/USDC.svg' },


  <KyberTokenType>{ value: KYBER_ETH_ADDRESS, viewValue: 'ETH', name: 'Ethereum', network: Network.Rinkeby, icon: '../../../assets/img/currencies/ETH.png' },
  <KyberTokenType>{ value: KYBER_ETH_ADDRESS, viewValue: 'ETH', name: 'Ethereum', network: Network.AppDefinerOrg },
  <KyberTokenType>{ value: KYBER_ETH_ADDRESS, viewValue: 'ETH', name: 'Ethereum', network: Network.Local },


  <KyberTokenType>{ value: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', viewValue: 'WETH', name: '', network: Network.Mainnet, icon: '../../../assets/img/currencies/WETH.svg' },
  <KyberTokenType>{ value: '0xdAC17F958D2ee523a2206206994597C13D831ec7', viewValue: 'USDT', name: '', network: Network.Mainnet, icon: '../../../assets/img/currencies/USDT.png' },
  <KyberTokenType>{ value: '0x0000000000085d4780B73119b644AE5ecd22b376', viewValue: 'TUSD', name: '', network: Network.Mainnet, icon: '../../../assets/img/currencies/TUSD.jpeg' },
  <KyberTokenType>{ value: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', viewValue: 'BNB', name: '', network: Network.Mainnet, icon: '../../../assets/img/currencies/BNB.png' },
  <KyberTokenType>{ value: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', viewValue: 'MKR', name: '', network: Network.Mainnet, icon: '../../../assets/img/currencies/MKR.png' },
  <KyberTokenType>{ value: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF', viewValue: 'BAT', name: '', network: Network.Mainnet, icon: '../../../assets/img/currencies/BAT.png' },

  <KyberTokenType>{ value: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07', name: 'OmiseGO', viewValue: 'OMG', network: Network.Mainnet, icon: '../../../assets/img/currencies/OMG.png' },
  <KyberTokenType>{ value: '0x732fBA98dca813C3A630b53a8bFc1d6e87B1db65', name: 'OmiseGO', viewValue: 'OMG', network: Network.Rinkeby, icon: '../../../assets/img/currencies/BAT.png' },

  // <KyberTokenType>{ value: '0xa74476443119A942dE498590Fe1f2454d7D4aC0d', viewValue: 'GNT', name: '', network: Network.Mainnet, icon: '../../../assets/img/currencies/GNT.png' },
  <KyberTokenType>{ value: '0xe41d2489571d322189246dafa5ebde1f4699f498', viewValue: 'ZRX', name: '', network: Network.Mainnet, icon: '../../../assets/img/currencies/ZRX.png' },
  <KyberTokenType>{ value: '0x1985365e9f78359a9B6AD760e32412f4a445E862', viewValue: 'REP', name: '', network: Network.Mainnet, icon: '../../../assets/img/currencies/REP.png' },
  // <KyberTokenType>{ value: '0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b', viewValue: 'CRO', name: '', network: Network.Mainnet, icon: '../../../assets/img/currencies/CRO.png' },
  <KyberTokenType>{ value: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', viewValue: 'WBTC', name: '', network: Network.Mainnet, icon: '../../../assets/img/currencies/WBTC.svg' },
  <KyberTokenType>{ value: '0x8e870d67f660d95d5be530380d0ec0bd388289e1', viewValue: 'PAX', name: 'Paxos Standard', network: Network.Mainnet, icon: '../../../assets/img/currencies/PAX.png' },
  // <KyberTokenType>{ value: '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd', viewValue: 'GUSD', name: '', network: Network.Mainnet, icon: '../../../assets/img/currencies/GUSD.png' },
  <KyberTokenType>{ value: COMPOUND_CDAI_ADDRESS, viewValue: 'cDAI', name: 'Compound cDai', network: Network.Mainnet, icon: '../../../assets/img/currencies/cDAI.png' },

  <KyberTokenType>{ value: '0x6FA355a7b6bD2D6bD8b927C489221BFBb6f1D7B2', name: 'Kyber Network', viewValue: 'KNC', network: Network.Rinkeby, icon: '../../../assets/img/currencies/BAT.png' },
  <KyberTokenType>{ value: '0x725d648E6ff2B8C44c96eFAEa29b305e5bb1526a', name: 'Mana', viewValue: 'MANA', network: Network.Rinkeby, icon: '../../../assets/img/currencies/BAT.png' },
  <KyberTokenType>{ value: '0xBcb83bAFD042618d5c9b1a91D0Fcd4B935e08CEA', name: 'Polymath', viewValue: 'POLY', network: Network.Rinkeby, icon: '../../../assets/img/currencies/BAT.png' },
  // <KyberTokenType>{ value: '0x058832CA736AB027c12367e53915e34e87a6081B', name: 'Salt', viewValue: 'SALT', network: Network.Rinkeby, icon: '../../../assets/img/currencies/BAT.png' },
  <KyberTokenType>{ value: '0x01DAd357f21BD4fB1D3d8f3B05d1cc151807AA23', name: 'Status Network', viewValue: 'SNT', network: Network.Rinkeby, icon: '../../../assets/img/currencies/BAT.png' },
  // <KyberTokenType>{ value: '0x405A656Dc1b672800D21a15eF5539D4776F6654c', name: 'Zilliqa', viewValue: 'ZIL', network: Network.Rinkeby, icon: '../../../assets/img/currencies/BAT.png' },
  <KyberTokenType>{ value: '0xf2de858bb65ca8b35029d2e40a04b76afdb87cd5', name: '', viewValue: 'FIN', network: Network.AppDefinerOrg, icon: '../../../assets/img/currencies/BAT.png' },
  <KyberTokenType>{ value: '0x9269dc4aee97808b0d5b17a4ccfc6708f1aae736', viewValue: 'FIN', network: Network.Local, icon: '../../../assets/img/currencies/BAT.png' },
];

@Injectable({
  providedIn: 'root'
})
export class KyberApiService {

  private ERC20 = contract(ERC20_ARTIFACT);
  private KEYBER_NETWORK_PROXY_CONTRACT = contract(KYBER_NETWORK_PROXY_ARTIFACT);
  private COMPOUND_CDAI_CONTRACT = contract(COMPOUND_CDAI_ARTIFACT);
  private kyberNetworkProxy: any;

  // Addresses are from: https://developer.kyber.network/docs/Environments-Intro/
  private KyberContractAddresses = {
    'Rinkeby': '0xF77eC7Ed5f5B9a5aee4cfa6FFCaC6A4C315BaC76',
    'Mainnet': '0x818E6FECD516Ecc3849DAf6845e3EC868087B755',
  };

  private CDaiContractAddresses = {
    'Rinkeby': '',
    'Mainnet': '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC',
  };

  constructor(
    private http: HttpClient,
    private localStorage: LocalStorageService,
    private web3: Web3Service,
    private definerApiService: DefinerApiService,
  ) {
    console.log(this.KyberContractAddresses[environment.Network]);
  }

  async initializeContract() {
    this.KEYBER_NETWORK_PROXY_CONTRACT.setProvider(this.web3.web3.currentProvider);
    this.ERC20.setProvider(this.web3.web3.currentProvider);
    this.COMPOUND_CDAI_CONTRACT.setProvider(this.web3.web3.currentProvider);
    this.kyberNetworkProxy = await this.KEYBER_NETWORK_PROXY_CONTRACT.at(this.KyberContractAddresses[environment.Network]);
  }

  // DISCLAIMER: Code snippets in this guide are just examples and you
  // should always do your own testing. If you have questions, visit our
  // https://t.me/KyberDeveloper.

  // public async broadcastTx(rawTx) {
  //   // Extract raw tx details, create a new Tx
  //   const tx = new Tx(rawTx);
  //   // Sign the transaction
  //   tx.sign(PRIVATE_KEY);
  //   // Serialize the transaction (RLP Encoding)
  //   const serializedTx = tx.serialize();
  //   // Broadcast the tx
  //   const txReceipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).catch(error => console.log(error));
  //   // Log the tx receipt
  //   console.log(txReceipt);
  // }

  // DISCLAIMER: Code snippets in this guide are just examples and you
  // should always do your own testing. If you have questions, visit our
  // https://t.me/KyberDeveloper.

  public caseInsensitiveEquals(a, b) {
    return typeof a === 'string' && typeof b === 'string' ?
      a.localeCompare(b, undefined, {
        sensitivity: 'accent'
      }) === 0 :
      a === b;
  }

  public async isTokenSupported(tokenAddress) {
    if (ignoreCase.equals(tokenAddress, COMPOUND_CDAI_ADDRESS)) {
      return true;
    }
    const tokensBasicInfoRequest = await fetch(`${NETWORK_URL}/currencies`);
    const tokensBasicInfo = await tokensBasicInfoRequest.json();
    const tokenSupported = tokensBasicInfo.data.some(token => {
      return this.caseInsensitiveEquals(tokenAddress, token.id)
    });
    if (!tokenSupported) {
      console.log('Token is not supported');
    }
    return tokenSupported;
  }

  public async checkAndApproveTokenContract(tokenAddress, userAddress, gasPrice = GAS_PRICE) {
    const enabledStatusesRequest = await fetch(`${NETWORK_URL}/users/${userAddress}/currencies`);
    const enabledStatuses = await enabledStatusesRequest.json();
    let txsRequired = 0;
    for (const token of enabledStatuses.data) {
      if (this.caseInsensitiveEquals(tokenAddress, token.id)) {
        txsRequired = token.txs_required;
        break;
      }
    }
    switch (txsRequired) {
      case 1:
        console.log('Approving to max amount');
        // No allowance so approve to maximum amount (2^255)
        await this.enableTokenTransfer(tokenAddress, userAddress, gasPrice);
        break;
      case 2:
        // Allowance has been given but is insufficient.
        // Have to approve to 0 first to avoid this issue https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
        // Approve to 0
        console.log('Approving to 0');
        await this.enableTokenTransfer(tokenAddress, userAddress, gasPrice);
        // Approve to maximum amount (2^255)
        console.log('Approving to max amount');
        await this.enableTokenTransfer(tokenAddress, userAddress, gasPrice);
        break;
      default:
        // Shouldn't need to do anything else in other scenarios.
        break;
    }
  }

  public async enableTokenTransfer(tokenAddress, userAddress, gasPrice) {
    // const enableTokenDetailsRequest =
    //   await fetch(`${NETWORK_URL}/users/${userAddress}/currencies/${tokenAddress}/enable_data?gas_price=${gasPrice}`);
    // const enableTokenDetails = await enableTokenDetailsRequest.json();
    // const rawTx = enableTokenDetails.data;
    // // await this.broadcastTx(rawTx);
  }

  public async getSellQty(tokenAddress, qty) {
    const sellQtyRequest = await fetch(`${NETWORK_URL}/sell_rate?id=${tokenAddress}&qty=${qty}`);
    let sellQty = await sellQtyRequest.json();
    sellQty = sellQty.data[0].dst_qty[0];
    return sellQty;
  }

  public async getApproximateBuyQty(tokenAddress) {
    const QTY = 1; // Quantity used for the approximation
    const approximateBuyRateRequest = await fetch(`${NETWORK_URL}/buy_rate?id=${tokenAddress}&qty=${QTY}`);
    let approximateBuyQty = await approximateBuyRateRequest.json();
    approximateBuyQty = approximateBuyQty.data[0].src_qty[0];
    return approximateBuyQty;
  }

  async getPriceConversion() {
    let request = await fetch(`https://api.kyber.network/api/tokens/pairs`);
    let conversionTable = await request.json();
    return conversionTable;
  }

  async getSupportedTokens() {

  }

  // sellQty = output from getSellQty function
  // buyQty = output from getApproximateBuyQty function
  // srcQty = token qty amount to swap from (100 BAT tokens in scenario)
  public async getApproximateReceivableTokens(sellQty, buyQty, srcQty) {
    const expectedAmountWithoutSlippage = buyQty / sellQty * srcQty;
    const expectedAmountWithSlippage = 0.97 * expectedAmountWithoutSlippage;
    return expectedAmountWithSlippage;
  }

  // DISCLAIMER: Code snippets in this guide are just examples and you
  // should always do your own testing. If you have questions, visit our
  // https://t.me/KyberDeveloper.

  public async executeTrade(destAddress, srcToken, dstToken, srcQty, minDstQty, gasPrice = GAS_PRICE, refAddress = '') {
    await this.initializeContract();

    console.log(this.definerApiService.getCurrentUserAddr());
    await this.kyberNetworkProxy.tradeWithHint(
      srcToken,
      srcQty.toString(),
      dstToken,
      destAddress,
      10,
      1,
      0, // walletId for fee sharing program
      'DeFiner',
      { from: this.definerApiService.getCurrentUserAddr(), gasPrice: DEFAULT_GAS_PRICE }
    );
  }

  public async swapTokenToEther(srcToken, srcQty, minConversionRate) {
    await this.initializeContract();

    // Approve cDai to extract DAI
    const fromToken = await this.ERC20.at(srcToken);
    await fromToken.approve(
      this.KyberContractAddresses[environment.Network],
      this.web3.web3.utils.toWei(srcQty.toString(), TokenAddress.getTokenWeiUnit(srcToken)),
      {from: this.definerApiService.getCurrentUserAddr(), gasPrice: DEFAULT_GAS_PRICE}
    );

    await this.kyberNetworkProxy.swapTokenToEther(
      srcToken,
      this.web3.web3.utils.toWei(srcQty.toString(), TokenAddress.getTokenWeiUnit(srcToken)),
      minConversionRate,
      { from: this.definerApiService.getCurrentUserAddr(), gasPrice: DEFAULT_GAS_PRICE }
    );
  }

  public async swapEtherToToken(destToken, srcQty, minConversionRate) {
    await this.initializeContract();

    if (ignoreCase.equals(destToken, COMPOUND_CDAI_ADDRESS)) {
      // convert to DAI, then to cDai
      await this.kyberNetworkProxy.swapEtherToToken(
        TOKEN_DAI_ADDRESS,
        minConversionRate,
        {
          from: this.definerApiService.getCurrentUserAddr(),
          value: this.web3.web3.utils.toWei(srcQty.toString(), 'ether'), gasPrice: DEFAULT_GAS_PRICE
        }
      );

      const tokenAmount = this.web3.web3.utils.toWei(srcQty.toString(), TokenAddress.getTokenWeiUnit(TOKEN_DAI_ADDRESS));

      // Approve cDai to extract DAI
      const daiToken = await this.ERC20.at(TOKEN_DAI_ADDRESS);
      await daiToken.approve(
        COMPOUND_CDAI_ADDRESS,
        tokenAmount,
        {from: this.definerApiService.getCurrentUserAddr(), gasPrice: DEFAULT_GAS_PRICE}
      );

      // send DAI to cDai
      const cDaiToken = await this.COMPOUND_CDAI_CONTRACT.at(COMPOUND_CDAI_ADDRESS);
      await cDaiToken.mint(tokenAmount, {from: this.definerApiService.getCurrentUserAddr(), gasPrice: DEFAULT_GAS_PRICE});
    }
    else
    {
      // normal path
      await this.kyberNetworkProxy.swapEtherToToken(
        destToken,
        minConversionRate,
        {
          from: this.definerApiService.getCurrentUserAddr(),
          value: this.web3.web3.utils.toWei(srcQty.toString(), 'ether'), gasPrice: DEFAULT_GAS_PRICE
        }
      );
    }
  }

  public async swapTokenToToken(srcToken, srcQty, destToken, minConversionRate) {
    await this.initializeContract();

    // Approve cDai to extract DAI
    const fromToken = await this.ERC20.at(srcToken);
    await fromToken.approve(
      this.KyberContractAddresses[environment.Network],
      this.web3.web3.utils.toWei(srcQty.toString(), TokenAddress.getTokenWeiUnit(srcToken)),
      {from: this.definerApiService.getCurrentUserAddr(), gasPrice: DEFAULT_GAS_PRICE}
    );    

    if (ignoreCase.equals(srcToken, COMPOUND_CDAI_ADDRESS)) {
      const tokenAmount = this.web3.web3.utils.toWei(srcQty.toString(), TokenAddress.getTokenWeiUnit(TOKEN_DAI_ADDRESS));

      const cDaiToken = await this.COMPOUND_CDAI_CONTRACT.at(COMPOUND_CDAI_ADDRESS);
      await cDaiToken.redeem(tokenAmount, {from: this.definerApiService.getCurrentUserAddr(), gasPrice: DEFAULT_GAS_PRICE});
      // await cDaiToken.redeemUnderlying(tokenAmount, {from: this.definerApiService.getCurrentUserAddr(), gasPrice: DEFAULT_GAS_PRICE});
      if (!ignoreCase.equals(destToken,TOKEN_DAI_ADDRESS)) {
        await this.kyberNetworkProxy.swapTokenToToken(
          TOKEN_DAI_ADDRESS,
          this.web3.web3.utils.toWei(srcQty.toString(), TokenAddress.getTokenWeiUnit(TOKEN_DAI_ADDRESS)),
          destToken,
          minConversionRate,
          { from: this.definerApiService.getCurrentUserAddr(), gasPrice: DEFAULT_GAS_PRICE }
        );
      }
    }
    else if (ignoreCase.equals(destToken, COMPOUND_CDAI_ADDRESS)) {

      if (!ignoreCase.equals(srcToken, TOKEN_DAI_ADDRESS)) {
        // convert to DAI, then to cDai
        await this.kyberNetworkProxy.swapTokenToToken(
          srcToken,
          this.web3.web3.utils.toWei(srcQty.toString(), TokenAddress.getTokenWeiUnit(srcToken)),
          TOKEN_DAI_ADDRESS,
          minConversionRate,
          { from: this.definerApiService.getCurrentUserAddr(), gasPrice: DEFAULT_GAS_PRICE }
        );
      }

      const tokenAmount = this.web3.web3.utils.toWei(srcQty.toString(), TokenAddress.getTokenWeiUnit(TOKEN_DAI_ADDRESS));

      // Approve cDai to extract DAI
      const daiToken = await this.ERC20.at(TOKEN_DAI_ADDRESS);
      await daiToken.approve(
        COMPOUND_CDAI_ADDRESS,
        tokenAmount,
        {from: this.definerApiService.getCurrentUserAddr(), gasPrice: DEFAULT_GAS_PRICE}
      );

      // send DAI to cDai
      const cDaiToken = await this.COMPOUND_CDAI_CONTRACT.at(COMPOUND_CDAI_ADDRESS);
      await cDaiToken.mint(tokenAmount, {from: this.definerApiService.getCurrentUserAddr(), gasPrice: DEFAULT_GAS_PRICE});
    }
    else
    {
      // normal path
      await this.kyberNetworkProxy.swapTokenToToken(
        srcToken,
        this.web3.web3.utils.toWei(srcQty.toString(), TokenAddress.getTokenWeiUnit(srcToken)),
        destToken,
        minConversionRate,
        { from: this.definerApiService.getCurrentUserAddr(), gasPrice: DEFAULT_GAS_PRICE }
      );
    }
  }
}
