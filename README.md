# 需求分析

需求：统计出[目标以太坊地址](https://etherscan.io/address/0xae2fc483527b8ef99eb5d9b44875f005ba1fae13)从区块高度19800000开始到19816000的交互过的`uniswapV2`交易对（名称/地址），以及该地址在每个交易对上的盈利（按交易对累计)。编程语言不限，只需要输出结果，不需要考虑数据存储问题。

需求分析：

- 根据用户的地址可以在区块中过滤出该用户所有`ERC-20`的转账记录（日志）；
- 根据用户所有的转账记录，可以获取到非用户地址的地址，需要判断该地址是否是`Uniswap V2` 的 `Pair`，也就是在 `UniswapV2Factory` 合约中是否存在，但是`UniswapV2Factory`合约没有判断一个合约地址是否存在的地址，只有一个方法：由两个代币地址得出`Pair`地址，结果为0就说明不存在；这个方法不能满足想要的结果；我的设计是根据`UniswapV2Factory`的`allPairs`和`allPairsLength`方法，将所有`pair`的地址都获取到存储到本地，用一个`Set`数据结构存储，粗略估计了一下大小：每个地址大小：`32 Byte`，目前2024.05.08，大概有`320000`个`pair`，总存储约`10MB`左右，所以放到`Redis`中就可以；用`Set`数据结构中判断是否包含`ERC-20`地址，若包含则是`Uniswap V2` 的 `Pair`，即用户与该交易对交易过；
- 需求中需要获取交易对的名称和地址，交易对的地址已经存在，如何获取名称，查看交易对地址`name`为`Uniswap V2`，`symbol`为`UNI-V2`，并不具有可读性和解释性，所以需要分别获取`pair`合约中的`token0`和`token1`的`ERC-20`地址，然后获取其`symbol`，为了优化性能，可以将该地址的`symbol`进行缓存，用`Map<tocken address,symbol>`数据结构进行存储；
- 获取该地址在每个交易对上的盈利，每次用户进行`swap`操作的时候，相当于： `x` 个 `token0` ➡`pair`➡ `y` 个`token1`，所以只需要计算该地址在每个`pair`的交易过所有代币交易即可，初始值是0，若是从该地址转出就减去转出的数量，若是转入该地址就加上转入的数量，用`Map<pair address,Map<token address,value>>`数据结构进行存储；

# 方案设计

1. 以太坊节点，因为我没有搭建以太坊节点，所以我采用的是第三方提供的节点，一开始使用`infura`，但是我的`vpn`无法访问到，最终采用`quiknode`实现，使用第三方节点的缺点就是访问受限，免费版查询功能一次查询的区块范围最大为5个，并且每天有限次；
2. 使用`node.js`开发，使用`ethers.js`库，首先连接以太坊网络；
3. 从以太坊提供的节点获取用户的所有交易数据；
4. 根据`UniswapV2Factory`合约的`ABI`（`allPairs`和`allPairsLength`方法）、`UniswapV2`官方的工厂合约地址和以太坊连接实例化一个合约对象，然后调用`allPairs`和`allPairsLength`方法获取所有数据存储到`uniswapV2PairSet`中;
5. 每隔5个block访问一次，获取5个block内用户的所有交易信息，根据用户所有交易记录，可以获取到非用户地址的地址，并判断非用户的地址是否在Set中；
6. 如果在Set中，然后获取名称，先在`Map<pair address,Map<token address,value>>`中进行查询是否含有代币的名称，若没有，根据ABI、该`pair`地址、以太坊连接，实例化一个对象，获取该合约的`token0`和`token1`的`ERC-20`地址，然后再根据ABI、该`token0`地址、以太坊连接实例化`token0`合约对象，`token1`同理，获取到名称之后添加到`Map`中；
7. 获取该地址在每个交易对上的盈利，根据每次交易记录的数额，对`Map<pair address,Map<token address,value>>`数据结构进行修改；
8. 最终遍历`Map<pair address,Map<token address,value>>`，统计出该每个代币地址的盈利情况，转化为`Map<token address,value>`进行存储并输出到文件。

# 方案优化

- 可以搭建本地节点进行跨多个区块查询；
- 可以使用并行思想优化时，可以同时获取多个区块的数据以及并行处理每个区块中的交易数据，提高效率。