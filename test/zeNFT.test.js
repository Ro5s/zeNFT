const { artifacts, ethers, web3 } = require("hardhat");
const { expect } = require("chai");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");

chai
  .use(solidity)
  .should();

const name = "ZEN";
const symbol = "ZEN";
const baseURI = "zenft.farm/";
const mintCap = 5;
const mintFee = ethers.utils.parseEther("0.5");

describe("zeNFT", function () {

  it("NFT has correct name and symbol", async function () {
    const NFT = await ethers.getContractFactory("zeNFT");
    const nft = await NFT.deploy(name, symbol, baseURI, mintCap, 0);
    await nft.deployed();

    expect(await nft.name()).to.equal("ZEN");
    expect(await nft.symbol()).to.equal("ZEN");
  });

  it("NFTs have correct metadata after mint", async function () {
    const NFT = await ethers.getContractFactory("zeNFT");
    const nft = await NFT.deploy(name, symbol, baseURI, mintCap, 0);
    await nft.deployed();

    await nft.mint();
    expect(await nft.tokenURI(1)).to.equal("zenft.farm/1");
    await nft.mint();
    expect(await nft.tokenURI(2)).to.equal("zenft.farm/2");
    await nft.mint();
    expect(await nft.tokenURI(3)).to.equal("zenft.farm/3");
  });

  it("NFT minters have correct balances and total supply matches", async function () {
    [minter0, minter1] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("zeNFT");
    const nft = await NFT.deploy(name, symbol, baseURI, mintCap, 0);
    await nft.deployed();

    await nft.mint();
    expect(await nft.balanceOf(minter0.address)).to.equal("1");
    await nft.mint();
    expect(await nft.balanceOf(minter0.address)).to.equal("2");
    await nft.connect(minter1).mint();
    expect(await nft.balanceOf(minter1.address)).to.equal("1");

    expect(await nft.totalSupply()).to.equal("3");
  });

  it("NFT burners have correct balances and total supply matches", async function () {
    [burner0, burner1] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("zeNFT");
    const nft = await NFT.deploy(name, symbol, baseURI, mintCap, 0);
    await nft.deployed();

    await nft.mint();
    expect(await nft.balanceOf(burner0.address)).to.equal("1");
    await nft.burn(1);
    expect(await nft.balanceOf(burner0.address)).to.equal("0");
    await nft.mint();
    expect(await nft.balanceOf(burner0.address)).to.equal("1");

    await nft.connect(burner1).mint();
    expect(await nft.balanceOf(burner1.address)).to.equal("1");
    await nft.connect(burner1).burn(3);
    expect(await nft.balanceOf(burner1.address)).to.equal("0");

    expect(await nft.totalSupply()).to.equal("1");
  });

  it("NFT holders can transfer tokens, have correct balances, and total supply doesn't change", async function () {
    [holder0, holder1, holder2] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("zeNFT");
    const nft = await NFT.deploy(name, symbol, baseURI, mintCap, 0);
    await nft.deployed();

    await nft.mint();
    await nft.transferFrom(holder0.address, holder1.address, 1);
    expect(await nft.balanceOf(holder0.address)).to.equal("0");
    expect(await nft.balanceOf(holder1.address)).to.equal("1");

    await nft.connect(holder2).mint();
    expect(await nft.balanceOf(holder2.address)).to.equal("1");
    await nft.connect(holder2).transferFrom(holder2.address, holder1.address, 2);
    expect(await nft.balanceOf(holder2.address)).to.equal("0");
    expect(await nft.balanceOf(holder1.address)).to.equal("2");

    expect(await nft.totalSupply()).to.equal("2");
  });

  it("NFT minting with correct fee works", async function () {
    [holder0] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("zeNFT");
    const nft = await NFT.deploy(name, symbol, baseURI, mintCap, mintFee);
    await nft.deployed();

    await nft.mint({ value: ethers.utils.parseEther("0.5") });
  });

  it("NFT minting without correct fee doesn't work", async function () {
    [holder0] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("zeNFT");
    const nft = await NFT.deploy(name, symbol, baseURI, mintCap, mintFee);
    await nft.deployed();

    await nft.mint().should.be.revertedWith("ETH_FEE_NOT_ATTACHED");
  });

  it("NFT minting works up to cap", async function () {
    [holder0] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("zeNFT");
    const nft = await NFT.deploy(name, symbol, baseURI, mintCap, mintFee);
    await nft.deployed();

    await nft.mint({ value: ethers.utils.parseEther("0.5") });
    await nft.mint({ value: ethers.utils.parseEther("0.5") });
    await nft.mint({ value: ethers.utils.parseEther("0.5") });
    await nft.mint({ value: ethers.utils.parseEther("0.5") });
    await nft.mint({ value: ethers.utils.parseEther("0.5") });
  });

  it("NFT minting does not work past cap", async function () {
    [holder0] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("zeNFT");
    const nft = await NFT.deploy(name, symbol, baseURI, mintCap, mintFee);
    await nft.deployed();

    await nft.mint({ value: ethers.utils.parseEther("0.5") });
    await nft.mint({ value: ethers.utils.parseEther("0.5") });
    await nft.mint({ value: ethers.utils.parseEther("0.5") });
    await nft.mint({ value: ethers.utils.parseEther("0.5") });
    await nft.mint({ value: ethers.utils.parseEther("0.5") });
    await nft.mint({ value: ethers.utils.parseEther("0.5") }).should.be.revertedWith("CAPPED");
  });

  it("NFT fees in ETH are collectable by owner", async function () {
    [holder0, holder1] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("zeNFT");
    const nft = await NFT.deploy(name, symbol, baseURI, mintCap, mintFee);
    await nft.deployed();

    await nft.connect(holder1).mint({ value: mintFee });
    await nft.collectETH();
  });

  it("NFT fees in ETH are not collectable by non-owner", async function () {
    [holder0, holder1, holder2] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("zeNFT");
    const nft = await NFT.deploy(name, symbol, baseURI, mintCap, mintFee);
    await nft.deployed();

    await nft.connect(holder1).mint({ value: mintFee });
    await nft.connect(holder2).collectETH().should.be.revertedWith("Ownable: caller is not the owner");
  });
});
