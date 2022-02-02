import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DaoFactory,
  VotesTokenWithSupply,
  MyGovernor,
  TestToken,
  VotesTokenWrapped,
} from "../typechain";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";

export const VoteType = {
  Against: 0,
  For: 1,
  Abstain: 2,
};

export type DaoInfo = {
  votingToken: string;
  timelockController: string;
  daoProxy: string;
};

export type ProposalCreatedEvent = {
  proposalId: BigNumber;
  proposer: string;
  targets: string[];
  _values: BigNumber[];
  signatures: string[];
  calldatas: string[];
  startBlock: BigNumber;
  endBlock: BigNumber;
  description: string;
};

export async function delegateTokens(
  governanceToken: VotesTokenWithSupply | VotesTokenWrapped,
  voters: SignerWithAddress[]
): Promise<void> {
  for (let i = 0; i < voters.length; i++) {
    await governanceToken.connect(voters[i]).delegate(voters[i].address);
  }
}

export async function wrapTokens(
  token: TestToken,
  wrappedToken: VotesTokenWrapped,
  users: SignerWithAddress[],
  amounts: BigNumber[]
): Promise<void> {
  for (let i = 0; i < users.length; i++) {
    await token.connect(users[i]).approve(wrappedToken.address, amounts[i]);

    await wrappedToken
      .connect(users[i])
      .depositFor(users[i].address, amounts[i]);
  }
}

export async function createDaoAndToken(
  _daoFactory: DaoFactory,
  _governanceImplementation: string,
  _proposers: string[],
  _executors: string[],
  _daoName: string,
  _minDelay: BigNumber,
  _initialVotingDelay: BigNumber,
  _initialVotingPeriod: BigNumber,
  _initialProposalThreshold: BigNumber,
  _initialQuorumNumeratorValue: BigNumber,
  _tokenFactory: string,
  _tokenName: string,
  _tokenSymbol: string,
  _tokenTotalSupply: BigNumber,
  _hodlers: string[],
  _allocations: BigNumber[]
): Promise<DaoInfo> {
  // create DAO via factory
  const tx: ContractTransaction = await _daoFactory.createDaoAndToken({
    createDaoParameters: {
      governanceImplementation: _governanceImplementation,
      proposers: _proposers,
      executors: _executors,
      daoName: _daoName,
      minDelay: _minDelay,
      initialVotingDelay: _initialVotingDelay,
      initialVotingPeriod: _initialVotingPeriod,
      initialProposalThreshold: _initialProposalThreshold,
      initialQuorumNumeratorValue: _initialQuorumNumeratorValue,
    },
    tokenFactory: _tokenFactory,
    tokenName: _tokenName,
    tokenSymbol: _tokenSymbol,
    tokenTotalSupply: _tokenTotalSupply,
    hodlers: _hodlers,
    allocations: _allocations,
  });

  const receipt: ContractReceipt = await tx.wait();

  const daoEvent = receipt.events?.filter((x) => {
    return x.event === "DaoDeployed";
  });

  if (daoEvent === undefined || daoEvent[0].args === undefined) {
    return {
      votingToken: "0",
      timelockController: "0",
      daoProxy: "0",
    };
  }
  return {
    votingToken: daoEvent[0].args[1],
    timelockController: daoEvent[0].args[2],
    daoProxy: daoEvent[0].args[3],
  };
}

export async function createDaoWrapToken(
  _daoFactory: DaoFactory,
  _governanceImplementation: string,
  _proposers: string[],
  _executors: string[],
  _daoName: string,
  _minDelay: BigNumber,
  _initialVotingDelay: BigNumber,
  _initialVotingPeriod: BigNumber,
  _initialProposalThreshold: BigNumber,
  _initialQuorumNumeratorValue: BigNumber,
  _tokenFactory: string,
  _tokenAddress: string,
  _tokenName: string,
  _tokenSymbol: string
): Promise<DaoInfo> {
  const tx: ContractTransaction = await _daoFactory.createDaoWrapToken({
    createDaoParameters: {
      governanceImplementation: _governanceImplementation,
      proposers: _proposers,
      executors: _executors,
      daoName: _daoName,
      minDelay: _minDelay,
      initialVotingDelay: _initialVotingDelay,
      initialVotingPeriod: _initialVotingPeriod,
      initialProposalThreshold: _initialProposalThreshold,
      initialQuorumNumeratorValue: _initialQuorumNumeratorValue,
    },
    tokenFactory: _tokenFactory,
    tokenAddress: _tokenAddress,
    tokenName: _tokenName,
    tokenSymbol: _tokenSymbol,
  });

  const receipt: ContractReceipt = await tx.wait();

  const daoEvent = receipt.events?.filter((x) => {
    return x.event === "DaoDeployed";
  });

  if (daoEvent === undefined || daoEvent[0].args === undefined) {
    return {
      votingToken: "0",
      timelockController: "0",
      daoProxy: "0",
    };
  }
  return {
    votingToken: daoEvent[0].args[1],
    timelockController: daoEvent[0].args[2],
    daoProxy: daoEvent[0].args[3],
  };
}

