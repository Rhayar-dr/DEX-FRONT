import { Route } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import Swap from "./components/Swap";
import Tokens from "./components/Tokens";
import Home from "./components/Home";
import { Routes } from 'react-router-dom';
import { useConnect , useAccount } from 'wagmi';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';

function App() {

  const { address, isConnected } = useAccount();
  const { connect} = useConnect({
    connector: new MetaMaskConnector(),
  });

  return (
  
  <div className="App">
    <Header connect={connect} isConnected={isConnected} address={address} />
      <div className="mainWindow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/swap" element={<Swap isConnected={isConnected} address={address} />} />
          <Route path="/tokens" element={<Tokens />} />
        </Routes>
      </div>
  </div>
  
  )
}

export default App;
