## Lottery DAPP by Verdecchia Luca
Welcome to my project about Lottery! 
Lottery is a big topic! Indeed it is used by many company's for many things, one crucial aspect is the security and how the final number is extracted.
In Web 2 systems the number can be exploited and no-one notice it as the code is ran on the backend infrastructure, that mean the final user doesn't know how the 
extraction is made. Thankfully blockchain resolve this. 

Blockchain add a layer of technology that suit well our needs for this use-case. In fact, if we extract the logic related to how the lottery process takes place and bring it to the blockchain, we get a 100% transparent solution. It's a big deal! 
This is possibile by using VRF oracle by ChainLink.

## Main Concept 
The main concept behind this idea is the following:
- Extractions are made one time per week ( This is possibile by checking the block timestamp )
- The function that calls the extraction is runned by the owner of the smart contract or a web2 cronjob ( this means the smart contract is fully automated )
- In each extraction there are N users partecipating 
- The winner get 500 ERC20 Token ( LOT TOKEN ) and the NFT that is the certificate of winning 

## Setup
- Change in deploy.js:
  - SubscriptionID
  - NFT_BASEURI
In a production env this should be set inside .env file 


### Final words
Thanks to Fabio for bringing his knowledge in this area and for answering all my questions during the live, last but not least the entire MasterZ team for making this possible! A big thank you also goes to Alecos for selecting me for the scholarship!


Main User:
0xBBB4C6aeb0793372868FDb72aA0Ce7b952e22525

0x4AdE465F18AF881A87f17975410854644d13CeA0
0x72C619e92784920B51BEb65d9083c56CA215F4Ba
0xF657cB6DD1E987Ef32dfC253c77e194Ee5C1e5dB
0x494a49050667c2D3E3b87Ceb755061B870480Fde


