// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
    // --- REMPLACEZ PAR VOS ADRESSES ---
    MINING: "0xcD718eCb9e46f474E28508E07b692610488a4Ba4",
    FTA: "0x535bBe393D64a60E14B731b7350675792d501623",          
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    CHAIN_ID: 137
};

// --- ABI (MIS À JOUR) ---
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
    
    // --- NOUVELLES FONCTIONS POUR LES MACHINES ---
    // Retourne un tableau d'IDs de machines possédées par l'utilisateur
    "function getUserMachines(address) view returns (uint256[] memory)",
    // Optionnel : Si le contrat stocke la durée de vie d'une machine (en secondes)
    "function machineDuration() view returns (uint256)",
    // Optionnel : Si le contrat stocke le temps d'achat par machine (alternative)
    // "function userMachines(address, uint256 index) view returns (uint256 typeId, uint256 purchaseTime)"
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
       
        this.currentRealPower = 0;
        this.pendingBalance = 0;    
        this.miningTimer = null;
        this.storageKey = "fitia_last_claim_time";

        this.vizContext = null;
        this.vizBars = [];
        this.animationId = null;
        
        // Cache pour la boutique
        this.shopData = [];
    }

    async init() {
        console.log("FITIA PRO V2 - Démarrage");
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

            await this.updateData();
            setInterval(() => this.updateData(), 3000);
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

    async updateData() {
        if (!this.user) return;
        try {
            // 1. Charger la boutique une seule fois
            if (this.shopData.length === 0) await this.renderShop();

            const rawPower = await this.contracts.mining.getActivePower(this.user);
            let multiplier = 1e18;
            try {
                multiplier = await this.contracts.mining.difficultyMultiplier();
            } catch(e) {}

            const realPowerBN = (rawPower * multiplier) / 1000000000000000000n;
            this.currentRealPower = parseFloat(ethers.formatUnits(realPowerBN, 8));

            let lastClaimTimeStored = localStorage.getItem(this.storageKey);
            if (!lastClaimTimeStored) {
                lastClaimTimeStored = Math.floor(Date.now() / 1000);
                localStorage.setItem(this.storageKey, lastClaimTimeStored);
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const timePassed = currentTime - parseInt(lastClaimTimeStored);

            if (this.currentRealPower > 0) {
                const earnings = this.currentRealPower * timePassed;
                this.pendingBalance = earnings;
                document.getElementById('viz-status').innerText = "MINAGE ACTIF";
                document.getElementById('viz-status').style.color = "var(--primary)";
                this.updateVisualizerIntensity(this.currentRealPower);
                if (!this.miningTimer) this.startMiningCounter();
            } else {
                this.stopMiningCounter();
                document.getElementById('viz-status').innerText = "AUCUNE MACHINE";
                document.getElementById('viz-status').style.color = "#666";
                this.updateVisualizerIntensity(0);
            }

            document.getElementById('val-power').innerText = this.currentRealPower.toFixed(5);
            if (!this.miningTimer) document.getElementById('val-pending').innerText = this.pendingBalance.toFixed(5);

            const usdtBal = await this.contracts.usdt.balanceOf(this.user);
            const ftaBal = await this.contracts.fta.balanceOf(this.user);
            document.getElementById('bal-usdt').innerText = parseFloat(ethers.formatUnits(usdtBal, 6)).toFixed(2);
            document.getElementById('bal-fta').innerText = parseFloat(ethers.formatUnits(ftaBal, 8)).toFixed(2);
           
            const rate = await this.contracts.mining.exchangeRate();
            this.currentRate = parseFloat(ethers.formatUnits(rate, 8));
            document.getElementById('swap-rate').innerText = `1 USDT = ${this.currentRate.toFixed(2)} FTA`;
            
            const fromBal = this.swapDirection === 'USDT_TO_FTA' ? usdtBal : ftaBal;
            const toBal = this.swapDirection === 'USDT_TO_FTA' ? ftaBal : usdtBal;
            const fromDec = this.swapDirection === 'USDT_TO_FTA' ? 6 : 8;
            const toDec = this.swapDirection === 'USDT_TO_FTA' ? 8 : 6;
            
            document.getElementById('swap-bal-from').innerText = parseFloat(ethers.formatUnits(fromBal, fromDec)).toFixed(2);
            document.getElementById('swap-bal-to').innerText = parseFloat(ethers.formatUnits(toBal, toDec)).toFixed(2);

        } catch (e) {
            console.error("Erreur refresh:", e);
        }
    }

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
    }

    stopMiningCounter() {
        if (this.miningTimer) {
            clearInterval(this.miningTimer);
            this.miningTimer = null;
        }
    }

    // --- NOUVELLE FONCTION : MES MACHINES ---
    async checkMyMachines() {
        const container = document.getElementById('my-rigs-list');
        const noRigsDiv = document.getElementById('no-rigs');
        container.innerHTML = '';
        
        if (!this.user) return;

        try {
            // 1. Essayer de récupérer la liste des machines (Nécessite ABI adapté)
            // On essaie d'appeler getUserMachines. Si ça échoue, on catch.
            let machineIds = [];
            try {
                machineIds = await this.contracts.mining.getUserMachines(this.user);
            } catch (e) {
                // Si le contrat ne renvoie pas de liste, on affiche un message générique
                // ou on peut essayer une autre méthode (ex: itérer sur un mapping si on connait les index)
                console.warn("Le contrat ne supporte pas getUserMachines ou ABI incorrect.");
                container.innerHTML = `<div class="card"><p style="color:var(--text-muted); text-align:center;">Impossible de récupérer la liste détaillée.<br>Vérifiez l'ABI du contrat.</p></div>`;
                return;
            }

            if (machineIds.length === 0) {
                noRigsDiv.style.display = 'block';
                return;
            } else {
                noRigsDiv.style.display = 'none';
            }

            // 2. Récupérer la durée de vie par défaut (si disponible)
            let duration = 0; // en secondes
            try {
                 duration = await this.contracts.mining.machineDuration();
            } catch(e) { 
                console.warn("machineDuration non trouvé, supposant illimité ou géré autrement"); 
            }

            // 3. Afficher chaque machine
            // Note: Ici on suppose que machineIds contient les IDs (typeId) ou des IDs uniques.
            // Pour un affichage correct, il faudrait l'heure d'achat (purchaseTime).
            // Si getUserMachines ne renvoie que des IDs sans temps, on ne peut pas calculer l'expiration.
            // Je fais une implémentation visuelle basique ici.

            for (let i = 0; i < machineIds.length; i++) {
                const id = machineIds[i];
                const typeData = this.shopData[id] || { power: "N/A", price: "N/A" }; // Récupéré depuis le cache shop
                
                // Logique d'état fictive ou à adapter selon le contrat réel
                // Ex: Si le contrat renvoie (id, timestamp)
                const isActive = true; // Par défaut actif si on ne peut pas vérifier le temps
                const statusClass = isActive ? 'active' : 'expired';
                const statusText = isActive ? 'ACTIF' : 'EXPIRÉ';
                
                const div = document.createElement('div');
                div.className = `my-rig-card ${statusClass}`;
                div.innerHTML = `
                    <div class="rig-info">
                        <h4>RIG #${id} (Type ${id})</h4>
                        <p>Puissance: ${typeData.power} FTA/s</p>
                    </div>
                    <span class="rig-status-badge ${isActive ? 'status-active' : 'status-expired'}">${statusText}</span>
                `;
                container.appendChild(div);
            }

        } catch (e) {
            console.error("Erreur chargement machines:", e);
            container.innerHTML = '<p style="color:var(--danger); text-align:center;">Erreur de chargement</p>';
        }
    }

    async renderShop() {
        const container = document.getElementById('shop-list');
        try {
            const count = await this.contracts.mining.getMachineCount();
            this.shopData = []; // Reset cache
            container.innerHTML = '';
            for(let i=0; i<count; i++) {
                const data = await this.contracts.mining.machineTypes(i);
                const price = parseFloat(ethers.formatUnits(data.price, 6)).toFixed(2);
               
                let multiplier = 1e18;
                try { multiplier = await this.contracts.mining.difficultyMultiplier(); } catch(e){}
               
                const rawShopPower = (data.power * multiplier) / 1000000000000000000n;
                const power = parseFloat(ethers.formatUnits(rawShopPower, 8)).toFixed(5);
                
                this.shopData.push({ price, power }); // Sauvegarder pour "Mes Machines"

                const div = document.createElement('div');
                div.className = 'rig-item';
                div.innerHTML = `
                    <div>
                        <span class="rig-name">RIG ${i+1}</span>
                        <span class="rig-power">${power} FTA/s</span>
                    </div>
                    <div>
                        <span class="rig-price">${price} $</span>
                        <button class="btn-primary" style="padding:8px; font-size:0.8rem; margin-top:5px" onclick="App.buyMachine(${i})">ACHETER</button>
                    </div>
                `;
                container.appendChild(div);
            }
        } catch(e) {
            console.error(e);
        }
    }

    async buyMachine(id) {
        if (!this.user) return this.connect();
        this.setLoader(true, "Vérification...");
        try {
            const m = await this.contracts.mining.machineTypes(id);
            const allowance = await this.contracts.usdt.allowance(this.user, CONFIG.MINING);
            
            if (allowance < m.price) {
                this.setLoader(true, "Approbation USDT...");
                const txApp = await this.contracts.usdt.approve(CONFIG.MINING, m.price);
                await txApp.wait();
            }
            
            this.setLoader(true, "Achat en cours...");
            const txBuy = await this.contracts.mining.buyMachine(id);
            await txBuy.wait();
            
            this.showToast("Achat réussi !");
            document.getElementById('shop-list').innerHTML = '';
            this.shopData = [];
            localStorage.setItem(this.storageKey, Math.floor(Date.now() / 1000));
            await this.renderShop(); // Re-render shop
            await this.checkMyMachines(); // Re-render my machines
            this.updateData();
        } catch (e) {
            console.error(e);
            this.showToast("Erreur Achat", true);
        }
        this.setLoader(false);
    }

    async claim() {
        if (!this.user) return this.connect();
        this.stopMiningCounter();
        this.setLoader(true, "Réclamation...");
        try {
            const tx = await this.contracts.mining.claimRewards();
            this.pendingBalance = 0;
            document.getElementById('val-pending').innerText = "0.00000";
            localStorage.setItem(this.storageKey, Math.floor(Date.now() / 1000));
            await tx.wait();
            this.showToast("Gains réceptionnés !");
            await this.updateData();
            if (this.currentRealPower > 0) this.startMiningCounter();
        } catch (e) {
            console.error(e);
            this.showToast("Erreur Réclamation", true);
            this.startMiningCounter();
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
        } catch (e) { this.showToast("Erreur liaison", true); }
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
        document.getElementById('swap-from-in').value = '';
        document.getElementById('swap-to-in').value = '';
        this.updateData();
    }

    calcSwap() {
        const inputVal = document.getElementById('swap-from-in').value;
        if (!inputVal) { document.getElementById('swap-to-in').value = ''; return; }
        const result = inputVal * this.currentRate;
        document.getElementById('swap-to-in').value = result.toFixed(5);
    }
    
    setMax() {
        const bal = document.getElementById('swap-bal-from').innerText;
        document.getElementById('swap-from-in').value = bal;
        this.calcSwap();
    }

    async executeSwap() {
        const inputVal = document.getElementById('swap-from-in').value;
        if (!inputVal || parseFloat(inputVal) <= 0) return this.showToast("Montant invalide", true);
        
        this.setLoader(true, "Préparation...");
        const decimals = this.swapDirection === 'USDT_TO_FTA' ? 6 : 8;
        const amount = ethers.parseUnits(inputVal, decimals);
        
        try {
            if (this.swapDirection === 'USDT_TO_FTA') {
                const allowance = await this.contracts.usdt.allowance(this.user, CONFIG.MINING);
                if (allowance < amount) {
                    this.setLoader(true, "Approbation USDT...");
                    const txApp = await this.contracts.usdt.approve(CONFIG.MINING, amount);
                    await txApp.wait();
                }
                this.setLoader(true, "Échange...");
                const tx = await this.contracts.mining.swapUsdtForFta(amount);
                await tx.wait();
            } else {
                const allowance = await this.contracts.fta.allowance(this.user, CONFIG.MINING);
                if (allowance < amount) {
                    this.setLoader(true, "Approbation FTA...");
                    const txApp = await this.contracts.fta.approve(CONFIG.MINING, amount);
                    await txApp.wait();
                }
                this.setLoader(true, "Échange...");
                const tx = await this.contracts.mining.swapFtaForUsdt(amount);
                await tx.wait();
            }
            this.showToast("Échange réussi !");
            document.getElementById('swap-from-in').value = '';
            document.getElementById('swap-to-in').value = '';
            this.updateData();
        } catch (e) { 
            this.showToast("Erreur Swap", true); 
        }
        this.setLoader(false);
    }

    initVisualizer() {
        const canvas = document.getElementById('mining-canvas');
        if (!canvas) return;
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        this.vizContext = canvas.getContext('2d');
        this.vizBars = [];
        const barCount = 20;
        for(let i=0; i<barCount; i++) {
            this.vizBars.push({
                x: i * (canvas.width / barCount),
                width: (canvas.width / barCount) - 4,
                height: 0, targetHeight: 0
            });
        }
        this.animateVisualizer();
    }

    updateVisualizerIntensity(power) {
        let intensity = power > 0 ? Math.min((power * 500) + 10, 100) : 0;
        this.vizBars.forEach(bar => {
            bar.targetHeight = (this.vizContext.canvas.height * (intensity/100)) * (0.3 + Math.random() * 0.7);
        });
    }

    animateVisualizer() {
        const ctx = this.vizContext;
        if(!ctx) return;
        const canvas = ctx.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary');
        this.vizBars.forEach(bar => {
            bar.height += (bar.targetHeight - bar.height) * 0.15;
            const y = canvas.height - bar.height;
            ctx.fillRect(bar.x, y, bar.width, bar.height);
            bar.targetHeight += (Math.random() - 0.5) * 10;
            if(bar.targetHeight < 0) bar.targetHeight = 0;
            if(bar.targetHeight > canvas.height) bar.targetHeight = canvas.height;
        });
        this.animationId = requestAnimationFrame(() => this.animateVisualizer());
    }

    nav(viewId) {
        document.querySelectorAll('.view').forEach(el => {
            el.classList.remove('active');
            el.style.display = 'none';
        });
        const activeView = document.getElementById('view-' + viewId);
        if(activeView) {
            activeView.classList.add('active');
            activeView.style.display = 'block';
        }

        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if(event && event.currentTarget) event.currentTarget.classList.add('active');

        // Charger les machines si on va sur l'onglet "my-rigs"
        if (viewId === 'my-rigs') {
            this.checkMyMachines();
        }
    }

    copyLink() {
        const val = document.getElementById('ref-link').value;
        navigator.clipboard.writeText(val);
        this.showToast("Lien copié !");
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