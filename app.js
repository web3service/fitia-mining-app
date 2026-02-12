// ==========================================
// CONFIGURATION PRO
// ==========================================
const CONFIG = {
    // --- VOS ADRESSES ICI ---
    MINING: "0xcD718eCb9e46f474E28508E07b692610488a4Ba4", // Contrat Principal
    FTA: "0x535bBe393D64a60E14B731b7350675792d501623",          // Votre Token
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT Polygon
    CHAIN_ID: 137 // Polygon Mainnet
};

// --- ABI (INTERFACES) ---
// Assurez-vous que l'ABI contient bien toutes les fonctions nécessaires
const MINING_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_usdt",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_fta",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_initialExchangeRate",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "name": "OwnableInvalidOwner",
    "type": "error",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "name": "OwnableUnauthorizedAccount",
    "type": "error",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "name": "SafeERC20FailedOperation",
    "type": "error",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "name": "CommissionPaid",
    "type": "event",
    "inputs": [
      {
        "name": "referrer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "level",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "DifficultyUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "newMultiplier",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "ExchangeRateUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "newRate",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "MachineBought",
    "type": "event",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "machineId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "expiryTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "OwnershipTransferred",
    "type": "event",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "name": "ReferrerSet",
    "type": "event",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "referrer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "name": "RewardsClaimed",
    "type": "event",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "SwappedFtaForUsdt",
    "type": "event",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "ftaAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "usdtAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "SwappedUsdtForFta",
    "type": "event",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "usdtAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "ftaAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "MACHINE_LIFESPAN",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "buyMachine",
    "type": "function",
    "inputs": [
      {
        "name": "_typeId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "claimRewards",
    "type": "function",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "commissionRates",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "depositLiquidityFta",
    "type": "function",
    "inputs": [
      {
        "name": "_amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "depositLiquidityUsdt",
    "type": "function",
    "inputs": [
      {
        "name": "_amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "difficultyMultiplier",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "exchangeRate",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "ftaToken",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IERC20"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getActivePower",
    "type": "function",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getMachineCount",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getUserMachineCount",
    "type": "function",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_typeId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "machineTypes",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "price",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "power",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "owner",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "referrers",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "renounceOwnership",
    "type": "function",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setCommissionRates",
    "type": "function",
    "inputs": [
      {
        "name": "_l1",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_l2",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_l3",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setDifficulty",
    "type": "function",
    "inputs": [
      {
        "name": "_newMultiplier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setExchangeRate",
    "type": "function",
    "inputs": [
      {
        "name": "_newRate",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setReferrer",
    "type": "function",
    "inputs": [
      {
        "name": "_referrer",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "swapFtaForUsdt",
    "type": "function",
    "inputs": [
      {
        "name": "_ftaAmount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "swapUsdtForFta",
    "type": "function",
    "inputs": [
      {
        "name": "_usdtAmount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "transferOwnership",
    "type": "function",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "usdtToken",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IERC20"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "users",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "lastClaimTime",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "withdrawFta",
    "type": "function",
    "inputs": [
      {
        "name": "_amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "withdrawUsdt",
    "type": "function",
    "inputs": [
      {
        "name": "_amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
]

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function approve(address, uint256) returns (bool)",
    "function allowance(address, address) view returns (uint256)",
    "function transferFrom(address, address, uint256) returns (bool)",
    "function symbol() view returns (string)"
];

// ==========================================
// CLASSE PRINCIPALE (LOGIC CONTROLLER)
// ==========================================
class Application {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        this.user = null;
        this.refreshInterval = null;
        this.currentRate = 0;
        this.swapDirection = 'USDT_TO_FTA'; // ou 'FTA_TO_USDT'
    }

    // --- INITIALISATION ---
    async init() {
        console.log("FITIA PRO Initialisation...");
        this.checkReferral();
        
        if (window.ethereum) {
            this.provider = new ethers.BrowserProvider(window.ethereum);
            // Écouteurs d'événements mobiles/stables
            window.ethereum.on('accountsChanged', () => window.location.reload());
            window.ethereum.on('chainChanged', () => window.location.reload());
        } else {
            this.showToast("Wallet non détecté (MetaMask / Trust)", true);
        }
    }

    checkReferral() {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref && ethers.isAddress(ref)) {
            document.getElementById('bind-ref-area').style.display = 'block';
            document.getElementById('detected-ref').innerText = ref;
        }
    }

    // --- CONNEXION ---
    async connect() {
        if (!window.ethereum) return;
        
        this.setLoader(true, "Connexion sécurisée...");
        
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.signer = await this.provider.getSigner();
            this.user = await this.signer.getAddress();

            // Vérification Réseau
            const network = await this.provider.getNetwork();
            if (Number(network.chainId) !== CONFIG.CHAIN_ID) {
                await this.switchNetwork();
            }

            // Initialisation Contrats
            this.contracts.usdt = new ethers.Contract(CONFIG.USDT, ERC20_ABI, this.signer);
            this.contracts.fta = new ethers.Contract(CONFIG.FTA, ERC20_ABI, this.signer);
            this.contracts.mining = new ethers.Contract(CONFIG.MINING, MINING_ABI, this.signer);

            // Mise à jour UI
            document.getElementById('btn-connect').classList.add('hidden');
            const ws = document.getElementById('wallet-status');
            ws.classList.remove('hidden');
            document.getElementById('addr-display').innerText = this.user.slice(0,6) + "..." + this.user.slice(38);
            document.getElementById('ref-link').value = window.location.origin + "?ref=" + this.user;

            // Lancement de la boucle de refresh
            this.refreshLoop();

        } catch (e) {
            console.error(e);
            this.showToast("Erreur de connexion", true);
        }
        this.setLoader(false);
    }

    async switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x' + CONFIG.CHAIN_ID.toString(16) }],
            });
        } catch (e) {
            if (e.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{ chainId: '0x' + CONFIG.CHAIN_ID.toString(16), chainName: 'Polygon Mainnet', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://polygon-rpc.com/'], blockExplorerUrls: ['https://polygonscan.com/'] }],
                });
            }
        }
    }

    // --- BOUCLE DE DONNÉES ---
    refreshLoop() {
        this.updateData();
        this.refreshInterval = setInterval(() => this.updateData(), 5000); // Refresh toutes les 5s
    }

    async updateData() {
        if (!this.user) return;
        try {
            // Balances
            const usdtBal = await this.contracts.usdt.balanceOf(this.user);
            const ftaBal = await this.contracts.fta.balanceOf(this.user);
            
            // Minage
            const power = await this.contracts.mining.getActivePower(this.user);
            
            // Swap Rate
            const rate = await this.contracts.mining.exchangeRate();
            this.currentRate = parseFloat(ethers.formatUnits(rate, 8));

            // Mises à jour DOM (Optimisées)
            document.getElementById('val-power').innerText = parseFloat(ethers.formatEther(power)).toFixed(2);
            document.getElementById('bal-usdt').innerText = parseFloat(ethers.formatUnits(usdtBal, 6)).toFixed(2);
            document.getElementById('bal-fta').innerText = parseFloat(ethers.formatUnits(ftaBal, 8)).toFixed(2);
            
            // Swap UI Update
            document.getElementById('swap-bal-from').innerText = this.swapDirection === 'USDT_TO_FTA' ? parseFloat(ethers.formatUnits(usdtBal, 6)).toFixed(2) : parseFloat(ethers.formatUnits(ftaBal, 8)).toFixed(2);
            document.getElementById('swap-bal-to').innerText = this.swapDirection === 'USDT_TO_FTA' ? parseFloat(ethers.formatUnits(ftaBal, 8)).toFixed(2) : parseFloat(ethers.formatUnits(usdtBal, 6)).toFixed(2);
            document.getElementById('swap-rate').innerText = `1 USDT = ${this.currentRate} FTA`;

            // Calcul des gains en attente (Client-side pour économiser du Gas)
            // Note: On ne peut pas savoir le "lastClaimTime" exact sans une fonction view dédiée dans le contrat, 
            // donc pour l'instant on laisse à 0 ou on peut essayer de deviner si on a une fonction getUserInfo.
            // Si vous voulez l'afficher, il faut ajouter `function userInfo(address) view returns (uint256 lastClaim)` au contrat.
            
            // Shop Update (Une seule fois au chargement ou après achat)
            if (document.getElementById('shop-list').children.length === 0) {
                await this.renderShop();
            }

        } catch (e) {
            console.error("Erreur refresh:", e);
        }
    }

    // --- FONCTIONS METIER ---

    async renderShop() {
        const container = document.getElementById('shop-list');
        const count = await this.contracts.mining.getMachineCount();
        const icons = ["🟢", "🔵", "🟣", "🟡", "🔴"];
        
        container.innerHTML = '';
        for(let i=0; i<count; i++) {
            const data = await this.contracts.mining.machineTypes(i);
            const price = parseFloat(ethers.formatUnits(data.price, 6)).toFixed(2);
            const power = parseFloat(ethers.formatEther(data.power)).toFixed(2);
            
            const div = document.createElement('div');
            div.className = 'rig-item';
            div.innerHTML = `
                <span class="rig-name">RIG ${i+1}</span>
                <span class="rig-power">${power} FTA/s</span>
                <span class="rig-price">${price} USDT</span>
                <button class="btn-primary" style="padding:10px; font-size:0.9rem" onclick="App.buyMachine(${i})">ACHETER</button>
            `;
            container.appendChild(div);
        }
    }

    async buyMachine(id) {
        if (!this.user) return this.connect();
        this.setLoader(true, "Validation et Achat...");
        try {
            const m = await this.contracts.mining.machineTypes(id);
            
            // Approve
            const allowance = await this.contracts.usdt.allowance(this.user, CONFIG.MINING);
            if (allowance < m.price) {
                this.setLoader(true, "Veuillez approuver le contrat...");
                const txApp = await this.contracts.usdt.approve(CONFIG.MINING, m.price);
                await txApp.wait();
            }

            // Buy
            const txBuy = await this.contracts.mining.buyMachine(id);
            await txBuy.wait();
            
            this.showToast("Achat réussi !");
            // Vider shop pour forcer re-render
            document.getElementById('shop-list').innerHTML = '';
            this.updateData();
        } catch (e) {
            this.showToast("Erreur Achat", true);
        }
        this.setLoader(false);
    }

    async claim() {
        if (!this.user) return this.connect();
        this.setLoader(true, "Réclamation...");
        try {
            const tx = await this.contracts.mining.claimRewards();
            await tx.wait();
            this.showToast("Gains réceptionnés !");
            this.updateData();
        } catch (e) {
            this.showToast("Erreur Réclamation", true);
        }
        this.setLoader(false);
    }

    async bindReferrer() {
        const addr = document.getElementById('detected-ref').innerText;
        if (!ethers.isAddress(addr)) return;
        this.setLoader(true, "Liaison...");
        try {
            const tx = await this.contracts.mining.setReferrer(addr);
            await tx.wait();
            this.showToast("Parrain lié !");
            document.getElementById('bind-ref-area').style.display = 'none';
        } catch (e) { this.showToast("Déjà lié", true); }
        this.setLoader(false);
    }

    // --- SWAP LOGIC ---
    toggleSwap() {
        this.swapDirection = this.swapDirection === 'USDT_TO_FTA' ? 'FTA_TO_USDT' : 'USDT_TO_FTA';
        const fromDisplay = document.getElementById('token-from-display');
        const toDisplay = document.getElementById('token-to-display');
        
        if (this.swapDirection === 'USDT_TO_FTA') {
            fromDisplay.innerText = 'USDT'; toDisplay.innerText = 'FTA';
        } else {
            fromDisplay.innerText = 'FTA'; toDisplay.innerText = 'USDT';
        }
        this.updateData(); // Refresh balances display
    }

    async executeSwap() {
        const inputVal = document.getElementById('swap-from-in').value;
        if (!inputVal || parseFloat(inputVal) <= 0) return this.showToast("Montant invalide", true);

        this.setLoader(true, "Échange en cours...");
        const decimals = this.swapDirection === 'USDT_TO_FTA' ? 6 : 8;
        const amount = ethers.parseUnits(inputVal, decimals);

        try {
            if (this.swapDirection === 'USDT_TO_FTA') {
                // Approve USDT
                const allowance = await this.contracts.usdt.allowance(this.user, CONFIG.MINING);
                if (allowance < amount) {
                    this.setLoader(true, "Approbation USDT...");
                    const txApp = await this.contracts.usdt.approve(CONFIG.MINING, amount);
                    await txApp.wait();
                }
                const tx = await this.contracts.mining.swapUsdtForFta(amount);
                await tx.wait();
            } else {
                // Approve FTA
                const allowance = await this.contracts.fta.allowance(this.user, CONFIG.MINING);
                if (allowance < amount) {
                    this.setLoader(true, "Approbation FTA...");
                    const txApp = await this.contracts.fta.approve(CONFIG.MINING, amount);
                    await txApp.wait();
                }
                const tx = await this.contracts.mining.swapFtaForUsdt(amount);
                await tx.wait();
            }
            this.showToast("Échange réussi !");
            document.getElementById('swap-from-in').value = '';
            this.updateData();
        } catch (e) {
            this.showToast("Erreur Swap", true);
        }
        this.setLoader(false);
    }

    // --- UTILS ---
    nav(viewId) {
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById('view-' + viewId).classList.add('active');
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        event.currentTarget.classList.add('active');
    }

    copyLink() {
        const val = document.getElementById('ref-link').value;
        navigator.clipboard.writeText(val);
        this.showToast("Lien copié");
    }

    setLoader(show, msg="Chargement...") {
        const l = document.getElementById('loader');
        document.getElementById('loader-text').innerText = msg;
        show ? l.classList.remove('hidden') : l.classList.add('hidden');
    }

    showToast(msg, isError=false) {
        const div = document.createElement('div');
        div.className = 'toast';
        if (isError) div.style.borderLeftColor = 'var(--danger)';
        div.innerText = msg;
        document.getElementById('toast-container').appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }
}

// INSTANCE GLOBALE
const App = new Application();
window.onload = () => App.init();