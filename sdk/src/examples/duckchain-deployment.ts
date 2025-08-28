import { AgentSDK, AgentRole } from '../index.js';
import { NETWORKS } from '../config/networks.js';

/**
 * Example: Complete DuckChain mainnet deployment and usage
 * 
 * This example demonstrates:
 * 1. Deploying to DuckChain mainnet
 * 2. Setting up a multi-agent system
 * 3. Real-time event monitoring
 * 4. Message communication between agents
 */

// Configuration
const DUCKCHAIN_CONFIG = {
  network: NETWORKS.duckchain,
  // Replace with your actual private key
  privateKey: process.env.DUCKCHAIN_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000',
  // Agent configurations
  agents: [
    {
      name: 'DuckChain AI Assistant',
      role: AgentRole.Chat,
      ipfsHash: 'QmDuckChainAssistant123456789abcdef',
      description: 'Main AI assistant for DuckChain ecosystem'
    },
    {
      name: 'DuckChain Analytics Agent',
      role: AgentRole.Agent,
      ipfsHash: 'QmDuckChainAnalytics987654321fedcba',
      description: 'Analytics and data processing agent'
    },
    {
      name: 'DuckChain Trading Bot',
      role: AgentRole.Agent,
      ipfsHash: 'QmDuckChainTrading555666777888999',
      description: 'Automated trading and market analysis'
    }
  ]
};

/**
 * Deploy AgentController to DuckChain mainnet
 */
