// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity 0.8.7;
/*
      d888888b                         d888888b
   d888    8888b                    d888888   888b
 d88    88  898888b               d8888  888     88b
d8P        88888888b             d88888888888     b8b
88        8888888888             88888888888       88
88       88888888888             8888888888        88
98b     88888888888P             988888888        d8P
 988     888  8888P      _=_      9888898  88    88P
   9888   888888P       (^_^)        98888    888P
      9888888P         '_) (_`         9888888P
         88            /__/  \            88
         88          _(<_   / )_          88
        d88b        (__\_\_|_/__)        d88b

 ▄▄▄▄▄▄   ▄███▄      ▄   ▄████     ▄▄▄▄▀     
▀   ▄▄▀   █▀   ▀      █  █▀   ▀ ▀▀▀ █        
 ▄▀▀   ▄▀ ██▄▄    ██   █ █▀▀        █        
 ▀▀▀▀▀▀   █▄   ▄▀ █ █  █ █         █         
          ▀███▀   █  █ █  █       ▀          
                  █   ██   ▀             
*/

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @dev {ERC721} token built on OpenZeppelin contracts (licensed under MIT), including:
 *  - ability for holders to burn (destroy) their tokens
 *  - public token minting (creation) with ETH fee and capping options
 *  - Incremental token ID and URI autogeneration
 * @author @r_ross_campbell
 */
contract zeNFT is
    ERC721Burnable,
    ERC721Enumerable,
    ReentrancyGuard,
    Ownable
{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdTracker;
    
    uint256 public mintCap; // @dev Cap for NFT minting.
    uint256 public mintFee; // @dev Fee to mint NFT in ETH.

    string private _baseTokenURI;

    /**
     * @dev Token URIs will be autogenerated based on `baseURI` and their token IDs.
     * See {ERC721-tokenURI}.
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        uint256 _mintCap,
        uint256 _mintFee
    ) ERC721(name, symbol) {
        _baseTokenURI = baseTokenURI;
        _tokenIdTracker.increment(); // @dev Sets token ID to start at '1' for UX.
        mintCap = _mintCap;
        mintFee = _mintFee;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Creates a new token for `_msgSender()` if `mintFee` is attached and `mintCap` is not exceeded. 
     * Its token ID will be automatically assigned (and available on the emitted {IERC721-Transfer} event), and the token
     * URI autogenerated based on the base URI passed at construction.
     *
     * See {ERC721-_mint}.
     */
    function mint() external nonReentrant payable {
        require(_tokenIdTracker.current() <= mintCap, "CAPPED"); // @dev Capped by token ID.
        require(msg.value == mintFee, "ETH_FEE_NOT_ATTACHED");
        _mint(_msgSender(), _tokenIdTracker.current());
        _tokenIdTracker.increment();
    }
    
    /**
     * @dev Allows `owner` admin to collect NFT minting fees in ETH.
     */
    function collectETH() external nonReentrant onlyOwner {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "NOT_PAYABLE");
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
