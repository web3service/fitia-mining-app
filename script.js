// --- CONFIGURATION ---
const CONTRACTS = {
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT Polygon Mainnet
    FTA: "0x535bBe393D64a60E14B731b7350675792d501623", // Adresse de VOTRE token FTA
    MINING: "0xcD718eCb9e46f474E28508E07b692610488a4Ba4" // <--- REMPLACEZ CECI PAR L'ADRESSE DU CONTRAT DÉPLOYÉ
};

const POLYGON_ID = 137;

// --- ABI (INTERFACE) ---
// REMPLACEZ CE TABLEAU PAR LE JSON COMPLET DEPUIS REMIX POUR AVOIR TOUTES LES FONCTIONS
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
    "function transfer(address, uint256) returns (bool)",
    "function transferFrom(address, address, uint256) returns (bool)",
    "function symbol() view returns (string)"
];

const app = {
    provider: null,
    signer: null,
    contracts: {},
    user: null,
    currentRate: 0,

    async init() {
        if (window.ethereum) {
            this.provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await this.provider.listAccounts();
            if (accounts.length > 0) this.connectWallet();
            
            // Vérifier le parrainage dans l'URL
            this.checkReferralUrl();
        }
    },

    checkReferralUrl() {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref && ethers.isAddress(ref)) {
            document.getElementById('referrer-input').value = ref;
            this.log("Code parrain détecté dans le lien.");
        }
    },

    async connectWallet() {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.signer = await this.provider.getSigner();
            this.user = await this.signer.getAddress();
            
            // Setup Contracts
            this.contracts.usdt = new ethers.Contract(CONTRACTS.USDT, ERC20_ABI, this.signer);
            this.contracts.fta = new ethers.Contract(CONTRACTS.FTA, ERC20_ABI, this.signer);
            this.contracts.mining = new ethers.Contract(CONTRACTS.MINING, MINING_ABI, this.signer);

            document.getElementById('btn-connect').classList.add('hidden');
            document.getElementById('wallet-display').classList.remove('hidden');
            document.getElementById('addr-short').innerText = this.user.slice(0,6) + "..." + this.user.slice(38);

            this.refreshData();
            this.renderShop();
            this.renderInventory();
            setInterval(() => this.refreshData(), 5000);
        } catch (e) { console.error(e); alert("Erreur connexion"); }
    },

    async refreshData() {
        if (!this.user) return;
        
        try {
            // Balances
            const usdtBal = await this.contracts.usdt.balanceOf(this.user);
            const ftaBal = await this.contracts.fta.balanceOf(this.user);
            
            // Mining Data
            const power = await this.contracts.mining.getActivePower(this.user);
            
            // UI Updates
            document.getElementById('total-power').innerText = parseFloat(ethers.formatEther(power)).toFixed(2);
            
            // Swap Balances
            document.getElementById('swap-balance-from').innerText = parseFloat(ethers.formatUnits(usdtBal, 6)).toFixed(2); 
            document.getElementById('swap-balance-to').innerText = parseFloat(ethers.formatUnits(ftaBal, 8)).toFixed(2);

            // Rate
            const rate = await this.contracts.mining.exchangeRate();
            this.currentRate = parseFloat(ethers.formatUnits(rate, 8));
            document.getElementById('rate-display').innerText = `Taux : 1 USDT = ${this.currentRate} FTA`;
            
            this.calcSwap();
        } catch(e) { console.error("Refresh error", e); }
    },

    async renderShop() {
        const container = document.getElementById('shop-grid');
        container.innerHTML = '';
        const count = await this.contracts.mining.getMachineCount();
        
        for(let i=0; i<count; i++) {
            const data = await this.contracts.mining.machineTypes(i);
            const priceUsdt = parseFloat(ethers.formatUnits(data.price, 6)).toFixed(2);
            const powerFta = parseFloat(ethers.formatEther(data.power)).toFixed(2);
            
            const div = document.createElement('div');
            div.className = 'rig-card';
            div.innerHTML = `
                <div class="rig-img">🖥️</div>
                <span class="expiry-tag">90 Jours</span>
                <h4>RIG NIVEAU ${i+1}</h4>
                <span class="rig-power">${powerFta} FTA/s</span>
                <div class="rig-price">${priceUsdt} USDT</div>
                <button class="btn-primary" onclick="app.buyMachine(${i})" style="margin-top:10px; font-size:0.8rem; padding:8px;">ACHETER</button>
            `;
            container.appendChild(div);
        }
    },

    async buyMachine(id) {
        this.showLoader(true, "Approbation & Achat en cours...");
        try {
            // Approve
            const m = await this.contracts.mining.machineTypes(id);
            const allowance = await this.contracts.usdt.allowance(this.user, CONTRACTS.MINING);
            if (allowance < m.price) {
                document.getElementById('loader-text').innerText = "Veuillez signer l'approbation USDT...";
                const txApp = await this.contracts.usdt.approve(CONTRACTS.MINING, m.price);
                await txApp.wait();
            }
            document.getElementById('loader-text').innerText = "Achat de la machine...";
            // Buy
            const txBuy = await this.contracts.mining.buyMachine(id);
            await txBuy.wait();
            this.log(`Achat Rig Niv ${id+1} réussi`);
            this.refreshData();
            this.renderInventory();
        } catch (e) {
            console.error(e);
            alert("Erreur achat: " + (e.reason || e.message));
        }
        this.showLoader(false);
    },

    async claim() {
        this.showLoader(true, "Réclamation en cours...");
        try {
            const tx = await this.contracts.mining.claimRewards();
            await tx.wait();
            this.log("Réclamation réussie");
            this.refreshData();
        } catch(e) { alert("Erreur réclamation"); }
        this.showLoader(false);
    },

    async setReferrer() {
        const addr = document.getElementById('referrer-input').value;
        if(!ethers.isAddress(addr)) { alert("Adresse invalide"); return; }
        
        this.showLoader(true, "Enregistrement du parrain...");
        try {
            const tx = await this.contracts.mining.setReferrer(addr);
            await tx.wait();
            this.log("Parrain enregistré avec succès !");
            document.getElementById('referrer-input').value = "";
            document.getElementById('referrer-input').disabled = true;
            document.getElementById('referrer-input').placeholder = "Parrain déjà défini";
        } catch(e) { alert("Erreur: " + (e.reason || "Déjà défini ?")); }
        this.showLoader(false);
    },

    // --- SWAP LOGIC ---
    async swapTokens() {
        const from = document.getElementById('token-from').value;
        const toSel = document.getElementById('token-to');
        
        if (from === 'USDT') {
            toSel.value = 'FTA';
        } else {
            toSel.value = 'USDT';
        }
        this.calcSwap();
    },

    calcSwap() {
        const amount = parseFloat(document.getElementById('amount-from').value) || 0;
        const from = document.getElementById('token-from').value;
        const output = document.getElementById('amount-to');
        
        if (from === 'USDT') {
            output.value = (amount * this.currentRate).toFixed(4);
        } else {
            output.value = (amount / this.currentRate).toFixed(4);
        }
    },

    async executeSwap() {
        const amount = document.getElementById('amount-from').value;
        if(!amount || amount <= 0) return;
        
        this.showLoader(true, "Échange en cours...");
        const from = document.getElementById('token-from').value;
        const parsedAmount = from === 'USDT' 
            ? ethers.parseUnits(amount, 6) 
            : ethers.parseUnits(amount, 8);

        try {
            if (from === 'USDT') {
                const allowance = await this.contracts.usdt.allowance(this.user, CONTRACTS.MINING);
                if (allowance < parsedAmount) {
                    const txApp = await this.contracts.usdt.approve(CONTRACTS.MINING, parsedAmount);
                    await txApp.wait();
                }
                const tx = await this.contracts.mining.swapUsdtForFta(parsedAmount);
                await tx.wait();
            } else {
                const allowance = await this.contracts.fta.allowance(this.user, CONTRACTS.MINING);
                if (allowance < parsedAmount) {
                    const txApp = await this.contracts.fta.approve(CONTRACTS.MINING, parsedAmount);
                    await txApp.wait();
                }
                const tx = await this.contracts.mining.swapFtaForUsdt(parsedAmount);
                await tx.wait();
            }
            this.log(`Swap de ${amount} ${from} réussi`);
            this.refreshData();
            document.getElementById('amount-from').value = '';
            document.getElementById('amount-to').value = '';
        } catch(e) { console.error(e); alert("Erreur Swap"); }
        this.showLoader(false);
    },

    renderInventory() {
        // Pour simplifier, on affiche juste un message car la fonction détaillée nécessite plus de gas
        const container = document.getElementById('inventory-list');
        container.innerHTML = `<p style="text-align:center; color:#666; padding:20px">Voir vos transactions sur Polygonscan pour les détails.</p>`;
    },

    nav(page) {
        document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
        document.getElementById('page-'+page).classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
        event.currentTarget.classList.add('active');
    },

    log(msg) {
        const li = document.createElement('li');
        li.innerText = `> ${msg}`;
        const list = document.getElementById('logs');
        list.prepend(li);
        if(list.children.length > 10) list.lastChild.remove();
    },

    showLoader(show, text="Chargement...") {
        const l = document.getElementById('loader');
        document.getElementById('loader-text').innerText = text;
        show ? l.classList.remove('hidden') : l.classList.add('hidden');
    }
};

window.onload = () => app.init();