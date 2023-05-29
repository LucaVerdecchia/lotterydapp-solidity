const { BN, constants, expectEvent, expectRevert, time} = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const LotteryDAPP = artifacts.require("lotterydapp");
const LOTToken = artifacts.require("lotterytoken");
const LOTNftToken = artifacts.require("lotterynft");
const VRFCoordinatorV2Mock = artifacts.require("VRFCoordinatorV2Mock");

const VRF_SUBSCRIPTION_ID = "1";
const LINK_KEY_HASH = "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc";
const NFT_BASEURI = "ipfs://QmdHqDJZJqyXM9QYWGGzqAWeyZ3Jw34YFDZMyxpzM8bu9f";

contract("LotteryDAPP", async function (accounts) {
  const [deployer, recipient, firstAccount, anotherAccount] = accounts;
  let lotToken = null;
  let lotNftToken = null;
  let lotteryContract = null;
  let vrfMockContract = null;
  let minterRole = null;

  /** Code for get current date + 1 week */
  const currentDate = new Date();
  const oneWeekLater = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeekLater = new Date(currentDate.getTime() + 12 * 24 * 60 * 60 * 1000);
  const currentExtractionInSeconds = Math.floor(oneWeekLater.getTime() / 1000);
  const nextExtractionInSeconds = Math.floor(twoWeekLater.getTime() / 1000);

  beforeEach(async () => {
    lotToken = await LOTToken.new();
    expect(lotToken.address).to.be.not.equal(ZERO_ADDRESS);
    expect(lotToken.address).to.match(/0x[0-9a-fA-F]/);

    lotNftToken = await LOTNftToken.new(NFT_BASEURI);
    expect(lotNftToken.address).to.be.not.equal(ZERO_ADDRESS);
    expect(lotNftToken.address).to.match(/0x[0-9a-fA-F]/);

    const baseFee = "100000000000000000";
    const gasPriceLink = "1000000000";
    vrfMockContract = await VRFCoordinatorV2Mock.new(baseFee, gasPriceLink);
    expect(vrfMockContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(vrfMockContract.address).to.match(/0x[0-9a-fA-F]/);
    await vrfMockContract.createSubscription();
    await vrfMockContract.fundSubscription("1", "1000000000000000000");

    lotteryContract = await LotteryDAPP.new(currentExtractionInSeconds, "1", lotToken.address, lotNftToken.address, vrfMockContract.address, LINK_KEY_HASH);
    expect(lotteryContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(lotteryContract.address).to.match(/0x[0-9a-fA-F]/);

    minterRole = await lotToken.MINTER_ROLE();
    await lotToken.grantRole(minterRole, lotteryContract.address);
    await lotNftToken.grantRole(minterRole, lotteryContract.address);

    await vrfMockContract.addConsumer("1", lotteryContract.address);
  });

  it("[getExtractionDate func] - Get correct extraction date", async () => {
    const extractionDate = (await lotteryContract.getExtractionDate()).toString();
    expect(extractionDate).to.be.equal(currentExtractionInSeconds.toString());
  });

  it("[updateExtractionDate func] - Update extraction date and check if is correct", async () => {
    const nextExtractionDate = 1685520410;
    await lotteryContract.updateExtractionDate(nextExtractionDate);
    const extractionDate = (await lotteryContract.getExtractionDate()).toString();
    expect(extractionDate).to.be.equal(nextExtractionDate.toString());
  });

  it("[getLotteryInfo func] - Add users to lottery and check struct", async () => {
    await lotteryContract.addUserToLottery(firstAccount);
    await lotteryContract.addUserToLottery(anotherAccount);
    const lotteryInfo = await lotteryContract.getLotteryInfo(currentExtractionInSeconds);
    const users = lotteryInfo[3];
    const winner = lotteryInfo[0];
    const randomWord = lotteryInfo[1];
    const fulfilled = lotteryInfo[2];
    expect(users[0]).to.be.equal(firstAccount);
    expect(users[1]).to.be.equal(anotherAccount);
    expect(randomWord.toString()).to.be.equal("0");
    expect(fulfilled).to.be.equal(false);
    expect(winner).to.be.equal(ZERO_ADDRESS);
  });

  it("[getLotteryUsers func] - Add users to lottery and check users", async () => {
    await lotteryContract.addUserToLottery(firstAccount);
    await lotteryContract.addUserToLottery(anotherAccount);
    const users = await lotteryContract.getLotteryUsers(currentExtractionInSeconds);
    expect(users[0]).to.be.equal(firstAccount);
    expect(users[1]).to.be.equal(anotherAccount);
  });

  it("[addUserToLottery func] - User cannot be added two times in same extraction", async () => {
    await lotteryContract.addUserToLottery(firstAccount);
    await expectRevert(lotteryContract.addUserToLottery(firstAccount), "User can be added only one time for the same extraction");
  });

  it("[getLotteryUsersLength func] - Add users to lottery and check users length", async () => {
    await lotteryContract.addUserToLottery(firstAccount);
    await lotteryContract.addUserToLottery(anotherAccount);
    const users = (await lotteryContract.getLotteryUsersLength(currentExtractionInSeconds)).toString();
    expect(users).to.be.equal("2");
  });

  it("[pickWinner func] - Date is not passed , should revert", async () => {
    await expectRevert(lotteryContract.pickWinner(nextExtractionInSeconds), "This function can only be executed after extraction date");
  });

  it("[pickWinner func] - Should pick winner and check rewards", async () => {
    const currentExtraction = 1685120410;
    await lotteryContract.updateExtractionDate(currentExtraction);

    await lotteryContract.addUserToLottery(firstAccount);
    await lotteryContract.addUserToLottery(anotherAccount);
    await lotteryContract.pickWinner(nextExtractionInSeconds);

    let lotteryInfo = await lotteryContract.getLotteryInfo(currentExtraction);
    const requestId = lotteryInfo[4];
    await vrfMockContract.fulfillRandomWords(requestId, lotteryContract.address);
    lotteryInfo = await lotteryContract.getLotteryInfo(currentExtraction);
    expect((await lotToken.balanceOf(lotteryInfo[0])).toString()).to.be.equal("50000").toString();
    expect((await lotNftToken.balanceOf(lotteryInfo[0])).toString()).to.be.equal("1").toString();
  });

  it("Check Minter Role for Lottery Smart Contract", async () => {
    const hasRoleForLotToken = await lotToken.hasRole(minterRole, lotteryContract.address);
    expect(hasRoleForLotToken).to.be.equal(true);
    const hasRoleForNftToken = await lotNftToken.hasRole(minterRole, lotteryContract.address);
    expect(hasRoleForNftToken).to.be.equal(true);
  });
});
