import React, { useState } from 'react';
import Eth from "../eth.svg";
import { Link } from 'react-router-dom';

function Header(props) {
  const { address, isConnected, connect } = props;

  const [showPopup, setShowPopup] = useState(false);

  const handleConnect = () => {
    if (window.ethereum) {
      connect();
    } else {
      setShowPopup(true);
    }
  };

  return (
    <header>
      <div className='leftH'>
        <img src="/images/logo-virtual-genius.png" alt='logo' className='logo' /> {/* Updated logo path */}
        <Link to="/" className='link'>
          <div className="headerItem">Home</div> 
        </Link>
        <Link to="/swap" className='link'>
          <div className="headerItem">Swap</div> 
        </Link>
        <Link to="/tokens" className='link'>
          <div className="headerItem">Tokens</div>
        </Link>
      </div>
      <div className='rightH'>
        <div className='headerItem'> 
          <img src={Eth} alt='eth' className='eth' />
          Ethereum
        </div>
        <div className='connectButton' onClick={handleConnect}>
          {isConnected ? (address.slice(0,4)) + "..." + (address.slice(38)) : "Connect"}
        </div>
      </div>
      {showPopup && (
        <div className="popup">
          <p>Please install MetaMask to continue.</p>
          <button onClick={() => setShowPopup(false)}>Close</button>
        </div>
      )}
    </header>
  )
}

export default Header;
