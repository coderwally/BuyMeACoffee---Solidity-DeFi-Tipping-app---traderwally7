import abi from '../utils/BuyMeACoffee.json';
import { ethers } from "ethers";
import Head from 'next/head'
import React, { useEffect, useState } from "react";
import styles from '../styles/Home.module.css'

export default function Home() {
  // Contract Address & ABI
  const contractAddress = "0xd1eF9e6381bb06E6F6280fc54E806656617A051d";
  const contractABI = abi.abi;

  // Component state
  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState([]);

  const onNameChange = (event) => {
    setName(event.target.value);
  }

  const onMessageChange = (event) => {
    setMessage(event.target.value);
  }

  // Wallet connection logic
  const isWalletConnected = async () => {
    try {
      const { ethereum } = window;

      const accounts = await ethereum.request({ method: 'eth_accounts' })
      console.log("accounts: ", accounts);

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("wallet is connected! " + account);
      } else {
        console.log("make sure MetaMask is connected");
      }
    } catch (error) {
      console.log("error: ", error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("please install MetaMask");
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  const buyCoffee = async (amount) => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, "any");
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("buying coffee..")
        const amountToSend = ethers.utils.parseEther(amount);
        const coffeeTxn = await buyMeACoffee.buyCoffee(
          name ? name : "anon",
          message ? message : "Enjoy your coffee!",
          { value: amountToSend }
        );

        await coffeeTxn.wait();

        console.log("mined ", coffeeTxn.hash);

        console.log("coffee purchased!");

        // Clear the form fields.
        setName("");
        setMessage("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("fetching memos from the blockchain..");
        const memos = await buyMeACoffee.getMemos();
        console.log("fetched!");
        setMemos(memos);
      } else {
        console.log("Metamask is not connected");
      }

    } catch (error) {
      console.log(error);
    }
  };

  const withdrawTips = async () => {

  }

  useEffect(() => {
    let buyMeACoffee;
    isWalletConnected();
    getMemos();

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (from, timestamp, name, message, amount) => {
      console.log("Memo received: ", from, timestamp, name, message, amount);
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp,
          message,
          name,
          amount
        }
      ]);
    };

    const { ethereum } = window;

    // Listen for new memo events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      buyMeACoffee = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      buyMeACoffee.on("NewMemo", onNewMemo);
    }

    return () => {
      if (buyMeACoffee) {
        buyMeACoffee.off("NewMemo", onNewMemo);
      }
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={'container-fluid'}>
        <Head>
          <title>Buy Wally a Coffee!</title>
          <meta name="description" content="Tipping site" />
          <link rel="icon" href="/favicon.ico" />

        </Head>

        <main className={styles.main}>
          <h1 className={styles.title}>
            Buy Wally a Coffee!
        </h1>

          {currentAccount ? (
            <div>
              <form>
                <div className={styles.buttonContainer}>
                  <label>
                    Name
                  </label>
                  <br />

                  <input
                    id="name"
                    type="text"
                    placeholder="anon"
                    className={styles.fullWidth}
                    onChange={onNameChange}
                  />
                </div>
                <div className={styles.buttonContainer}>
                  <label>
                    Send Wally a message
                </label>
                  <br />

                  <textarea
                    rows={3}
                    placeholder="Enjoy your coffee!"
                    id="message"
                    onChange={onMessageChange}
                    required
                    className={styles.fullWidth}
                  >
                  </textarea>
                </div>
                <div className={styles.buttonContainer}>
                  <button
                    type="button"
                    onClick={() => buyCoffee("0.001")}
                    className='btn btn-success'
                  >
                    Send 1 Coffee for 0.001ETH
                </button>
                </div>
                <div className={styles.buttonContainer}>
                  <button
                    type="button"
                    onClick={() => buyCoffee("0.003")}
                    className='btn btn-info'
                  >
                    Send 1 Large Coffee for 0.003ETH
                </button>
                </div>
                <div className={styles.buttonContainer}>
                  <button
                    type="button"
                    onClick={() => withdrawTips}
                    className='btn btn-secondary'
                  >
                    Withdraw tips
                </button>
                </div>
              </form>
            </div>
          ) : (
              <button onClick={connectWallet} className='btn btn-warning'> Connect your wallet </button>
            )}
        </main>

        {currentAccount && (<h1>Memos received</h1>)}

        {currentAccount && (memos.map((memo, idx) => {
          const timestamp = new Date(memo.timestamp * 1000);
          const timestampDisplay = timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString();
          return (
            <div key={idx} style={{ border: "2px solid", "borderRadius": "5px", padding: "5px", margin: "5px" }}>
              <p style={{ "fontWeight": "bold" }}>"{memo.message}"</p>
              <p>From: {memo.name} at {timestampDisplay}</p>
              <p>Amount: {memo.amount.toNumber() / Math.pow(10, 18)} ETH</p>
            </div>
          )
        }))}

        <footer className={styles.footer}>
          <a
            href="https://alchemy.com/?a=roadtoweb3weektwo"
            target="_blank"
            rel="noopener noreferrer"
          >
            Created by @traderwally7 for Alchemy's Road to Web3 lesson two!
        </a>
        </footer>
      </div>
    </div>
  )
}
