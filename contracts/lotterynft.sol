// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract LotteryNFT is ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  using Counters for Counters.Counter;
  string private baseUri = '';

  Counters.Counter private _tokenIdCounter;

  constructor(string memory _baseUri) ERC721("Lottery DAPP NFT", "LOTNFT"){
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MINTER_ROLE, msg.sender);
    baseUri = _baseUri;
  }

  function _baseURI() internal view override returns (string memory) {
     return baseUri;
  }

  function mint(address _to) public onlyRole(MINTER_ROLE){
    _tokenIdCounter.increment();
    uint256 tokenId = _tokenIdCounter.current();
    _safeMint(_to, tokenId);
    string memory uri = string.concat(Strings.toString(tokenId), ".json");
    _setTokenURI(tokenId, uri);
  }
  function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage){
    super._burn(tokenId);
  }

  function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory){
    return super.tokenURI(tokenId);
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override(ERC721, ERC721Enumerable){
    super._beforeTokenTransfer(from, to, tokenId, batchSize);
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, AccessControl) returns (bool){
    return super.supportsInterface(interfaceId);
  }

}
