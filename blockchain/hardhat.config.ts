import dotenv from "dotenv"
dotenv.config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000
      }
    }
  },
  defaultNetwork: "local",
  networks: {
    local: {
      url: process.env.LOCAL_URL,
      chainId: 31337,
      accounts: {
        mnemonic: process.env.LOCAL_SECRET
      }
    },
    bsctest: {
      url: process.env.BSCTEST_URL,
      chainId: 97,
      accounts: {
        mnemonic: process.env.BSCTEST_SECRET
      }
    }
  },
  etherscan: {
    apiKey: process.env.API_KEY
  }
};

export default config;
