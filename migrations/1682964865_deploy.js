const LotteryDAPP = artifacts.require("lotterydapp");
const LOTToken = artifacts.require("lotterytoken");
const LOTNftToken = artifacts.require("lotterynft");
const VRFCoordinatorV2Mock = artifacts.require("VRFCoordinatorV2Mock");

/** Code for get current date + 1 week */
const currentDate = new Date();
const oneWeekLater = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
const currentExtractionInSeconds = Math.floor(oneWeekLater.getTime() / 1000);
const GOERLI_VRF_SUBSCRIPTION_ID = "12171";
const GOERLI_LINK_VRF_COORDINATOR = "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D";
const GOERLI_LINK_KEY_HASH = "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15";
const NFT_BASEURI = "ipfs://QmP1zg6hipRoW6EGgz2RtgPtYu9A5HK2zvyyy7dnnhdiqG/";

module.exports = async (deployer, network, accounts) => {
  console.log('################################################');
  console.log('########## DEPLOYING CONTRACTS #################');
  console.log('################################################');
  const isInLocalMode = ['development', 'test'].includes(network);
  const isInDashboard = network === 'dashboard';
  let vrfMock = null;

  if(isInLocalMode || isInDashboard){
    if(isInLocalMode){
      const baseFee = "100000000000000000";
      const gasPriceLink = "1000000000";
      await deployer.deploy(VRFCoordinatorV2Mock, baseFee, gasPriceLink);
      vrfMock = await VRFCoordinatorV2Mock.deployed();
      console.log("vrfMock @address:", vrfMock.address);
      await vrfMock.createSubscription();
    }
  
    const LINK_VRF_COORDINATOR = isInLocalMode ? vrfMock.address : GOERLI_LINK_VRF_COORDINATOR;
    const VRF_SUBSCRIPTION_ID = isInLocalMode ? "1" : GOERLI_VRF_SUBSCRIPTION_ID;
    const LINK_KEY_HASH = isInLocalMode ? "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc" : GOERLI_LINK_KEY_HASH;

    await deployer.deploy(LOTToken);
    const lotToken = await LOTToken.deployed();
    
    await deployer.deploy(LOTNftToken, NFT_BASEURI);
    const lotNftToken = await LOTNftToken.deployed();
  
    await deployer.deploy(
      LotteryDAPP,
      currentExtractionInSeconds,
      VRF_SUBSCRIPTION_ID,
      lotToken.address,
      lotNftToken.address,
      LINK_VRF_COORDINATOR,
      LINK_KEY_HASH
    );
    const lotteryapp = await LotteryDAPP.deployed();
    
    const minterRole = await lotToken.MINTER_ROLE();
    await lotToken.grantRole(minterRole, lotteryapp.address);
    await lotNftToken.grantRole(minterRole, lotteryapp.address);
    
    console.log("lotToken @address:", lotToken.address);
    console.log("lotNftToken @address:", lotNftToken.address);
    console.log("LotteryDAPP @address:", lotteryapp.address);

    console.log('#### IMPORTANT INFO FOR VERIFY CONTRACT #########');
    console.log('Current extraction date timestamp: ', currentExtractionInSeconds);
  
    console.log('################################################');
    console.log('############# DEPLOY IS COMPLETE ###############');
    console.log('################################################');
  
  }

};