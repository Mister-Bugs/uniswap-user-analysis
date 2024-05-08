const ethers = require('ethers');
const provider = new ethers.providers.JsonRpcProvider("https://dry-cosmological-bird.quiknode.pro/5eb987fc1d4572b49ec49e80fe75457158063b7e/");
provider.getBlockNumber()
.then(blockNumber => {
  console.log(blockNumber);
})
.catch(error => {
  console.error(error);
});