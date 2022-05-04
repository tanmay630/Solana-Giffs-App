
import './App.css';
import React, { useEffect, useState } from 'react';
import idl from './idl.json';
import kp from './keypair.json'

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';

import { Buffer } from 'buffer';
window.Buffer = Buffer;


const { SystemProgram, Keypair } = web3;


const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)


const programID = new PublicKey(idl.metadata.address);

const network = clusterApiUrl('devnet');

const opts = {
  preflightCommitment: "processed"
}



const TWITTER_HANDLE = '@TanmaySinghKush';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;



function App() {


  const TEST_GIFS = [
    'https://i.giphy.com/media/eIG0HfouRQJQr1wBzz/giphy.webp',
    'https://media3.giphy.com/media/L71a8LW2UrKwPaWNYM/giphy.gif?cid=ecf05e47rr9qizx2msjucl1xyvuu47d7kf25tqt2lvo024uo&rid=giphy.gif&ct=g',
    'https://media4.giphy.com/media/AeFmQjHMtEySooOc8K/giphy.gif?cid=ecf05e47qdzhdma2y3ugn32lkgi972z9mpfzocjj6z1ro4ec&rid=giphy.gif&ct=g',
    'https://i.giphy.com/media/PAqjdPkJLDsmBRSYUp/giphy.webp'
  ]



  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);


  const checkifwalletIsConnected = async () => {
     try {
      const {solana} = window;
       if(solana.isPhantom) {
          console.log("found phantom wallet", solana)

          const response = await solana.connect({onlyIfTrusted: true});
          console.log("connnected with Public key", response.publicKey.toString());
           
          setWalletAddress(response.publicKey.toString());
          console.log("wallet state saved");

       } else {
         console.log("download phantom wallet")
       }
    } catch(error) {
      console.log("error")
    }

   }
   const connectWallet = async () => {

     const { solana } = window;
      if(solana) { 
      const response  = await solana.connect()
      setWalletAddress(response.publicKey.toString())
       console.log("wallet connected")
      } else {
        console.log()
      }
   };

   const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };


    const renderNotConnectedContainer = () => (
     <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );


  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    setInputValue('');
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
  
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue)
  
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };
  


    const renderConnectedContainer = () => {
      // If we hit this, it means the program account hasn't been initialized.
        if (gifList === null) {
          return (
            <div className="connected-container">
              <button className="cta-button submit-gif-button" onClick={createGifAccount}>
                Do One-Time Initialization For GIF Program Account
              </button>
            </div>
          )
        } 
        // Otherwise, we're good! Account exists. User can submit GIFs.
        else {
          return(
            <div className="connected-container">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  sendGif();
                }}
              >
                <input
                  type="text"
                  placeholder="Enter gif link!"
                  value={inputValue}
                  onChange={onInputChange}
                />
                <button type="submit" className="cta-button submit-gif-button">
                  Submit
                </button>
              </form>
              <div className="gif-grid">
                {/* We use index as the key instead, also, the src is now item.gifLink */}
                {gifList.map((item, index) => (
                  <div className="gif-item" key={index}>
                    <img src={item.gifLink} />
                  </div>
                ))}
              </div>
            </div>
          )
        }
      }













   useEffect(() => {
    const onLoad = async () => {
      await  checkifwalletIsConnected();
    };  
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
   },[]);




   const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Got the account", account)
      setGifList(account.gifList)
  
    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress]);


   useEffect(() => {
     if(walletAddress) {
       console.log("Fetching GIF list...")
       setGifList(TEST_GIFS);
     }
   },[walletAddress])



   const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }


const createGifAccount = async () => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    console.log("ping")
    await program.rpc.startStuffOff({
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [baseAccount]
    });
    console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
    await getGifList();

  } catch(error) {
    console.log("Error creating BaseAccount account:", error)
  }
}


  return (
    <div className="App">
    <div className="container">
      <div className="header-container">
        <p className="header">🖼 GIF Portal</p>
        <p className="sub-text">
          View your GIF collection in the metaverse ✨
        </p>
        {!walletAddress && renderNotConnectedContainer()}
        {walletAddress && renderConnectedContainer()}
      </div>
      <div className="footer-container">
        <img alt="Twitter Logo" className="twitter-logo" src="https://ouch-cdn2.icons8.com/D30Q1BGE_v5B5B0yFJ3LjtZgi6bx78VnG5t2Tog96VA/rs:fit:256:256/czM6Ly9pY29uczgu/b3VjaC1wcm9kLmFz/c2V0cy9zdmcvNDAy/L2VhMTdkMDA0LThm/ODAtNGRlNy1iMTQ1/LTdkZjQyMmE2ZDcz/OC5zdmc.png" />
        <a
          className="footer-text"
          href={TWITTER_LINK}
          target="_blank"
          rel="noreferrer"
        >{`built by  ${TWITTER_HANDLE}`}</a>
      </div>
    </div>
  </div>
  );
}

export default App;
