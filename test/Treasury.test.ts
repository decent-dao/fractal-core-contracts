import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  TestToken,
  TestToken__factory,
  TestNft,
  TestNft__factory,
  Treasury,
  Treasury__factory,
  ACL,
  ACL__factory,
} from "../typechain";
import chai from "chai";
import { ethers } from "hardhat";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";
import {
  TreasuryDepositEth,
  TreasuryWithdrawEth,
  TreasuryDepositERC20Tokens,
  TreasuryWithdrawERC20Tokens,
  TreasuryDepositERC721Tokens,
  TreasuryWithdrawERC721Tokens,
} from "../helpers/Index";
import { TreasuryFactory__factory } from "../typechain/factories/TreasuryFactory__factory";
import { TreasuryFactory } from "../typechain/TreasuryFactory";

const expect = chai.expect;

describe("Treasury", function () {
  let treasuryFactory: TreasuryFactory;
  let treasury: Treasury;
  // eslint-disable-next-line camelcase
  let acl: ACL;
  let erc20TokenAlpha: TestToken;
  let erc20TokenBravo: TestToken;
  let erc721TokenAlpha: TestNft;
  let erc721TokenBravo: TestNft;
  let deployer: SignerWithAddress;
  let owner: SignerWithAddress;
  let userA: SignerWithAddress;
  let userB: SignerWithAddress;

  describe("Treasury supports Ether", function () {
    beforeEach(async function () {
      [deployer, owner, userA, userB] = await ethers.getSigners();
      // init ACL/Permissions/Treasury
      const ROLE = ethers.utils.id("ROLE");
      const TIMELOCK = ethers.utils.id("TIMELOCK");
      acl = await new ACL__factory(deployer).deploy(deployer.address);
      await acl
        .connect(deployer)
        .createPermissionBatch([ROLE], [TIMELOCK], [owner.address]);
      treasuryFactory = await new TreasuryFactory__factory(deployer).deploy();
      const tx: ContractTransaction = await treasuryFactory.createTreasury(
        acl.address,
        ROLE
      );
      const receipt: ContractReceipt = await tx.wait();
      const _proposalCreatedEvent = receipt.events?.filter((x) => {
        return x.event === "TreasuryCreated";
      });
      if (
        _proposalCreatedEvent === undefined ||
        _proposalCreatedEvent[0].args === undefined
      ) {
        return {};
      }
      const treasuryAddress = _proposalCreatedEvent[0].args[0];
      // eslint-disable-next-line camelcase
      treasury = Treasury__factory.connect(treasuryAddress, deployer);

      await TreasuryDepositEth(
        treasury,
        deployer,
        ethers.utils.parseUnits("10", 18)
      );
    });

    it("Receives Ether", async () => {
      expect(await treasury.provider.getBalance(treasury.address)).to.equal(
        ethers.utils.parseUnits("10", 18)
      );
    });

    it("Emits an event when ETH is withdrawn", async () => {
      const withdrawEvent = await TreasuryWithdrawEth(
        treasury,
        owner,
        [userA.address],
        [ethers.utils.parseUnits("1", 18)]
      );

      expect(withdrawEvent.recipients).to.deep.equal([userA.address]);
      expect(withdrawEvent.amounts).to.deep.equal([
        ethers.utils.parseUnits("1", 18),
      ]);
    });

    it("Sends Eth using the withdraw function", async () => {
      const userABalanceBefore = await userA.getBalance();

      await TreasuryWithdrawEth(
        treasury,
        owner,
        [userA.address],
        [ethers.utils.parseUnits("1", 18)]
      );

      expect((await userA.getBalance()).sub(userABalanceBefore)).to.equal(
        ethers.utils.parseUnits("1", 18)
      );

      expect(await treasury.provider.getBalance(treasury.address)).to.equal(
        ethers.utils.parseUnits("9", 18)
      );
    });

    it("Sends ETH to multiple addresses using the withdraw function", async () => {
      const userABalanceBefore = await userA.getBalance();
      const userBBalanceBefore = await userB.getBalance();

      await TreasuryWithdrawEth(
        treasury,
        owner,
        [userA.address],
        [ethers.utils.parseUnits("1", 18)]
      );

      await TreasuryWithdrawEth(
        treasury,
        owner,
        [userB.address],
        [ethers.utils.parseUnits("2", 18)]
      );

      expect((await userA.getBalance()).sub(userABalanceBefore)).to.equal(
        ethers.utils.parseUnits("1", 18)
      );

      expect((await userB.getBalance()).sub(userBBalanceBefore)).to.equal(
        ethers.utils.parseUnits("2", 18)
      );

      expect(await treasury.provider.getBalance(treasury.address)).to.equal(
        ethers.utils.parseUnits("7", 18)
      );
    });

    it("Reverts when a non-owner attempts to withdraw ETH", async () => {
      await expect(
        TreasuryWithdrawEth(
          treasury,
          userA,
          [userA.address],
          [ethers.utils.parseUnits("1", 18)]
        )
      ).to.be.revertedWith("NotRole()");
    });

    it("Reverts when the withdraw function is called with inequal array lengths", async () => {
      await expect(
        TreasuryWithdrawEth(
          treasury,
          owner,
          [userA.address, userB.address],
          [ethers.utils.parseUnits("1", 18)]
        )
      ).to.be.revertedWith("ArraysNotEqual()");

      await expect(
        TreasuryWithdrawEth(
          treasury,
          owner,
          [userA.address],
          [ethers.utils.parseUnits("1", 18), ethers.utils.parseUnits("1", 18)]
        )
      ).to.be.revertedWith("ArraysNotEqual()");
    });
  });

  describe("Treasury supports ERC-20 tokens", function () {
    beforeEach(async function () {
      [deployer, owner, userA, userB] = await ethers.getSigners();

      // init ACL/Permissions/Treasury
      const ROLE = ethers.utils.id("ROLE");
      const TIMELOCK = ethers.utils.id("TIMELOCK");
      acl = await new ACL__factory(deployer).deploy(deployer.address);
      await acl
        .connect(deployer)
        .createPermissionBatch([ROLE], [TIMELOCK], [owner.address]);
      treasuryFactory = await new TreasuryFactory__factory(deployer).deploy();
      const tx: ContractTransaction = await treasuryFactory.createTreasury(
        acl.address,
        ROLE
      );
      const receipt: ContractReceipt = await tx.wait();
      const _proposalCreatedEvent = receipt.events?.filter((x) => {
        return x.event === "TreasuryCreated";
      });
      if (
        _proposalCreatedEvent === undefined ||
        _proposalCreatedEvent[0].args === undefined
      ) {
        return {};
      }
      const treasuryAddress = _proposalCreatedEvent[0].args[0];
      // eslint-disable-next-line camelcase
      treasury = Treasury__factory.connect(treasuryAddress, deployer);

      erc20TokenAlpha = await new TestToken__factory(deployer).deploy(
        "ALPHA",
        "ALPHA",
        [treasury.address, userA.address, userB.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );

      erc20TokenBravo = await new TestToken__factory(deployer).deploy(
        "BRAVO",
        "BRAVO",
        [treasury.address, userA.address, userB.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );

      await erc20TokenAlpha
        .connect(userA)
        .approve(treasury.address, ethers.utils.parseUnits("100.0", 18));

      await erc20TokenAlpha
        .connect(userB)
        .approve(treasury.address, ethers.utils.parseUnits("100.0", 18));

      await erc20TokenBravo
        .connect(userA)
        .approve(treasury.address, ethers.utils.parseUnits("100.0", 18));

      await erc20TokenBravo
        .connect(userB)
        .approve(treasury.address, ethers.utils.parseUnits("100.0", 18));
    });

    it("Receives ERC-20 tokens", async () => {
      expect(await erc20TokenAlpha.balanceOf(userA.address)).to.equal(
        ethers.utils.parseUnits("100.0", 18)
      );
      expect(await erc20TokenAlpha.balanceOf(userB.address)).to.equal(
        ethers.utils.parseUnits("100.0", 18)
      );
      expect(await erc20TokenAlpha.balanceOf(treasury.address)).to.equal(
        ethers.utils.parseUnits("100.0", 18)
      );
      expect(await erc20TokenBravo.balanceOf(userA.address)).to.equal(
        ethers.utils.parseUnits("100.0", 18)
      );
      expect(await erc20TokenBravo.balanceOf(userB.address)).to.equal(
        ethers.utils.parseUnits("100.0", 18)
      );
      expect(await erc20TokenBravo.balanceOf(treasury.address)).to.equal(
        ethers.utils.parseUnits("100.0", 18)
      );
    });

    it("Emits event when ERC-20 tokens are deposited", async () => {
      const depositEvent = await TreasuryDepositERC20Tokens(
        treasury,
        owner,
        [erc20TokenAlpha.address],
        [userA.address],
        [ethers.utils.parseUnits("50.0", 18)]
      );

      expect(depositEvent.tokenAddresses).to.deep.equal([
        erc20TokenAlpha.address,
      ]);
      expect(depositEvent.senders).to.deep.equal([userA.address]);
      expect(depositEvent.amounts).to.deep.equal([
        ethers.utils.parseUnits("50.0", 18),
      ]);
    });

    it("Receives ERC-20 tokens using the deposit function", async () => {
      await TreasuryDepositERC20Tokens(
        treasury,
        owner,
        [erc20TokenAlpha.address],
        [userA.address],
        [ethers.utils.parseUnits("50.0", 18)]
      );

      expect(await erc20TokenAlpha.balanceOf(userA.address)).to.equal(
        ethers.utils.parseUnits("50.0", 18)
      );
      expect(await erc20TokenAlpha.balanceOf(treasury.address)).to.equal(
        ethers.utils.parseUnits("150.0", 18)
      );
    });

    it("Receives multiple ERC-20 tokens from multiple addresses using the deposit function", async () => {
      await TreasuryDepositERC20Tokens(
        treasury,
        owner,
        [erc20TokenAlpha.address],
        [userA.address],
        [ethers.utils.parseUnits("20.0", 18)]
      );

      await TreasuryDepositERC20Tokens(
        treasury,
        owner,
        [erc20TokenAlpha.address],
        [userB.address],
        [ethers.utils.parseUnits("30.0", 18)]
      );

      await TreasuryDepositERC20Tokens(
        treasury,
        owner,
        [erc20TokenBravo.address],
        [userA.address],
        [ethers.utils.parseUnits("40.0", 18)]
      );

      await TreasuryDepositERC20Tokens(
        treasury,
        owner,
        [erc20TokenBravo.address],
        [userB.address],
        [ethers.utils.parseUnits("50.0", 18)]
      );

      expect(await erc20TokenAlpha.balanceOf(userA.address)).to.equal(
        ethers.utils.parseUnits("80.0", 18)
      );

      expect(await erc20TokenAlpha.balanceOf(userB.address)).to.equal(
        ethers.utils.parseUnits("70.0", 18)
      );

      expect(await erc20TokenAlpha.balanceOf(treasury.address)).to.equal(
        ethers.utils.parseUnits("150.0", 18)
      );

      expect(await erc20TokenBravo.balanceOf(userA.address)).to.equal(
        ethers.utils.parseUnits("60.0", 18)
      );

      expect(await erc20TokenBravo.balanceOf(userB.address)).to.equal(
        ethers.utils.parseUnits("50.0", 18)
      );

      expect(await erc20TokenBravo.balanceOf(treasury.address)).to.equal(
        ethers.utils.parseUnits("190.0", 18)
      );
    });

    it("Emits event when ERC-20 tokens are withdrawn", async () => {
      const withdrawEvent = await TreasuryWithdrawERC20Tokens(
        treasury,
        owner,
        [erc20TokenAlpha.address],
        [userA.address],
        [ethers.utils.parseUnits("50.0", 18)]
      );

      expect(withdrawEvent.tokenAddresses).to.deep.equal([
        erc20TokenAlpha.address,
      ]);
      expect(withdrawEvent.recipients).to.deep.equal([userA.address]);
      expect(withdrawEvent.amounts).to.deep.equal([
        ethers.utils.parseUnits("50.0", 18),
      ]);
    });

    it("Sends ERC-20 tokens using the withdraw function", async () => {
      await TreasuryWithdrawERC20Tokens(
        treasury,
        owner,
        [erc20TokenAlpha.address],
        [userA.address],
        [ethers.utils.parseUnits("50.0", 18)]
      );

      expect(await erc20TokenAlpha.balanceOf(userA.address)).to.equal(
        ethers.utils.parseUnits("150.0", 18)
      );
      expect(await erc20TokenAlpha.balanceOf(treasury.address)).to.equal(
        ethers.utils.parseUnits("50.0", 18)
      );
    });

    it("Sends multiple ERC-20 tokens to multiple addresses using the withdraw function", async () => {
      await TreasuryWithdrawERC20Tokens(
        treasury,
        owner,
        [erc20TokenAlpha.address],
        [userA.address],
        [ethers.utils.parseUnits("20.0", 18)]
      );

      await TreasuryWithdrawERC20Tokens(
        treasury,
        owner,
        [erc20TokenAlpha.address],
        [userB.address],
        [ethers.utils.parseUnits("30.0", 18)]
      );

      await TreasuryWithdrawERC20Tokens(
        treasury,
        owner,
        [erc20TokenBravo.address],
        [userA.address],
        [ethers.utils.parseUnits("40.0", 18)]
      );

      await TreasuryWithdrawERC20Tokens(
        treasury,
        owner,
        [erc20TokenBravo.address],
        [userB.address],
        [ethers.utils.parseUnits("50.0", 18)]
      );

      expect(await erc20TokenAlpha.balanceOf(userA.address)).to.equal(
        ethers.utils.parseUnits("120.0", 18)
      );

      expect(await erc20TokenAlpha.balanceOf(userB.address)).to.equal(
        ethers.utils.parseUnits("130.0", 18)
      );

      expect(await erc20TokenAlpha.balanceOf(treasury.address)).to.equal(
        ethers.utils.parseUnits("50.0", 18)
      );

      expect(await erc20TokenBravo.balanceOf(userA.address)).to.equal(
        ethers.utils.parseUnits("140.0", 18)
      );

      expect(await erc20TokenBravo.balanceOf(userB.address)).to.equal(
        ethers.utils.parseUnits("150.0", 18)
      );

      expect(await erc20TokenBravo.balanceOf(treasury.address)).to.equal(
        ethers.utils.parseUnits("10.0", 18)
      );
    });

    it("Reverts when a non-owner attempts to withdraw ERC-20 tokens", async () => {
      await expect(
        TreasuryWithdrawERC20Tokens(
          treasury,
          userA,
          [erc20TokenBravo.address],
          [userB.address],
          [ethers.utils.parseUnits("50.0", 18)]
        )
      ).to.be.revertedWith("NotRole()");
    });

    it("Reverts when the deposit function is called with inequal array lengths", async () => {
      await expect(
        TreasuryDepositERC20Tokens(
          treasury,
          owner,
          [erc20TokenAlpha.address, erc20TokenBravo.address],
          [userA.address],
          [ethers.utils.parseUnits("50.0", 18)]
        )
      ).to.be.revertedWith("ArraysNotEqual()");

      await expect(
        TreasuryDepositERC20Tokens(
          treasury,
          owner,
          [erc20TokenAlpha.address],
          [userA.address, userB.address],
          [ethers.utils.parseUnits("50.0", 18)]
        )
      ).to.be.revertedWith("ArraysNotEqual()");

      await expect(
        TreasuryDepositERC20Tokens(
          treasury,
          owner,
          [erc20TokenAlpha.address],
          [userA.address],
          [
            ethers.utils.parseUnits("50.0", 18),
            ethers.utils.parseUnits("50.0", 18),
          ]
        )
      ).to.be.revertedWith("ArraysNotEqual()");
    });

    it("Reverts when the withdraw function is called with inequal array lengths", async () => {
      await expect(
        TreasuryWithdrawERC20Tokens(
          treasury,
          owner,
          [erc20TokenAlpha.address, erc20TokenBravo.address],
          [userA.address],
          [ethers.utils.parseUnits("50.0", 18)]
        )
      ).to.be.revertedWith("ArraysNotEqual()");

      await expect(
        TreasuryWithdrawERC20Tokens(
          treasury,
          owner,
          [erc20TokenAlpha.address],
          [userA.address, userB.address],
          [ethers.utils.parseUnits("50.0", 18)]
        )
      ).to.be.revertedWith("ArraysNotEqual()");

      await expect(
        TreasuryWithdrawERC20Tokens(
          treasury,
          owner,
          [erc20TokenAlpha.address],
          [userA.address],
          [
            ethers.utils.parseUnits("50.0", 18),
            ethers.utils.parseUnits("50.0", 18),
          ]
        )
      ).to.be.revertedWith("ArraysNotEqual()");
    });
  });

  describe("Treasury supports ERC-721 tokens", function () {
    beforeEach(async function () {
      [deployer, owner, userA, userB] = await ethers.getSigners();

      // init ACL/Permissions/Treasury
      const ROLE = ethers.utils.id("ROLE");
      const TIMELOCK = ethers.utils.id("TIMELOCK");
      acl = await new ACL__factory(deployer).deploy(deployer.address);
      await acl
        .connect(deployer)
        .createPermissionBatch([ROLE], [TIMELOCK], [owner.address]);
      treasuryFactory = await new TreasuryFactory__factory(deployer).deploy();
      const tx: ContractTransaction = await treasuryFactory.createTreasury(
        acl.address,
        ROLE
      );
      const receipt: ContractReceipt = await tx.wait();
      const _proposalCreatedEvent = receipt.events?.filter((x) => {
        return x.event === "TreasuryCreated";
      });
      if (
        _proposalCreatedEvent === undefined ||
        _proposalCreatedEvent[0].args === undefined
      ) {
        return {};
      }
      const treasuryAddress = _proposalCreatedEvent[0].args[0];
      // eslint-disable-next-line camelcase
      treasury = Treasury__factory.connect(treasuryAddress, deployer);

      erc721TokenAlpha = await new TestNft__factory(deployer).deploy(
        "ALPHA",
        "ALPHA",
        [treasury.address, treasury.address, userA.address, userB.address],
        [
          BigNumber.from("0"),
          BigNumber.from("1"),
          BigNumber.from("2"),
          BigNumber.from("3"),
        ]
      );

      erc721TokenBravo = await new TestNft__factory(deployer).deploy(
        "BRAVO",
        "BRAVO",
        [treasury.address, treasury.address, userA.address, userB.address],
        [
          BigNumber.from("0"),
          BigNumber.from("1"),
          BigNumber.from("2"),
          BigNumber.from("3"),
        ]
      );

      await erc721TokenAlpha
        .connect(userA)
        .approve(treasury.address, BigNumber.from("2"));

      await erc721TokenAlpha
        .connect(userB)
        .approve(treasury.address, BigNumber.from("3"));

      await erc721TokenBravo
        .connect(userA)
        .approve(treasury.address, BigNumber.from("2"));

      await erc721TokenBravo
        .connect(userB)
        .approve(treasury.address, BigNumber.from("3"));
    });

    it("Receives ERC-721 tokens", async () => {
      expect(await erc721TokenAlpha.ownerOf(BigNumber.from("0"))).to.equal(
        treasury.address
      );
      expect(await erc721TokenAlpha.ownerOf(BigNumber.from("1"))).to.equal(
        treasury.address
      );

      expect(await erc721TokenAlpha.ownerOf(BigNumber.from("2"))).to.equal(
        userA.address
      );
      expect(await erc721TokenAlpha.ownerOf(BigNumber.from("3"))).to.equal(
        userB.address
      );
      expect(await erc721TokenBravo.ownerOf(BigNumber.from("0"))).to.equal(
        treasury.address
      );
      expect(await erc721TokenBravo.ownerOf(BigNumber.from("1"))).to.equal(
        treasury.address
      );
      expect(await erc721TokenBravo.ownerOf(BigNumber.from("2"))).to.equal(
        userA.address
      );
      expect(await erc721TokenBravo.ownerOf(BigNumber.from("3"))).to.equal(
        userB.address
      );
    });

    it("Emits an event when ERC-721 tokens are deposited", async () => {
      const depositEvent = await TreasuryDepositERC721Tokens(
        treasury,
        owner,
        [erc721TokenAlpha.address],
        [userA.address],
        [BigNumber.from("2")]
      );

      expect(depositEvent.tokenAddresses).to.deep.equal([
        erc721TokenAlpha.address,
      ]);
      expect(depositEvent.senders).to.deep.equal([userA.address]);
      expect(depositEvent.tokenIds).to.deep.equal([BigNumber.from("2")]);
    });

    it("Receives ERC-721 tokens using the deposit function", async () => {
      await TreasuryDepositERC721Tokens(
        treasury,
        owner,
        [erc721TokenAlpha.address],
        [userA.address],
        [BigNumber.from("2")]
      );

      expect(await erc721TokenAlpha.ownerOf(BigNumber.from("2"))).to.equal(
        treasury.address
      );
    });

    it("Receives multiple ERC-721 tokens from multiple addresses using the deposit function", async () => {
      await TreasuryDepositERC721Tokens(
        treasury,
        owner,
        [erc721TokenAlpha.address],
        [userA.address],
        [BigNumber.from("2")]
      );

      await TreasuryDepositERC721Tokens(
        treasury,
        owner,
        [erc721TokenAlpha.address],
        [userB.address],
        [BigNumber.from("3")]
      );

      await TreasuryDepositERC721Tokens(
        treasury,
        owner,
        [erc721TokenBravo.address],
        [userA.address],
        [BigNumber.from("2")]
      );

      await TreasuryDepositERC721Tokens(
        treasury,
        owner,
        [erc721TokenBravo.address],
        [userB.address],
        [BigNumber.from("3")]
      );

      expect(await erc721TokenAlpha.ownerOf(BigNumber.from("2"))).to.equal(
        treasury.address
      );

      expect(await erc721TokenAlpha.ownerOf(BigNumber.from("3"))).to.equal(
        treasury.address
      );

      expect(await erc721TokenBravo.ownerOf(BigNumber.from("2"))).to.equal(
        treasury.address
      );

      expect(await erc721TokenBravo.ownerOf(BigNumber.from("3"))).to.equal(
        treasury.address
      );
    });

    it("Emits an event when ERC-721 tokens are withdrawn", async () => {
      const withdrawEvent = await TreasuryWithdrawERC721Tokens(
        treasury,
        owner,
        [erc721TokenAlpha.address],
        [userA.address],
        [BigNumber.from("0")]
      );

      expect(withdrawEvent.tokenAddresses).to.deep.equal([
        erc721TokenAlpha.address,
      ]);
      expect(withdrawEvent.recipients).to.deep.equal([userA.address]);
      expect(withdrawEvent.tokenIds).to.deep.equal([BigNumber.from("0")]);
    });

    it("Sends ERC-721 tokens using the withdraw function", async () => {
      await TreasuryWithdrawERC721Tokens(
        treasury,
        owner,
        [erc721TokenAlpha.address],
        [userA.address],
        [BigNumber.from("0")]
      );

      expect(await erc721TokenAlpha.ownerOf(BigNumber.from("0"))).to.equal(
        userA.address
      );
    });

    it("Sends multiple ERC-721 tokens to multiple addresses using the withdraw function", async () => {
      await TreasuryWithdrawERC721Tokens(
        treasury,
        owner,
        [erc721TokenAlpha.address],
        [userA.address],
        [BigNumber.from("0")]
      );

      await TreasuryWithdrawERC721Tokens(
        treasury,
        owner,
        [erc721TokenAlpha.address],
        [userB.address],
        [BigNumber.from("1")]
      );

      await TreasuryWithdrawERC721Tokens(
        treasury,
        owner,
        [erc721TokenBravo.address],
        [userA.address],
        [BigNumber.from("0")]
      );

      await TreasuryWithdrawERC721Tokens(
        treasury,
        owner,
        [erc721TokenBravo.address],
        [userB.address],
        [BigNumber.from("1")]
      );

      expect(await erc721TokenAlpha.ownerOf(BigNumber.from("0"))).to.equal(
        userA.address
      );

      expect(await erc721TokenAlpha.ownerOf(BigNumber.from("1"))).to.equal(
        userB.address
      );

      expect(await erc721TokenBravo.ownerOf(BigNumber.from("0"))).to.equal(
        userA.address
      );

      expect(await erc721TokenBravo.ownerOf(BigNumber.from("1"))).to.equal(
        userB.address
      );
    });

    it("Reverts when a non-owner attempts to withdraw ERC-721 tokens", async () => {
      await expect(
        TreasuryWithdrawERC721Tokens(
          treasury,
          userA,
          [erc721TokenAlpha.address],
          [userA.address],
          [BigNumber.from("0")]
        )
      ).to.be.revertedWith("NotRole()");
    });

    it("Reverts when the deposit function is called with inequal array lengths", async () => {
      await expect(
        TreasuryDepositERC721Tokens(
          treasury,
          owner,
          [erc721TokenAlpha.address, erc721TokenBravo.address],
          [userA.address],
          [BigNumber.from("2")]
        )
      ).to.be.revertedWith("ArraysNotEqual()");

      await expect(
        TreasuryDepositERC721Tokens(
          treasury,
          owner,
          [erc721TokenAlpha.address],
          [userA.address, userB.address],
          [BigNumber.from("3")]
        )
      ).to.be.revertedWith("ArraysNotEqual()");

      await expect(
        TreasuryDepositERC721Tokens(
          treasury,
          owner,
          [erc721TokenAlpha.address],
          [userA.address],
          [BigNumber.from("2"), BigNumber.from("3")]
        )
      ).to.be.revertedWith("ArraysNotEqual()");
    });

    it("Reverts when the withdraw function is called with inequal array lengths", async () => {
      await expect(
        TreasuryWithdrawERC721Tokens(
          treasury,
          owner,
          [erc721TokenAlpha.address, erc721TokenBravo.address],
          [userA.address],
          [BigNumber.from("0")]
        )
      ).to.be.revertedWith("ArraysNotEqual()");

      await expect(
        TreasuryWithdrawERC721Tokens(
          treasury,
          owner,
          [erc721TokenAlpha.address],
          [userA.address, userB.address],
          [BigNumber.from("0")]
        )
      ).to.be.revertedWith("ArraysNotEqual()");

      await expect(
        TreasuryWithdrawERC20Tokens(
          treasury,
          owner,
          [erc721TokenAlpha.address],
          [userA.address],
          [BigNumber.from("0"), BigNumber.from("1")]
        )
      ).to.be.revertedWith("ArraysNotEqual()");
    });
  });
});