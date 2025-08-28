import { AgentSDK, AgentRole, DeploymentConfig, SDKConfig } from '../index.js';

/**
 * Example: Deploy a new AgentController contract
 */
async function deployNewContract() {
  const deployConfig: DeploymentConfig = {
    rpcUrl: 'http://localhost:8545', // Your RPC URL
    privateKey: '0x...', // Your private key
    chainId: 1337, // Your chain ID
  };

  try {
    console.log('Deploying new AgentController contract...');
    const sdk = await AgentSDK.deployController(deployConfig);
    const contractAddress = await sdk.getContractAddress();
    
    console.log(`Contract deployed at: ${contractAddress}`);
    return sdk;
  } catch (error) {
    console.error('Deployment failed:', error);
    throw error;
  }
}

/**
 * Example: Connect to existing contract
 */
function connectToExistingContract() {
  const config: SDKConfig = {
    rpcUrl: 'http://localhost:8545',
    privateKey: '0x...', // Your private key
    contractAddress: '0x...', // Existing contract address
    chainId: 1337,
  };

  return new AgentSDK(config);
}

/**
 * Example: Register a new agent
 */
async function registerAgent(sdk: AgentSDK) {
  try {
    console.log('Registering new agent...');
    
    const result = await sdk.createNewAgent({
      name: 'ChatBot Assistant',
      role: AgentRole.Chat,
      ipfsHash: 'QmYourIPFSHash', // IPFS hash for agent metadata
    });

    console.log(`Agent registered with ID: ${result.agentId}`);
    console.log(`Transaction hash: ${result.transactionHash}`);
    console.log('Agent details:', result.agent);
    
    return result.agentId;
  } catch (error) {
    console.error('Agent registration failed:', error);
    throw error;
  }
}

/**
 * Example: Send a message between agents
 */
async function sendMessage(sdk: AgentSDK, receiverAgentId: bigint) {
  try {
    console.log('Sending message...');
    
    const result = await sdk.sendMessage({
      agentId: receiverAgentId,
      message: 'Hello! How can I help you today?',
    });

    console.log(`Message sent with ID: ${result.messageId}`);
    console.log(`Transaction hash: ${result.transactionHash}`);
    
    return result.messageId;
  } catch (error) {
    console.error('Message sending failed:', error);
    throw error;
  }
}

/**
 * Example: Respond to a message
 */
async function respondToMessage(sdk: AgentSDK, messageId: bigint, receiverAgentId: bigint) {
  try {
    console.log('Responding to message...');
    
    const result = await sdk.respondToMessage({
      messageId,
      receiverAgentId,
      response: 'Thank you for your message! I can help you with various tasks.',
    });

    console.log(`Response sent. Transaction hash: ${result.transactionHash}`);
  } catch (error) {
    console.error('Message response failed:', error);
    throw error;
  }
}

/**
 * Example: Set up event monitoring
 */
async function setupEventMonitoring(sdk: AgentSDK) {
  console.log('Setting up event monitoring...');

  // Set up event listeners
  sdk.onAgentRegistered((event) => {
    console.log('New agent registered:', {
      agentId: event.agentId,
      name: event.name,
      role: event.role,
      address: event.agentAddress,
    });
  });

  sdk.onMessageSent((event) => {
    console.log('Message sent:', {
      messageId: event.messageId,
      from: event.senderAgentId,
      to: event.receiverAgentId,
      message: event.message,
    });
  });

  sdk.onMessageResponded((event) => {
    console.log('Message responded:', {
      messageId: event.messageId,
      from: event.senderAgentId,
      to: event.receiverAgentId,
      response: event.response,
    });
  });

  sdk.onError((error) => {
    console.error('Event monitoring error:', error);
  });

  // Start monitoring
  await sdk.startEventMonitoring({
    fromBlock: 'latest',
    pollInterval: 3000, // Poll every 3 seconds
  });

  console.log('Event monitoring started');
}

/**
 * Example: Get historical events
 */
async function getHistoricalEvents(sdk: AgentSDK) {
  try {
    console.log('Fetching historical events...');
    
    const events = await sdk.getHistoricalEvents({
      fromBlock: 0,
      toBlock: 'latest',
    });

    console.log('Historical events:');
    console.log(`- Agent registrations: ${events.agentRegistered.length}`);
    console.log(`- Messages sent: ${events.messageSent.length}`);
    console.log(`- Messages responded: ${events.messageResponded.length}`);
    console.log(`- Agent updates: ${events.agentUpdated.length}`);

    return events;
  } catch (error) {
    console.error('Failed to fetch historical events:', error);
    throw error;
  }
}

/**
 * Example: List all agents
 */
async function listAllAgents(sdk: AgentSDK) {
  try {
    console.log('Fetching all agents...');
    
    const agents = await sdk.getAllAgents();
    const count = await sdk.getAgentCount();

    console.log(`Total agents: ${count}`);
    agents.forEach((agent, index) => {
      console.log(`${index + 1}. Agent ID: ${agent.id}, Name: ${agent.name}, Role: ${AgentRole[agent.role]}`);
    });

    return agents;
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    throw error;
  }
}

/**
 * Complete example workflow
 */
async function completeExample() {
  try {
    // Option 1: Deploy new contract
    const sdk = await deployNewContract();
    
    // Option 2: Connect to existing contract
    // const sdk = connectToExistingContract();

    // Set up event monitoring
    await setupEventMonitoring(sdk);

    // Register agents
    const agent1Id = await registerAgent(sdk);
    
    // Wait a bit for events to be processed
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Create another agent with different wallet
    const sdk2 = sdk.withWallet('0x...'); // Different private key
    const agent2Id = await sdk2.createNewAgent({
      name: 'Task Assistant',
      role: AgentRole.Agent,
      ipfsHash: 'QmAnotherIPFSHash',
    });

    // Send messages between agents
    const messageResult = await sdk.sendMessage({
      agentId: agent2Id.agentId,
      message: 'Hello from Agent 1!',
    });

    // Respond to the message
    await sdk2.respondToMessage({
      messageId: messageResult.messageId,
      receiverAgentId: agent1Id,
      response: 'Hello back from Agent 2!',
    });

    // List all agents
    await listAllAgents(sdk);

    // Get historical events
    await getHistoricalEvents(sdk);

    console.log('Example completed successfully!');

  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  completeExample().catch(console.error);
}

export {
  deployNewContract,
  connectToExistingContract,
  registerAgent,
  sendMessage,
  respondToMessage,
  setupEventMonitoring,
  getHistoricalEvents,
  listAllAgents,
  completeExample,
};
