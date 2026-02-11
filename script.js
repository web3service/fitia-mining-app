// ======================================================
// CONFIGURATION (REMPLISSEZ SEULEMENT ICI)
// ======================================================
const CONFIG = {
    // ADRESSE DU CONTRAT DEPLOYE (FITIA MINING V2)
    MINING: "0xcD718eCb9e46f474E28508E07b692610488a4Ba4", 
    
    // ADRESSE DE VOTRE TOKEN FTA
    FTA: "0x535bBe393D64a60E14B731b7350675792d501623",          
    
    // ADRESSE USDT POLYGON (NE CHANGEZ PAS)
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", 
    
    // ID DU RESEAU (137 = Polygon Mainnet)
    POLYGON_ID: 137
};

// ======================================================
// INTERFACES (ABI) - NE TOUCHEZ PAS, C'EST DEJA FAIT
// ======================================================

// ABI MINIMAL ET NETTOYE POUR VOTRE CONTRAT V2
const MINING_ABI = [
    {
        "inputs": [],
        "name": "getMachineCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "_user", "name": "", "type": "address"}],
        "name": "getActivePower",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "exchangeRate",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "typeId", "name": "", "type": "uint256"}],
        "name": "buyMachine",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "claimRewards",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "amount", "name": "", "type": "uint256"}],
        "name": "swapUsdtForFta",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "amount", "name": "", "type": "uint256"}],
        "name": "swapFtaForUsdt",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "_referrer", "name": "", "type": "address"}],
        "name": "setReferrer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "", "name": "", "type": "uint256"}],
        "name": "machineTypes",
        "outputs": [
            {"internalType": "uint256", "name": "price", "type": "uint256"},
            {"internalType": "uint256", "name": "power", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// ABI STANDARD POUR TOUS LES TOKENS (USDT, FTA, ETC)
const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_spender", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {"name": "_owner", "type": "address"},
            {"name": "_spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_from", "type": "address"},
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transferFrom",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    }
];

// ======================================================
// LOGIQUE DE L'APPLICATION
// ======================================================
const app = {
    provider: null,
    signer: null,
    contracts: {},
    user: null,
    currentRate: 0,

    async init() {
        console.log("App initialized");
        this.checkUrlReferral();
        
        if (window.ethereum) {
            try {
                this.provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await this.provider.listAccounts();
                if (accounts.length > 0) {
                    await this.connectWallet(true);
                }
            } catch (e) { console.log("Auto-connect failed"); }
        } else {
            this.showToast("Installez MetaMask ou Trust Wallet", true);
        }
    },

    checkUrlReferral() {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref && ethers.isAddress(ref)) {
            document.getElementById('ref-input').value = ref;
            document.getElementById('set-ref-section').style.display = 'block';
        }
    },

    async connectWallet(silent = false) {
        if (!window.ethereum) return alert("Wallet non trouvé");
        
        try {
            if (!silent) this.showLoader(true, "Connexion...");
            
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            this.user = await this.signer.getAddress();

            const network = await this.provider.getNetwork();
            if (Number(network.chainId) !== CONFIG.POLYGON_ID) {
                await this.switchNetwork();
            }

            this.contracts.usdt = new ethers.Contract(CONFIG.USDT, ERC20_ABI, this.signer);
            this.contracts.fta = new ethers.Contract(CONFIG.FTA, ERC20_ABI, this.signer);
            this.contracts.mining = new ethers.Contract(CONFIG.MINING, MINING_ABI, this.signer);

            document.getElementById('btn-connect').classList.add('hidden');
            document.getElementById('wallet-info').classList.remove('hidden');
            document.getElementById('user-addr').innerText = this.user.slice(0,6) + "..." + this.user.slice(38);
            
            this.log("Connecté : " + this.user);
            await this.refreshAll();
            document.getElementById('ref-input').value = window.location.origin + "?ref=" + this.user;

        } catch (e) {
            console.error(e);
            this.showToast("Erreur connexion", true);
        }
        this.showLoader(false);
    },

    async switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x' + CONFIG.POLYGON_ID.toString(16) }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: '0x' + CONFIG.POLYGON_ID.toString(16),
                            chainName: 'Polygon Mainnet',
                            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                            rpcUrls: ['https://polygon-rpc.com/'],
                            blockExplorerUrls: ['https://polygonscan.com/']
                        },
                    ],
                });
            }
        }
    },

    async refreshAll() {
        if (!this.user) return;
        try {
            const usdtBal = await this.contracts.usdt.balanceOf(this.user);
            const ftaBal = await this.contracts.fta.balanceOf(this.user);
            const usdtFmt = parseFloat(ethers.formatUnits(usdtBal, 6)).toFixed(2);
            const ftaFmt = parseFloat(ethers.formatUnits(ftaBal, 8)).toFixed(2);

            document.getElementById('mini-usdt').innerText = usdtFmt + " USDT";
            document.getElementById('mini-fta').innerText = ftaFmt + " FTA";
            document.getElementById('bal-from').innerText = usdtFmt;
            document.getElementById('bal-to').innerText = ftaFmt;

            const power = await this.contracts.mining.getActivePower(this.user);
            document.getElementById('val-power').innerText = parseFloat(ethers.formatEther(power)).toFixed(4);

            const rate = await this.contracts.mining.exchangeRate();
            this.currentRate = parseFloat(ethers.formatUnits(rate, 8));
            document.getElementById('rate-display').innerText = `Taux : 1 USDT = ${this.currentRate} FTA`;

            await this.renderShop();

        } catch (e) {
            console.error("Erreur refresh", e);
        }
    },

    async renderShop() {
        const container = document.getElementById('shop-container');
        container.innerHTML = "";
        try {
            const count = await this.contracts.mining.getMachineCount();
            const icons = ["💾", "💚", "🟣", "🔷", "🟠"];

            for (let i = 0; i < count; i++) {
                const data = await this.contracts.mining.machineTypes(i);
                const price = parseFloat(ethers.formatUnits(data.price, 6)).toFixed(2);
                const power = parseFloat(ethers.formatEther(data.power)).toFixed(2);
                
                const div = document.createElement('div');
                div.className = "rig-card";
                div.innerHTML = `
                    <span class="rig-icon">${icons[i] || "⚙️"}</span>
                    <span class="rig-name">Rig Niveau ${i+1}</span>
                    <span class="rig-power">${power} FTA/s</span>
                    <span class="rig-price">${price} USDT</span>
                    <button class="btn-small" style="width:100%; background:var(--primary); color:black;" onclick="app.buyMachine(${i})">ACHETER</button>
                `;
                container.appendChild(div);
            }
        } catch (e) {
            container.innerText = "Erreur boutique (Vérifiez console F12)";
        }
    },

    async buyMachine(id) {
        if (!this.user) return this.connectWallet();
        this.showLoader(true, "Achat...");
        try {
            const m = await this.contracts.mining.machineTypes(id);
            const allowance = await this.contracts.usdt.allowance(this.user, CONFIG.MINING);
            if (allowance < m.price) {
                const txApp = await this.contracts.usdt.approve(CONFIG.MINING, m.price);
                await txApp.wait();
            }
            const txBuy = await this.contracts.mining.buyMachine(id);
            await txBuy.wait();
            this.showToast("Achat réussi !");
            this.refreshAll();
        } catch (e) {
            this.showToast("Erreur: " + e.reason, true);
        }
        this.showLoader(false);
    },

    async claimRewards() {
        if (!this.user) return this.connectWallet();
        this.showLoader(true, "Réclamation...");
        try {
            const tx = await this.contracts.mining.claimRewards();
            await tx.wait();
            this.showToast("Gains réclamés !");
            this.log("Réclamation OK");
            this.refreshAll();
        } catch (e) {
            this.showToast("Erreur réclamation", true);
        }
        this.showLoader(false);
    },

    async setReferrer() {
        const addr = document.getElementById('new-ref-input').value;
        if (!ethers.isAddress(addr)) return this.showToast("Adresse invalide", true);
        this.showLoader(true, "Lien...");
        try {
            const tx = await this.contracts.mining.setReferrer(addr);
            await tx.wait();
            this.showToast("Parrain lié !");
            document.getElementById('set-ref-section').style.display = 'none';
        } catch (e) {
            this.showToast("Erreur", true);
        }
        this.showLoader(false);
    },
    
    copyRef() {
        const val = document.getElementById('ref-input').value;
        navigator.clipboard.writeText(val);
        this.showToast("Copié !");
    },

    flipSwap() {
        const fromSel = document.getElementById('swap-from-token');
        const toSel = document.getElementById('swap-to-token');
        if (fromSel.value === 'USDT') {
            fromSel.value = 'FTA'; toSel.value = 'USDT';
        } else {
            fromSel.value = 'USDT'; toSel.value = 'FTA';
        }
        this.calcSwap();
    },

    calcSwap() {
        const amount = parseFloat(document.getElementById('swap-from-amount').value) || 0;
        const from = document.getElementById('swap-from-token').value;
        const output = document.getElementById('swap-to-amount');
        if (from === 'USDT') {
            output.value = (amount * this.currentRate).toFixed(4);
        } else {
            output.value = (amount / this.currentRate).toFixed(4);
        }
    },

    async executeSwap() {
        if (!this.user) return this.connectWallet();
        const amount = document.getElementById('swap-from-amount').value;
        if (!amount) return this.showToast("Montant requis", true);

        this.showLoader(true, "Échange...");
        const from = document.getElementById('swap-from-token').value;
        const decimals = from === 'USDT' ? 6 : 8;
        const parsedAmount = ethers.parseUnits(amount, decimals);

        try {
            if (from === 'USDT') {
                const allowance = await this.contracts.usdt.allowance(this.user, CONFIG.MINING);
                if (allowance < parsedAmount) {
                    const txApp = await this.contracts.usdt.approve(CONFIG.MINING, parsedAmount);
                    await txApp.wait();
                }
                const tx = await this.contracts.mining.swapUsdtForFta(parsedAmount);
                await tx.wait();
            } else {
                const allowance = await this.contracts.fta.allowance(this.user, CONFIG.MINING);
                if (allowance < parsedAmount) {
                    const txApp = await this.contracts.fta.approve(CONFIG.MINING, parsedAmount);
                    await txApp.wait();
                }
                const tx = await this.contracts.mining.swapFtaForUsdt(parsedAmount);
                await tx.wait();
            }
            this.showToast("Échange OK !");
            document.getElementById('swap-from-amount').value = '';
            document.getElementById('swap-to-amount').value = '';
            this.refreshAll();
        } catch (e) {
            this.showToast("Erreur Swap", true);
        }
        this.showLoader(false);
    },

    switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.getElementById('tab-' + tabId).classList.add('active');
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        event.currentTarget.classList.add('active');
    },

    log(msg) {
        const li = document.createElement('li');
        li.innerText = `> ${msg}`;
        const list = document.getElementById('activity-log');
        list.prepend(li);
    },

    showToast(msg, isError = false) {
        const div = document.createElement('div');
        div.className = 'toast';
        if (isError) div.style.borderLeftColor = 'var(--danger)';
        div.innerText = msg;
        document.getElementById('toast-container').appendChild(div);
        setTimeout(() => div.remove(), 3000);
    },

    showLoader(show, msg = "Chargement...") {
        const l = document.getElementById('loader');
        document.getElementById('loader-msg').innerText = msg;
        show ? l.classList.remove('hidden') : l.classList.add('hidden');
    }
};

window.addEventListener('load', () => app.init());