async function deployToDuckChain() {
  console.log('🦆 Deploying to DuckChain Mainnet');
  console.log('=' .repeat(50));
  
  if (!DUCKCHAIN_CONFIG.privateKey || DUCKCHAIN_CONFIG.privateKey.startsWith('0x0000')) {
    throw new Error('Please set DUCKCHAIN_PRIVATE_KEY environment variable with your actual private key');
  }

  console.log(`📡 Network: ${DUCKCHAIN_CONFIG.network.name}`);
  console.log(`🔗 RPC URL: ${DUCKCHAIN_CONFIG.network.rpcUrl}`);
  console.log(`🆔 Chain ID: ${DUCKCHAIN_CONFIG.network.chainId}`);
  console.log(`💰 Native Currency: ${DUCKCHAIN_CONFIG.network.nativeCurrency.symbol}`);
  
  console.log('\n⚠️  MAINNET DEPLOYMENT WARNING ⚠️');
  console.log('You are about to deploy to DuckChain mainnet.');
  console.log('Make sure you have sufficient DUCK tokens for gas fees.');
  console.log('Press Ctrl+C to cancel or wait 10 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 10000));

  try {
    const deployConfig = {
      rpcUrl: DUCKCHAIN_CONFIG.network.rpcUrl,
      privateKey: DUCKCHAIN_CONFIG.privateKey,
      chainId: DUCKCHAIN_CONFIG.network.chainId,
    };

    console.log('🚀 Deploying AgentController contract...');
    const startTime = Date.now();
    
    const sdk = await AgentSDK.deployController(deployConfig);
    const contractAddress = await sdk.getContractAddress();
    
    const deployTime = (Date.now() - startTime) / 1000;
    
    console.log('✅ Contract deployed successfully!');
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log(`⏱️  Deployment Time: ${deployTime.toFixed(2)}s`);
    console.log(`🔍 Block Explorer: ${DUCKCHAIN_CONFIG.network.blockExplorer}/address/${contractAddress}`);
    
    return sdk;
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

/**
 * Register multiple agents on DuckChain
 */
async function registerAgents(sdk: AgentSDK) {
  console.log('\n🤖 Registering AI Agents');
  console.log('=' .repeat(50));
  
  const registeredAgents: any[] = [];
  
  for (let i = 0; i < DUCKCHAIN_CONFIG.agents.length; i++) {
    const agentConfig = DUCKCHAIN_CONFIG.agents[i];
    
    console.log(`\n📝 Registering Agent ${i + 1}: ${agentConfig.name}`);
    console.log(`   Role: ${AgentRole[agentConfig.role]}`);
    console.log(`   Description: ${agentConfig.description}`);
    
    try {
      const result = await sdk.createNewAgent({
        name: agentConfig.name,
        role: agentConfig.role,
        ipfsHash: agentConfig.ipfsHash,
      });
      
      console.log(`✅ Agent registered with ID: ${result.agentId}`);
      console.log(`📄 Transaction: ${result.transactionHash}`);
      console.log(`🔍 View on explorer: ${DUCKCHAIN_CONFIG.network.blockExplorer}/tx/${result.transactionHash}`);
      
      registeredAgents.push({
        ...result,
        config: agentConfig,
      });
      
      // Wait between registrations to avoid nonce issues
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to register ${agentConfig.name}:`, error);
    }
  }
  
  console.log(`\n✅ Successfully registered ${registeredAgents.length}/${DUCKCHAIN_CONFIG.agents.length} agents`);
  return registeredAgents;
}

/**
 * Set up real-time event monitoring
 */
async function setupEventMonitoring(sdk: AgentSDK) {
  console.log('\n📡 Setting up Event Monitoring');
  console.log('=' .repeat(50));
  
  // Event counters
  const eventStats = {
    agentRegistered: 0,
    messageSent: 0,
    messageResponded: 0,
    agentUpdated: 0,
  };

  // Set up event listeners
  sdk.onAgentRegistered((event) => {
    eventStats.agentRegistered++;
    console.log(`📡 [AgentRegistered] Agent ${event.agentId}: ${event.name} (${event.role})`);
    console.log(`   Address: ${event.agentAddress}`);
    console.log(`   Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
  });

  sdk.onMessageSent((event) => {
    eventStats.messageSent++;
    console.log(`📡 [MessageSent] Message ${event.messageId}`);
    console.log(`   From Agent ${event.senderAgentId} to Agent ${event.receiverAgentId}`);
    console.log(`   Message: "${event.message}"`);
    console.log(`   Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
  });

  sdk.onMessageResponded((event) => {
    eventStats.messageResponded++;
    console.log(`📡 [MessageResponded] Message ${event.messageId}`);
    console.log(`   From Agent ${event.senderAgentId} to Agent ${event.receiverAgentId}`);
    console.log(`   Response: "${event.response}"`);
    console.log(`   Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
  });

  sdk.onAgentUpdated((event) => {
    eventStats.agentUpdated++;
    console.log(`📡 [AgentUpdated] Agent ${event.agentId}: ${event.name}`);
    console.log(`   New Role: ${event.role}`);
    console.log(`   Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
  });

  sdk.onError((error) => {
    console.error('📡 Event monitoring error:', error);
  });

  // Start monitoring
  await sdk.startEventMonitoring({
    fromBlock: 'latest',
    pollInterval: 3000, // Poll every 3 seconds
  });

  console.log('✅ Event monitoring started (polling every 3 seconds)');
  
  return eventStats;
}

/**
 * Demonstrate agent communication
 */
async function demonstrateAgentCommunication(sdk: AgentSDK, agents: any[]) {
  console.log('\n💬 Demonstrating Agent Communication');
  console.log('=' .repeat(50));
  
  if (agents.length < 2) {
    console.log('⚠️  Need at least 2 agents for communication demo');
    return;
  }

  const [agent1, agent2] = agents;
  
  try {
    // Send message from agent 1 to agent 2
    console.log(`\n📤 Sending message from ${agent1.config.name} to ${agent2.config.name}...`);
    const messageResult = await sdk.sendMessage({
      agentId: agent2.agentId,
      message: `Hello ${agent2.config.name}! This is ${agent1.config.name} on DuckChain. How can we collaborate?`,
    });

    console.log(`✅ Message sent with ID: ${messageResult.messageId}`);
    console.log(`📄 Transaction: ${messageResult.transactionHash}`);
    console.log(`🔍 View on explorer: ${DUCKCHAIN_CONFIG.network.blockExplorer}/tx/${messageResult.transactionHash}`);

    // Wait a bit for the event to be processed
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Send response (in real scenario, this would be from a different wallet/agent)
    console.log(`\n📤 Sending response from ${agent2.config.name} to ${agent1.config.name}...`);
    const responseResult = await sdk.respondToMessage({
      messageId: messageResult.messageId,
      receiverAgentId: agent1.agentId,
      response: `Hello ${agent1.config.name}! Great to connect on DuckChain. Let's work together to provide excellent service to users!`,
    });

    console.log(`✅ Response sent. Transaction: ${responseResult.transactionHash}`);
    console.log(`🔍 View on explorer: ${DUCKCHAIN_CONFIG.network.blockExplorer}/tx/${responseResult.transactionHash}`);

    return { messageResult, responseResult };
  } catch (error) {
    console.error('❌ Communication demo failed:', error);
  }
}

/**
 * Main DuckChain deployment and demo function
 */
async function runDuckChainDemo() {
  console.log('🦆 DuckChain AI Agents Deployment & Demo');
  console.log('🚀 DAI Agents SDK on DuckChain Mainnet');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Deploy contract
    const sdk = await deployToDuckChain();
    
    // Step 2: Set up event monitoring
    const eventStats = await setupEventMonitoring(sdk);
    
    // Step 3: Register agents
    const agents = await registerAgents(sdk);
    
    // Step 4: Demonstrate communication
    await demonstrateAgentCommunication(sdk, agents);
    
    // Step 5: Show final statistics
    console.log('\n📊 Final Statistics');
    console.log('=' .repeat(50));
    
    const totalAgents = await sdk.getAgentCount();
    console.log(`🤖 Total Agents: ${totalAgents}`);
    
    const allAgents = await sdk.getAllAgents();
    console.log(`📋 Agent List:`);
    allAgents.forEach((agent, index) => {
      console.log(`   ${index + 1}. ID: ${agent.id}, Name: ${agent.name}, Role: ${AgentRole[agent.role]}`);
    });
    
    console.log(`\n📡 Event Statistics:`);
    console.log(`   - Agent Registrations: ${eventStats.agentRegistered}`);
    console.log(`   - Messages Sent: ${eventStats.messageSent}`);
    console.log(`   - Messages Responded: ${eventStats.messageResponded}`);
    console.log(`   - Agent Updates: ${eventStats.agentUpdated}`);
    
    console.log('\n🎉 DuckChain deployment and demo completed successfully!');
    console.log(`📍 Contract Address: ${await sdk.getContractAddress()}`);
    console.log(`🔍 Block Explorer: ${DUCKCHAIN_CONFIG.network.blockExplorer}/address/${await sdk.getContractAddress()}`);
    
    // Keep monitoring for a bit longer
    console.log('\n⏳ Monitoring events for 30 more seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    sdk.stopEventMonitoring();
    console.log('✅ Event monitoring stopped');
    
  } catch (error) {
    console.error('❌ DuckChain demo failed:', error);
    process.exit(1);
  }
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDuckChainDemo().catch(console.error);
}

export {
  runDuckChainDemo,
  deployToDuckChain,
  registerAgents,
  setupEventMonitoring,
  demonstrateAgentCommunication,
};
