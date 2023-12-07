import React, { useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import tokenList from "../tokenList.json";
import axios from "axios";
import { useBalance, useSendTransaction, useWaitForTransaction } from "wagmi";


function Swap(props) {
  const { address, isConnected } = props;
  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
  const [transactionModalMessage, setTransactionModalMessage] = useState('');
  const [messageApi, contextHolder] = message.useMessage();
  const [slippage, setSlippage] = useState(2.5);
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [prices, setPrices] = useState(null);
  const [txDetails, setTxDetails] = useState({
    to:null,
    data: null,
    value: null,
  }); 

  const balance1 = useBalance({
    address: address,
    token: tokenOne.address,
    });
  
    const balance2 = useBalance({
      address: address,
      token: tokenTwo.address,
    });

  const showTransactionModal = (message) => {
    setTransactionModalMessage(message);
    setIsTransactionModalVisible(true);
  };

  const {data, sendTransaction} = useSendTransaction({
    request: {
      from: address,
      to: String(txDetails.to),
      data: String(txDetails.data),
      value: String(txDetails.value),
    }
  })

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  const config = {
    headers: {
      "Authorization": `Bearer ${process.env.API_KEY_1INCH}`
    },
    params: {}
  };

  function handleSlippageChange(e) {
    setSlippage(e.target.value);
  }

  function changeAmount(e) {
    setTokenOneAmount(e.target.value);
    if(e.target.value && prices){
      setTokenTwoAmount((e.target.value * prices.ratio).toFixed(2))
    }else{
      setTokenTwoAmount(null);
    }
  }

  function switchTokens() {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    const one = tokenOne;
    const two = tokenTwo;
    setTokenOne(two);
    setTokenTwo(one);
    fetchPrices(two.address, one.address);
  }

  function openModal(asset) {
    setChangeToken(asset);
    setIsOpen(true);
  }

  function modifyToken(i){
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    if (changeToken === 1) {
      setTokenOne(tokenList[i]);
      fetchPrices(tokenList[i].address, tokenTwo.address)
    } else {
      setTokenTwo(tokenList[i]);
      fetchPrices(tokenOne.address, tokenList[i].address)
    }
    setIsOpen(false);
  }

  async function fetchPrices(one, two){

      const res = await axios.get(`https://dexback23.azurewebsites.net/tokenPrice`, {
        params: {addressOne: one, addressTwo: two}
      })

      
      setPrices(res.data)
  }

  async function fetchDexSwap() {
    try {
      const allowanceResponse = await axios.get(`https://dexback23.azurewebsites.net/1inch/approve/allowance?tokenAddress=${tokenOne.address}&walletAddress=${address}`, config);
  
      if (allowanceResponse.data.allowance === "0") {
        const approveResponse = await axios.get(`https://dexback23.azurewebsites.net/1inch/approve/transaction?tokenAddress=${tokenOne.address}`, config);
        
        if (approveResponse.data.approved) {
          showTransactionModal('Transação de aprovação bem-sucedida!');
        } else {
          showTransactionModal('Falha na aprovação da transação. Por favor, tente novamente.');
        }
        return;
      }
  
      const txResponse = await axios.get(`https://dexback23.azurewebsites.net/1inch/swap?fromTokenAddress=${tokenOne.address}&toTokenAddress=${tokenTwo.address}&amount=${tokenOneAmount.padEnd(tokenOne.decimals + tokenOneAmount.length, '0')}&fromAddress=${address}&slippage=${slippage}`, config);
  
      if (txResponse.data.toAmount && txResponse.data.tx) {
        let decimals = Number(`1E${tokenTwo.decimals}`);
        setTokenTwoAmount((Number(txResponse.data.toAmount) / decimals).toFixed(2));
        setTxDetails(txResponse.data.tx);
        showTransactionModal('Troca bem-sucedida!');
      } else {
        showTransactionModal('Falha na troca. Por favor, verifique os detalhes e tente novamente.');
      }
    } catch (error) {
      if (error.response) {
        // Erros de resposta da API (ex: 400, 401, 500)
        showTransactionModal(`Erro na transação: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        // Erros de requisição (ex: problema de rede)
        showTransactionModal('Erro na transação: Falha ao enviar a requisição. Por favor, verifique sua conexão.');
      } else {
        // Erros desconhecidos
        showTransactionModal('Erro na transação: Um erro desconhecido ocorreu.');
      }
      console.error("Detalhes do erro:", error);
    }
  }
  


  useEffect(()=>{

    fetchPrices(tokenList[0].address, tokenList[1].address)

  }, [])

  useEffect(() => {
    if (txDetails.to && isConnected) {
      sendTransaction();
    }
  }, [txDetails.to, isConnected, sendTransaction]);


  useEffect(() => {
    messageApi.destroy();
    if (isLoading) {
      messageApi.open({
        type: 'loading',
        content: 'Transaction is Pending...',
        duration: 0,
      });
    }
  }, [isLoading, messageApi]);  

  useEffect(() => {
    messageApi.destroy();
    if (isSuccess) {
      messageApi.open({
        type: 'success',
        content: 'Transaction Successful',
        duration: 1.5,
      });
    } else if (txDetails.to) {
      messageApi.open({
        type: 'error',
        content: 'Transaction Failed',
        duration: 1.5,
      });
    }
  }, [isSuccess, txDetails.to, messageApi]);
  


  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  );

  return (
    <>
      {contextHolder}
      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a token"
      >
        <div className="modalContent">
          {tokenList?.map((e, i) => {
            return (
              <div
                className="tokenChoice"
                key={i}
                onClick={() => modifyToken(i)}
              >
                <img src={e.img} alt={e.ticker} className="tokenLogo" />
                <div className="tokenChoiceNames">
                  <div className="tokenName">{e.name}</div>
                  <div className="tokenTicker">{e.ticker}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <h4>Swap</h4>
          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomRight"
          >
            <SettingOutlined className="cog" />
          </Popover>
        </div>
        <div className="inputs">
          <Input
            placeholder="0"
            value={tokenOneAmount}
            onChange={changeAmount}
            disabled={!prices}
          />
          <Input placeholder="0" value={tokenTwoAmount} disabled={true} />
          <div className="switchButton" onClick={switchTokens}>
            <ArrowDownOutlined className="switchArrow" />
          </div>
          <div className="assetOne" onClick={() => openModal(1)}>
            <img src={tokenOne.img} alt="assetOneLogo" className="assetLogo" />
            {tokenOne.ticker}
            <DownOutlined />
          </div>
          <div className="balance1">
          Balance: {balance1.data?.formatted}
          </div>
          <div className="assetTwo" onClick={() => openModal(2)}>
            <img src={tokenTwo.img} alt="assetOneLogo" className="assetLogo" />
            {tokenTwo.ticker}
            <DownOutlined />
          </div>
          <div className="balance2">
          Balance: {balance2.data?.formatted}
        </div>
        </div>
        <div className="swapButton" disabled={!tokenOneAmount || !isConnected} onClick={fetchDexSwap}>Swap</div>
      </div>
      <Modal
        title="Status da Transação"
        open={isTransactionModalVisible}
        onOk={() => setIsTransactionModalVisible(false)}
        onCancel={() => setIsTransactionModalVisible(false)}
      >
        <div className="modalContentError">
          <p>{transactionModalMessage}</p>
        </div>
      </Modal>
    </>
  );
}

export default Swap;