import { BigNumberish } from 'ethers';

/**
 * Agent role enumeration matching the smart contract
 */
export enum AgentRole {
  Agent = 0,
  Chat = 1
}

/**
 * Agent structure matching the smart contract
 */
export interface Agent {
  id: bigint;
  name: string;
  role: AgentRole;
  ipfsHash: string;
}

/**
 * Event data structures for contract events
 */
export interface AgentRegisteredEvent {
  agentId: bigint;
  agentAddress: string;
  name: string;
  role: string;
  ipfsHash: string;
  blockNumber: number;
  transactionHash: string;
}

export interface MessageSentEvent {
  messageId: bigint;
  senderAgentId: bigint;
  receiverAgentId: bigint;
  message: string;
  blockNumber: number;
  transactionHash: string;
}

export interface MessageRespondedEvent {
  messageId: bigint;
  senderAgentId: bigint;
  receiverAgentId: bigint;
  response: string;
  blockNumber: number;
  transactionHash: string;
}

export interface AgentUpdatedEvent {
  agentId: bigint;
  name: string;
  role: string;
  ipfsHash: string;
  blockNumber: number;
  transactionHash: string;
}

/**
 * Configuration for the SDK
 */
export interface SDKConfig {
  rpcUrl: string;
  privateKey?: string;
  contractAddress?: string;
  chainId?: number;
}

/**
 * Contract deployment configuration
 */
export interface DeploymentConfig {
  rpcUrl: string;
  privateKey: string;
  chainId?: number;
  gasLimit?: BigNumberish;
  gasPrice?: BigNumberish;
}

/**
 * Event filter options
 */
export interface EventFilterOptions {
  fromBlock?: number | 'latest';
  toBlock?: number | 'latest';
  agentId?: bigint;
  messageId?: bigint;
  senderAgentId?: bigint;
  receiverAgentId?: bigint;
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  gasLimit?: BigNumberish;
  gasPrice?: BigNumberish;
  value?: BigNumberish;
}

/**
 * Agent registration parameters
 */
export interface RegisterAgentParams {
  name: string;
  role: AgentRole;
  ipfsHash: string;
  options?: TransactionOptions;
}

/**
 * Message sending parameters
 */
export interface SendMessageParams {
  agentId: bigint;
  message: string;
  options?: TransactionOptions;
}

/**
 * Message response parameters
 */
export interface RespondToMessageParams {
  messageId: bigint;
  receiverAgentId: bigint;
  response: string;
  options?: TransactionOptions;
}

/**
 * Event listener callback types
 */
export type AgentRegisteredCallback = (event: AgentRegisteredEvent) => void;
export type MessageSentCallback = (event: MessageSentEvent) => void;
export type MessageRespondedCallback = (event: MessageRespondedEvent) => void;
export type AgentUpdatedCallback = (event: AgentUpdatedEvent) => void;

/**
 * Event listener options
 */
export interface EventListenerOptions {
  fromBlock?: number | 'latest';
  pollInterval?: number; // in milliseconds
}
