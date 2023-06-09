import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { DIDSession } from 'did-session';
import { useHistory } from 'react-router-dom';
import { gql, useLazyQuery } from '@apollo/client';
import { EthereumWebAuth, getAccountId } from '@didtools/pkh-ethereum';


const GET_USERS_QUERY = gql
`
  query {
    viewer {
      id
      user {
        id
        name
        creator
      }
    }
  }
`;

function WalletConnect() {
  const { session, setSession, compose, client, setQData } = useContext(AuthContext);
  const history = useHistory();
  const [didSet, setDidSet] = useState(false); // Track if setDID is completed
  const [executeQuery, { loading, error, data }] = useLazyQuery(GET_USERS_QUERY, {
    client,
    fetchPolicy: 'network-only',
    onCompleted: handleQueryCompleted,
  });

  useEffect(() => {
    const authSession = async () => {
      try {
        if (session && session.did) {
          await compose.setDID(session.did);
          console.log(compose);
          setDidSet(true)
        }
      } catch (err) {
        console.log('Error in setting auth session - ', err);
      }
    };
    authSession();
  }, [session]);

  useEffect(() => {
    if (didSet) {
      executeQuery(); 
    }
  }, [didSet, executeQuery]);

  function handleQueryCompleted(queryData) {
    if (queryData && queryData.viewer && queryData.viewer.user) {
      setQData(queryData);
      console.log('data:', queryData);
      history.push('/dashboard');

    } else if (didSet) {
      console.log('no data:', queryData);
      history.push('/createprofile');
    }
  }

  async function connectWallet() {
    try {
      const ethProvider = window.ethereum;
      const addresses = await ethProvider.request({ method: 'eth_requestAccounts' });
      const accountId = await getAccountId(ethProvider, addresses[0]);
      const authMethod = await EthereumWebAuth.getAuthMethod(ethProvider, accountId);

      const sesh = await DIDSession.authorize(authMethod, { resources: compose.resources });
      setSession(sesh); 
    } catch (error) {
      console.log('Inside connectWallet - ', error);
    }
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  return (
    <div className='wallet-connect-main'>
      <h1 className='title'>web3Sound</h1>
      <button className='btn-class' onClick={connectWallet}>Connect Wallet</button>
    </div>
  );
  
}

export default WalletConnect;
