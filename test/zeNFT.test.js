const { artifacts, ethers, web3 } = require("hardhat");
const { expect } = require("chai");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");

chai
  .use(solidity)
  .should();

const ZERO_ADDRESS = 0x0000000000000000000000000000000000000000;

const name = "ZEN";
const symbol = "ZEN";
const baseURI = "zenft.farm/";

describe("zeNFT", function () {

  it("NFT has correct name and symbol", async function () {
    const NFT = await ethers.getContractFactory("zeNFT");
    const nft = await NFT.deploy(name, symbol, baseURI);
    await nft.deployed();

    expect(await nft.name()).to.equal("ZEN");
    expect(await nft.symbol()).to.equal("ZEN");
  });

  it("NFTs have correct metadata after mint", async function () {
    let minter;
    [minter] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("zeNFT");
    const nft = await NFT.deploy("ZEN", "ZEN", "zenft.farm/");
    await nft.deployed();

    await nft.mint();
    expect(await nft.tokenURI(0)).to.equal("zenft.farm/0");
    await nft.mint();
    expect(await nft.tokenURI(1)).to.equal("zenft.farm/1");
    await nft.mint();
    expect(await nft.tokenURI(2)).to.equal("zenft.farm/2");
  });

  it("NFT minters have correct balances and total supply matches", async function () {
    let minter;
    [minter0, minter1] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("zeNFT");
    const nft = await NFT.deploy("ZEN", "ZEN", "zenft.farm/");
    await nft.deployed();

    await nft.mint();
    expect(await nft.balanceOf(minter0.address)).to.equal("1");
    await nft.mint();
    expect(await nft.balanceOf(minter0.address)).to.equal("2");
    await nft.connect(minter1).mint();
    expect(await nft.balanceOf(minter1.address)).to.equal("1");

    expect(await nft.totalSupply()).to.equal("3");
  });
});
