import React, {useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Switch, Route, Redirect, useLocation} from 'react-router-dom';
import {changeTheme, setCurExt, setExtensionsList, setWalletIsConnected, showPopup} from './store/actions/app';
import {setLiquidityList, setPairsList, setPubKey, setSubscribeData, setTokenList, setTransactionsList, setWallet} from './store/actions/wallet';
import { getAllClientWallets, getAllPairsWoithoutProvider, getClientBalance, subscribe } from './extensions/webhook/script';
import { checkExtensions, getCurrentExtension } from './extensions/extensions/checkExtensions';
import { setSwapAsyncIsWaiting, setSwapFromInputValue, setSwapFromToken, setSwapToInputValue, setSwapToToken } from './store/actions/swap';
import { setPoolAsyncIsWaiting, setPoolFromInputValue, setPoolFromToken, setPoolToInputValue, setPoolToToken } from './store/actions/pool';
import Account from './pages/Account/Account';
import Swap from './pages/Swap/Swap';
import Pool from './pages/Pool/Pool';
import Popup from './components/Popup/Popup';
import Header from './components/Header/Header'
import Manage from './pages/Manage/Manage';
import AddLiquidity from './pages/AddLiquidity/AddLiquidity';

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const popup = useSelector(state => state.appReducer.popup);
  const appTheme = useSelector(state => state.appReducer.appTheme);
  const pubKey = useSelector(state => state.walletReducer.pubKey);
  const walletIsConnected = useSelector(state => state.appReducer.walletIsConnected);
  const swapAsyncIsWaiting = useSelector(state => state.swapReducer.swapAsyncIsWaiting);
  const poolAsyncIsWaiting = useSelector(state => state.poolReducer.poolAsyncIsWaiting);
  const subscribeData = useSelector(state => state.walletReducer.subscribeData);

  useEffect(async () => {
    const theme = localStorage.getItem('appTheme') === null ? 'light' : localStorage.getItem('appTheme');
    if(appTheme !== theme) dispatch(changeTheme(theme));

    const wallet = localStorage.getItem('wallet') === null ? {} : JSON.parse(localStorage.getItem('wallet'));
    if(wallet.id) {
      dispatch(setWallet(wallet));
      dispatch(setWalletIsConnected(true));
    }

    const extName = localStorage.getItem('extName');
    if(extName) {
      let curExt = await getCurrentExtension(extName);
      console.log(curExt);
      dispatch(setCurExt(curExt));
    }

    const pubKey = localStorage.getItem('pubKey') === null ? {} : JSON.parse(localStorage.getItem('pubKey'));
    if(pubKey.status) dispatch(setPubKey(pubKey));

    const tokenList = localStorage.getItem('tokenList') === null ? [] : JSON.parse(localStorage.getItem('tokenList'));
    if(tokenList.length) {
      tokenList.forEach(async item => await subscribe(item.walletAddress));
      dispatch(setTokenList(tokenList));
    }

    const liquidityList = localStorage.getItem('liquidityList') === null ? [] : JSON.parse(localStorage.getItem('liquidityList'));
    if(liquidityList.length) {
      liquidityList.forEach(async item => await subscribe(item.walletAddress));
      dispatch(setLiquidityList(liquidityList));
    }

    const transactionsList = localStorage.getItem('transactionsList') === null ? [] : JSON.parse(localStorage.getItem('transactionsList'));
    if(transactionsList.length) dispatch(setTransactionsList(transactionsList));

    const extensionsList = await checkExtensions();
    dispatch(setExtensionsList(extensionsList));

    const pairs = await getAllPairsWoithoutProvider();
    dispatch(setPairsList(pairs));

    // setInterval(async () => {
    //   const pairs = await getAllPairsWoithoutProvider();
    //   dispatch(setPairsList(pairs));
    // }, 5000);
  }, []);



  useEffect(() => {
    window.addEventListener('beforeunload', function(e) {
      if(swapAsyncIsWaiting || poolAsyncIsWaiting) e.returnValue = ''
    })
  }, [swapAsyncIsWaiting, poolAsyncIsWaiting]);

  useEffect(async () => {
    if(subscribeData.dst) {
      const clientBalance = await getClientBalance(pubKey.address);
      dispatch(setWallet({id: pubKey.address, balance: clientBalance}));

      let tokenList = await getAllClientWallets(pubKey.address);
      let liquidityList = [];

      if(tokenList.length) {
        console.log('token list');
        tokenList.forEach(async item => await subscribe(item.walletAddress));

        liquidityList = tokenList.filter(i => i.symbol.includes('/'));

        tokenList = tokenList.filter(i => !i.symbol.includes('/')).map(i => (
          {
            ...i,
            symbol: i.symbol === 'WTON' ? 'TON' : i.symbol
          })
        );

        dispatch(setTokenList(tokenList));
        dispatch(setLiquidityList(liquidityList));
      }

      if(swapAsyncIsWaiting) {
        console.log('popup');
        dispatch(showPopup({type: 'success', link: subscribeData.transactionID}));
        dispatch(setSwapFromToken({
          walletAddress: '',
          symbol: '',
          balance: 0
        }));
        dispatch(setSwapToToken({
          walletAddress: '',
          symbol: '',
          balance: 0
        }));
        dispatch(setSwapFromInputValue(0));
        dispatch(setSwapToInputValue(0));
        dispatch(setSwapAsyncIsWaiting(false));
      } else if(poolAsyncIsWaiting) {
        dispatch(showPopup({type: 'success', link: subscribeData.transactionID}));
        dispatch(setPoolFromToken({
          walletAddress: '',
          symbol: '',
          balance: 0
        }));
        dispatch(setPoolToToken({
          walletAddress: '',
          symbol: '',
          balance: 0
        }));
        dispatch(setPoolFromInputValue(0));
        dispatch(setPoolToInputValue(0));
        dispatch(setPoolAsyncIsWaiting(false));
      }
    }
  }, [subscribeData]);

  return (
    <>
      <Header />
      <Switch location={location}>
        <Route path="/account" component={Account} />
        <Route path="/swap" component={Swap} />
        <Route path="/pool"  component={Pool} />
        <Route path="/add-liquidity" component={AddLiquidity} />
        <Route path="/manage" render={() => !walletIsConnected ? <Redirect to="/pool" /> : <Manage />} />
        <Redirect from="" to="/swap" />
      </Switch>

      {popup.isVisible && <Popup type={popup.type} message={popup.message} link={popup.link} />}
    </>
  );
}

export default App;
