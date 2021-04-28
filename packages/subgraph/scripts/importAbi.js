const fs = require('fs');

const {
  OrgIdContract,
} = require('@windingtree/org.id');

const {
  DirectoryIndexContract,
  ArbitrableDirectoryContract,
} = require('@windingtree/org.id-directories');

// Define the list of contracts to import
const contracts = [
  OrgIdContract,
  DirectoryIndexContract,
  ArbitrableDirectoryContract,
];

// Write the ABI of a contract build to a path on the filesystem
const writeContractAbi = (abi, path) => {
  return new Promise((resolve, reject) => {
    const dir = path.split('/')[0];
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    fs.writeFile(path, JSON.stringify(abi) , err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Write all required ABIs
Promise
  .all(contracts.map(contract => writeContractAbi(contract.abi, `abis/${contract.contractName}.json`)))
  .then(() => console.log('✔ ABIs Imported'))
  .catch(console.error);



