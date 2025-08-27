#!/bin/bash

# Comprehensive test script for AgentsController contract

echo "🚀 Running AgentsController Test Suite"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "foundry.toml" ]; then
    echo "❌ Error: Not in a Foundry project directory"
    exit 1
fi

# Check if forge is available
if ! command -v forge &> /dev/null; then
    echo "❌ Forge not found. Please install Foundry."
    echo "Visit: https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi

echo "📋 Test Files:"
echo "  - AgentsController.t.sol (Core functionality)"
echo "  - AgentsControllerIntegration.t.sol (Integration scenarios)"  
echo ""

# Compile contracts first
echo "🔨 Compiling contracts..."
forge build

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo "✅ Compilation successful!"
echo ""

# Run core functionality tests
echo "🧪 Running Core Functionality Tests..."
echo "----------------------------------------"
forge test --match-contract AgentsControllerTest -v

if [ $? -ne 0 ]; then
    echo "❌ Core tests failed!"
    exit 1
fi

echo ""

# Run integration tests  
echo "🔗 Running Integration Tests..."
echo "--------------------------------"
forge test --match-contract AgentsControllerIntegrationTest -v

if [ $? -ne 0 ]; then
    echo "❌ Integration tests failed!"
    exit 1
fi

echo ""


# Run all tests with gas reporting
echo "📊 Gas Usage Report..."
echo "----------------------"
forge test --match-path "test/AgentsController*.sol" --gas-report

echo ""
echo "🎉 All tests completed successfully!"
echo ""
echo "📈 Test Summary:"
echo "  ✅ Core functionality tests"
echo "  ✅ Integration scenario tests"  
echo ""
echo "For detailed coverage, run:"
echo "  forge coverage --match-path 'test/AgentsController*.sol'"
