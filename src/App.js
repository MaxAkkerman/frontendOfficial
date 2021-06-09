import React, {useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Switch, Route, Redirect, useLocation} from 'react-router-dom';
import {changeTheme, setCurExt, setExtensionsList, setWalletIsConnected} from './store/actions/app';
import {setPairsList, setPubKey, setTokenList, setTransactionsList, setWallet} from './store/actions/wallet';
import { getAllPairsWoithoutProvider } from './extensions/webhook/script';
import { checkExtensions } from './extensions/extensions/checkExtensions';
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
  const walletIsConnected = useSelector(state => state.appReducer.walletIsConnected);
  const swapAsyncIsWaiting = useSelector(state => state.swapReducer.swapAsyncIsWaiting);

  useEffect(async () => {
    const theme = localStorage.getItem('appTheme') === null ? 'light' : localStorage.getItem('appTheme');
    if(appTheme !== theme) dispatch(changeTheme(theme));

    const wallet = localStorage.getItem('wallet') === null ? {} : JSON.parse(localStorage.getItem('wallet'));
    if(wallet.id) {
      dispatch(setWallet(wallet));
      dispatch(setWalletIsConnected(true));
    }

    const curExt = localStorage.getItem('curExt') === null ? {} : JSON.parse(localStorage.getItem('curExt'));
    if(curExt._extLib) dispatch(setCurExt(curExt));

    const pubKey = localStorage.getItem('pubKey') === null ? {} : JSON.parse(localStorage.getItem('pubKey'));
    if(pubKey.status) dispatch(setPubKey(pubKey));

    const tokenList = localStorage.getItem('tokenList') === null ? [] : JSON.parse(localStorage.getItem('tokenList'));
    if(tokenList.length) dispatch(setTokenList(tokenList));

    const transactionsList = localStorage.getItem('transactionsList') === null ? [] : JSON.parse(localStorage.getItem('transactionsList'));
    if(transactionsList.length) dispatch(setTransactionsList(transactionsList));
    
    const extensionsList = await checkExtensions();
    dispatch(setExtensionsList(extensionsList));

    const pairs = await getAllPairsWoithoutProvider();
    dispatch(setPairsList(pairs))
  }, []);


  useEffect(() => {
    window.addEventListener('beforeunload', function(e) {
      if(swapAsyncIsWaiting) e.returnValue = ''
    })
  }, [swapAsyncIsWaiting]);

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