export async function createDaoBringToken(
  _daoFactory: DaoFactory,
  _governanceImplementation: string,
  _proposers: string[],
  _executors: string[],
  _daoName: string,
  _minDelay: BigNumber,
  _initialVotingDelay: BigNumber,
  _initialVotingPeriod: BigNumber,
  _initialProposalThreshold: BigNumber,
  _initialQuorumNumeratorValue: BigNumber,
  _tokenAddress: string
): Promise<DaoInfo> {
  const tx: ContractTransaction = await _daoFactory.createDaoBringToken({
    createDaoParameters: {
      governanceImplementation: _governanceImplementation,
      proposers: _proposers,
      executors: _executors,
      daoName: _daoName,
      minDelay: _minDelay,
      initialVotingDelay: _initialVotingDelay,
      initialVotingPeriod: _initialVotingPeriod,
      initialProposalThreshold: _initialProposalThreshold,
      initialQuorumNumeratorValue: _initialQuorumNumeratorValue,
    },
    tokenAddress: _tokenAddress,
  });

  const receipt: ContractReceipt = await tx.wait();

  const daoEvent = receipt.events?.filter((x) => {
    return x.event === "DaoDeployed";
  });

  if (daoEvent === undefined || daoEvent[0].args === undefined) {
    return {
      votingToken: "0",
      timelockController: "0",
      daoProxy: "0",
    };
  }
  return {
    votingToken: daoEvent[0].args[1],
    timelockController: daoEvent[0].args[2],
    daoProxy: daoEvent[0].args[3],
  };
}

export async function propose(
  _targets: string[],
  _values: BigNumber[],
  _dao: MyGovernor,
  _proposer: SignerWithAddress,
  _transferCallData: string,
  _description: string
): Promise<ProposalCreatedEvent> {
  const tx: ContractTransaction = await _dao
    .connect(_proposer)
    ["propose(address[],uint256[],bytes[],string)"](
      _targets,
      _values,
      [_transferCallData],
      _description
    );

  const receipt: ContractReceipt = await tx.wait();

  const _proposalCreatedEvent = receipt.events?.filter((x) => {
    return x.event === "ProposalCreated";
  });

  if (
    _proposalCreatedEvent === undefined ||
    _proposalCreatedEvent[0].args === undefined
  ) {
    return {
      proposalId: BigNumber.from("0"),
      proposer: "",
      targets: [""],
      _values: [BigNumber.from("0")],
      signatures: [""],
      calldatas: [""],
      startBlock: BigNumber.from("0"),
      endBlock: BigNumber.from("0"),
      description: "",
    };
  }

  return {
    proposalId: _proposalCreatedEvent[0].args[0],
    proposer: _proposalCreatedEvent[0].args[1],
    targets: _proposalCreatedEvent[0].args[2],
    _values: _proposalCreatedEvent[0].args[3],
    signatures: _proposalCreatedEvent[0].args[4],
    calldatas: _proposalCreatedEvent[0].args[5],
    startBlock: _proposalCreatedEvent[0].args[6],
    endBlock: _proposalCreatedEvent[0].args[7],
    description: _proposalCreatedEvent[0].args[8],
  };
}

export async function vote(
  _dao: MyGovernor,
  _proposalId: BigNumber,
  _vote: number,
  _voter: SignerWithAddress
): Promise<void> {
  await _dao.connect(_voter).castVote(_proposalId, _vote);
}

export async function queueProposal(
  _dao: MyGovernor,
  _queuer: SignerWithAddress,
  _proposalId: BigNumber
): Promise<void> {
  await _dao.connect(_queuer)["queue(uint256)"](_proposalId);
}

export async function executeProposal(
  _dao: MyGovernor,
  _executer: SignerWithAddress,
  _proposalId: BigNumber
): Promise<void> {
  await _dao.connect(_executer)["execute(uint256)"](_proposalId);
}
