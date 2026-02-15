// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
    // --- VOS ADRESSES ---
    MINING: "0xcD718eCb9e46f474E28508E07b692610488a4Ba4", 
    FTA: "0x535bBe393D64a60E14B731b7350675792d501623",          
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", 
    CHAIN_ID: 137 
};

// --- ABI (COMPLET AVEC USERS POUR L'INVENTAIRE) ---
const MINING_ABI = [
    "function buyMachine(uint256 typeId)",
    "function claimRewards()",
    "function swapUsdtForFta(uint256 amount)",
    "function swapFtaForUsdt(uint256 amount)",
    "function setReferrer(address _referrer)",
    "function getActivePower(address) view returns (uint256)",
    "function exchangeRate() view returns (uint256)",
    "function machineTypes(uint256) view returns (uint256 price, uint256 power)",
    "function getMachineCount() view returns (uint256)",
    "function difficultyMultiplier() view returns (uint256)",
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "users",
        "outputs": [
            {"internalType": "uint256", "name": "totalPower", "type": "uint256"},
            {"internalType": "uint256", "name": "lastClaimTime", "type": "uint256"},
            {"components": [{"internalType": "uint256", "name": "typeId", "type": "uint256"}, {"internalType": "uint256", "name": "boughtAt", "type": "uint256"}], "internalType": "struct MachineInstance[]", "name": "machines", "type": "tuple[]"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function approve(address, uint256) returns (bool)",
    "function allowance(address, address) view returns (uint256)",
    "function transferFrom(address, address, uint256) returns (bool)",
    "function symbol() view returns (string)"
];

// ==========================================
// LOGIQUE
// ==========================================
class Application {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        this.user = null;
        this.currentRate = 0;
        this.swapDirection = 'USDT_TO_FTA';
        
        // Variables pour le calcul de minage
        this.currentRealPower = 0; 
        this.lastClaimTimeChain = 0;
        this.pendingBalance = 0;     
        this.miningTimer = null;
        
        // Variables Visualiseur
        this.vizContext = null;
        this.vizBars = [];
    }

    async init() {
        console.log("FITIA PRO Final Version");
        this.checkReferral();
        
        if (window.ethereum) {
            this.provider = new ethers.BrowserProvider(window.ethereum);
            window.ethereum.on('accountsChanged', () => window.location.reload());
            window.ethereum.on('chainChanged', () => window.location.reload());
        } else {
            this.showToast("Wallet non détecté", true);
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

    async connect() {
        if (!window.ethereum) return;
        
        this.setLoader(true, "Connexion...");
        
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.signer = await this.provider.getSigner();
            this.user = await this.signer.getAddress();

            const network = await this.provider.getNetwork();
            if (Number(network.chainId) !== CONFIG.CHAIN_ID) {
                await this.switchNetwork();
            }

            this.contracts.usdt = new ethers.Contract(CONFIG.USDT, ERC20_ABI, this.signer);
            this.contracts.fta = new ethers.Contract(CONFIG.FTA, ERC20_ABI, this.signer);
            this.contracts.mining = new ethers.Contract(CONFIG.MINING, MINING_ABI, this.signer);

            document.getElementById('btn-connect').classList.add('hidden');
            const ws = document.getElementById('wallet-status');
            ws.classList.remove('hidden');
            document.getElementById('addr-display').innerText = this.user.slice(0,6) + "..." + this.user.slice(38);
            document.getElementById('ref-link').value = window.location.origin + "?ref=" + this.user;

            // Premier chargement
            await this.updateData();
            
            // Refresh automatique
            setInterval(() => this.updateData(), 3000);

            // Initialisation Visualiseur
            this.initVisualizer();

        } catch (e) {
            console.error(e);
            this.showToast("Erreur connexion", true);
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

    // C'EST ICI QUE LA SYNCHRONISATION SE FAIT
    async updateData() {
        if (!this.user) return;
        try {
            // 1. Récupérer les données brutes
            const rawPower = await this.contracts.mining.getActivePower(this.user);
            const multiplier = await this.contracts.mining.difficultyMultiplier();
            
            // 2. Lire l'heure du dernier retrait (pour le calcul offline)
            const userInfo = await this.contracts.mining.users(this.user);
            this.lastClaimTimeChain = userInfo.lastClaimTime;

            // 3. Calculer la puissance réelle (avec la difficulté 0.001)
            const realPowerBN = (rawPower * multiplier) / 1000000000000000000n;
            this.currentRealPower = parseFloat(ethers.formatUnits(realPowerBN, 8));

            // 4. CALCUL DU MINING HORS LIGNE
            if (this.currentRealPower > 0 && this.lastClaimTimeChain > 0) {
                const currentTime = Math.floor(Date.now() / 1000);
                const timeSinceLastClaim = currentTime - Number(this.lastClaimTimeChain);
                const offlineEarnings = this.currentRealPower * timeSinceLastClaim;
                
                // Mise à jour du compteur "En Attente"
                this.pendingBalance = offlineEarnings;
                
                // Mise à jour de l'état visuel
                document.getElementById('viz-status').innerText = "MINAGE ACTIF";
                document.getElementById('viz-status').style.color = "var(--primary)";
                this.updateVisualizerIntensity(this.currentRealPower);

                // Lancer le timer visuel
                if (!this.miningTimer) this.startMiningCounter();

            } else if (this.currentRealPower === 0) {
                this.stopMiningCounter();
                document.getElementById('viz-status').innerText = "AUCUNE MACHINE";
                document.getElementById('viz-status').style.color = "#666";
                this.updateVisualizerIntensity(0);
            }

            // 5. AFFICHAGE TABLEAU DE BORD
            document.getElementById('val-power').innerText = this.currentRealPower.toFixed(5);
            document.getElementById('val-pending').innerText = this.pendingBalance.toFixed(5);
            
            // Soldes
            const usdtBal = await this.contracts.usdt.balanceOf(this.user);
            const ftaBal = await this.contracts.fta.balanceOf(this.user);
            document.getElementById('bal-usdt').innerText = parseFloat(ethers.formatUnits(usdtBal, 6)).toFixed(2);
            document.getElementById('bal-fta').innerText = parseFloat(ethers.formatUnits(ftaBal, 8)).toFixed(2);
            
            // Swap UI
            document.getElementById('swap-bal-from').innerText = this.swapDirection === 'USDT_TO_FTA' ? parseFloat(ethers.formatUnits(usdtBal, 6)).toFixed(2) : parseFloat(ethers.formatUnits(ftaBal, 8)).toFixed(2);
            document.getElementById('swap-bal-to').innerText = this.swapDirection === 'USDT_TO_FTA' ? parseFloat(ethers.formatUnits(ftaBal, 8)).toFixed(2) : parseFloat(ethers.formatUnits(usdtBal, 6)).toFixed(2);
            
            const rate = await this.contracts.mining.exchangeRate();
            this.currentRate = parseFloat(ethers.formatUnits(rate, 8));
            document.getElementById('swap-rate').innerText = `1 USDT = ${this.currentRate} FTA`;

            // Rendu boutique
            if (document.getElementById('shop-list').children.length === 0) {
                await this.renderShop();
            }

        } catch (e) {
            console.error("Erreur refresh:", e);
        }
    }

    // --- FONCTION DU MINUTEUR VISUEL (Effet Live) ---
    startMiningCounter() {
        if (this.miningTimer) return;
        this.miningTimer = setInterval(() => {
            if (this.currentRealPower > 0) {
                this.pendingBalance += this.currentRealPower;
                document.getElementById('val-pending').innerText = this.pendingBalance.toFixed(5);
                const el = document.getElementById('val-pending');
                el.style.color = 'var(--primary)';
                setTimeout(() => el.style.color = 'var(--text)', 500);
            }
        }, 1000); 
    };

    stopMiningCounter() {
        if (this.miningTimer) {
            clearInterval(this.miningTimer);
            this.miningTimer = null;
        }
    };

    async renderShop() {
        const container = document.getElementById('shop-list');
        const count = await this.contracts.mining.getMachineCount();
        const icons = ["🟢", "🔵", "🟣", "🟡", "🔴"];
        
        container.innerHTML = '';
        for(let i=0; i<count; i++) {
            const data = await this.contracts.mining.machineTypes(i);
            const price = parseFloat(ethers.formatUnits(data.price, 6)).toFixed(2);
            
            // Calcul avec difficulté
            let multiplier = 1e18;
            try {
                multiplier = await this.contracts.mining.difficultyMultiplier();
            } catch(e){}
            
            const rawShopPower = (data.power * multiplier) / 1000000000000000000n;
            const power = parseFloat(ethers.formatUnits(rawShopPower, 8)).toFixed(5);
            
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
    };

    // --- FONCTION AFFICHAGE INVENTAIRE (NOUVEAU) ---
    async renderInventory() {
        const container = document.getElementById('inventory-list');
        container.innerHTML = '<p style="text-align:center; color:#888;"> Chargement de l'/inventaire//

        try {
            // 1. Lire la liste des machines brutes depuis le contrat
            const userData = await this.contracts.mining.users(this.user);
            const rawMachines = userData.machines;
            const now = Math.floor(Date.now() / 1000);
            const lifespan = 90 * 24 * 60 * 60; // 90 jours en secondes
            const counts = {}; // Pour compter combien de chaque type on a

            // 2. Parcourir les machines
            rawMachines.forEach(m => {
                let typeId, boughtAt;
                
                // Gestion des formats de données renvoyés par Ethers
                if (typeof m === 'object') {
                    typeId = Number(m.typeId);
                    boughtAt = Number(m.boughtAt);
                } else if (Array.isArray(m)) {
                    typeId = Number(m[0]);
                    boughtAt = Number(m[1]);
                }

                // 3. Vérifier si la machine est toujours active (90 jours)
                if (now < boughtAt + lifespan) {
                    counts[typeId] = (counts[typeId] || 0) + 1;
                }
            });

            // 4. Affichage
            let html = '';
            const count = await this.contracts.mining.getMachineCount();
            const icons = ["💾", "💚", "💜", "🔷", "🟠"];

            if (Object.keys(counts).length === 0) {
                container.innerHTML = '<p style="text-align:center; padding:20px; color:#888;">Aucune machine active (expirée ou aucune).</p>';
                return;
            }

            // Récupérer le multiplicateur pour afficher la puissance réelle (0.0005)
            const multiplier = await this.contracts.mining.difficultyMultiplier();

            for (const [id, qty] of Object.entries(counts)) {
                const typeData = await this.contracts.mining.machineTypes(id);
                
                // Calcul puissance réelle
                const rawPower = (typeData.power * multiplier) / 1000000000000000000n;
                const power = parseFloat(ethers.formatUnits(rawPower, 8)).toFixed(5);
                
                html += `
                    <div class="inv-item">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span style="font-size:1.5rem;">${icons[id] || '⚙️'}</span>
                                <div>
                                    <div style="font-weight:bold; color:white;">RIG NIVEAU ${parseInt(id)+1}</div>
                                    <div style="font-size:0.8rem; color:#888;">${power} FTA/s</div>
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-size:1.2rem; font-weight:bold; color:var(--primary);">x${qty}</div>
                                <div style="font-size:0.7rem; color:#aaa;">Unités</div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            container.innerHTML = html;

        } catch (e) {
            console.error("Erreur inventaire:", e);
            container.innerHTML = '<p style="text-align:center; color:var(--danger)">Erreur de chargement.</p>';
        }
    };

    async buyMachine(id) {
        if (!this.user) return this.connect();
        this.setLoader(true, "Achat...");
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
            document.getElementById('shop-list').innerHTML = ''; 
            this.updateData();
        } catch (e) { 
            console.error(e);
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
            
            this.pendingBalance = 0; 
            this.updateData();
            
            this.showToast("Gains réceptionnés !");
        } catch (e) { 
            console.error(e);
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

    toggleSwap() {
        this.swapDirection = this.swapDirection === 'USDT_TO_FTA' ? 'FTA_TO_USDT' : 'USDT_TO_FTA';
        const fromDisplay = document.getElementById('token-from-display');
        const toDisplay = document.getElementById('token-to-display');
        if (this.swapDirection === 'USDT_TO_FTA') {
            fromDisplay.innerText = 'USDT'; toDisplay.innerText = 'FTA';
        } else {
            fromDisplay.innerText = 'FTA'; toDisplay.innerText = 'USDT';
        }
        this.updateData();
    }

    async executeSwap() {
        const inputVal = document.getElementById('swap-from-in').value;
        if (!inputVal || parseFloat(inputVal) <= 0) return this.showToast("Montant invalide", true);
        this.setLoader(true, "Échange...");
        const decimals = this.swapDirection === 'USDT_TO_FTA' ? 6 : 8;
        const amount = ethers.parseUnits(inputVal, decimals);
        try {
            if (this.swapDirection === 'USDT_TO_FTA') {
                const allowance = await this.contracts.usdt.allowance(this.user, CONFIG.MINING);
                if (allowance < amount) {
                    const txApp = await this.contracts.usdt.approve(CONFIG.MINING, amount);
                    await txApp.wait();
                }
                const tx = await this.contracts.mining.swapUsdtForFta(amount);
                await tx.wait();
            } else {
                const allowance = await this.contracts.fta.allowance(this.user, CONFIG.MINING);
                if (allowance < amount) {
                    const txApp = await this.contracts.fta.approve(CONFIG.MINING, amount);
                    await txApp.wait();
                }
                const tx = await this.contracts.mining.swapFtaForUsdt(amount);
                await tx.wait();
            }
            this.showToast("Échange réussi !");
            document.getElementById('swap-from-in').value = '';
            this.updateData();
        } catch (e) { this.showToast("Erreur Swap", true); }
        this.setLoader(false);
    }

    // --- VISUALISATION GRAPHIQUE ---
    initVisualizer() {
        const canvas = document.getElementById('mining-canvas');
        if (!canvas) return;
        
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        this.vizContext = canvas.getContext('2d');
        this.vizBars = [];
        
        for(let i=0; i<10; i++) {
            this.vizBars.push({
                x: i * (canvas.width / 10) + 2,
                width: (canvas.width / 10) - 4,
                height: 0,
                targetHeight: 0,
                speed: Math.random() * 0.5 + 0.5
            });
        }
        
        this.animateVisualizer();
    }

    updateVisualizerIntensity(power) {
        let intensity = 0;
        if(power > 0) {
            intensity = Math.min((power * 500) + 20, 100);
        }
        
        this.vizBars.forEach(bar => {
            bar.targetHeight = (this.vizContext.canvas.height * intensity / 100) * Math.random();
        });
    }

    animateVisualizer() {
        const ctx = this.vizContext;
        if(!ctx) return;
        
        const canvas = ctx.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary');
        
        this.vizBars.forEach(bar => {
            bar.height += (bar.targetHeight - bar.height) * 0.1;
            
            const y = canvas.height - bar.height;
            ctx.fillRect(bar.x, y, bar.width, bar.height);
            
            bar.targetHeight += (Math.random() - 0.5) * 5;
            
            if(bar.targetHeight < 0) bar.targetHeight = 0;
            if(bar.targetHeight > canvas.height) bar.targetHeight = canvas.height;
        });
        
        requestAnimationFrame(() => this.animateVisualizer());
    }

    // --- NAVIGATION ---
    nav(viewId) {
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById('view-' + viewId).classList.add('active');
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        event.currentTarget.classList.add('active');

        // Lancer l'inventaire si on clique dessus
        if (viewId === 'inventory') {
            this.renderInventory();
        }
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

const App = new Application();
window.onload = () => App.init();