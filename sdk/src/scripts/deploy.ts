#!/usr/bin/env node

import { AgentSDK } from '../index.js';
import { NETWORKS, getNetwork } from '../config/networks.js';

/**
 * Deployment script for AgentController contracts
 */

interface DeploymentOptions {
  network: string;
  privateKey: string;
  verify?: boolean;
  save?: boolean;
}

/**
 * Deploy contract to specified network
 */
async function deployToNetwork(options: DeploymentOptions) {
  const { network: networkName, privateKey, verify = false, save = true } = options;
  
  console.log(`🚀 Deploying AgentController to ${networkName}...`);
  
  // Get network configuration
  const network = getNetwork(networkName);
  if (!network) {
    throw new Error(`Network '${networkName}' not found. Available networks: ${Object.keys(NETWORKS).join(', ')}`);
  }

  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`🔗 RPC URL: ${network.rpcUrl}`);
  
  if (!network.testnet) {
    console.log('⚠️  WARNING: Deploying to MAINNET! Make sure you have sufficient funds.');
    console.log('⚠️  Press Ctrl+C to cancel or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  try {
    // Deploy the contract
    const deployConfig = {
      rpcUrl: network.rpcUrl,
      privateKey,
      chainId: network.chainId,
    };

    console.log('⏳ Deploying contract...');
    const startTime = Date.now();
    
    const sdk = await AgentSDK.deployController(deployConfig);
    const contractAddress = await sdk.getContractAddress();
    
    const deployTime = (Date.now() - startTime) / 1000;
    
    console.log('✅ Contract deployed successfully!');
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log(`⏱️  Deployment Time: ${deployTime.toFixed(2)}s`);
    
    if (network.blockExplorer) {
      console.log(`🔍 Block Explorer: ${network.blockExplorer}/address/${contractAddress}`);
    }

    // Test basic functionality
    console.log('\n🧪 Testing basic functionality...');
    
    // Get initial agent count
    const initialCount = await sdk.getAgentCount();
    console.log(`📊 Initial agent count: ${initialCount}`);
    
    // Register a test agent
    console.log('📝 Registering test agent...');
    const testAgent = await sdk.createNewAgent({
      name: `Test Agent - ${network.name}`,
      role: 0, // AgentRole.Agent
      ipfsHash: `QmTest${Date.now()}`,
    });
    
    console.log(`✅ Test agent registered with ID: ${testAgent.agentId}`);
    console.log(`📄 Transaction: ${testAgent.transactionHash}`);
    
    // Verify agent count increased
    const newCount = await sdk.getAgentCount();
    console.log(`📊 New agent count: ${newCount}`);
    
    if (newCount > initialCount) {
      console.log('✅ Basic functionality test passed!');
    } else {
      console.log('❌ Basic functionality test failed!');
    }

    // Save deployment info
    if (save) {
      const deploymentInfo = {
        network: networkName,
        chainId: network.chainId,
        contractAddress,
        deploymentTime: new Date().toISOString(),
        deployTime: deployTime,
        testAgent: {
          id: testAgent.agentId.toString(),
          transactionHash: testAgent.transactionHash,
        },
        blockExplorer: network.blockExplorer ? `${network.blockExplorer}/address/${contractAddress}` : undefined,
      };

      console.log('\n💾 Deployment Summary:');
      console.log(JSON.stringify(deploymentInfo, null, 2));
    }

    return {
      sdk,
      contractAddress,
      network,
      deploymentTime: deployTime,
      testAgent,
    };

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

/**
 * Deploy to multiple networks
 */
async function deployToMultipleNetworks(networks: string[], privateKey: string) {
  console.log(`🌐 Deploying to ${networks.length} networks: ${networks.join(', ')}`);

  const results: any[] = [];
  
  for (const networkName of networks) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      const result = await deployToNetwork({
        network: networkName,
        privateKey,
      });
      results.push({ networkName, success: true, ...result });
    } catch (error: any) {
      console.error(`❌ Failed to deploy to ${networkName}:`, error);
      results.push({ networkName, success: false, error: error.message });
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 DEPLOYMENT SUMMARY');
  console.log(`${'='.repeat(60)}`);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful deployments: ${successful.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successful Deployments:');
    successful.forEach(result => {
      console.log(`   ${result.networkName}: ${result.contractAddress}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Deployments:');
    failed.forEach(result => {
      console.log(`   ${result.networkName}: ${result.error}`);
    });
  }

  return results;
}

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🚀 DAI Agents SDK Deployment Script

Usage:
  npm run deploy <network> [privateKey]
  npm run deploy:multi <network1,network2,...> [privateKey]

Available networks:
${Object.entries(NETWORKS).map(([key, network]) => 
  `  ${key.padEnd(15)} - ${network.name} (${network.testnet ? 'Testnet' : 'Mainnet'})`
).join('\n')}

Examples:
  npm run deploy seiTestnet
  npm run deploy:multi seiTestnet,sepolia
  npm run deploy duckchain 0x1234...

Environment Variables:
  PRIVATE_KEY - Your private key (if not provided as argument)
  SKIP_CONFIRMATION - Skip mainnet deployment confirmation
    `);
    process.exit(0);
  }

  const command = args[0];
  const privateKey = args[1] || process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ Private key required. Provide as argument or set PRIVATE_KEY environment variable.');
    process.exit(1);
  }

  try {
    if (command.includes(',')) {
      // Multiple networks
      const networks = command.split(',').map(n => n.trim());
      await deployToMultipleNetworks(networks, privateKey);
    } else {
      // Single network
      await deployToNetwork({
        network: command,
        privateKey,
      });
    }
  } catch (error) {
    console.error('❌ Deployment script failed:', error);
    process.exit(1);
  }
}

// Export functions for use in other scripts
export {
  deployToNetwork,
  deployToMultipleNetworks,
};

// Run main function if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
