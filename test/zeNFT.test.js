const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');

const { expect } = require('chai');

const zeNFT = artifacts.require('zeNFT');

contract('zeNFT', function (accounts) {
  const [ deployer, other ] = accounts;

  const name = 'ZEN';
  const symbol = 'ZEN';
  const baseURI = 'my.app/';

  beforeEach(async function () {
    this.token = await zeNFT.new(name, symbol, baseURI, { from: deployer });
  });

  shouldSupportInterfaces(['ERC721', 'ERC721Enumerable']);

  it('token has correct name', async function () {
    expect(await this.token.name()).to.equal(name);
  });

  it('token has correct symbol', async function () {
    expect(await this.token.symbol()).to.equal(symbol);
  });

  describe('minting', function () {
    it('public can mint tokens', async function () {
      const tokenId = new BN('0');

      const receipt = await this.token.mint(other, { from: deployer });
      expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: other, tokenId });

      expect(await this.token.balanceOf(other)).to.be.bignumber.equal('1');
      expect(await this.token.ownerOf(tokenId)).to.equal(other);

      expect(await this.token.tokenURI(tokenId)).to.equal(baseURI + tokenId);
    });

  describe('burning', function () {
    it('holders can burn their tokens', async function () {
      const tokenId = new BN('0');

      await this.token.mint(other, { from: deployer });

      const receipt = await this.token.burn(tokenId, { from: other });

      expectEvent(receipt, 'Transfer', { from: other, to: ZERO_ADDRESS, tokenId });

      expect(await this.token.balanceOf(other)).to.be.bignumber.equal('0');
      expect(await this.token.totalSupply()).to.be.bignumber.equal('0');
    });
  });
});
