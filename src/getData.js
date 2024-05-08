const ethers = require("ethers")
const redis = require('redis');

// 创建 Redis 客户端
const client = redis.createClient({
    host: 'your_redis_host',
    port: 'your_redis_port',
    // 如果有密码认证，请添加下面这行
    // password: 'your_redis_password'
});
// 监听连接错误
client.on('error', (error) => {
    console.error('Redis Error:', error);
});

// 将 ABI 转化为 topic 所需要的格式
const getEventSignature = (eventName, abi) => {
    const eventAbi = abi.find((entry) => entry.name === eventName);
    const types = eventAbi.inputs.map((input) => input.type);
    return `${eventName}(${types.join(',')})`;
}


//RpcProviderURL
// const RPC_PROVIDERURL ="https://dry-cosmological-bird.quiknode.pro/YOUR_API_KEY/";
const RPC_PROVIDERURL = "https://dry-cosmological-bird.quiknode.pro/5eb987fc1d4572b49ec49e80fe75457158063b7e/";

//address
// 用户地址
const USER_ADDRESS = "0xae2fc483527b8ef99eb5d9b44875f005ba1fae13";
// Uniswap V2 路由合约地址
const UNISWAP_V2Router02_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
// Uniswap V2 工厂合约地址
const factoryAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

const provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDERURL);


const uniswapV2PairSet = new Set();
// uniswapV2PairSet.add('0xD6A4BA0f6627488164D1Ba97681fB90876954a8E');


// ABI
// Uniswap V2 工厂合约 ABI：allPairs 和 allPairsLength 方法
const factoryABI = [
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "allPairs",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "allPairsLength",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];
// 
const ERC20TransferEventABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    }
]

// 创建 Uniswap V2 工厂合约实例
const factoryContract = new ethers.Contract(factoryAddress, factoryABI, provider);

// 获取所有 pair 合约地址, 并存储到 Set 中
(async () => {
    try {
        const allPairsLength = await factoryContract.allPairsLength();
        console.log("Total pairs:", allPairsLength.toString());
        console.log("Pairs addresses:");
        const pairAddress = await factoryContract.allPairs(0);
        // uniswapV2PairSet.add(pairAddress);
        // console.log(pairAddress);
        // for (let i = 0; i < allPairsLength; i++) {
        //     const pairAddress = await factoryContract.allPairs(i);
        //     console.log(pairAddress);
        // }
    } catch (error) {
        console.error("Error:", error);
    }
})();


async function getTransactions(address, fromBlock, toBlock) {
    const history = await provider.getHistory(address, fromBlock, toBlock);
    return history;
}

let fromBlock = 19823258;
let toBlock = 19823260;
// let fromBlock = 19800000;
// let toBlock = 19816000;

const main = async () => {
    //写一个for循环，每隔5个block访问一次，获取5个block的交易信息
    for (let i = fromBlock; i <= toBlock; i += 5) {
        const result = await provider.getTransaction(USER_ADDRESS, i, i + 5);
        //根据用户所有交易记录，可以获取到非用户地址的地址，并判断非用户的地址是否在Set中
        for (let j = 0; j < result.length; j++) {
            const tx = result[j];
            const txTo = tx.to;
            const txFrom = tx.from;
            //判断txTo是否在Set中
            if (txTo !== USER_ADDRESS && uniswapV2PairSet.has(txTo)) {

            }
        }
    }


    // const ERC20TransferEventABISignature = getEventSignature('Swap', ERC20TransferEventABI)


    // console.log('-------------')
    // console.log(eventSignature)
    // console.log('-------------')

    // const userAddressFilter = {
    //     address: USER_ADDRESS,
    //     topics: [
    //         ethers.utils.id('function transfer(address to, uint256 value) returns (bool)'),
    //     ],
    //     fromBlock: fromBlock,
    //     toBlock: toBlock,
    // };

    // const uniswapFilter = {
    //     address: UNISWAP_V2Router02_ADDRESS,
    //     topics: [
    //         ethers.utils.id(eventSignature),
    //     ],
    //     fromBlock: fromBlock,
    //     toBlock: toBlock,
    // };

    const result = await provider.getLogs(userAddressFilter)
    console.log(result.length)
    console.log(result)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });